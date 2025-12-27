import boto3
from botocore.client import Config

from app.core.config import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET

def get_s3():
    return boto3.client(
        "s3",
        endpoint_url=MINIO_ENDPOINT,
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )

def ensure_bucket() -> None:
    s3 = get_s3()
    try:
        s3.head_bucket(Bucket=MINIO_BUCKET)
    except Exception:
        s3.create_bucket(Bucket=MINIO_BUCKET)

def put_object(key: str, content: bytes, content_type: str) -> None:
    s3 = get_s3()
    s3.put_object(Bucket=MINIO_BUCKET, Key=key, Body=content, ContentType=content_type)

def presign_get_url(key: str, expires_seconds: int = 3600) -> str:
    s3 = get_s3()
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": MINIO_BUCKET, "Key": key},
        ExpiresIn=expires_seconds,
    )