import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_categories(client: AsyncClient):
    """Verifica que el endpoint de categorías retorna la lista predefinida incluyendo 'Startups'."""
    response = await client.get("/categories")
    assert response.status_code == 200
    categories = response.json()
    assert "Startups" in categories
    assert isinstance(categories, list)


@pytest.mark.asyncio
async def test_create_entry_with_categories_and_tags(auth_client: AsyncClient):
    """Verifica que al crear una entrada se asignan categorías y etiquetas correctamente, deduplicando por caso."""
    response = await auth_client.post(
        "/entries",
        json={
            "title": "Entrada etiquetada",
            "body": "Contenido",
            "category_names": ["Startups"],
            "tags": ["Python", "fastapi", "python"],
        },
    )
    assert response.status_code == 201
    entry = response.json()
    assert entry["categories"] == ["Startups"]
    assert entry["tags"] == ["python", "fastapi"]


@pytest.mark.asyncio
async def test_invalid_category_rejected(auth_client: AsyncClient):
    """Verifica que una categoría no válida (fuera del catálogo predefinido) es rechazada con 422."""
    response = await auth_client.post(
        "/entries",
        json={
            "title": "Entrada",
            "body": "Contenido",
            "category_names": ["NoExiste"],
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_categories_reused_across_entries(auth_client: AsyncClient):
    """Verifica que las categorías se reutilizan entre entradas sin duplicarlas (resolución case-insensitive)."""
    first = await auth_client.post(
        "/entries",
        json={"title": "A", "body": "x", "category_names": ["Emprendimiento"]},
    )
    second = await auth_client.post(
        "/entries",
        json={"title": "B", "body": "y", "category_names": ["emprendimiento"]},
    )
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["categories"] == ["Emprendimiento"]
    assert second.json()["categories"] == ["Emprendimiento"]
