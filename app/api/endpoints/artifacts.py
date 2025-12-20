from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from app.services.artifact_store import artifact_service

router = APIRouter()

@router.post("/upload/{run_id}")
async def upload(run_id: str, file: UploadFile = File(...)):
    data = await file.read()
    aid = artifact_service.save_bytes(run_id, file.filename, data)
    return {"artifact_id": aid}

@router.get("/run/{run_id}")
async def list_run_artifacts(run_id: str):
    """List all artifacts for a specific run"""
    artifacts = artifact_service.list_by_run(run_id)
    return {"artifacts": artifacts}

@router.get("/{artifact_id}")
async def get_artifact(artifact_id: str):
    path = artifact_service.get_path(artifact_id)
    if not path:
        raise HTTPException(404, "Artifact not found")
    return FileResponse(path)
