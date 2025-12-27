from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import MONGO_URL, MONGO_DB

if not MONGO_URL:
    raise RuntimeError("MONGO_URL env var is required")

_client: AsyncIOMotorClient | None = None

def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGO_URL)
    return _client

def get_db():
    client = get_client()
    return client[MONGO_DB]