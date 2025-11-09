import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

def setup_logging():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        logging.info(f"Incoming: {request.method} {request.url}")
        resp = await call_next(request)
        logging.info(f"Response: {resp.status_code} {request.url}")
        return resp
