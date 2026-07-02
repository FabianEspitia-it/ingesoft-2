from sqlalchemy import func, select, bindparam
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.infrastructure.db.models import Entry, EntryStatus, User

async def search_terms(
        db: AsyncSession, 
        terms: str,
        title: str,
        author: str,
        tag: str,
        page: int = 1,
        page_size: int = 20
)-> tuple[list[Entry], int]:
    offset = (page - 1) * page_size
    query = (
        select(Entry)
        .join(User, User.id == Entry.author_id)
        .options(selectinload(Entry.author))
        .where(
            Entry.deleted_at.is_(None),
            Entry.status == "published",
            (
                func.to_tsvector("spanish", Entry.title).op("||")(
                    func.to_tsvector("spanish", User.full_name)
                )
            ).op("@@")(
                func.websearch_to_tsquery(
                    "spanish",
                    bindparam("search_term"),
                )
            ),
        )
        .order_by(Entry.published_at.desc())
        .offset(offset)
        .limit(page_size)
        )
    if (terms):
        result =  await db.execute(query, {"search_term": terms})
    else:
        search_terms = [author, tag, title]
        clean_search_terms = [item for item in search_terms if item is not None]
        result =  await db.execute(query, {"search_term": " OR ".join(clean_search_terms)})
    return list(result.scalars().all())
