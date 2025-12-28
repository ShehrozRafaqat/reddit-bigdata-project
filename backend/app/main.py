import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from sqlmodel import Session

from app.db.postgres import create_tables, engine
from app.routers.auth import router as auth_router
from app.routers.communities import router as communities_router
from app.routers.posts import router as posts_router
from app.routers.comments import router as comments_router
from app.routers.media import router as media_router
from app.services.seed import seed_demo_data

app = FastAPI(title="Reddit Big Data MVP", version="0.1.0")
logger = logging.getLogger("uvicorn.error")

# Allow Vite dev server to call FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def init_postgres_with_retry() -> None:
    delay_seconds = 1
    while True:
        try:
            create_tables()
            with Session(engine) as session:
                await seed_demo_data(session)
            return
        except OperationalError as exc:
            logger.warning(
                "Postgres not ready yet. Retrying in %s seconds. Error: %s",
                delay_seconds,
                exc,
            )
            await asyncio.sleep(delay_seconds)
            delay_seconds = min(delay_seconds * 2, 10)


@app.on_event("startup")
async def on_startup():
    await init_postgres_with_retry()

app.include_router(auth_router)
app.include_router(communities_router)
app.include_router(posts_router)
app.include_router(comments_router)
app.include_router(media_router)

@app.get("/", tags=["health"])
def root():
    return {"ok": True, "docs": "/docs"}
