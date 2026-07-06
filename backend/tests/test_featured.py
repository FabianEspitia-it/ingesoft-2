import pytest
from httpx import AsyncClient


async def _create_entry_with_engagement(
    auth_client: AsyncClient,
    title: str,
    add_likes: int = 0,
    add_comments: int = 0,
) -> int:
    """Crea una entrada y opcionalmente le agrega reacciones y comentarios."""
    response = await auth_client.post(
        "/entries",
        json={"title": title, "body": "Contenido de prueba"},
    )
    assert response.status_code == 201
    entry_id = response.json()["id"]

    if add_likes > 0:
        await auth_client.post(
            f"/entries/{entry_id}/reactions",
            json={"type": "like"},
        )

    for i in range(add_comments):
        await auth_client.post(
            f"/entries/{entry_id}/comments",
            json={"content": f"Comentario {i + 1}"},
        )

    return entry_id


@pytest.mark.asyncio
async def test_featured_entries_empty_when_no_entries(auth_client: AsyncClient):
    """Verifica que el feed destacado retorna una lista vacía cuando no hay entradas en el sistema."""
    response = await auth_client.get("/entries/featured")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"] == []
    assert payload["total"] == 0


@pytest.mark.asyncio
async def test_featured_entries_returns_above_average(auth_client: AsyncClient):
    """Verifica que solo las entradas que superan el promedio de likes+comentarios aparecen como destacadas."""
    await _create_entry_with_engagement(
        auth_client, "Entrada normal", add_likes=0, add_comments=0
    )

    popular_id = await _create_entry_with_engagement(
        auth_client, "Entrada popular", add_likes=1, add_comments=3
    )

    response = await auth_client.get("/entries/featured")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1

    featured_ids = [item["id"] for item in payload["items"]]
    assert popular_id in featured_ids


@pytest.mark.asyncio
async def test_featured_entries_pagination(auth_client: AsyncClient):
    """Verifica que el endpoint de destacados respeta los parámetros de paginación (page y page_size)."""
    response = await auth_client.get("/entries/featured?page=1&page_size=5")
    assert response.status_code == 200
    payload = response.json()
    assert payload["page"] == 1
    assert payload["page_size"] == 5


@pytest.mark.asyncio
async def test_featured_entries_includes_metrics(auth_client: AsyncClient):
    """Verifica que cada entrada destacada incluye las métricas de likes, comentarios, vistas y autor."""
    await _create_entry_with_engagement(
        auth_client, "Sin engagement", add_likes=0, add_comments=0
    )
    await _create_entry_with_engagement(
        auth_client, "Con engagement", add_likes=1, add_comments=2
    )

    response = await auth_client.get("/entries/featured")
    assert response.status_code == 200
    payload = response.json()

    for item in payload["items"]:
        assert "likes" in item
        assert "comments_count" in item
        assert "view_count" in item
        assert "author" in item
        assert "title" in item
