import asyncio
import logging

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """MinIO/S3 access with two clients:

    - an internal client (MINIO_ENDPOINT, Docker network) for server-side
      operations: bucket setup, head_object, delete_object;
    - a public client (MINIO_PUBLIC_ENDPOINT) used only to sign presigned
      URLs, because SigV4 signs the Host header — the URL must be signed
      against the exact origin the browser will request.

    No network I/O happens at construction; call ensure_bucket() from the
    application lifespan.
    """

    def __init__(self):
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self._internal_client = None
        self._public_client = None

    def _make_client(self, endpoint_url: str):
        return boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=settings.MINIO_ROOT_USER,
            aws_secret_access_key=settings.MINIO_ROOT_PASSWORD,
            config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
            region_name="ap-southeast-3",
        )

    @property
    def internal(self):
        if self._internal_client is None:
            protocol = "https" if settings.MINIO_USE_SSL else "http"
            self._internal_client = self._make_client(f"{protocol}://{settings.MINIO_ENDPOINT}")
        return self._internal_client

    @property
    def public(self):
        if self._public_client is None:
            self._public_client = self._make_client(settings.MINIO_PUBLIC_ENDPOINT)
        return self._public_client

    async def ensure_bucket(self) -> None:
        try:
            await asyncio.to_thread(self._ensure_bucket_exists)
        except Exception as exc:
            logger.warning("MinIO bucket check failed, storage may be unavailable: %s", exc)

    def _ensure_bucket_exists(self):
        try:
            self.internal.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            self.internal.create_bucket(Bucket=self.bucket_name)

    async def head_object(self, object_name: str) -> dict | None:
        """Return object metadata, or None if the object does not exist."""
        def _head():
            try:
                return self.internal.head_object(Bucket=self.bucket_name, Key=object_name)
            except ClientError as exc:
                if exc.response.get("Error", {}).get("Code") in ("404", "NoSuchKey", "NotFound"):
                    return None
                raise
        return await asyncio.to_thread(_head)

    async def delete_object(self, object_name: str) -> None:
        await asyncio.to_thread(
            self.internal.delete_object, Bucket=self.bucket_name, Key=object_name
        )

    def generate_presigned_upload_url(self, object_name: str, expiration: int = 3600) -> str:
        return self.public.generate_presigned_url(
            "put_object",
            Params={"Bucket": self.bucket_name, "Key": object_name},
            ExpiresIn=expiration
        )

    def generate_presigned_download_url(self, object_name: str, expiration: int = 3600) -> str:
        return self.public.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": object_name},
            ExpiresIn=expiration
        )

storage_service = StorageService()