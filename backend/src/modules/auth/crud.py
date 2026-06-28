from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.db.models import Session, User, UserRole
from src.modules.auth.schemas import RegisterRequest
from src.modules.auth.services.password import hash_password


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(
        select(User).where(User.email == email, User.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, payload: RegisterRequest) -> User:
    user = User(
        email=payload.email,
        full_name=payload.full_name.strip(),
        password=hash_password(payload.password),
        affiliation=payload.affiliation,
        role=UserRole.author,
        email_verified=False,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def mark_email_verified(db: AsyncSession, user: User) -> User:
    user.email_verified = True
    await db.flush()
    await db.refresh(user)
    return user


async def create_session(
    db: AsyncSession,
    *,
    user_id: int,
    token: str,
    expires_at: datetime,
) -> Session:
    session = Session(
        user_id=user_id,
        token=token,
        expires_at=expires_at,
        is_active=True,
    )
    db.add(session)
    await db.flush()
    return session


async def get_active_session_by_token(
    db: AsyncSession,
    token: str,
) -> Session | None:
    result = await db.execute(
        select(Session).where(
            Session.token == token,
            Session.is_active.is_(True),
        )
    )
    return result.scalar_one_or_none()


async def revoke_session(db: AsyncSession, session: Session) -> None:
    session.is_active = False
    await db.flush()
