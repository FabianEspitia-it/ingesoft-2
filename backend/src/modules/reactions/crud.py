from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.db.models import Reaction, ReactionType


async def get_reaction_summary(
    db: AsyncSession,
    entry_id: int,
    user_id: int | None = None,
) -> dict:
    likes_result = await db.execute(
        select(func.count())
        .select_from(Reaction)
        .where(Reaction.entry_id == entry_id, Reaction.type == ReactionType.like)
    )
    likes = likes_result.scalar_one()

    dislikes_result = await db.execute(
        select(func.count())
        .select_from(Reaction)
        .where(Reaction.entry_id == entry_id, Reaction.type == ReactionType.dislike)
    )
    dislikes = dislikes_result.scalar_one()

    user_reaction = None
    if user_id is not None:
        result = await db.execute(
            select(Reaction).where(
                Reaction.entry_id == entry_id,
                Reaction.user_id == user_id,
            )
        )
        reaction = result.scalar_one_or_none()
        if reaction:
            user_reaction = reaction.type.value

    return {"likes": likes, "dislikes": dislikes, "user_reaction": user_reaction}


async def toggle_reaction(
    db: AsyncSession,
    *,
    entry_id: int,
    user_id: int,
    reaction_type: str,
) -> dict:
    """Add, change, or remove a reaction (toggle behavior)."""
    result = await db.execute(
        select(Reaction).where(
            Reaction.entry_id == entry_id,
            Reaction.user_id == user_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing is not None:
        if existing.type.value == reaction_type:
            await db.execute(
                delete(Reaction).where(Reaction.id == existing.id)
            )
            await db.flush()
        else:
            existing.type = ReactionType(reaction_type)
            db.add(existing)
            await db.flush()
    else:
        new_reaction = Reaction(
            entry_id=entry_id,
            user_id=user_id,
            type=ReactionType(reaction_type),
        )
        db.add(new_reaction)
        await db.flush()

    return await get_reaction_summary(db, entry_id, user_id)
