# Minimal file-based state store. Replace with Redis for production.
import os, json, datetime
BASE = os.path.join("data", "states")
os.makedirs(BASE, exist_ok=True)

class StateService:
    def save(self, run_id: str, state: dict) -> str:
        fname = f"{run_id}__{int(datetime.datetime.utcnow().timestamp())}.json"
        path = os.path.join(BASE, fname)
        with open(path, "w") as f:
            json.dump({"ts": datetime.datetime.utcnow().isoformat(), "state": state}, f)
        return path

    def load_latest(self, run_id: str):
        files = [f for f in os.listdir(BASE) if f.startswith(run_id)]
        if not files: return None
        files.sort()
        with open(os.path.join(BASE, files[-1])) as f:
            return json.load(f)["state"]

state_service = StateService()
