from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from src.api.router import app
from src.infrastructure.db.database import Base, get_db
from src.infrastructure.db.models import Session, User, UserAffiliation, UserRole
from src.modules.auth.services.password import hash_password

TEST_PASSWORD = "Password1"
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def db_engine():
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def db_session(db_engine):
    session_factory = async_sessionmaker(
        db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def test_user(db_session: AsyncSession):
    user = User(
        email="autor@unal.edu.co",
        full_name="Autor Prueba",
        password=hash_password(TEST_PASSWORD),
        affiliation=UserAffiliation.student,
        role=UserRole.author,
        email_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def client(db_session: AsyncSession):
    async def override_get_db():
        try:
            yield db_session
            await db_session.commit()
        except Exception:
            await db_session.rollback()
            raise

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
async def auth_client(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    token = "test-session-token"
    db_session.add(
        Session(
            user_id=test_user.id,
            token=token,
            expires_at=datetime.now(UTC) + timedelta(hours=1),
            is_active=True,
        )
    )
    await db_session.commit()
    client.cookies.set("session", token)
    return client


@pytest.fixture
async def unverified_user(db_session: AsyncSession):
    user = User(
        email="nuevo@unal.edu.co",
        full_name="Usuario Nuevo",
        password=hash_password(TEST_PASSWORD),
        affiliation=UserAffiliation.graduate,
        role=UserRole.author,
        email_verified=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def unverified_auth_client(
    client: AsyncClient,
    db_session: AsyncSession,
    unverified_user: User,
):
    token = "unverified-session-token"
    db_session.add(
        Session(
            user_id=unverified_user.id,
            token=token,
            expires_at=datetime.now(UTC) + timedelta(hours=1),
            is_active=True,
        )
    )
    await db_session.commit()
    client.cookies.set("session", token)
    return client
