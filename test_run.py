# test_run.py
import time
import requests
import json
import asyncio
import websockets   

BASE = "http://127.0.0.1:8000"   
API = BASE + "/api"

def create_run(name="test-run", payload=None):
    payload = payload or {"input":"hello"}
    body = {"name": name, "payload": payload}
    r = requests.post(f"{API}/runs/", json=body, timeout=10)
    print("create:", r.status_code, r.text)
    if r.ok:
        return r.json().get("run_id") or r.json()
    return None

def poll_run(run_id, attempts=30, delay=1.0):
    for i in range(attempts):
        r = requests.get(f"{API}/runs/{run_id}", timeout=5)
        print(i, r.status_code, r.text)
        if r.status_code == 200:
            print("found run:", r.json())
            return r.json()
        time.sleep(delay)
    return None

async def ws_listen(run_id, duration=10):
    uri = f"ws://127.0.0.1:8000/api/ws/{run_id}"
    print("connect ws:", uri)
    try:
        async with websockets.connect(uri) as ws:
            print("connected websocket, listening...")
            start = asyncio.get_event_loop().time()
            while asyncio.get_event_loop().time() - start < duration:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=duration)
                    print("WS MSG:", msg)
                except asyncio.TimeoutError:
                    break
    except Exception as e:
        print("ws error:", e)

if __name__ == "__main__":
    run_id = create_run("smoke-test", {"input":"hello world"})
    print("run_id:", run_id)
    if not run_id:
        raise SystemExit("create failed")

    poll_run(run_id, attempts=20, delay=1)
