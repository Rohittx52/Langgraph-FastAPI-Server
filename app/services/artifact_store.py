import os, uuid
BASE = os.path.join("data", "artifacts")
os.makedirs(BASE, exist_ok=True)

class ArtifactService:
    def save_bytes(self, run_id: str, filename: str, data: bytes) -> str:
        aid = f"{run_id}_{uuid.uuid4().hex}_{filename}"
        path = os.path.join(BASE, aid)
        with open(path, "wb") as f:
            f.write(data)
        return aid

    def get_path(self, artifact_id: str) -> str:
        p = os.path.join(BASE, artifact_id)
        return p if os.path.exists(p) else None
    
    def list_by_run(self, run_id: str) -> list:
        """List all artifacts for a specific run"""
        artifacts = []
        if not os.path.exists(BASE):
            return artifacts
        
        for filename in os.listdir(BASE):
            if filename.startswith(f"{run_id}_"):
                # Extract original filename from artifact_id format: run_id_uuid_filename
                parts = filename.split("_", 2)
                original_name = parts[2] if len(parts) > 2 else filename
                file_path = os.path.join(BASE, filename)
                artifacts.append({
                    "artifact_id": filename,
                    "filename": original_name,
                    "size": os.path.getsize(file_path),
                    "created_at": os.path.getctime(file_path)
                })
        
        # Sort by creation time, newest first
        artifacts.sort(key=lambda x: x["created_at"], reverse=True)
        return artifacts

artifact_service = ArtifactService()
