import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

@pytest_asyncio.fixture(loop_scope="session")
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        yield client
