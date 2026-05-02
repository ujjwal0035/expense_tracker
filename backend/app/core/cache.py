import redis.asyncio as redis
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.backends.inmemory import InMemoryBackend
from starlette.requests import Request
from starlette.responses import Response
from typing import Optional

def user_key_builder(func, namespace: Optional[str] = "", request: Request = None, response: Response = None, *args, **kwargs):
    """
    Custom key builder for FastAPI Cache.
    Generates a cache key isolated by the user ID.
    """
    # Extract current_user from kwargs (injected by FastAPI Depends)
    current_user = kwargs.get("current_user")
    user_id = current_user.id if current_user else "anonymous"
    
    # Prefix the cache key with the user ID to ensure isolation
    query_string = request.url.query if request else ""
    return f"{namespace}:{func.__module__}:{func.__name__}:{user_id}:{query_string}"


async def init_cache():
    """
    Initialize FastAPI cache with Redis. Fallback to InMemory if Redis is unavailable.
    """
    try:
        redis_client = redis.from_url("redis://localhost:6379", encoding="utf8", decode_responses=True)
        # Ping to test connection
        await redis_client.ping()
        FastAPICache.init(RedisBackend(redis_client), prefix="expense-cache")
        print("Successfully connected to Redis cache.")
    except Exception as e:
        print(f"Warning: Could not connect to Redis ({e}). Falling back to InMemoryBackend.")
        FastAPICache.init(InMemoryBackend(), prefix="expense-cache")


async def invalidate_user_cache(user_id: str):
    """
    Invalidate all cached data for a specific user.
    """
    backend = FastAPICache.get_backend()
    cache_prefix = FastAPICache.get_prefix()

    if isinstance(backend, RedisBackend):
        # We need to find all keys matching the user's namespace
        redis_client = backend.redis
        # The key format from user_key_builder is:
        # expense-cache:{namespace}:{module}:{name}:{user_id}:{query}
        pattern = f"expense-cache:*:*:*:{user_id}:*"
        keys = await redis_client.keys(pattern)
        if keys:
            await redis_client.delete(*keys)
    elif isinstance(backend, InMemoryBackend):
        # InMemoryBackend requires a namespace/key; clearing without one is a no-op.
        await backend.clear(namespace=cache_prefix)
