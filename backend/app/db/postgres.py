from sqlmodel import SQLModel, create_engine, Session
from app.core.config import DATABASE_URL

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL env var is required")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

def create_tables() -> None:
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session