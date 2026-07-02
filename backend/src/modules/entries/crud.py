from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.infrastructure.db.models import Entry, EntryStatus, Tag, User
from src.modules.entries.categories import normalize_category
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
        .options(selectinload(Entry.author), selectinload(Entry.tags))
        .where(*base_filters)
        .order_by(Entry.published_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    return list(result.scalars().all()), total


async def get_entry_by_id(db: AsyncSession, entry_id: int) -> Entry | None:
    result = await db.execute(
        select(Entry)
        .options(selectinload(Entry.author), selectinload(Entry.tags))
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


async def resolve_entry_tags(
    db: AsyncSession,
    *,
    category_names: list[str],
    free_tags: list[str],
) -> list[Tag]:
    """Turn category names + free tag strings into persisted Tag rows.

    Categories are stored with their canonical spelling; free tags are lowercased.
    A free tag that happens to match a predefined category is treated as that
    category so reads stay consistent. Duplicates (case-insensitive) collapse.
    Existing tags are reused (get-or-create) to keep the N:M table clean.
    """
    normalized: list[str] = list(category_names)  # already canonical from schema
    for raw in free_tags:
        name = raw.strip()
        if not name:
            continue
        canon = normalize_category(name)
        normalized.append(canon if canon is not None else name.lower())

    # Deduplicate case-insensitively, preserving order (categories first).
    seen: set[str] = set()
    unique_names: list[str] = []
    for name in normalized:
        key = name.casefold()
        if key in seen:
            continue
        seen.add(key)
        unique_names.append(name)

    tags: list[Tag] = []
    for name in unique_names:
        result = await db.execute(select(Tag).where(Tag.name == name))
        tag = result.scalar_one_or_none()
        if tag is None:
            tag = Tag(name=name)
            db.add(tag)
            await db.flush()
        tags.append(tag)
    return tags


async def create_entry(
    db: AsyncSession,
    *,
    author: User,
    payload: EntryCreate,
) -> Entry:
    tags = await resolve_entry_tags(
        db,
        category_names=payload.category_names,
        free_tags=payload.tags,
    )

    entry = Entry(
        author_id=author.id,
        title=payload.title.strip(),
        body=payload.body.strip(),
        status=EntryStatus.published,
    )
    entry.tags = tags
    db.add(entry)
    await db.flush()

    result = await db.execute(
        select(Entry)
        .options(selectinload(Entry.author), selectinload(Entry.tags))
        .where(Entry.id == entry.id)
    )
    return result.scalar_one()
