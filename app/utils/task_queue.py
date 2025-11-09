import asyncio
from typing import Callable, Any

class TaskQueue:
    def __init__(self):
        self.queue = asyncio.Queue()
        self.is_running = False

    async def add_task(self, coro: Callable[..., Any], *args, **kwargs):
        await self.queue.put((coro, args, kwargs))
        if not self.is_running:
            asyncio.create_task(self.run())

    async def run(self):
        self.is_running = True
        while not self.queue.empty():
            coro, args, kwargs = await self.queue.get()
            try:
                await coro(*args, **kwargs)
            except Exception as e:
                print(f" Task failed: {e}")
            finally:
                self.queue.task_done()
        self.is_running = False

task_queue = TaskQueue()
