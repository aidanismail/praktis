import logging

from fastapi import HTTPException, Request, status
from redis.exceptions import RedisError

from core import cache

logger = logging.getLogger(__name__)


def rate_limiter(times: int, seconds: int, scope: str):
    async def dependency(request: Request) -> None:
        if cache.redis_client is None:
            return

        client_ip = request.headers.get("x-real-ip") or (
            request.client.host if request.client else "unknown"
        )
        key = f"ratelimit:{scope}:{client_ip}"

        try:
            current = await cache.redis_client.incr(key)
            if current == 1:
                await cache.redis_client.expire(key, seconds)
        except (RedisError, OSError) as exc:
            logger.error("Rate limiter unavailable for %s: %s", scope, exc)
            return

        if current > times:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests, please try again later.",
            )

    return dependency
