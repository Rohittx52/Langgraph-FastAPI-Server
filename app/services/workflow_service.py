import asyncio
from app.services.run_manager import run_manager
from app.services.state_services import state_service
from app.services.checkpoint_store import checkpoint_service
from app.services.artifact_store import artifact_service
from app.utils.stream_manager import stream_manager
from app.utils.task_queue import task_queue
from app.database import async_session 


async def _execute_workflow(run_id: str, payload: dict):
    async with async_session() as db:   
        try:
            await stream_manager.broadcast(run_id, {"event": "started", "run_id": run_id})
            await asyncio.sleep(1)
            state_service.save(run_id, {"step": "parsed", "payload": payload})
            await stream_manager.broadcast(run_id, {"event": "node_update", "node": "parse"})

            await asyncio.gather(asyncio.sleep(1.5), asyncio.sleep(2.0))
            checkpoint_service.save(run_id, "analysis", {"ok": True})

            aid = artifact_service.save_bytes(run_id, "result.json", b'{"result":"ok"}')

            # ✅ use proper db here
            await run_manager.update(db, run_id, status="completed", result={"artifact": aid})
            await stream_manager.broadcast(run_id, {"event": "completed", "artifact": aid})

        except asyncio.CancelledError:
            await run_manager.update(db, run_id, status="cancelled")
            await stream_manager.broadcast(run_id, {"event": "cancelled", "run_id": run_id})

        except Exception as e:
            await run_manager.update(db, run_id, status="failed", result={"error": str(e)})
            await stream_manager.broadcast(run_id, {"event": "failed", "error": str(e)})