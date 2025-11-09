import uuid
import json
from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select       
from app.models.run import Run


class RunManager:
    async def create(self, db: AsyncSession, name: str, meta: Optional[Dict] = None) -> str:
        run_id = str(uuid.uuid4())
        db_run = Run(id=run_id, name=name, status="running", run_meta=json.dumps(meta or {}))
        db.add(db_run)
        await db.commit()
        await db.refresh(db_run)
        return run_id

    async def update(self, db: AsyncSession, run_id: str, status: Optional[str] = None, result: Optional[Dict] = None):
        stmt = select(Run).where(Run.id == run_id)   
        result_obj = await db.execute(stmt)
        row = result_obj.scalar_one_or_none()
        if not row:
            raise KeyError("Run not found")
        if status:
            row.status = status
        if result is not None:
            row.result = json.dumps(result)
        await db.commit()

    async def get(self, db: AsyncSession, run_id: str) -> Optional[Run]:
        stmt = select(Run).where(Run.id == run_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()


run_manager = RunManager()
