from sqlalchemy import and_, bindparam, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.infrastructure.db.models import Comment, Entry, EntryStatus, Reaction, ReactionType, Tag, User


def _normalize(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _uses_postgres_fts(db: AsyncSession) -> bool:
    bind = db.get_bind()
    return bind is not None and bind.dialect.name == "postgresql"


def _full_text_match(column, param_name: str):
    return func.to_tsvector("spanish", column).op("@@")(
        func.websearch_to_tsquery("spanish", bindparam(param_name))
    )


def _contains_match(column, param_name: str):
    pattern = func.concat("%", bindparam(param_name), "%")
    return column.ilike(pattern)


async def search_terms(
    db: AsyncSession,
    terms: str | None,
    title: str | None,
    author: str | None,
    tag: str | None,
    page: int = 1,
    page_size: int = 20,
) -> list[dict]:
    offset = (page - 1) * page_size
    params: dict[str, str] = {}
    use_postgres_fts = _uses_postgres_fts(db)

    terms = _normalize(terms)
    title = _normalize(title)
    author = _normalize(author)
    tag = _normalize(tag)

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

    query = (
        select(
            Entry,
            func.coalesce(likes_subq.c.like_count, 0).label("likes"),
            func.coalesce(comments_subq.c.comment_count, 0).label("comments_count"),
        )
        .join(User, User.id == Entry.author_id)
        .outerjoin(likes_subq, Entry.id == likes_subq.c.entry_id)
        .outerjoin(comments_subq, Entry.id == comments_subq.c.entry_id)
        .options(selectinload(Entry.author), selectinload(Entry.tags))
        .where(
            Entry.deleted_at.is_(None),
            Entry.status == EntryStatus.published,
        )
    )

    filters = []

    if terms:
        params["search_term"] = terms
        if use_postgres_fts:
            filters.append(
                (
                    func.to_tsvector("spanish", Entry.title).op("||")(
                        func.to_tsvector("spanish", User.full_name)
                    )
                ).op("@@")(
                    func.websearch_to_tsquery("spanish", bindparam("search_term"))
                )
            )
        else:
            filters.append(
                or_(
                    _contains_match(Entry.title, "search_term"),
                    _contains_match(User.full_name, "search_term"),
                )
            )
    else:
        if title:
            params["title_term"] = title
            if use_postgres_fts:
                filters.append(_full_text_match(Entry.title, "title_term"))
            else:
                filters.append(_contains_match(Entry.title, "title_term"))

        if author:
            params["author_term"] = author
            if use_postgres_fts:
                filters.append(_full_text_match(User.full_name, "author_term"))
            else:
                filters.append(_contains_match(User.full_name, "author_term"))

        if tag:
            query = query.join(Entry.tags)
            filters.append(Tag.name == tag)

    if filters:
        query = query.where(and_(*filters))

    query = query.order_by(Entry.published_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(query, params)
    entries = []
    for row in result.unique().all():
        entries.append({
            "entry": row[0],
            "likes": row[1],
            "comments_count": row[2],
        })
    return entries
