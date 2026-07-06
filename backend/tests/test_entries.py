import pytest
from httpx import AsyncClient


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
async def test_create_entry_requires_title(auth_client: AsyncClient):
    """Verifica que una entrada sin título es rechazada con error de validación 422."""
    response = await auth_client.post(
        "/entries",
        json={"title": "", "body": "Contenido"},
    )
    assert response.status_code == 422
