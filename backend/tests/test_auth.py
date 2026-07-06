import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.db.models import User
from src.modules.auth.services.password import verify_password
from src.modules.auth.services.tokens import create_email_verification_token
from tests.conftest import TEST_PASSWORD

REGISTER_PAYLOAD = {
    "full_name": "Estudiante UNAL",
    "email": "estudiante@unal.edu.co",
    "password": TEST_PASSWORD,
    "affiliation": "student",
    "accepted_terms": True,
}


@pytest.fixture(autouse=True)
def mock_verification_email(monkeypatch):
    monkeypatch.setattr(
        "src.modules.auth.router.send_verification_email",
        lambda user, token: None,
    )


async def test_register_success(client: AsyncClient, db_session: AsyncSession):
    """Verifica que un usuario puede registrarse con correo institucional y se crea la cuenta sin verificar."""
    response = await client.post("/auth/register", json=REGISTER_PAYLOAD)

    assert response.status_code == 201
    assert "Revisa tu correo" in response.json()["message"]

    result = await db_session.execute(
        select(User).where(User.email == REGISTER_PAYLOAD["email"])
    )
    user = result.scalar_one()
    assert user.email_verified is False
    assert user.full_name == REGISTER_PAYLOAD["full_name"]
    assert verify_password(TEST_PASSWORD, user.password)


async def test_register_rejects_non_unal_email(client: AsyncClient):
    """Verifica que un correo no institucional (distinto a @unal.edu.co) es rechazado."""
    payload = {**REGISTER_PAYLOAD, "email": "user@gmail.com"}
    response = await client.post("/auth/register", json=payload)

    assert response.status_code == 422


async def test_register_rejects_weak_password(client: AsyncClient):
    """Verifica que una contraseña débil (sin mayúscula o número, menos de 8 caracteres) es rechazada."""
    payload = {**REGISTER_PAYLOAD, "password": "weakpass"}
    response = await client.post("/auth/register", json=payload)

    assert response.status_code == 422


async def test_register_rejects_duplicate_email(
    client: AsyncClient,
    test_user: User,
):
    """Verifica que no se puede registrar una cuenta con un correo que ya existe en el sistema."""
    payload = {**REGISTER_PAYLOAD, "email": test_user.email}
    response = await client.post("/auth/register", json=payload)

    assert response.status_code == 409


async def test_register_requires_terms(client: AsyncClient):
    """Verifica que el registro falla si el usuario no acepta los términos y condiciones."""
    payload = {**REGISTER_PAYLOAD, "accepted_terms": False}
    response = await client.post("/auth/register", json=payload)

    assert response.status_code == 422


async def test_verify_email_activates_and_sets_cookie(
    client: AsyncClient,
    db_session: AsyncSession,
):
    """Verifica que al verificar el correo se activa la cuenta y se establece la cookie de sesión."""
    await client.post("/auth/register", json=REGISTER_PAYLOAD)

    result = await db_session.execute(
        select(User).where(User.email == REGISTER_PAYLOAD["email"])
    )
    user = result.scalar_one()
    token = create_email_verification_token(user.id)

    response = await client.post("/auth/verify-email", json={"token": token})

    assert response.status_code == 200
    body = response.json()
    assert body["email_verified"] is True
    assert body["full_name"] == REGISTER_PAYLOAD["full_name"]
    assert "session" in response.cookies


async def test_login_success(client: AsyncClient, test_user: User):
    """Verifica que un usuario verificado puede iniciar sesión con credenciales correctas."""
    response = await client.post(
        "/auth/login",
        json={"email": test_user.email, "password": TEST_PASSWORD},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["full_name"] == test_user.full_name
    assert body["role"] == test_user.role.value
    assert "session" in response.cookies


async def test_login_wrong_password(client: AsyncClient, test_user: User):
    """Verifica que un intento de login con contraseña incorrecta retorna 401."""
    response = await client.post(
        "/auth/login",
        json={"email": test_user.email, "password": "WrongPass1"},
    )

    assert response.status_code == 401


async def test_login_unverified_email(client: AsyncClient, unverified_user: User):
    """Verifica que un usuario con correo no verificado no puede iniciar sesión (retorna 403)."""
    response = await client.post(
        "/auth/login",
        json={"email": unverified_user.email, "password": TEST_PASSWORD},
    )

    assert response.status_code == 403


async def test_logout_revokes_session(auth_client: AsyncClient):
    """Verifica que al cerrar sesión se revoca el token y ya no se puede acceder a rutas protegidas."""
    logout_response = await auth_client.post("/auth/logout")

    assert logout_response.status_code == 200

    me_response = await auth_client.get("/auth/me")
    assert me_response.status_code == 401

    entry_response = await auth_client.post(
        "/entries",
        json={"title": "Entrada", "body": "Contenido"},
    )
    assert entry_response.status_code == 401


async def test_me_returns_authenticated_user(auth_client: AsyncClient, test_user: User):
    """Verifica que el endpoint /me retorna los datos del usuario autenticado correctamente."""
    response = await auth_client.get("/auth/me")

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == test_user.email
    assert body["full_name"] == test_user.full_name


async def test_create_entry_requires_verified_email(
    unverified_auth_client: AsyncClient,
):
    """Verifica que un usuario con correo no verificado no puede crear entradas (retorna 403)."""
    response = await unverified_auth_client.post(
        "/entries",
        json={"title": "Entrada", "body": "Contenido"},
    )

    assert response.status_code == 403
