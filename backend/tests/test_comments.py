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
    """Verifica que una entrada sin comentarios retorna una lista vacía con total 0."""
    entry_id = await _create_entry(auth_client)
    response = await auth_client.get(f"/entries/{entry_id}/comments")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"] == []
    assert payload["total"] == 0


@pytest.mark.asyncio
async def test_create_comment_requires_auth(auth_client: AsyncClient):
    """Verifica que un usuario no autenticado no puede publicar comentarios."""
    entry_id = await _create_entry(auth_client)
    auth_client.cookies.clear()
    response = await auth_client.post(
        f"/entries/{entry_id}/comments",
        json={"content": "Anónimo"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_and_list_comments_descending(auth_client: AsyncClient):
    """Verifica que los comentarios se crean correctamente y se listan en orden descendente (más reciente primero)."""
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
    assert payload["items"][0]["content"] == "Segundo comentario"
    assert payload["items"][1]["content"] == "Primer comentario"


@pytest.mark.asyncio
async def test_comment_on_missing_entry_returns_404(auth_client: AsyncClient):
    """Verifica que intentar comentar en una entrada inexistente retorna error 404."""
    response = await auth_client.post(
        "/entries/9999/comments", json={"content": "Hola"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_empty_comment_rejected(auth_client: AsyncClient):
    """Verifica que un comentario con contenido vacío o solo espacios es rechazado con 422."""
    entry_id = await _create_entry(auth_client)
    response = await auth_client.post(
        f"/entries/{entry_id}/comments", json={"content": "   "}
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_own_comment(auth_client: AsyncClient):
    """Verifica que un usuario puede editar su propio comentario y se marca con fecha de edición."""
    entry_id = await _create_entry(auth_client)
    create_resp = await auth_client.post(
        f"/entries/{entry_id}/comments", json={"content": "Comentario original"}
    )
    assert create_resp.status_code == 201
    comment_id = create_resp.json()["id"]

    update_resp = await auth_client.put(
        f"/entries/{entry_id}/comments/{comment_id}",
        json={"content": "Comentario editado"},
    )
    assert update_resp.status_code == 200
    payload = update_resp.json()
    assert payload["content"] == "Comentario editado"
    assert payload["edited_at"] is not None


@pytest.mark.asyncio
async def test_update_comment_requires_auth(auth_client: AsyncClient):
    """Verifica que un usuario no autenticado no puede editar un comentario."""
    entry_id = await _create_entry(auth_client)
    create_resp = await auth_client.post(
        f"/entries/{entry_id}/comments", json={"content": "Mi comentario"}
    )
    comment_id = create_resp.json()["id"]

    auth_client.cookies.clear()
    response = await auth_client.put(
        f"/entries/{entry_id}/comments/{comment_id}",
        json={"content": "Editado sin sesión"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_comment_empty_content_rejected(auth_client: AsyncClient):
    """Verifica que editar un comentario con contenido vacío es rechazado con 422."""
    entry_id = await _create_entry(auth_client)
    create_resp = await auth_client.post(
        f"/entries/{entry_id}/comments", json={"content": "Comentario"}
    )
    comment_id = create_resp.json()["id"]

    response = await auth_client.put(
        f"/entries/{entry_id}/comments/{comment_id}",
        json={"content": "   "},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_delete_own_comment(auth_client: AsyncClient):
    """Verifica que un usuario puede eliminar su propio comentario y ya no aparece en el listado."""
    entry_id = await _create_entry(auth_client)
    create_resp = await auth_client.post(
        f"/entries/{entry_id}/comments", json={"content": "A eliminar"}
    )
    comment_id = create_resp.json()["id"]

    delete_resp = await auth_client.delete(
        f"/entries/{entry_id}/comments/{comment_id}"
    )
    assert delete_resp.status_code == 204

    listing = await auth_client.get(f"/entries/{entry_id}/comments")
    assert listing.json()["total"] == 0


@pytest.mark.asyncio
async def test_delete_comment_requires_auth(auth_client: AsyncClient):
    """Verifica que un usuario no autenticado no puede eliminar un comentario."""
    entry_id = await _create_entry(auth_client)
    create_resp = await auth_client.post(
        f"/entries/{entry_id}/comments", json={"content": "Mi comentario"}
    )
    comment_id = create_resp.json()["id"]

    auth_client.cookies.clear()
    response = await auth_client.delete(
        f"/entries/{entry_id}/comments/{comment_id}"
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delete_nonexistent_comment_returns_404(auth_client: AsyncClient):
    """Verifica que intentar eliminar un comentario inexistente retorna error 404."""
    entry_id = await _create_entry(auth_client)
    response = await auth_client.delete(
        f"/entries/{entry_id}/comments/9999"
    )
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_all_comments(auth_client: AsyncClient):
    """Verifica que se carguen todos los comentarios"""
    response = await auth_client.get(
        "/entries/%7Bentry_id%7D/comments/all/"   
    )
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_delete_nonexistent_comment_by_id(auth_client: AsyncClient):
    """Verifica que se elimine un comentario por id"""
    response = await auth_client.delete(
        "/entries/%7BentryId%7D/comments/delete/99999"
    )
    assert response.status_code == 404

