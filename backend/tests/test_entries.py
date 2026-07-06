from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.db.models import (
    Entry,
    Session,
    User,
    UserAffiliation,
    UserRole,
)
from src.modules.auth.services.password import hash_password
from tests.conftest import TEST_PASSWORD


async def _login_admin(client: AsyncClient, db_session: AsyncSession) -> User:
    """Create an administrator, open a session and attach its cookie to client."""
    admin = User(
        email="admin@unal.edu.co",
        full_name="Admin Prueba",
        password=hash_password(TEST_PASSWORD),
        affiliation=UserAffiliation.professor,
        role=UserRole.administrator,
        email_verified=True,
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)

    token = "admin-session-token"
    db_session.add(
        Session(
            user_id=admin.id,
            token=token,
            expires_at=datetime.now(UTC) + timedelta(hours=1),
            is_active=True,
        )
    )
    await db_session.commit()
    client.cookies.set("session", token)
    return admin


@pytest.mark.asyncio
async def test_list_entries_empty(client: AsyncClient):
    """Verifica que el listado de entradas retorna vacío cuando no hay publicaciones en el sistema."""
    response = await client.get("/entries")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"] == []
    assert payload["total"] == 0


@pytest.mark.asyncio
async def test_create_entry_requires_auth(client: AsyncClient):
    """Verifica que un usuario no autenticado no puede crear una entrada."""
    response = await client.post(
        "/entries",
        json={"title": "Mi entrada", "body": "Contenido de prueba"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_and_read_entry(auth_client: AsyncClient):
    """Verifica el flujo completo de crear una entrada y leerla, incluyendo el incremento de vistas."""
    create_response = await auth_client.post(
        "/entries",
        json={"title": "Startup UNAL", "body": "Historia de emprendimiento"},
    )
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["title"] == "Startup UNAL"
    assert created["author"]["full_name"] == "Autor Prueba"

    list_response = await auth_client.get("/entries")
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1

    detail_response = await auth_client.get(f"/entries/{created['id']}")
    assert detail_response.status_code == 200
    assert detail_response.json()["view_count"] == 1


@pytest.mark.asyncio
async def test_filter_success_cases(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """US: the success-cases page lists only admin-flagged entries (RN-23)."""
    db_session.add_all(
        [
            Entry(
                author_id=test_user.id,
                title="Entrada normal",
                body="Contenido",
                is_success_case=False,
            ),
            Entry(
                author_id=test_user.id,
                title="Caso destacado",
                body="Contenido",
                is_success_case=True,
            ),
        ]
    )
    await db_session.commit()

    all_response = await client.get("/entries")
    assert all_response.json()["total"] == 2

    filtered = await client.get("/entries?is_success_case=true")
    payload = filtered.json()
    assert payload["total"] == 1
    assert payload["items"][0]["title"] == "Caso destacado"
    assert payload["items"][0]["is_success_case"] is True


@pytest.mark.asyncio
async def test_admin_can_flag_success_case(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """RN-23: an administrator can feature an entry as a success case."""
    entry = Entry(author_id=test_user.id, title="Entrada", body="Contenido")
    db_session.add(entry)
    await db_session.commit()
    await db_session.refresh(entry)

    await _login_admin(client, db_session)

    response = await client.patch(
        f"/entries/{entry.id}/success-case",
        json={"is_success_case": True},
    )
    assert response.status_code == 200
    assert response.json()["is_success_case"] is True

    # And it can be un-flagged.
    response = await client.patch(
        f"/entries/{entry.id}/success-case",
        json={"is_success_case": False},
    )
    assert response.status_code == 200
    assert response.json()["is_success_case"] is False


@pytest.mark.asyncio
async def test_non_admin_cannot_flag_success_case(
    auth_client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """RN-23: a regular author is forbidden from featuring entries."""
    entry = Entry(author_id=test_user.id, title="Entrada", body="Contenido")
    db_session.add(entry)
    await db_session.commit()
    await db_session.refresh(entry)

    response = await auth_client.patch(
        f"/entries/{entry.id}/success-case",
        json={"is_success_case": True},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_entry_requires_title(auth_client: AsyncClient):
    """Verifica que una entrada sin título es rechazada con error de validación 422."""
    response = await auth_client.post(
        "/entries",
        json={"title": "", "body": "Contenido"},
    )
    assert response.status_code == 422
