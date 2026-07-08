from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.db.database import get_db
from src.modules.search import crud
from src.modules.entries.schemas import EntryListResponse, EntrySummary

search_router = APIRouter(prefix="/search", tags=["Search"])

MAX_PAGE_SIZE = 20


@search_router.get("", response_model=EntryListResponse)
async def get_search(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=MAX_PAGE_SIZE),
    terms: str | None = Query(None),
    title: str | None = Query(None),
    author: str | None = Query(None),
    tag: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if terms:
        entries = await crud.search_terms(db, terms, None, None, None)
    else:
        entries = await crud.search_terms(db, None, title, author, tag)

    return EntryListResponse(
        items=[
            EntrySummary.from_entry(
                e["entry"], likes=e["likes"], comments_count=e["comments_count"]
            )
            for e in entries
        ],
        total=len(entries),
        page=page,
        page_size=page_size,
    )
