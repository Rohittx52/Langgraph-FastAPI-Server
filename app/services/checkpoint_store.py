import os, json, datetime
BASE = os.path.join("data", "checkpoints")
os.makedirs(BASE, exist_ok=True)

class CheckpointService:
    def save(self, run_id: str, step: str, state: dict) -> str:
        filename = f"{run_id}__{step}.json"
        path = os.path.join(BASE, filename)
        with open(path, "w") as f:
            json.dump({"step": step, "ts": datetime.datetime.utcnow().isoformat(), "state": state}, f)
        return path

    def load(self, run_id: str, step: str = None):
        if step:
            path = os.path.join(BASE, f"{run_id}__{step}.json")
            if not os.path.exists(path): return None
            with open(path) as f: return json.load(f)
        files = [f for f in os.listdir(BASE) if f.startswith(run_id)]
        if not files: return None
        files.sort();  path = os.path.join(BASE, files[-1])
        with open(path) as f: return json.load(f)

checkpoint_service = CheckpointService()
