import asyncio
import logging
from core.database import SessionLocal
from sqlalchemy.future import select
from models.module import Module
from services.storage_service import storage_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def cleanup_orphans():
    """
    Deletes any objects in MinIO that are older than 24 hours and do not have
    a matching file_key in the modules table.
    """
    logger.info("Starting cleanup of orphaned objects...")
    
    # 1. Fetch all confirmed file_keys from DB
    async with SessionLocal() as db:
        result = await db.execute(select(Module.file_key))
        confirmed_keys = {row for row in result.scalars().all()}
    
    # 2. List all objects in MinIO
    # Note: boto3 list_objects_v2 is paginated, we should iterate.
    s3_client = storage_service.internal
    bucket = storage_service.bucket_name
    
    orphans_deleted = 0
    paginator = s3_client.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=bucket)
    
    for page in pages:
        if 'Contents' not in page:
            continue
            
        for obj in page['Contents']:
            key = obj['Key']
            # We don't have a reliable age check right here without checking timezone, 
            # but usually upload intents expire in 1 hour. We can check object 'LastModified'.
            import datetime
            now = datetime.datetime.now(datetime.timezone.utc)
            age = now - obj['LastModified']
            
            # If object is older than 2 hours and not in the DB, delete it
            if age.total_seconds() > 7200 and key not in confirmed_keys:
                logger.info(f"Deleting orphaned object: {key}")
                s3_client.delete_object(Bucket=bucket, Key=key)
                orphans_deleted += 1
                
    logger.info(f"Cleanup complete. Deleted {orphans_deleted} orphaned objects.")

if __name__ == "__main__":
    asyncio.run(cleanup_orphans())
