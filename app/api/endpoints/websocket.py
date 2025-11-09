from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.utils.stream_manager import stream_manager

router = APIRouter()

@router.websocket("/{run_id}")
async def ws_run(websocket: WebSocket, run_id: str):
    await stream_manager.connect(run_id, websocket)
    try:
        await websocket.send_json({"msg": f"connected to {run_id}"})
        while True:
            # keepalive or receive messages
            try:
                msg = await websocket.receive_text()
                await websocket.send_json({"echo": msg})
            except Exception:
                await websocket.send_json({"type":"ping"})
    except WebSocketDisconnect:
        await stream_manager.disconnect(run_id, websocket)
