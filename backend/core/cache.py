from redis import asyncio as aioredis

from core.config import settings

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
    return await redis_client.get(key)

async def cache_set(key: str, value: str, ttl: int = 30) -> None:
    if redis_client is None:
        return
    await redis_client.set(key, value, ex=ttl)

async def cache_delete_pattern(pattern: str) -> None:
    if redis_client is None:
        return
    async for key in redis_client.scan_iter(pattern):
        await redis_client.delete(key)
