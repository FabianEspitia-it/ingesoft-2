from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.dependencies import get_current_user, require_role
from src.infrastructure.db.database import get_db
from src.infrastructure.db.models import User, UserRole
from src.modules.entries import crud
from src.modules.entries.schemas import (
    EntryCreate,
    EntryDetail,
    EntryListResponse,
    EntrySummary,
    FeaturedEntryResponse,
    FeaturedEntrySummary,
    SuccessCaseUpdate,
)

entries_router = APIRouter(prefix="/entries", tags=["Entries"])
MAX_PAGE_SIZE = 20


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
        None, description="Filter by admin-flagged success cases (RN-23)."
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
        items=[EntrySummary.from_entry(entry) for entry in entries],
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
    """Admin-only: feature or unfeature an entry as a success case (RN-23)."""
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

@entries_router.patch("/{entry_id}",
    response_model=EntryDetail
)
async def delete_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
):
    entry = await crud.get_entry_by_id(db, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada no encontrada.",
        )
    updated_entry = await crud.delete_entry(db, entry_id=entry_id)
    
    return EntryDetail.from_entry(updated_entry)