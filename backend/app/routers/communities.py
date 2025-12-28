from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.deps import get_current_user
from app.db.models import Community, CommunityMembership, User
from app.db.postgres import get_session
from app.services.events import log_event

router = APIRouter(prefix="/communities", tags=["communities"])

class CommunityIn(BaseModel):
    name: str
    description: str = ""

class CommunityUpdateIn(BaseModel):
    name: str | None = None
    description: str | None = None

@router.post("", response_model=dict)
def create_community(
    data: CommunityIn,
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    existing = session.exec(select(Community).where(Community.name == data.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Community name already exists")

    c = Community(name=data.name, description=data.description, created_by_user_id=me.id)
    session.add(c)
    session.commit()
    session.refresh(c)

    membership = CommunityMembership(user_id=me.id, community_id=c.id)
    session.add(membership)
    session.commit()

    log_event("community_create", me.id, {"community_id": c.id, "name": c.name})
    return {"id": c.id, "name": c.name, "description": c.description, "created_by_user_id": c.created_by_user_id}

@router.get("", response_model=list[dict])
def list_communities(session: Session = Depends(get_session)):
    communities = session.exec(select(Community).order_by(Community.created_at.desc())).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "created_by_user_id": c.created_by_user_id,
            "created_at": c.created_at,
        }
        for c in communities
    ]


@router.patch("/{community_id}", response_model=dict)
def update_community(
    community_id: int,
    data: CommunityUpdateIn,
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    community = session.exec(select(Community).where(Community.id == community_id)).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    if community.created_by_user_id != me.id:
        raise HTTPException(status_code=403, detail="Not authorized to update community")

    if data.name is not None:
        cleaned = data.name.strip()
        if not cleaned:
            raise HTTPException(status_code=400, detail="Community name cannot be empty")
        if cleaned != community.name:
            existing = session.exec(select(Community).where(Community.name == cleaned)).first()
            if existing:
                raise HTTPException(status_code=400, detail="Community name already exists")
            community.name = cleaned

    if data.description is not None:
        community.description = data.description.strip()

    session.add(community)
    session.commit()
    session.refresh(community)

    log_event("community_update", me.id, {"community_id": community.id})
    return {
        "id": community.id,
        "name": community.name,
        "description": community.description,
        "created_by_user_id": community.created_by_user_id,
        "created_at": community.created_at,
    }


@router.post("/{community_id}/join", response_model=dict)
def join_community(
    community_id: int,
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    community = session.exec(select(Community).where(Community.id == community_id)).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    existing = session.exec(
        select(CommunityMembership).where(
            CommunityMembership.user_id == me.id,
            CommunityMembership.community_id == community_id,
        )
    ).first()
    if existing:
        return {"status": "already_joined"}

    membership = CommunityMembership(user_id=me.id, community_id=community_id)
    session.add(membership)
    session.commit()
    session.refresh(membership)

    log_event("community_join", me.id, {"community_id": community_id})
    return {"status": "joined"}


@router.delete("/{community_id}/join", response_model=dict)
def leave_community(
    community_id: int,
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    membership = session.exec(
        select(CommunityMembership).where(
            CommunityMembership.user_id == me.id,
            CommunityMembership.community_id == community_id,
        )
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")

    session.delete(membership)
    session.commit()

    log_event("community_leave", me.id, {"community_id": community_id})
    return {"status": "left"}
