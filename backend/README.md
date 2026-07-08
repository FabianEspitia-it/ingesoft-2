# UN Silicon Valley — Backend

REST API for the **UN Silicon Valley** platform, a space for entrepreneurship at
the Universidad Nacional de Colombia (UNAL) where members publish entries,
success stories, projects, comments and reactions.

## Tech stack

| Concern            | Technology                                             |
| ------------------ | ------------------------------------------------------ |
| Language           | Python 3.13                                            |
| Web framework      | [FastAPI](https://fastapi.tiangolo.com/)               |
| ASGI server        | [Uvicorn](https://www.uvicorn.org/)                    |
| ORM                | [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (async)  |
| Database           | PostgreSQL (Cloud SQL in production)                   |
| DB drivers         | `asyncpg` (local), `psycopg` (production)              |
| Validation         | Pydantic v2 / `pydantic-settings`                      |
| Auth               | JWT (`pyjwt`) + bcrypt password hashing                |
| Object storage     | Google Cloud Storage (private bucket, V4 signed URLs)  |
| Transactional mail | [Resend](https://resend.com/)                          |
| Package manager    | [uv](https://docs.astral.sh/uv/)                       |
| Lint / format      | [Ruff](https://docs.astral.sh/ruff/)                   |
| Tests              | pytest + pytest-asyncio (SQLite in-memory)             |

## Architecture

The codebase follows a **modular, layered** structure. Each feature lives in its
own module under `src/modules/` and is split into three layers:

- **`router.py`** — HTTP layer: FastAPI routes, request/response wiring, auth
  dependencies. No business logic beyond validation and orchestration.
- **`crud.py`** — data-access layer: async SQLAlchemy queries and persistence.
- **`schemas.py`** — Pydantic models for request/response contracts.

```
src/
├── main.py                     # App entrypoint (title, version, metadata)
├── api/
│   ├── router.py               # FastAPI app, lifespan, CORS, request logging,
│   │                           #   and registration of every module router
│   ├── health.py               # Health / root endpoints
│   └── dependencies.py         # Shared FastAPI dependencies
├── core/
│   └── config.py               # Settings loaded from environment (.env)
├── infrastructure/
│   ├── db/
│   │   ├── database.py          # Async engine, session factory, get_db()
│   │   └── models.py            # SQLAlchemy ORM models (single source of truth)
│   └── storage/
│       └── gcs.py               # Cloud Storage upload + signed-URL helpers
└── modules/                    # Feature modules (router / crud / schemas)
    ├── auth/                    # Registration, login, email verification, JWT
    ├── users/                   # User profiles and external links
    ├── entries/                 # Blog/forum entries, categories, success cases
    ├── comments/                # Comments on entries
    ├── reactions/               # Like / dislike reactions
    ├── projects/                # Portfolio projects
    └── search/                  # Cross-entity search
```

Key design notes:

- **Async end to end** — the engine, sessions and all queries are async.
- **Auth via session cookies** — a signed session token is stored in an
  `httponly` cookie and validated against the `sessions` table.
- **Private object storage** — cover images are stored in a private GCS bucket;
  reads are served through short-lived V4 signed URLs generated on demand.
- **Environment-aware DB driver** — `asyncpg` for local dev, `psycopg` for the
  Cloud SQL connection in production.
- **Tables auto-created in development** — on startup in `development` the app
  runs `Base.metadata.create_all`; production expects the schema to already
  exist.

## Running for development

### Prerequisites

- Python **3.13**
- [uv](https://docs.astral.sh/uv/getting-started/installation/)
- Access to a PostgreSQL database (local or Cloud SQL)

### 1. Install dependencies

```bash
cd backend
uv sync
```

### 2. Configure environment

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Relevant variables:

| Variable                          | Description                                             |
| --------------------------------- | ------------------------------------------------------- |
| `ENVIRONMENT`                     | `development` or `production`                            |
| `DATABASE_HOST` / `_PORT`         | PostgreSQL host and port                                |
| `DATABASE_NAME` / `_USER` / `_PASSWORD` | Database credentials                              |
| `CORS_ORIGINS`                    | Allowed frontend origins (JSON list)                    |
| `FRONTEND_URL`                    | Base URL of the frontend                                |
| `JWT_SECRET` / `JWT_EXPIRATION_HOURS` | JWT signing secret and lifetime                     |
| `GCS_BUCKET_NAME`                 | Cloud Storage bucket for cover images                   |
| `GCP_SERVICE_ACCOUNT_EMAIL`       | Service account used to sign storage URLs               |
| `GCP_SERVICE_ACCOUNT_PRIVATE_KEY` | Service account private key (with `\n` escapes)         |
| `RESEND_KEY` / `RESEND_FROM_EMAIL`| Resend API key and sender for verification emails       |

### 3. Run the API

```bash
uv run uvicorn src.main:app --reload --port 9999
```

The API is then available at `http://localhost:9999`. In development,
interactive docs are served at `http://localhost:9999/docs` (disabled in
production).

### Tests, lint and format

```bash
uv run pytest            # run the test suite (SQLite in-memory, no external DB)
uv run ruff check .      # lint
uv run ruff format .     # format
```

## Deployment

The backend is **deployed automatically to Google Cloud Run** on every commit to
the `main` branch.

On push to `main`, the CI/CD pipeline:

1. **Builds** the Docker image using the multi-stage `Dockerfile`
   (`uv`-based build stage → slim `python:3.13-slim` runtime, running as a
   non-root user).
2. **Pushes** the image to the container registry.
3. **Deploys** the new image as a revision to the Cloud Run service.

Runtime details baked into the image:

- The container listens on `$PORT` (defaults to `8080` on Cloud Run) and starts
  with `uvicorn src.main:app`.
- A `HEALTHCHECK` hits `GET /health`.
- The database is reached over Cloud SQL; production uses the `psycopg` driver
  with SSL required.

To build and run the production image locally:

```bash
docker build -t un-silicon-valley-api .
docker run -p 8080:8080 --env-file .env un-silicon-valley-api
```
