import os
import asyncio
from pathlib import Path
from typing import AsyncGenerator, List, Dict
from .base import BaseLLM

# Load .env file from project root
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent.parent.parent / '.env'
    load_dotenv(env_path)
except Exception:
    pass  # If dotenv fails, continue with system env vars

try:
    from groq import AsyncGroq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

class GroqLLM(BaseLLM):
    """LLM implementation using Groq API."""
    
    def __init__(self, model_name: str = "llama-3.3-70b-versatile"):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")
        
        if not GROQ_AVAILABLE:
            raise ImportError("groq package not installed. Run: pip install groq")
        
        self.client = AsyncGroq(api_key=api_key)
        self.model_name = model_name

    async def stream(
        self, history: List[Dict[str, str]]
    ) -> AsyncGenerator[str, None]:
        """
        Stream responses from Groq API.
        history = [
            {"role": "user", "content": "..."},
            {"role": "assistant", "content": "..."}
        ]
        """
        # Convert history to Groq format
        messages = [{"role": msg["role"], "content": msg["content"]} for msg in history]
        
        # Stream the response
        stream = await self.client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            stream=True,
            temperature=0.7,
            max_tokens=2048
        )
        
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

# Keep GeminiLLM alias for backward compatibility
GeminiLLM = GroqLLM
