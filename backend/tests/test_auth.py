import pytest

@pytest.mark.asyncio
async def test_login_success(async_client):
    response = await async_client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "admin"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_failure(async_client):
    response = await async_client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "wrongpassword"}
    )
    assert response.status_code == 401
