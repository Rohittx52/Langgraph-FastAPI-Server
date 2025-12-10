from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.run import RunCreate, RunInfo
from app.services.run_manager import run_manager
from app.utils.task_queue import task_queue
from app.services.workflow_service import _execute_workflow
from sqlalchemy import select
from app.models.run import Run 
import json
import asyncio


router = APIRouter()

@router.post("/", response_model=dict)
async def create_run(req: RunCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    run_id = await run_manager.create(
        db, 
        req.name or f"run-{req.workflow_id or 'default'}", 
        meta=req.payload or {}
    )
    asyncio.create_task(_execute_workflow(run_id, req.payload or {}))
    return {"run_id": run_id}

@router.get("/", response_model=list)
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
            "meta": json.loads(r.run_meta) if isinstance(r.run_meta, str) else (r.run_meta or {}),
            "result": json.loads(r.result) if isinstance(r.result, str) else r.result
        }
        for r in runs
    ]

@router.get("/{run_id}", response_model=dict)
async def get_run(run_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single run by ID"""
    run = await run_manager.get(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    
    return {
        "id": run.id,
        "name": run.name,
        "status": run.status,
        "created_at": run.created_at.isoformat() if run.created_at else None,
        "updated_at": run.updated_at.isoformat() if run.updated_at else None,
        "meta": json.loads(run.run_meta) if isinstance(run.run_meta, str) else (run.run_meta or {}),
        "result": json.loads(run.result) if isinstance(run.result, str) else run.result
    }