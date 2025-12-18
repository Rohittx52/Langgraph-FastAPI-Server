from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict

class BaseLLM(ABC):
    @abstractmethod
    async def stream(
        self, history: List[Dict[str, str]]
    ) -> AsyncGenerator[str, None]:
        ...
