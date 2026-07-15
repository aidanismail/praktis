from fastapi import HTTPException, Request, status

from core import cache


def rate_limiter(times: int, seconds: int, scope: str):
    async def dependency(request: Request) -> None:
        if cache.redis_client is None:
            return

        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"
        key = f"ratelimit:{scope}:{client_ip}"

        current = await cache.redis_client.incr(key)
        if current == 1:
            await cache.redis_client.expire(key, seconds)

        if current > times:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests, please try again later.",
            )

    return dependency
