from fastapi import APIRouter
from app.services.chat_service import process_chat_message
from app.services.chat_memory import get_chat_history as fetch_chat_history
from app.utils.task_queue import task_queue

router = APIRouter()

@router.post("/{thread_id}/message")
async def send_message(thread_id: str, body: dict):
    message = body["message"]
    await task_queue.add_task(
        process_chat_message,
        thread_id,
        message
    )

    return {"status": "queued"}

@router.get("/{thread_id}/history")
async def get_chat_history(thread_id: str):
    """
    Fetch full chat history for a thread
    """
    return await fetch_chat_history(thread_id)
