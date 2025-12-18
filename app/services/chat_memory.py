from sqlalchemy import select
from app.models.chat_message import ChatMessage
from app.database import AsyncSessionLocal

async def save_user_message(thread_id: str, content: str):
    async with AsyncSessionLocal() as db:
        db.add(ChatMessage(
            thread_id=thread_id,
            role="user",
            content=content
        ))
        await db.commit()

async def save_assistant_message(thread_id: str, content: str):
    async with AsyncSessionLocal() as db:
        db.add(ChatMessage(
            thread_id=thread_id,
            role="assistant",
            content=content
        ))
        await db.commit()

async def get_chat_history(thread_id: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ChatMessage)
            .filter(ChatMessage.thread_id == thread_id)
            .order_by(ChatMessage.created_at)
        )
        rows = result.scalars().all()
        return [
            {"role": r.role, "content": r.content}
            for r in rows
        ]
