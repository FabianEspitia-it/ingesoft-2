from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.dependencies import get_current_user
from src.infrastructure.db.database import get_db
from src.infrastructure.db.models import User
from src.modules.entries import crud
from src.modules.entries.schemas import (
    EntryCreate,
    EntryDetail,
    EntryListResponse,
    EntrySummary,
)

entries_router = APIRouter(prefix="/entries", tags=["Entries"])

MAX_PAGE_SIZE = 20


@entries_router.get("", response_model=EntryListResponse)
async def list_entries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=MAX_PAGE_SIZE),
    db: AsyncSession = Depends(get_db),
):
    """US-1: List published entries ordered by date (RN-36)."""
    entries, total = await crud.list_entries(db, page=page, page_size=page_size)
    return EntryListResponse(
        items=[EntrySummary.model_validate(entry) for entry in entries],
        total=total,
        page=page,
        page_size=page_size,
    )


@entries_router.get("/{entry_id}", response_model=EntryDetail)
async def get_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
):
    """US-2: Read a full entry and increment view count (RN-26)."""
    entry = await crud.get_entry_by_id(db, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada no encontrada.",
        )

    await crud.increment_view_count(db, entry)
    return EntryDetail.model_validate(entry)


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
    """US-9: Create a blog entry (RN-15, requires authenticated author)."""
    entry = await crud.create_entry(db, author=current_user, payload=payload)
    return EntryDetail.model_validate(entry)
