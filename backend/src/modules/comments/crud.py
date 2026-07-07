from datetime import UTC, datetime

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.infrastructure.db.models import Comment, User


async def list_comments(
    db: AsyncSession,
    entry_id: int,
) -> tuple[list[Comment], int]:
    """List an entry's comments, newest first (descending by published_at)."""
    count_result = await db.execute(
        select(func.count()).select_from(Comment).where(Comment.entry_id == entry_id)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.entry_id == entry_id)
        .order_by(Comment.published_at.desc(), Comment.id.desc())
    )
    return list(result.scalars().all()), total


async def create_comment(
    db: AsyncSession,
    *,
    entry_id: int,
    author: User,
    content: str,
) -> Comment:
    comment = Comment(
        entry_id=entry_id,
        author_id=author.id,
        content=content,
    )
    db.add(comment)
    await db.flush()

    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.id == comment.id)
    )
    return result.scalar_one()


async def get_comment_by_id(db: AsyncSession, comment_id: int) -> Comment | None:
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.id == comment_id)
    )
    return result.scalar_one_or_none()


async def update_comment(
    db: AsyncSession,
    comment: Comment,
    content: str,
) -> Comment:
    comment.content = content
    comment.edited_at = datetime.now(UTC)
    db.add(comment)
    await db.flush()

    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.id == comment.id)
    )
    return result.scalar_one()


async def delete_comment(db: AsyncSession, comment_id: int) -> None:
    await db.execute(delete(Comment).where(Comment.id == comment_id))
    await db.flush()

async def list_all_comments(
    db: AsyncSession,
) -> tuple[list[Comment], int]:
    """List an entry's comments, newest first (descending by published_at)."""
    count_result = await db.execute(
        select(func.count()).select_from(Comment)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .order_by(Comment.published_at.desc(), Comment.id.desc())
    )
    return list(result.scalars().all()), total       
