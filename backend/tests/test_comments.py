import pytest
from httpx import AsyncClient


async def _create_entry(auth_client: AsyncClient) -> int:
    response = await auth_client.post(
        "/entries",
        json={"title": "Entrada con comentarios", "body": "Contenido"},
    )
    assert response.status_code == 201
    return response.json()["id"]


@pytest.mark.asyncio
async def test_list_comments_empty(auth_client: AsyncClient):
    entry_id = await _create_entry(auth_client)
    response = await auth_client.get(f"/entries/{entry_id}/comments")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"] == []
    assert payload["total"] == 0


@pytest.mark.asyncio
async def test_create_comment_requires_auth(auth_client: AsyncClient):
    entry_id = await _create_entry(auth_client)
    auth_client.cookies.clear()
    response = await auth_client.post(
        f"/entries/{entry_id}/comments",
        json={"content": "Anónimo"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_and_list_comments_descending(auth_client: AsyncClient):
    entry_id = await _create_entry(auth_client)

    first = await auth_client.post(
        f"/entries/{entry_id}/comments", json={"content": "Primer comentario"}
    )
    assert first.status_code == 201
    assert first.json()["author"]["full_name"] == "Autor Prueba"

    second = await auth_client.post(
        f"/entries/{entry_id}/comments", json={"content": "Segundo comentario"}
    )
    assert second.status_code == 201

    listing = await auth_client.get(f"/entries/{entry_id}/comments")
    assert listing.status_code == 200
    payload = listing.json()
    assert payload["total"] == 2
    # Newest first.
    assert payload["items"][0]["content"] == "Segundo comentario"
    assert payload["items"][1]["content"] == "Primer comentario"


@pytest.mark.asyncio
async def test_comment_on_missing_entry_returns_404(auth_client: AsyncClient):
    response = await auth_client.post(
        "/entries/9999/comments", json={"content": "Hola"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_empty_comment_rejected(auth_client: AsyncClient):
    entry_id = await _create_entry(auth_client)
    response = await auth_client.post(
        f"/entries/{entry_id}/comments", json={"content": "   "}
    )
    assert response.status_code == 422
