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


async def _login_second_author(client: AsyncClient, db_session: AsyncSession) -> User:
    """Create a second author, open a session and attach its cookie to client."""
    author = User(
        email="otro@unal.edu.co",
        full_name="Otro Autor",
        password=hash_password(TEST_PASSWORD),
        affiliation=UserAffiliation.graduate,
        role=UserRole.author,
        email_verified=True,
    )
    db_session.add(author)
    await db_session.commit()
    await db_session.refresh(author)

    token = "second-author-session-token"
    db_session.add(
        Session(
            user_id=author.id,
            token=token,
            expires_at=datetime.now(UTC) + timedelta(hours=1),
            is_active=True,
        )
    )
    await db_session.commit()
    client.cookies.set("session", token)
    return author


# ── Editar entrada (US Release 3) ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_entry_by_owner(auth_client: AsyncClient):
    """El autor puede editar su propia entrada y se marca updated_at (RN-19)."""
    create = await auth_client.post(
        "/entries",
        json={"title": "Título original", "body": "Cuerpo original"},
    )
    entry_id = create.json()["id"]

    response = await auth_client.patch(
        f"/entries/{entry_id}",
        json={"title": "Título editado", "body": "Cuerpo editado"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "Título editado"
    assert payload["body"] == "Cuerpo editado"
    assert payload["updated_at"] is not None


@pytest.mark.asyncio
async def test_update_entry_requires_auth(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """Sin sesión no se puede editar una entrada (401)."""
    entry = Entry(author_id=test_user.id, title="Entrada", body="Contenido")
    db_session.add(entry)
    await db_session.commit()
    await db_session.refresh(entry)

    response = await client.patch(
        f"/entries/{entry.id}",
        json={"title": "Hackeada"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_entry_non_owner_forbidden(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """Un autor distinto no puede editar entradas ajenas (403, RN-7)."""
    entry = Entry(author_id=test_user.id, title="Entrada", body="Contenido")
    db_session.add(entry)
    await db_session.commit()
    await db_session.refresh(entry)

    await _login_second_author(client, db_session)
    response = await client.patch(
        f"/entries/{entry.id}",
        json={"title": "Título ajeno"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_entry_not_found(auth_client: AsyncClient):
    """Editar una entrada inexistente retorna 404."""
    response = await auth_client.patch(
        "/entries/9999999",
        json={"title": "No existe"},
    )
    assert response.status_code == 404


# ── Eliminar entrada (US Release 3) ────────────────────────────────────────


@pytest.mark.asyncio
async def test_delete_entry_by_owner(auth_client: AsyncClient):
    """El autor elimina su entrada (204) y deja de aparecer/leerse."""
    create = await auth_client.post(
        "/entries",
        json={"title": "Para borrar", "body": "Contenido"},
    )
    entry_id = create.json()["id"]

    response = await auth_client.delete(f"/entries/{entry_id}")
    assert response.status_code == 204

    detail = await auth_client.get(f"/entries/{entry_id}")
    assert detail.status_code == 404

    listing = await auth_client.get("/entries")
    assert listing.json()["total"] == 0


@pytest.mark.asyncio
async def test_delete_entry_requires_auth(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """Sin sesión no se puede eliminar una entrada (401)."""
    entry = Entry(author_id=test_user.id, title="Entrada", body="Contenido")
    db_session.add(entry)
    await db_session.commit()
    await db_session.refresh(entry)

    response = await client.delete(f"/entries/{entry.id}")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delete_entry_non_owner_forbidden(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """Un autor distinto no puede eliminar entradas ajenas (403, RN-7)."""
    entry = Entry(author_id=test_user.id, title="Entrada", body="Contenido")
    db_session.add(entry)
    await db_session.commit()
    await db_session.refresh(entry)

    await _login_second_author(client, db_session)
    response = await client.delete(f"/entries/{entry.id}")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_entry_not_found(auth_client: AsyncClient):
    """Eliminar una entrada inexistente retorna 404."""
    response = await auth_client.delete("/entries/9999999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_admin_can_delete_any_entry(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """Un administrador puede moderar (eliminar) entradas de otros autores."""
    entry = Entry(author_id=test_user.id, title="Entrada", body="Contenido")
    db_session.add(entry)
    await db_session.commit()
    await db_session.refresh(entry)

    await _login_admin(client, db_session)
    response = await client.delete(f"/entries/{entry.id}")
    assert response.status_code == 204
