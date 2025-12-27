from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.deps import get_current_user
from app.db.models import Community, User
from app.db.postgres import get_session
from app.services.events import log_event

router = APIRouter(prefix="/communities", tags=["communities"])

class CommunityIn(BaseModel):
    name: str
    description: str = ""

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

    log_event("community_create", me.id, {"community_id": c.id, "name": c.name})
    return {"id": c.id, "name": c.name, "description": c.description, "created_by_user_id": c.created_by_user_id}

@router.get("", response_model=list[dict])
def list_communities(session: Session = Depends(get_session)):
    communities = session.exec(select(Community).order_by(Community.created_at.desc())).all()
    return [{"id": c.id, "name": c.name, "description": c.description} for c in communities]