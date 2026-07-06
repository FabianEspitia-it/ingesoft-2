from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.infrastructure.db.models import Comment, Entry, EntryStatus, Reaction, ReactionType, Tag, User
from src.modules.entries.categories import normalize_category
from src.modules.entries.schemas import EntryCreate


async def list_entries(
    db: AsyncSession,
    *,
    page: int = 1,
    page_size: int = 20,
    author_id: int | None = None,
    is_success_case: bool | None = None,
) -> tuple[list[Entry], int]:
    offset = (page - 1) * page_size
    filters = [
        Entry.deleted_at.is_(None),
        Entry.status == EntryStatus.published,
    ]
    if author_id is not None:
        filters.append(Entry.author_id == author_id)
    if is_success_case is not None:
        filters.append(Entry.is_success_case.is_(is_success_case))

    count_result = await db.execute(
        select(func.count()).select_from(Entry).where(*filters)
    )
    total = count_result.scalar_one()
    result = await db.execute(
        select(Entry)
        .options(selectinload(Entry.author), selectinload(Entry.tags))
        .where(*filters)
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


async def set_success_case(db: AsyncSession, entry: Entry, value: bool) -> Entry:
    """Flag or unflag an entry as a success case (RN-23, admin only)."""
    entry.is_success_case = value
    db.add(entry)
    await db.flush()
    return entry


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


async def list_featured_entries(
    db: AsyncSession,
    *,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[dict], int]:
    """
    Return entries that exceed the average likes+comments of the last month.
    """
    one_month_ago = datetime.now(UTC) - timedelta(days=30)
    base_filters = [
        Entry.deleted_at.is_(None),
        Entry.status == EntryStatus.published,
        Entry.published_at >= one_month_ago,
    ]

    likes_subq = (
        select(
            Reaction.entry_id,
            func.count().label("like_count"),
        )
        .where(Reaction.type == ReactionType.like)
        .group_by(Reaction.entry_id)
        .subquery()
    )

    comments_subq = (
        select(
            Comment.entry_id,
            func.count().label("comment_count"),
        )
        .group_by(Comment.entry_id)
        .subquery()
    )

    avg_likes_result = await db.execute(
        select(func.avg(func.coalesce(likes_subq.c.like_count, 0)))
        .select_from(Entry)
        .outerjoin(likes_subq, Entry.id == likes_subq.c.entry_id)
        .where(*base_filters)
    )
    avg_likes = float(avg_likes_result.scalar_one() or 0)

    avg_comments_result = await db.execute(
        select(func.avg(func.coalesce(comments_subq.c.comment_count, 0)))
        .select_from(Entry)
        .outerjoin(comments_subq, Entry.id == comments_subq.c.entry_id)
        .where(*base_filters)
    )
    avg_comments = float(avg_comments_result.scalar_one() or 0)

    featured_query = (
        select(
            Entry,
            func.coalesce(likes_subq.c.like_count, 0).label("likes"),
            func.coalesce(comments_subq.c.comment_count, 0).label("comments_count"),
        )
        .outerjoin(likes_subq, Entry.id == likes_subq.c.entry_id)
        .outerjoin(comments_subq, Entry.id == comments_subq.c.entry_id)
        .where(
            *base_filters,
            (func.coalesce(likes_subq.c.like_count, 0) + func.coalesce(comments_subq.c.comment_count, 0))
            > (avg_likes + avg_comments),
        )
    )

    count_result = await db.execute(
        select(func.count()).select_from(featured_query.subquery())
    )
    total = count_result.scalar_one()

    offset = (page - 1) * page_size
    result = await db.execute(
        featured_query
        .options(selectinload(Entry.author), selectinload(Entry.tags))
        .order_by(
            (func.coalesce(likes_subq.c.like_count, 0) + func.coalesce(comments_subq.c.comment_count, 0)).desc()
        )
        .offset(offset)
        .limit(page_size)
    )

    entries = []
    for row in result.all():
        entries.append({
            "entry": row[0],
            "likes": row[1],
            "comments_count": row[2],
        })

    return entries, total