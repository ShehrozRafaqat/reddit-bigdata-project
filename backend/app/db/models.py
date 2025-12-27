from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column, String, UniqueConstraint

class User(SQLModel, table=True):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("username"), UniqueConstraint("email"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(sa_column=Column(String(50), nullable=False))
    email: str = Field(sa_column=Column(String(255), nullable=False))
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