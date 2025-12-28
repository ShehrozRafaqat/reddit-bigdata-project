import uuid
from datetime import datetime, timezone

from sqlmodel import Session, select

from app.core.security import hash_password
from app.db.models import Community, User
from app.db.mongo import get_db
from app.services.events import log_event


async def seed_demo_data(session: Session) -> None:
    user = session.exec(select(User).order_by(User.id)).first()
    if not user:
        user = User(
            username="demo",
            email="demo@example.com",
            display_name="Demo User",
            password_hash=hash_password("demo1234"),
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        log_event("seed_user", user.id, {"username": user.username})

    community = session.exec(select(Community).order_by(Community.id)).first()
    if not community:
        community = Community(
            name="demo",
            description="Welcome to the demo community.",
            created_by_user_id=user.id,
        )
        session.add(community)
        session.commit()
        session.refresh(community)
        log_event("seed_community", user.id, {"community_id": community.id})

    db = get_db()
    existing_posts = await db.posts.count_documents({})
    if existing_posts == 0:
        post_id = str(uuid.uuid4())
        post_doc = {
            "post_id": post_id,
            "community_id": community.id,
            "author_user_id": user.id,
            "title": "Welcome to the demo feed",
            "body": "This seeded post shows up for the demo flow. Feel free to add more!",
            "media_keys": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "score": 0,
            "num_comments": 1,
        }
        await db.posts.insert_one(post_doc)
        log_event("seed_post", user.id, {"post_id": post_id, "community_id": community.id})

        comment_id = str(uuid.uuid4())
        comment_doc = {
            "comment_id": comment_id,
            "post_id": post_id,
            "parent_comment_id": None,
            "author_user_id": user.id,
            "body": "Drop a comment to keep the conversation going.",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "score": 0,
        }
        await db.comments.insert_one(comment_doc)
        log_event("seed_comment", user.id, {"comment_id": comment_id, "post_id": post_id})
