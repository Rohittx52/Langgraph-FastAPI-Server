from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Response, status

class SimpleRateLimit(BaseHTTPMiddleware):
    # naive demo: block everything when header 'X-Block' present
    async def dispatch(self, request, call_next):
        if request.headers.get("x-block"):
            return Response("Rate limited", status_code=status.HTTP_429_TOO_MANY_REQUESTS)
        return await call_next(request)

