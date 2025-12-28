import boto3
from botocore.client import Config
from io import BytesIO

from app.core.config import (
    MINIO_ENDPOINT,
    MINIO_PUBLIC_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET,
)

def get_s3(endpoint_url: str):
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )

def ensure_bucket() -> None:
    s3 = get_s3(MINIO_ENDPOINT)
    try:
        s3.head_bucket(Bucket=MINIO_BUCKET)
    except Exception:
        s3.create_bucket(Bucket=MINIO_BUCKET)

def put_object(key: str, content: bytes, content_type: str) -> None:
    s3 = get_s3(MINIO_ENDPOINT)
    s3.put_object(Bucket=MINIO_BUCKET, Key=key, Body=content, ContentType=content_type)

def presign_get_url(key: str, expires_seconds: int = 3600) -> str:
    s3 = get_s3(MINIO_PUBLIC_ENDPOINT)
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": MINIO_BUCKET, "Key": key},
        ExpiresIn=expires_seconds,
    )

def get_object(key: str):
    s3 = get_s3(MINIO_ENDPOINT)  # use the S3 client
    obj = s3.get_object(Bucket=MINIO_BUCKET, Key=key)
    return BytesIO(obj['Body'].read()), obj['ContentType']

def get_object_content_type(key: str) -> str:
    s3 = get_s3(MINIO_ENDPOINT)
    metadata = s3.head_object(Bucket=MINIO_BUCKET, Key=key)
    return metadata.get("ContentType", "application/octet-stream")
