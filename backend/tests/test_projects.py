import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.db.models import Project, Session, User, UserAffiliation, UserRole
from src.modules.auth.services.password import hash_password
from tests.conftest import TEST_PASSWORD


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
async def test_project(db_session: AsyncSession, test_user: User) -> Project:
    project = Project(
        user_id=test_user.id,
        title="Proyecto de prueba",
        description="Descripción de prueba",
        url="https://github.com/test/proyecto",
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)
    return project


@pytest.fixture
async def other_auth_client(client: AsyncClient, db_session: AsyncSession) -> AsyncClient:
    """Cliente autenticado como un usuario distinto a test_user."""
    from datetime import UTC, datetime, timedelta

    other_user = User(
        email="otro@unal.edu.co",
        full_name="Otro Usuario",
        password=hash_password(TEST_PASSWORD),
        affiliation=UserAffiliation.student,
        role=UserRole.author,
        email_verified=True,
    )
    db_session.add(other_user)
    await db_session.commit()
    await db_session.refresh(other_user)

    token = "other-session-token"
    db_session.add(
        Session(
            user_id=other_user.id,
            token=token,
            expires_at=datetime.now(UTC) + timedelta(hours=1),
            is_active=True,
        )
    )
    await db_session.commit()
    client.cookies.set("session", token)
    return client


# ─── GET /projects ─────────────────────────────────────────────────────────────

async def test_list_projects_empty(client: AsyncClient):
    """Verifica que el listado de proyectos retorna vacío cuando no hay proyectos creados."""
    response = await client.get("/projects")

    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["total"] == 0


async def test_list_projects_returns_project(
    client: AsyncClient,
    test_project: Project,
):
    """Verifica que el listado de proyectos incluye un proyecto existente con su título correcto."""
    response = await client.get("/projects")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == test_project.title


# ─── GET /projects/{id} ────────────────────────────────────────────────────────

async def test_get_project_success(client: AsyncClient, test_project: Project):
    """Verifica que se puede obtener un proyecto por su ID con todos sus campos."""
    response = await client.get(f"/projects/{test_project.id}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == test_project.id
    assert body["title"] == test_project.title
    assert body["description"] == test_project.description
    assert body["url"] == test_project.url
    assert body["user_id"] == test_project.user_id


async def test_get_project_not_found(client: AsyncClient):
    """Verifica que solicitar un proyecto inexistente retorna 404."""
    response = await client.get("/projects/999999")

    assert response.status_code == 404


# ─── POST /projects ────────────────────────────────────────────────────────────

async def test_create_project_success(
    auth_client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """Verifica que un usuario autenticado puede crear un proyecto con título, descripción y URL."""
    payload = {
        "title": "Nuevo proyecto",
        "description": "Una descripción",
        "url": "https://github.com/test/nuevo",
    }
    response = await auth_client.post("/projects", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == payload["title"]
    assert body["description"] == payload["description"]
    assert body["url"] == payload["url"]
    assert body["user_id"] == test_user.id

    result = await db_session.execute(
        select(Project).where(Project.title == payload["title"])
    )
    assert result.scalar_one_or_none() is not None


async def test_create_project_only_title_required(auth_client: AsyncClient):
    """Verifica que solo el título es obligatorio al crear un proyecto (descripción y URL son opcionales)."""
    response = await auth_client.post("/projects", json={"title": "Solo título"})

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Solo título"
    assert body["description"] is None
    assert body["url"] is None


async def test_create_project_requires_auth(client: AsyncClient):
    """Verifica que crear un proyecto sin autenticación retorna 401."""
    response = await client.post("/projects", json={"title": "Proyecto"})

    assert response.status_code == 401


async def test_create_project_rejects_empty_title(auth_client: AsyncClient):
    """Verifica que un título vacío es rechazado con error de validación 422."""
    response = await auth_client.post("/projects", json={"title": ""})

    assert response.status_code == 422


async def test_create_project_rejects_missing_title(auth_client: AsyncClient):
    """Verifica que omitir el campo título es rechazado con error de validación 422."""
    response = await auth_client.post("/projects", json={"description": "Sin título"})

    assert response.status_code == 422


# ─── PUT /projects/{id} ────────────────────────────────────────────────────────

async def test_update_project_success(
    auth_client: AsyncClient,
    db_session: AsyncSession,
    test_project: Project,
):
    """Verifica que el propietario puede actualizar el título de su proyecto."""
    response = await auth_client.put(
        f"/projects/{test_project.id}",
        json={"title": "Título actualizado"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Título actualizado"

    await db_session.refresh(test_project)
    assert test_project.title == "Título actualizado"


async def test_update_project_partial_keeps_other_fields(
    auth_client: AsyncClient,
    test_project: Project,
):
    """Verifica que una actualización parcial conserva los campos no modificados."""
    response = await auth_client.put(
        f"/projects/{test_project.id}",
        json={"title": "Solo cambia el título"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Solo cambia el título"
    assert body["description"] == test_project.description
    assert body["url"] == test_project.url


async def test_update_project_requires_auth(
    client: AsyncClient,
    test_project: Project,
):
    """Verifica que actualizar un proyecto sin autenticación retorna 401."""
    response = await client.put(
        f"/projects/{test_project.id}",
        json={"title": "Hacker"},
    )

    assert response.status_code == 401


async def test_update_project_not_found(auth_client: AsyncClient):
    """Verifica que actualizar un proyecto inexistente retorna 404."""
    response = await auth_client.put(
        "/projects/999999",
        json={"title": "No existe"},
    )

    assert response.status_code == 404


async def test_update_project_forbidden_for_other_user(
    other_auth_client: AsyncClient,
    test_project: Project,
):
    """Verifica que un usuario no puede actualizar el proyecto de otro usuario (retorna 403)."""
    response = await other_auth_client.put(
        f"/projects/{test_project.id}",
        json={"title": "Intento hackear"},
    )

    assert response.status_code == 403


# ─── DELETE /projects/{id} ─────────────────────────────────────────────────────

async def test_delete_project_success(
    auth_client: AsyncClient,
    db_session: AsyncSession,
    test_project: Project,
):
    """Verifica que el propietario puede eliminar su proyecto y este deja de existir en la base de datos."""
    response = await auth_client.delete(f"/projects/{test_project.id}")

    assert response.status_code == 204

    result = await db_session.execute(
        select(Project).where(Project.id == test_project.id)
    )
    assert result.scalar_one_or_none() is None


async def test_delete_project_requires_auth(
    client: AsyncClient,
    test_project: Project,
):
    """Verifica que eliminar un proyecto sin autenticación retorna 401."""
    response = await client.delete(f"/projects/{test_project.id}")

    assert response.status_code == 401


async def test_delete_project_not_found(auth_client: AsyncClient):
    """Verifica que eliminar un proyecto inexistente retorna 404."""
    response = await auth_client.delete("/projects/999999")

    assert response.status_code == 404


async def test_delete_project_forbidden_for_other_user(
    other_auth_client: AsyncClient,
    test_project: Project,
):
    """Verifica que un usuario no puede eliminar el proyecto de otro usuario (retorna 403)."""
    response = await other_auth_client.delete(f"/projects/{test_project.id}")

    assert response.status_code == 403
