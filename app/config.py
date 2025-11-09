from pydantic import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "LangGraph-FastAPI"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/fastgraph.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    CORS_ORIGINS: List[str] = ["*"]
    JWT_SECRET: str = "change-me"

    class Config:
        env_file = ".env"

settings = Settings()
