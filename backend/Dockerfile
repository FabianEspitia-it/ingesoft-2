## Stage 1: Builder
FROM python:3.13-slim AS builder

# Install uv for dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy dependency files first to leverage Docker cache
COPY pyproject.toml uv.lock ./

# Create virtual env and install prod dependencies (no dev, no project)
RUN uv venv && \
    uv sync --locked --no-editable --no-install-project --no-dev

# Copy the rest of the application code
COPY . .

# ----
# Stage 2: Production
FROM python:3.13-slim AS production

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser


RUN apt-get update && apt-get install -y \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Minimal runtime deps (curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy virtualenv from builder
COPY --from=builder /app/.venv /app/.venv

# Copy app source (and alembic files if needed for migrations)
#COPY --from=builder --chown=appuser:appuser /app/src ./src
#COPY --from=builder --chown=appuser:appuser /app/alembic.ini /app/alembic.ini
#COPY --from=builder --chown=appuser:appuser /app/alembic ./alembic

# Make venv executables available
ENV PATH="/app/.venv/bin:$PATH"

# Runtime env
ENV PORT=8080
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE ${PORT}

USER appuser

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/ping || exit 1

# Start the API
CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port ${PORT}"]