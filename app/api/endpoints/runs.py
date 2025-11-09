from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.run import RunCreate, RunInfo
from app.services.run_manager import RunManager
from app.utils.task_queue import task_queue
from app.services.workflow_service import _execute_workflow
from sqlalchemy import select
from app.models.run import Run 


router = APIRouter()

@router.post("/", response_model=dict)
async def create_run(req: RunCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    run_id = await RunManager.create(db, req.name, meta={"payload_size": len(str(req.payload))})
    # schedule async execution via task_queue (or background_tasks)
    task_queue.create_task(run_id, _execute_workflow(run_id, req.payload))
    return {"run_id": run_id}

@router.get("/", response_model=list[RunInfo])
async def list_runs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Run))
    runs = result.scalars().all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            "meta": r.meta,
            "result": r.result
        }
        for r in runs
    ]

