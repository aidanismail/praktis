import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from core.config import settings

class StorageService:
    def __init__(self):
        protocol = "https" if settings.MINIO_USE_SSL else "http"
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=f"{protocol}://{settings.MINIO_ENDPOINT}",
            aws_access_key_id=settings.MINIO_ROOT_USER,
            aws_secret_access_key=settings.MINIO_ROOT_PASSWORD,
            config=Config(signature_version="s3v4"),
            region_name="ap-southeast-3"
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            self.s3_client.create_bucket(Bucket=self.bucket_name)
            self.s3_client.put_bucket_cors(
                Bucket=self.bucket_name,
                CORSConfiguration={
                    'CORSRules': [{
                        'AllowedHeaders': ['*'],
                        'AllowedMethods': ['GET', 'PUT', 'POST', 'DELETE'],
                        'AllowedOrigins': settings.CORS_ORIGINS.split(","),
                        'ExposeHeaders': ['ETag']
                    }]
                }
            )

    def generate_presigned_upload_url(self, object_name: str, expiration: int = 3600) -> str:
        return self.s3_client.generate_presigned_url(
            "put_object",
            Params={"Bucket": self.bucket_name, "Key": object_name},
            ExpiresIn=expiration
        )

    def generate_presigned_download_url(self, object_name: str, expiration: int = 3600) -> str:
        return self.s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": object_name},
            ExpiresIn=expiration
        )

storage_service = StorageService()