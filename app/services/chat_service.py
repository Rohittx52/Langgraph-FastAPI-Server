from app.utils.stream_manager import stream_manager
from app.services.chat_memory import (
    get_chat_history,
    save_user_message,
    save_assistant_message,
)
from app.llm.provider import llm  

async def process_chat_message(thread_id: str, user_message: str):
    # 1. Save user message
    await save_user_message(thread_id, user_message)

    # 2. Load full chat history
    history = await get_chat_history(thread_id)

    full_response = ""

    # 3. Stream tokens from LLM
    async for token in llm.stream(history):
        full_response += token

        # 4. STREAM EACH TOKEN
        await stream_manager.broadcast(
            thread_id,
            {
                "event": "token",
                "content": token
            }
        )

    # 5. Save assistant response to memory
    await save_assistant_message(thread_id, full_response)

    # 6. Signal completion
    await stream_manager.broadcast(
        thread_id,
        {
            "event": "completed"
        }
    )
