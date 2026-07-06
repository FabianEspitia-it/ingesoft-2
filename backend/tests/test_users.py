import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.db.models import User


async def test_get_me_returns_authenticated_user(
    auth_client: AsyncClient, test_user: User
):
    """Verifica que el endpoint /users/me retorna los datos del usuario autenticado."""
    response = await auth_client.get("/users/me")

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == test_user.email
    assert body["full_name"] == test_user.full_name
    assert body["affiliation"] == test_user.affiliation.value


async def test_get_me_requires_auth(client: AsyncClient):
    """Verifica que el endpoint /users/me retorna 401 si no hay sesión activa."""
    response = await client.get("/users/me")

    assert response.status_code == 401


async def test_update_me_updates_full_name(
    auth_client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """Verifica que se puede actualizar el nombre completo del usuario autenticado."""
    response = await auth_client.put(
        "/users/me",
        json={"full_name": "New name"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["full_name"] == "New name"

    await db_session.refresh(test_user)
    assert test_user.full_name == "New name"


async def test_update_me_updates_affiliation(
    auth_client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """Verifica que se puede actualizar la afiliación del usuario (estudiante, egresado, docente)."""
    response = await auth_client.put(
        "/users/me",
        json={"affiliation": "professor"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["affiliation"] == "professor"

    await db_session.refresh(test_user)
    assert test_user.affiliation.value == "professor"


async def test_update_me_updates_bio(
    auth_client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """Verifica que se puede actualizar la biografía del usuario."""
    response = await auth_client.put(
        "/users/me",
        json={"biography": "New bio"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["biography"] == "New bio"

    await db_session.refresh(test_user)
    assert test_user.biography == "New bio"


async def test_update_me_updates_profile_picture(
    auth_client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """Verifica que se puede actualizar la foto de perfil del usuario."""
    response = await auth_client.put(
        "/users/me",
        json={"profile_picture": "New profile picture link"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["profile_picture"] == "New profile picture link"

    await db_session.refresh(test_user)
    assert test_user.profile_picture == "New profile picture link"


async def test_update_me_partial_update_keeps_other_fields(
    auth_client: AsyncClient,
    test_user: User,
):
    """Verifica que una actualización parcial solo modifica los campos enviados y conserva los demás."""
    response = await auth_client.put(
        "/users/me",
        json={
            "full_name": "Change name",
            "biography": "Change bio"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["biography"] == "Change bio"
    assert body["full_name"] == "Change name"
    assert body["affiliation"] == test_user.affiliation.value


async def test_update_me_empty_payload_no_changes(
    auth_client: AsyncClient,
    test_user: User,
):
    """Verifica que enviar un payload vacío no modifica ningún campo del perfil."""
    response = await auth_client.put("/users/me", json={})

    assert response.status_code == 200
    body = response.json()
    assert body["full_name"] == test_user.full_name
    assert body["affiliation"] == test_user.affiliation.value


async def test_update_me_rejects_empty_full_name(auth_client: AsyncClient):
    """Verifica que un nombre vacío es rechazado con error de validación 422."""
    response = await auth_client.put("/users/me", json={"full_name": ""})

    assert response.status_code == 422


async def test_update_me_rejects_invalid_affiliation(auth_client: AsyncClient):
    """Verifica que una afiliación no válida es rechazada con error de validación 422."""
    response = await auth_client.put(
        "/users/me", json={"affiliation": "not_a_real_role"}
    )

    assert response.status_code == 422


async def test_update_me_requires_auth(client: AsyncClient):
    """Verifica que actualizar el perfil sin autenticación retorna 401."""
    response = await client.put("/users/me", json={"full_name": "Hacker"})

    assert response.status_code == 401


async def test_update_me_does_not_change_email(
    auth_client: AsyncClient,
    test_user: User,
):
    """Verifica que al actualizar el perfil no se modifica el correo electrónico del usuario."""
    response = await auth_client.put(
        "/users/me",
        json={"full_name": "Otro Nombre"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == test_user.email
