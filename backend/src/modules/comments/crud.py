from sqlalchemy import func, select
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
