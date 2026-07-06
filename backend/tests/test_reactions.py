import pytest
from httpx import AsyncClient


async def _create_entry(auth_client: AsyncClient) -> int:
    response = await auth_client.post(
        "/entries",
        json={"title": "Entrada con reacciones", "body": "Contenido"},
    )
    assert response.status_code == 201
    return response.json()["id"]


@pytest.mark.asyncio
async def test_get_reactions_empty(auth_client: AsyncClient):
    """Verifica que una entrada recién creada no tiene reacciones y el usuario no ha reaccionado."""
    entry_id = await _create_entry(auth_client)
    response = await auth_client.get(f"/entries/{entry_id}/reactions")
    assert response.status_code == 200
    payload = response.json()
    assert payload["likes"] == 0
    assert payload["dislikes"] == 0
    assert payload["user_reaction"] is None


@pytest.mark.asyncio
async def test_toggle_reaction_requires_auth(auth_client: AsyncClient):
    """Verifica que un usuario no autenticado no puede agregar una reacción a una entrada."""
    entry_id = await _create_entry(auth_client)
    auth_client.cookies.clear()
    response = await auth_client.post(
        f"/entries/{entry_id}/reactions",
        json={"type": "like"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_add_like_reaction(auth_client: AsyncClient):
    """Verifica que un usuario autenticado puede dar like a una entrada y el conteo se incrementa."""
    entry_id = await _create_entry(auth_client)
    response = await auth_client.post(
        f"/entries/{entry_id}/reactions",
        json={"type": "like"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["likes"] == 1
    assert payload["dislikes"] == 0
    assert payload["user_reaction"] == "like"


@pytest.mark.asyncio
async def test_toggle_same_reaction_removes_it(auth_client: AsyncClient):
    """Verifica que al enviar la misma reacción dos veces se elimina (comportamiento toggle)."""
    entry_id = await _create_entry(auth_client)

    await auth_client.post(
        f"/entries/{entry_id}/reactions",
        json={"type": "like"},
    )

    response = await auth_client.post(
        f"/entries/{entry_id}/reactions",
        json={"type": "like"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["likes"] == 0
    assert payload["user_reaction"] is None


@pytest.mark.asyncio
async def test_change_reaction_type(auth_client: AsyncClient):
    """Verifica que al cambiar de like a dislike se actualiza correctamente sin duplicar reacciones."""
    entry_id = await _create_entry(auth_client)

    await auth_client.post(
        f"/entries/{entry_id}/reactions",
        json={"type": "like"},
    )

    response = await auth_client.post(
        f"/entries/{entry_id}/reactions",
        json={"type": "dislike"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["likes"] == 0
    assert payload["dislikes"] == 1
    assert payload["user_reaction"] == "dislike"


@pytest.mark.asyncio
async def test_invalid_reaction_type_rejected(auth_client: AsyncClient):
    """Verifica que un tipo de reacción no válido (distinto a like/dislike) es rechazado con 422."""
    entry_id = await _create_entry(auth_client)
    response = await auth_client.post(
        f"/entries/{entry_id}/reactions",
        json={"type": "love"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_reaction_on_missing_entry_returns_404(auth_client: AsyncClient):
    """Verifica que intentar reaccionar a una entrada inexistente retorna error 404."""
    response = await auth_client.post(
        "/entries/9999/reactions",
        json={"type": "like"},
    )
    assert response.status_code == 404
