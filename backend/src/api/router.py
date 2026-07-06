import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

import src.infrastructure.db.models  # noqa: F401
from src.api.health import root_router
from src.core.config import settings
from src.infrastructure.db.database import close_db, init_db
from src.modules.auth.router import auth_router
from src.modules.comments.router import comments_router
from src.modules.entries.categories import categories_router
from src.modules.entries.router import entries_router
from src.modules.search.router import search_router
from src.modules.users.router import users_router
from src.modules.projects.router import projects_router
from src.modules.reactions.router import reactions_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifespan: startup and shutdown events.

    Ensures proper initialization and cleanup of resources:
    - Creates all DB tables on startup (development only)
    - Closes database connections on shutdown
    """
    if settings.ENVIRONMENT == "development":
        await init_db()

    yield
    await close_db()


if settings.ENVIRONMENT == "development":
    app = FastAPI(lifespan=lifespan)
else:
    app = FastAPI(lifespan=lifespan, openapi_url=None)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every incoming request with method, path, status and duration."""
    start = time.time()
    logger.info("→ %s %s", request.method, request.url.path)
    response = await call_next(request)
    logger.info(
        "← %s %s %s (%.2fs)",
        request.method,
        request.url.path,
        response.status_code,
        time.time() - start,
    )
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Set-Cookie"],
)

app.include_router(root_router, tags=["Root"])
app.include_router(entries_router)
app.include_router(comments_router)
app.include_router(categories_router)
app.include_router(auth_router)
app.include_router(search_router)
app.include_router(users_router)
app.include_router(projects_router)
app.include_router(reactions_router)

# --- Register new module routers below this line ---


def custom_openapi():
    """
    Generate a custom OpenAPI schema with session cookie security scheme.

    Adds the session cookie as a global security requirement so Swagger UI
    will include it in authenticated requests.
    """
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        routes=app.routes,
    )

    openapi_schema.setdefault("components", {})
    openapi_schema["components"]["securitySchemes"] = {
        "session": {
            "type": "apiKey",
            "in": "cookie",
            "name": "session",
        }
    }
    openapi_schema["security"] = [{"session": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


if settings.ENVIRONMENT == "development":
    app.openapi = custom_openapi