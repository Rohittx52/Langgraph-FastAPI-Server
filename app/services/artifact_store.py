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

artifact_service = ArtifactService()
