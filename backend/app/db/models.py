from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column, String, UniqueConstraint

class User(SQLModel, table=True):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("username"), UniqueConstraint("email"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(sa_column=Column(String(50), nullable=False))
    email: str = Field(sa_column=Column(String(255), nullable=False))
    display_name: str = Field(default="", sa_column=Column(String(120), nullable=False))
    profile_image_key: Optional[str] = Field(default=None, sa_column=Column(String(255)))
    password_hash: str = Field(sa_column=Column(String(255), nullable=False))
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Community(SQLModel, table=True):
    __tablename__ = "communities"
    __table_args__ = (UniqueConstraint("name"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(sa_column=Column(String(80), nullable=False))
    description: str = Field(default="", sa_column=Column(String(500), nullable=False))
    created_by_user_id: int = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CommunityMembership(SQLModel, table=True):
    __tablename__ = "community_memberships"
    __table_args__ = (UniqueConstraint("user_id", "community_id"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    community_id: int = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
