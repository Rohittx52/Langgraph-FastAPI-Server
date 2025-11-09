import aioredis
from app.config import settings

_redis = None
async def get_redis():
    global _redis
    if _redis is None:
        _redis = await aioredis.from_url(settings.REDIS_URL)
    return _redis
