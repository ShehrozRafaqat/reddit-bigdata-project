from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.postgres import create_tables
from app.routers.auth import router as auth_router
from app.routers.communities import router as communities_router
from app.routers.posts import router as posts_router
from app.routers.comments import router as comments_router
from app.routers.media import router as media_router

app = FastAPI(title="Reddit Big Data MVP", version="0.1.0")

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

@app.on_event("startup")
def on_startup():
    create_tables()

app.include_router(auth_router)
app.include_router(communities_router)
app.include_router(posts_router)
app.include_router(comments_router)
app.include_router(media_router)

@app.get("/", tags=["health"])
def root():
    return {"ok": True, "docs": "/docs"}
