import uuid
import os
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.deps import get_current_user
from app.db.models import User
from app.services.minio_service import ensure_bucket, get_object_stream, put_object, presign_get_url
from app.services.events import log_event

router = APIRouter(prefix="/media", tags=["media"])

class PresignOut(BaseModel):
    key: str
    url: str

@router.on_event("startup")
def _startup_minio():
    ensure_bucket()

@router.post("/upload", response_model=dict)
async def upload_media(file: UploadFile = File(...), me: User = Depends(get_current_user)):
    if not file.content_type:
        raise HTTPException(status_code=400, detail="Missing content_type")

    if not (file.content_type.startswith("image/") or file.content_type.startswith("video/")):
        raise HTTPException(status_code=400, detail="Only image/* and video/* are allowed in MVP")

    ext = os.path.splitext(file.filename or "")[1].lower()
    key = f"media/u{me.id}/{uuid.uuid4().hex}{ext}"

    content = await file.read()
    put_object(key, content, file.content_type)
    url = presign_get_url(key, expires_seconds=3600)
    media_url = f"/media/{key}"

    log_event("media_upload", me.id, {"key": key, "content_type": file.content_type, "bytes": len(content)})
    return {
        "media_key": key,
        "media_url": media_url,
        "presigned_get_url": url,
        "expires_seconds": 3600,
    }

@router.get("/presign", response_model=PresignOut)
def presign(key: str, me: User = Depends(get_current_user)):
    url = presign_get_url(key, expires_seconds=3600)
    return PresignOut(key=key, url=url)


@router.get("/{key:path}")
def get_media(key: str):
    stream, content_type = get_object_stream(key)
    if stream is None:
        raise HTTPException(status_code=404, detail="Media not found")
    return StreamingResponse(stream, media_type=content_type)
