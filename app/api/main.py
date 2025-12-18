from fastapi import APIRouter
from app.api.endpoints import runs as runs_endpoint
from app.api.endpoints import artifacts as artifacts_endpoint
from app.api.endpoints import workflows as workflows_endpoint
from app.api.endpoints import websocket as websocket_endpoint
from app.api.endpoints import monitoring as monitoring_endpoint
from app.api.endpoints import chat as chat_endpoint


api_router = APIRouter()

for mod, prefix, tag in [
    (runs_endpoint, "/runs", ["runs"]),
    (artifacts_endpoint, "/artifacts", ["artifacts"]),
    (workflows_endpoint, "/workflows", ["workflows"]),
    (websocket_endpoint, "/ws", ["websocket"]),
    (monitoring_endpoint, "/monitoring", ["monitoring"]),
    (chat_endpoint, "/chat", ["chat"]),
]:
    if not hasattr(mod, "router"):
        raise ImportError(f"Module {mod.__name__!r} does not expose 'router'. Check {mod.__file__}")
    api_router.include_router(getattr(mod, "router"), prefix=prefix, tags=tag)

