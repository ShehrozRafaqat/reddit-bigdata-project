import uuid
import os
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from pydantic import BaseModel

from app.core.deps import get_current_user
from app.db.models import User
from app.services.minio_service import ensure_bucket, get_object_content_type, put_object, presign_get_url
from app.services.events import log_event
from fastapi.responses import StreamingResponse
from app.services.minio_service import get_object


router = APIRouter(prefix="/media", tags=["media"])

ALLOWED_MEDIA_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
}

CONTENT_TYPE_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/ogg": ".ogg",
    "video/quicktime": ".mov",
}

class PresignOut(BaseModel):
    key: str
    url: str
    content_type: str

@router.on_event("startup")
def _startup_minio():
    ensure_bucket()

@router.post("/upload", response_model=dict)
async def upload_media(file: UploadFile = File(...), me: User = Depends(get_current_user)):
    if not file.content_type:
        raise HTTPException(status_code=400, detail="Missing content_type")

    if file.content_type not in ALLOWED_MEDIA_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported media type")

    ext = os.path.splitext(file.filename or "")[1].lower()
    expected_ext = CONTENT_TYPE_EXTENSIONS.get(file.content_type)
    if expected_ext and ext != expected_ext:
        ext = expected_ext
    key = f"media/u{me.id}/{uuid.uuid4().hex}{ext}"

    content = await file.read()
    put_object(key, content, file.content_type)
    url = presign_get_url(key, expires_seconds=3600)

    log_event("media_upload", me.id, {"key": key, "content_type": file.content_type, "bytes": len(content)})
    return {
        "media_key": key,
        "presigned_get_url": url,
        "content_type": file.content_type,
        "expires_seconds": 3600,
    }

@router.get("/presign", response_model=PresignOut)
def presign(key: str, me: User = Depends(get_current_user)):
    url = presign_get_url(key, expires_seconds=3600)
    content_type = get_object_content_type(key)
    return PresignOut(key=key, url=url, content_type=content_type)

@router.get("/{path:path}")
async def serve_media(path: str):
    data, content_type = get_object(path)
    return StreamingResponse(
        data,
        media_type=content_type,
        headers={
            "Content-Disposition": "inline",
            "X-Content-Type-Options": "nosniff",
        },
    )
