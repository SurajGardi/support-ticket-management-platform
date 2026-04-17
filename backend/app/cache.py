import redis
import json
from app.config import settings

try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2)
    redis_client.ping()
    REDIS_AVAILABLE = True
    print("✅ Redis connected")
except Exception:
    REDIS_AVAILABLE = False
    print("⚠️ Redis not available - running without cache")

def get_cache(key: str):
    if not REDIS_AVAILABLE:
        return None
    try:
        val = redis_client.get(key)
        return json.loads(val) if val else None
    except Exception:
        return None

def set_cache(key: str, value, ttl: int = 300):
    if not REDIS_AVAILABLE:
        return
    try:
        redis_client.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass

def delete_cache(key: str):
    if not REDIS_AVAILABLE:
        return
    try:
        redis_client.delete(key)
    except Exception:
        pass

def delete_pattern(pattern: str):
    if not REDIS_AVAILABLE:
        return
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
    except Exception:
        pass