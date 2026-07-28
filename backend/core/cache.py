import logging

from redis import asyncio as aioredis
from redis.exceptions import RedisError

from core.config import settings

logger = logging.getLogger(__name__)

redis_client: aioredis.Redis | None = None


async def init_redis() -> aioredis.Redis:
    global redis_client
    redis_client = aioredis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
    return redis_client

async def close_redis() -> None:
    if redis_client is not None:
        await redis_client.close()

async def cache_get(key: str) -> str | None:
    if redis_client is None:
        return None
    try:
        return await redis_client.get(key)
    except (RedisError, OSError) as exc:
        logger.warning("Cache read failed for %s: %s", key, exc)
        return None

async def cache_set(key: str, value: str, ttl: int = 30) -> None:
    if redis_client is None:
        return
    try:
        await redis_client.set(key, value, ex=ttl)
    except (RedisError, OSError) as exc:
        logger.warning("Cache write failed for %s: %s", key, exc)

async def cache_delete_pattern(pattern: str) -> None:
    if redis_client is None:
        return
    try:
        async for key in redis_client.scan_iter(pattern):
            await redis_client.delete(key)
    except (RedisError, OSError) as exc:
        logger.warning("Cache invalidation failed for %s: %s", pattern, exc)
