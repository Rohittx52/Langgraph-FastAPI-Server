from fastapi import APIRouter
from .endpoints import runs, artifacts, workflows, websocket, monitoring
from app.api import runs 

api_router = APIRouter() 

api_router.include_router(runs.router, prefix="/runs", tags=["runs"])
api_router.include_router(artifacts.router, prefix="/artifacts", tags=["artifacts"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])


