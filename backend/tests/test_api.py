import pytest

@pytest.mark.asyncio
async def test_get_menu(async_client):
    response = await async_client.get("/api/menu")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # the menu should be seeded
    assert len(data) > 0

@pytest.mark.asyncio
async def test_get_customers_unauthorized(async_client):
    response = await async_client.get("/api/customers")
    assert response.status_code == 401 # Unauthorized because no token

@pytest.mark.asyncio
async def test_get_customers_authorized(async_client):
    # First login to get the token
    login_response = await async_client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "admin"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # Use the token to get customers
    headers = {"Authorization": f"Bearer {token}"}
    response = await async_client.get("/api/customers", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
