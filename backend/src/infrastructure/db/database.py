"""
SQLAlchemy database connection and session management for PostgreSQL.

This module provides async database engine and session factory for the application.
Supports two connection modes:
- Production: Uses Cloud SQL Proxy sidecar (connects to localhost)
- Local: Direct TCP/IP connection to Cloud SQL or local PostgreSQL
"""

import asyncio
import logging
import warnings
from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy.engine.url import URL
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from src.core.config import settings

logger = logging.getLogger(__name__)

# Base class for all SQLAlchemy models
Base = declarative_base()


def get_database_url() -> str:
    """
    Construct the database URL for PostgreSQL connection.

    Returns:
        str: The async PostgreSQL connection URL.
    """

    # Configure SSL if required
    query_params = {"ssl": "require"}

    drivername = "postgresql+asyncpg"
    if settings.ENVIRONMENT == "production":
        drivername = "postgresql+psycopg"

        query_params = {"sslmode": "require"}

    url = URL.create(
        drivername=drivername,
        username=settings.DATABASE_USER,
        password=settings.DATABASE_PASSWORD,
        database=settings.DATABASE_NAME,
        host=settings.DATABASE_HOST,
        port=settings.DATABASE_PORT,
        query=query_params,
    )

    return url


def get_connect_args() -> dict[str, Any]:
    """
    Get driver-specific connection arguments.

    Returns:
        dict: Connection arguments for the database driver.
    """
    if settings.ENVIRONMENT == "production":
        # psycopg-specific args
        return {}
    else:
        # asyncpg-specific args - helps with Windows compatibility
        return {
            "server_settings": {"jit": "off"},
        }


# Create async engine
# Optimized pool settings for better performance with multiple concurrent queries
engine = create_async_engine(
    get_database_url(),
    echo=False,  # Disable SQL query logging
    pool_pre_ping=True,  # Verify connections before using
    pool_size=20,  # Increased from 10 to handle more concurrent connections
    max_overflow=30,  # Increased from 20 to allow more overflow connections
    pool_recycle=3600,  # Recycle connections after 1 hour to prevent stale connections
    # Note: pool_reset_on_return is not recommended for async engines
    # as it can cause ResourceClosedError issues
    connect_args=get_connect_args(),
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession]:
    """
    Dependency for FastAPI routes to get database session.

    Yields:
        AsyncSession: Database session that will be automatically closed.

    Example:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(Item))
            return result.scalars().all()
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    Initialize database by creating all tables.

    WARNING: Only use this in development. In production, use Alembic migrations.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """
    Close database connections gracefully on application shutdown.

    Handles asyncio lifecycle issues with asyncpg:
    - Gives pending operations time to complete before disposal
    - Suppresses known asyncpg cleanup errors that occur when event loop closes
    - These errors are harmless and occur across all platforms (Windows, macOS, Linux)

    This function suppresses expected shutdown errors while propagating unexpected ones.
    """
    try:
        # Suppress RuntimeWarnings about unawaited coroutines during shutdown
        # These occur when asyncpg tries to cancel operations as connections close
        warnings.filterwarnings(
            "ignore",
            category=RuntimeWarning,
            message=".*coroutine.*_cancel.*was never awaited.*",
        )
        warnings.filterwarnings(
            "ignore", category=RuntimeWarning, message=".*Enable tracemalloc.*"
        )

        # Give pending async operations a moment to complete
        # This reduces race conditions during shutdown
        await asyncio.sleep(0.1)

        # Dispose of the engine and close all connections
        # close=True ensures connections are closed immediately
        await engine.dispose(close=True)
        logger.info("Database connections closed successfully")
    except (RuntimeError, AttributeError, OSError) as e:
        error_msg = str(e)
        # Known shutdown errors with asyncpg on all platforms
        is_event_loop_closed = "Event loop is closed" in error_msg
        is_proactor_none = "'NoneType' object has no attribute" in error_msg
        is_transport_closed = (
            "unable to perform operation" in error_msg
            and "handler is closed" in error_msg
        )
        is_ssl_error = "SSL" in error_msg

        if (
            is_event_loop_closed
            or is_proactor_none
            or is_transport_closed
            or is_ssl_error
        ):
            # These errors occur when the event loop closes before asyncpg
            # finishes cleanup. They're harmless and can be safely ignored.
            logger.debug(
                f"Ignoring expected asyncpg shutdown error: {type(e).__name__}"
            )
        else:
            # Unexpected error - should be investigated
            logger.error(f"Unexpected error during database shutdown: {e}")
            raise
    except Exception as e:
        # Catch any other unexpected exceptions
        logger.error(f"Unexpected exception during database shutdown: {e}")
        raise