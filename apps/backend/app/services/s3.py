"""S3 service for resume file storage."""

import logging
from typing import BinaryIO

import boto3
from botocore.exceptions import ClientError

from app.config import settings

logger = logging.getLogger(__name__)


class S3Service:
    """Service for S3 file operations."""

    def __init__(self):
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_s3_region,
        )
        self.bucket = settings.aws_s3_bucket
        self.resume_prefix = settings.aws_s3_resume_prefix

    def _get_resume_key(self, user_id: str, resume_id: str, filename: str) -> str:
        """Generate S3 key for resume file."""
        return f"{self.resume_prefix}{user_id}/{resume_id}/{filename}"

    async def upload_resume(
        self, user_id: str, resume_id: str, filename: str, file_obj: BinaryIO
    ) -> str:
        """Upload resume file to S3 and return the S3 path."""
        key = self._get_resume_key(user_id, resume_id, filename)

        try:
            self.s3_client.upload_fileobj(file_obj, self.bucket, key)
            logger.info(f"Uploaded resume to S3: {key}")
            return key
        except ClientError as e:
            logger.error(f"Failed to upload resume to S3: {e}")
            raise

    async def get_presigned_url(self, s3_path: str, expiration: int = 3600) -> str:
        """Generate presigned URL for resume download (default 1 hour)."""
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": s3_path},
                ExpiresIn=expiration,
            )
            return url
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise

    async def delete_resume(self, s3_path: str) -> bool:
        """Delete resume file from S3."""
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=s3_path)
            logger.info(f"Deleted resume from S3: {s3_path}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete resume from S3: {e}")
            return False

    async def download_resume(self, s3_path: str) -> bytes:
        """Download resume file content from S3."""
        try:
            response = self.s3_client.get_object(Bucket=self.bucket, Key=s3_path)
            return response["Body"].read()
        except ClientError as e:
            logger.error(f"Failed to download resume from S3: {e}")
            raise


# Global S3 service instance
s3_service = S3Service()
