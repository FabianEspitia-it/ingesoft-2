from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.dependencies import get_current_user
from src.infrastructure.db.database import get_db
from src.infrastructure.db.models import User
from src.modules.comments import crud
from src.modules.comments.schemas import (
    CommentCreate,
    CommentListResponse,
    CommentResponse,
    CommentUpdate,
)
from src.modules.entries import crud as entries_crud

comments_router = APIRouter(prefix="/entries/{entry_id}/comments", tags=["Comments"])


async def _get_published_entry_or_404(db: AsyncSession, entry_id: int):
    entry = await entries_crud.get_entry_by_id(db, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada no encontrada.",
        )
    return entry


@comments_router.get("", response_model=CommentListResponse)
async def list_entry_comments(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
):
    """US: List the comments of an entry, newest first."""
    await _get_published_entry_or_404(db, entry_id)
    comments, total = await crud.list_comments(db, entry_id)
    return CommentListResponse(
        items=[CommentResponse.model_validate(c) for c in comments],
        total=total,
    )


@comments_router.post(
    "",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_entry_comment(
    entry_id: int,
    payload: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """US: Publish a comment on an entry (requires authenticated user)."""
    await _get_published_entry_or_404(db, entry_id)
    comment = await crud.create_comment(
        db,
        entry_id=entry_id,
        author=current_user,
        content=payload.content,
    )
    return CommentResponse.model_validate(comment)


@comments_router.put(
    "/{comment_id}",
    response_model=CommentResponse,
)
async def update_comment(
    entry_id: int,
    comment_id: int,
    payload: CommentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edit own comment."""
    await _get_published_entry_or_404(db, entry_id)
    comment = await crud.get_comment_by_id(db, comment_id)
    if comment is None or comment.entry_id != entry_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comentario no encontrado.",
        )
    if comment.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes editar tus propios comentarios.",
        )
    updated = await crud.update_comment(db, comment, payload.content)
    return CommentResponse.model_validate(updated)


@comments_router.delete(
    "/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_comment(
    entry_id: int,
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete own comment."""
    await _get_published_entry_or_404(db, entry_id)
    comment = await crud.get_comment_by_id(db, comment_id)
    if comment is None or comment.entry_id != entry_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comentario no encontrado.",
        )
    if comment.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes eliminar tus propios comentarios.",
        )
    await crud.delete_comment(db, comment_id)

@comments_router.get(
    "/all/", 
    response_model=CommentListResponse)
async def list_all_comments(
    db: AsyncSession = Depends(get_db),
):
    """US: List the comments of an entry, newest first."""
    comments, total = await crud.list_all_comments(db)
    if comments is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comentarios no encontrados.",
        )
    return CommentListResponse(
        items=[CommentResponse.model_validate(c) for c in comments],
        total=total,
    )

@comments_router.delete(
    "/delete/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
):
    comment = await crud.get_comment_by_id(db, comment_id)
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comentario no encontrado.",
        )

    await crud.delete_comment(db, comment_id)