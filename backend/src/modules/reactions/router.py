from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.dependencies import get_current_user
from src.infrastructure.db.database import get_db
from src.infrastructure.db.models import User
from src.modules.entries import crud as entries_crud
from src.modules.reactions import crud
from src.modules.reactions.schemas import ReactionCreate, ReactionSummary

reactions_router = APIRouter(prefix="/entries/{entry_id}/reactions", tags=["Reactions"])


async def _get_published_entry_or_404(db: AsyncSession, entry_id: int):
    entry = await entries_crud.get_entry_by_id(db, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada no encontrada.",
        )
    return entry


@reactions_router.get("", response_model=ReactionSummary)
async def get_reactions(
    entry_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Get reaction counts for an entry, optionally with user's own reaction."""
    await _get_published_entry_or_404(db, entry_id)

    user_id = None
    token = request.cookies.get("session")
    if token:
        try:
            from src.api.dependencies import get_current_user as _get_user
            user = await _get_user(request, db)
            user_id = user.id
        except HTTPException:
            pass

    summary = await crud.get_reaction_summary(db, entry_id, user_id)
    return ReactionSummary(**summary)


@reactions_router.post("", response_model=ReactionSummary)
async def toggle_reaction(
    entry_id: int,
    payload: ReactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle a reaction on an entry (one reaction per user per entry)."""
    await _get_published_entry_or_404(db, entry_id)
    summary = await crud.toggle_reaction(
        db,
        entry_id=entry_id,
        user_id=current_user.id,
        reaction_type=payload.type,
    )
    return ReactionSummary(**summary)
