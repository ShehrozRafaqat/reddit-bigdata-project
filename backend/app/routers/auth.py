from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

from app.core.security import hash_password, verify_password, create_access_token
from app.db.postgres import get_session
from app.db.models import User
from app.services.events import log_event

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterIn(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginIn(BaseModel):
    username: str
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/register", response_model=dict)
def register(data: RegisterIn, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.username == data.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    existing_email = session.exec(select(User).where(User.email == data.email)).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(username=data.username, email=data.email, password_hash=hash_password(data.password))
    session.add(user)
    session.commit()
    session.refresh(user)

    log_event("user_register", user.id, {"username": user.username})
    return {"id": user.id, "username": user.username, "email": user.email}

@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == data.username)).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(str(user.id))
    log_event("user_login", user.id, {"username": user.username})
    return TokenOut(access_token=token)