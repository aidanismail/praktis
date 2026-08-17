import logging
import time
from typing import Callable
from fastapi import HTTPException, Request, status
from redis.exceptions import RedisError

from core.cache import redis_client

logger = logging.getLogger(__name__)

# Fallback in-memory store if Redis is down
_in_memory_limits: dict[str, tuple[int, float]] = {}


async def check_rate_limit(
    key: str,
    max_requests: int = 10,
    window_seconds: int = 60,
) -> None:
    """
    Checks if a key (e.g. login:127.0.0.1) has exceeded max_requests within window_seconds.
    Raises HTTPException(429) if exceeded.
    """
    rate_key = f"rate_limit:{key}"

    if redis_client is not None:
        try:
            current = await redis_client.incr(rate_key)
            if current == 1:
                await redis_client.expire(rate_key, window_seconds)

            if current > max_requests:
                ttl = await redis_client.ttl(rate_key)
                retry_after = max(ttl, 1)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many requests. Please try again in {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)},
                )
            return
        except HTTPException:
            raise
        except (RedisError, OSError) as exc:
            logger.warning("Redis rate limiter failed: %s, using in-memory fallback", exc)

    # In-memory fallback
    now = time.time()
    count, reset_at = _in_memory_limits.get(rate_key, (0, now + window_seconds))

    if now > reset_at:
        count = 1
        reset_at = now + window_seconds
    else:
        count += 1

    _in_memory_limits[rate_key] = (count, reset_at)

    if count > max_requests:
        retry_after = max(int(reset_at - now), 1)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests. Please try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )


def rate_limiter(times: int = 10, seconds: int = 60, scope: str = "global") -> Callable:
    """FastAPI dependency factory for endpoint rate limiting."""
    async def _rate_limit_dependency(request: Request) -> None:
        client_ip = request.client.host if request.client else "127.0.0.1"
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        key = f"{scope}:{client_ip}"
        await check_rate_limit(key=key, max_requests=times, window_seconds=seconds)

    return _rate_limit_dependency
