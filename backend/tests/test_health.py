from httpx import ASGITransport, AsyncClient
from src.api.router import app


async def test_health_check():
    """Verifica que el endpoint de health check responde con status 200 y el cuerpo {"status": "ok"}."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
