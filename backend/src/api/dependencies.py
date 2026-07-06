from datetime import UTC, datetime

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.infrastructure.db.database import get_db
from src.infrastructure.db.models import Session, User, UserRole


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Resolve the authenticated user from the session cookie.

    Validates active session, non-deleted user, and verified email.
    """
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Debes iniciar sesión para realizar esta acción.",
        )

    now = datetime.now(UTC)
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.user))
        .where(
            Session.token == token,
            Session.is_active.is_(True),
            Session.expires_at > now,
        )
    )
    session = result.scalar_one_or_none()
    if session is None or session.user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión inválida o expirada.",
        )

    if not session.user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debes verificar tu correo institucional antes de continuar.",
        )

    return session.user


def require_role(*roles: UserRole):
    """Dependency factory for role-based access control."""

    async def _require_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción.",
            )
        return current_user

    return _require_role
