from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.dependencies import get_current_user
from src.infrastructure.db.database import get_db
from src.infrastructure.db.models import User
from src.modules.search import crud
from src.modules.entries.schemas import EntryListResponse, EntrySummary

search_router = APIRouter(prefix="/search", tags=["Search"])

MAX_PAGE_SIZE = 20

@search_router.get("")
async def get_search(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=MAX_PAGE_SIZE),
    terms: str | None = Query(None),
    title: str | None = Query(None),
    author: str | None = Query(None),
    tag: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    print(f"Parametros recibidos: ", terms, title, author, tag)

    if (terms):
        entries = await crud.search_terms(db, terms, None, None, None)
    else:
        entries = await crud.search_terms(db, None, title, author, tag)

    return EntryListResponse(
        items=[EntrySummary.model_validate(entry) for entry in entries],
        total=12,
        page=page,
        page_size=page_size,
    )

'''@search_router.get("")
async def get_specific_search(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=MAX_PAGE_SIZE),
    title: str | None = Query(None),
    author: str | None = Query(None),
    tag: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    print(f"recievedParams=,", author, title, tag)
    
    entries = await crud.search_terms(db, author)
    return EntryListResponse(
        items=[EntrySummary.model_validate(entry) for entry in entries],
        total=12,
        page=page,
        page_size=page_size,
    )'''