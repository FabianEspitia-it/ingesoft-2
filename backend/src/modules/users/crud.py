from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.db.models import User
from src.modules.users.schemas import UpdateUserRequest

async def update_user(
        db: AsyncSession, 
        user: User,
        payload: UpdateUserRequest,
) -> User:  
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.flush()
    await db.refresh(user)
    return user

async def get_user_by_id(
        db: AsyncSession, 
        user_id: int
        ):
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
    )

    return result.scalar_one_or_none()