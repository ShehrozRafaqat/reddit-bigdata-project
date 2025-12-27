import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.deps import get_current_user
from app.db.models import Community, User
from app.db.postgres import get_session
from app.db.mongo import get_db
from app.services.events import log_event

router = APIRouter(tags=["posts"])

class PostIn(BaseModel):
    community_id: int
    title: str
    body: str = ""
    media_keys: List[str] = Field(default_factory=list)

@router.post("/posts", response_model=dict)
async def create_post(
    data: PostIn,
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    community = session.exec(select(Community).where(Community.id == data.community_id)).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    post_id = str(uuid.uuid4())
    doc = {
        "post_id": post_id,
        "community_id": data.community_id,
        "author_user_id": me.id,
        "title": data.title,
        "body": data.body,
        "media_keys": data.media_keys,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "score": 0,
        "num_comments": 0,
    }
    db = get_db()
    await db.posts.insert_one(doc)

    log_event("post_create", me.id, {"post_id": post_id, "community_id": data.community_id, "has_media": bool(data.media_keys)})
    return doc

@router.get("/communities/{community_id}/posts", response_model=list[dict])
async def list_posts(community_id: int, limit: int = 20, skip: int = 0):
    db = get_db()
    cursor = db.posts.find({"community_id": community_id}).sort("created_at", -1).skip(skip).limit(limit)
    posts = await cursor.to_list(length=limit)
    for p in posts:
        p.pop("_id", None)
    return posts

@router.get("/posts/{post_id}", response_model=dict)
async def get_post(post_id: str):
    db = get_db()
    p = await db.posts.find_one({"post_id": post_id})
    if not p:
        raise HTTPException(status_code=404, detail="Post not found")
    p.pop("_id", None)
    return p