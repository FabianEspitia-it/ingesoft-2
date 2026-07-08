from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.dependencies import get_current_user, require_role
from src.infrastructure.db.database import get_db
from src.infrastructure.db.models import User, UserRole
from src.infrastructure.storage.gcs import (
    StorageNotConfiguredError,
    signed_cover_url,
    upload_cover_image,
)
from src.modules.entries import crud
from src.modules.entries.schemas import (
    CoverImageResponse,
    EntryCreate,
    EntryDetail,
    EntryListResponse,
    EntrySummary,
    EntryUpdate,
    FeaturedEntryResponse,
    FeaturedEntrySummary,
    SuccessCaseUpdate,
)

entries_router = APIRouter(prefix="/entries", tags=["Entries"])
MAX_PAGE_SIZE = 20
MAX_COVER_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB max cover image size
ALLOWED_COVER_IMAGE_TYPES = {"image/jpeg", "image/png"}


@entries_router.get("/featured", response_model=FeaturedEntryResponse)
async def list_featured_entries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=MAX_PAGE_SIZE),
    db: AsyncSession = Depends(get_db),
):
    """List featured entries that exceed the reaction threshold."""
    entries, total = await crud.list_featured_entries(db, page=page, page_size=page_size)
    return FeaturedEntryResponse(
        items=[FeaturedEntrySummary.from_entry(e["entry"], e["likes"], e["comments_count"]) for e in entries],
        total=total,
        page=page,
        page_size=page_size,
    )


@entries_router.get("", response_model=EntryListResponse)
async def list_entries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=MAX_PAGE_SIZE),
    author_id: int | None = Query(None),
    is_success_case: bool | None = Query(
        None, description="Filter by admin-flagged success cases."
    ),
    db: AsyncSession = Depends(get_db),
):
    """List published entries ordered by date."""
    entries, total = await crud.list_entries(
        db,
        page=page,
        page_size=page_size,
        author_id=author_id,
        is_success_case=is_success_case,
    )
    return EntryListResponse(
        items=[
            EntrySummary.from_entry(
                e["entry"], likes=e["likes"], comments_count=e["comments_count"]
            )
            for e in entries
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@entries_router.get("/{entry_id}", response_model=EntryDetail)
async def get_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Read a full entry and increment view count."""
    entry = await crud.get_entry_by_id(db, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada no encontrada.",
        )
    await crud.increment_view_count(db, entry)
    return EntryDetail.from_entry(entry)


@entries_router.patch("/{entry_id}/success-case", response_model=EntryDetail)
async def set_entry_success_case(
    entry_id: int,
    payload: SuccessCaseUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.administrator)),
):
    """Admin-only: feature or unfeature an entry as a success case."""
    entry = await crud.get_entry_by_id(db, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada no encontrada.",
        )
    await crud.set_success_case(db, entry, payload.is_success_case)
    return EntryDetail.from_entry(entry)


@entries_router.post(
    "",
    response_model=EntryDetail,
    status_code=status.HTTP_201_CREATED,
)
async def create_entry(
    payload: EntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a blog entry (requires authenticated author)."""
    entry = await crud.create_entry(db, author=current_user, payload=payload)
    return EntryDetail.from_entry(entry)


@entries_router.post("/cover-image", response_model=CoverImageResponse)
async def upload_cover_image_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a JPG/PNG cover image (<=5MB) and return its public URL."""
    if file.content_type not in ALLOWED_COVER_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen debe ser JPG o PNG.",
        )

    data = await file.read()
    if len(data) > MAX_COVER_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen no debe superar 5MB.",
        )
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo está vacío.",
        )

    try:
        object_path = upload_cover_image(data=data, content_type=file.content_type)
    except StorageNotConfiguredError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El almacenamiento de imágenes no está configurado.",
        ) from None
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No se pudo subir la imagen. Inténtalo de nuevo.",
        ) from None

    return CoverImageResponse(path=object_path, url=signed_cover_url(object_path))


@entries_router.get("/image/{object_path:path}")
async def get_entry_image(object_path: str):
    """Redirect a stable image path to a fresh signed URL.

    Images embedded in an entry body are stored as object paths (e.g.
    ``covers/<uuid>.jpg``). The bucket is private and signed URLs expire, so the
    body cannot embed the signed URL directly. Instead it embeds this stable
    endpoint, which resolves a short-lived signed URL on every request and
    redirects to it. Public: images render on public entry pages.
    """
    url = signed_cover_url(object_path)
    if not url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imagen no encontrada.",
        )
    return RedirectResponse(url)


def _ensure_can_manage(entry, current_user: User) -> None:
    """Only the author or an administrator may edit/delete an entry."""
    if (
        entry.author_id != current_user.id
        and current_user.role != UserRole.administrator
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para modificar esta entrada.",
        )


@entries_router.patch("/{entry_id}", response_model=EntryDetail)
async def update_entry(
    entry_id: int,
    payload: EntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edit an owned entry: title, body, categories and tags."""
    entry = await crud.get_entry_by_id(db, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada no encontrada.",
        )
    _ensure_can_manage(entry, current_user)
    updated_entry = await crud.update_entry(db, entry=entry, payload=payload)
    return EntryDetail.from_entry(updated_entry)


@entries_router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete an owned entry (author or administrator)."""
    entry = await crud.get_entry_by_id(db, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada no encontrada.",
        )
    _ensure_can_manage(entry, current_user)
    await crud.delete_entry(db, entry)


@entries_router.get("/all/", response_model=EntryListResponse)
async def list_all_entries(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=MAX_PAGE_SIZE),
):
    entries, total = await crud.list_all_entries(
        db,
        page=page,
        page_size=page_size,
    )
    return EntryListResponse(
        items=[
            EntrySummary.from_entry(
                e["entry"], likes=e["likes"], comments_count=e["comments_count"]
            )
            for e in entries
        ],
        total=total,
        page=page,
        page_size=page_size,
    )