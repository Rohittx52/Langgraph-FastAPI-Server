from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.utils.stream_manager import stream_manager
import asyncio

router = APIRouter()

@router.websocket("/{thread_id}")
async def ws_run(websocket: WebSocket, thread_id: str):
    await websocket.accept()   # ← REQUIRED
    await stream_manager.connect(thread_id, websocket)

    try:
        await websocket.send_json({"msg": f"connected to {thread_id}"})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await stream_manager.disconnect(thread_id, websocket)

