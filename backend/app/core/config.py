import os

def getenv(key: str, default: str | None = None) -> str | None:
    return os.getenv(key, default)

APP_ENV = getenv("APP_ENV", "dev")

DATABASE_URL = getenv("DATABASE_URL")
MONGO_URL = getenv("MONGO_URL")
MONGO_DB = getenv("MONGO_DB", "reddit")

MINIO_ENDPOINT = getenv("MINIO_ENDPOINT", "http://minio:9000")
MINIO_ACCESS_KEY = getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = getenv("MINIO_SECRET_KEY", "minioadminpass")
MINIO_BUCKET = getenv("MINIO_BUCKET", "media")

JWT_SECRET = getenv("JWT_SECRET", "change-me")
JWT_EXPIRE_MINUTES = int(getenv("JWT_EXPIRE_MINUTES", "1440") or "1440")

EVENT_LOG_DIR = getenv("EVENT_LOG_DIR", "/datalake/events")