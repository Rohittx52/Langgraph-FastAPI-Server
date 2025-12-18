import asyncio
from typing import Dict, Set
from fastapi import WebSocket

class StreamManager:
    def __init__(self):
        self._subs: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, run_id: str, ws: WebSocket):
        async with self._lock:
            self._subs.setdefault(run_id, set()).add(ws)

    async def disconnect(self, run_id: str, ws: WebSocket):
        async with self._lock:
            if run_id in self._subs:
                self._subs[run_id].discard(ws)
                if not self._subs[run_id]:
                    del self._subs[run_id]

    async def broadcast(self, run_id: str, payload: dict):
        conns = list(self._subs.get(run_id, []))
        for ws in conns:
            try:
                await ws.send_json(payload)
            except Exception:
                pass

stream_manager = StreamManager()
