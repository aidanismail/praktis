"""Delete module uploads that were never confirmed.

Dry run by default; pass --delete to remove objects:
    python scripts/cleanup_orphans.py [--delete] [--min-age-hours 24]
"""

import argparse
import asyncio
import datetime
import logging
import re

from sqlalchemy.future import select

from core.database import AsyncSessionLocal
from models.module import Module
from services.storage_service import storage_service

logger = logging.getLogger(__name__)

# Same shape the module presign step generates; the bucket also holds assignments/ and banners/.
MODULE_KEY_PATTERN = re.compile(r"^[0-9a-f]{32}\.(pdf|docx)$")
DEFAULT_MIN_AGE_HOURS = 24


def find_orphan_keys(
    objects: list[tuple[str, datetime.datetime]],
    confirmed_keys: set[str],
    now: datetime.datetime,
    min_age: datetime.timedelta,
) -> list[str]:
    return [
        key
        for key, last_modified in objects
        if MODULE_KEY_PATTERN.match(key)
        and key not in confirmed_keys
        and now - last_modified > min_age
    ]


def _list_objects() -> list[tuple[str, datetime.datetime]]:
    paginator = storage_service.internal.get_paginator("list_objects_v2")
    objects = []
    for page in paginator.paginate(Bucket=storage_service.bucket_name):
        for obj in page.get("Contents", []):
            objects.append((obj["Key"], obj["LastModified"]))
    return objects


async def cleanup_orphans(delete: bool = False, min_age_hours: int = DEFAULT_MIN_AGE_HOURS) -> list[str]:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Module.file_key))
        confirmed_keys = set(result.scalars().all())

    objects = await asyncio.to_thread(_list_objects)
    orphans = find_orphan_keys(
        objects,
        confirmed_keys,
        datetime.datetime.now(datetime.timezone.utc),
        datetime.timedelta(hours=min_age_hours),
    )

    for key in orphans:
        if delete:
            await storage_service.delete_object(key)
        logger.info("%s orphaned module upload: %s", "Deleted" if delete else "Would delete", key)

    logger.info("%s %d orphaned module uploads.", "Deleted" if delete else "Found", len(orphans))
    return orphans


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--delete", action="store_true", help="Delete orphans instead of listing them.")
    parser.add_argument("--min-age-hours", type=int, default=DEFAULT_MIN_AGE_HOURS)
    args = parser.parse_args()
    asyncio.run(cleanup_orphans(delete=args.delete, min_age_hours=args.min_age_hours))
