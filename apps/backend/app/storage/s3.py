from __future__ import annotations

import logging
from functools import lru_cache
from typing import BinaryIO

import boto3
from botocore.client import Config

from app.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_s3_client() -> boto3.client:
    """
    Create an S3 client from env settings.
    Supports AWS S3 and S3-compatible endpoints (MinIO, etc.).
    """
    # For S3-compatible providers, endpoint_url is typically required.
    client = boto3.client(
        "s3",
        region_name=settings.aws_s3_region,
        aws_access_key_id=settings.aws_access_key_id or None,
        aws_secret_access_key=settings.aws_secret_access_key or None,
        endpoint_url=settings.aws_s3_endpoint_url,
        config=Config(signature_version="s3v4"),
    )
    return client


def _require_s3() -> None:
    if not settings.aws_s3_bucket:
        raise RuntimeError("Missing S3 configuration: aws_s3_bucket (S3_BUCKET_NAME)")


def build_resume_s3_key(*, user_id: str, resume_id: str, filename: str) -> str:
    prefix = (settings.aws_s3_resume_prefix or "").strip("/")
    if not prefix:
        prefix = "resumes"
    safe_filename = filename.replace("\\", "/").split("/")[-1]
    return f"{prefix}/{user_id}/{resume_id}/{safe_filename}"


def upload_bytes_to_s3(*, key: str, data: bytes, content_type: str | None = None) -> None:
    _require_s3()
    extra_args = {}
    if content_type:
        extra_args["ContentType"] = content_type

    get_s3_client().put_object(Bucket=settings.aws_s3_bucket, Key=key, Body=data, **extra_args)


def generate_presigned_get_url(*, key: str, expires_seconds: int | None = None) -> str:
    _require_s3()
    ttl = expires_seconds or settings.aws_s3_presign_ttl_seconds
    return get_s3_client().generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": settings.aws_s3_bucket, "Key": key},
        ExpiresIn=ttl,
    )

