import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.deps import get_current_user
from app.db.postgres import get_session
from app.db.mongo import get_db
from app.db.models import CommunityMembership, User
from app.services.events import log_event

router = APIRouter(tags=["comments"])

class CommentIn(BaseModel):
    post_id: str
    body: str
    parent_comment_id: Optional[str] = None

@router.post("/comments", response_model=dict)
async def add_comment(
    data: CommentIn,
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    db = get_db()
    post = await db.posts.find_one({"post_id": data.post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    community_id = post.get("community_id")
    if not community_id:
        raise HTTPException(status_code=400, detail="Post community missing")

    membership = session.exec(
        select(CommunityMembership).where(
            CommunityMembership.user_id == me.id,
            CommunityMembership.community_id == community_id,
        )
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Join the community to comment.")

    comment_id = str(uuid.uuid4())
    doc = {
        "comment_id": comment_id,
        "post_id": data.post_id,
        "parent_comment_id": data.parent_comment_id,
        "author_user_id": me.id,
        "body": data.body,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "score": 0,
    }
    await db.comments.insert_one(doc)

    await db.posts.update_one({"post_id": data.post_id}, {"$inc": {"num_comments": 1}})

    log_event("comment_create", me.id, {"comment_id": comment_id, "post_id": data.post_id, "is_reply": bool(data.parent_comment_id)})
    doc.pop("_id", None)
    return doc

@router.get("/posts/{post_id}/comments", response_model=list[dict])
async def list_comments(post_id: str, limit: int = 50, skip: int = 0):
    db = get_db()
    cursor = db.comments.find({"post_id": post_id}).sort("created_at", 1).skip(skip).limit(limit)
    comments = await cursor.to_list(length=limit)
    for c in comments:
        c.pop("_id", None)
    return comments
