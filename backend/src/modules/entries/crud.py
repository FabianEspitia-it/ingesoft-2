from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.infrastructure.db.models import Entry, EntryStatus, User
from src.modules.entries.schemas import EntryCreate


async def list_entries(
    db: AsyncSession,
    *,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Entry], int]:
    offset = (page - 1) * page_size

    base_filters = (
        Entry.deleted_at.is_(None),
        Entry.status == EntryStatus.published,
    )

    count_result = await db.execute(
        select(func.count()).select_from(Entry).where(*base_filters)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Entry)
        .options(selectinload(Entry.author))
        .where(*base_filters)
        .order_by(Entry.published_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    return list(result.scalars().all()), total


async def get_entry_by_id(db: AsyncSession, entry_id: int) -> Entry | None:
    result = await db.execute(
        select(Entry)
        .options(selectinload(Entry.author))
        .where(
            Entry.id == entry_id,
            Entry.deleted_at.is_(None),
            Entry.status == EntryStatus.published,
        )
    )
    return result.scalar_one_or_none()


async def increment_view_count(db: AsyncSession, entry: Entry) -> None:
    entry.view_count += 1
    db.add(entry)
    await db.flush()


async def create_entry(
    db: AsyncSession,
    *,
    author: User,
    payload: EntryCreate,
) -> Entry:
    entry = Entry(
        author_id=author.id,
        title=payload.title.strip(),
        body=payload.body.strip(),
        status=EntryStatus.published,
    )
    db.add(entry)
    await db.flush()

    result = await db.execute(
        select(Entry)
        .options(selectinload(Entry.author))
        .where(Entry.id == entry.id)
    )
    return result.scalar_one()
