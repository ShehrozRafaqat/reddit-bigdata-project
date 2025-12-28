from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.deps import get_current_user
from app.db.models import Community, CommunityMembership, User
from app.db.postgres import get_session
from app.services.events import log_event

router = APIRouter(prefix="/users", tags=["users"])


class UserProfileOut(BaseModel):
    id: int
    username: str
    email: str
    display_name: str
    profile_image_key: str | None


class UserProfileUpdateIn(BaseModel):
    username: str | None = None
    display_name: str | None = None
    profile_image_key: str | None = None


@router.get("/me", response_model=UserProfileOut)
def get_me(me: User = Depends(get_current_user)):
    return UserProfileOut(
        id=me.id,
        username=me.username,
        email=me.email,
        display_name=me.display_name,
        profile_image_key=me.profile_image_key,
    )


@router.patch("/me", response_model=UserProfileOut)
def update_me(
    data: UserProfileUpdateIn,
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    if data.username is not None:
        cleaned = data.username.strip()
        if not cleaned:
            raise HTTPException(status_code=400, detail="Username cannot be empty")
        if cleaned != me.username:
            existing = session.exec(select(User).where(User.username == cleaned)).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username already exists")
            me.username = cleaned

    if data.display_name is not None:
        me.display_name = data.display_name.strip()

    if data.profile_image_key is not None:
        me.profile_image_key = data.profile_image_key

    session.add(me)
    session.commit()
    session.refresh(me)

    log_event(
        "user_profile_update",
        me.id,
        {
            "updated_username": data.username is not None,
            "updated_display_name": data.display_name is not None,
            "updated_profile_image": data.profile_image_key is not None,
        },
    )

    return UserProfileOut(
        id=me.id,
        username=me.username,
        email=me.email,
        display_name=me.display_name,
        profile_image_key=me.profile_image_key,
    )


@router.get("/me/communities", response_model=dict)
def list_my_communities(
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    created = session.exec(
        select(Community).where(Community.created_by_user_id == me.id)
    ).all()
    joined = session.exec(
        select(Community)
        .join(CommunityMembership, CommunityMembership.community_id == Community.id)
        .where(CommunityMembership.user_id == me.id)
    ).all()

    return {
        "created": [
            {"id": community.id, "name": community.name, "description": community.description}
            for community in created
        ],
        "joined": [
            {"id": community.id, "name": community.name, "description": community.description}
            for community in joined
        ],
    }
