from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from datetime import datetime
from app.database import Base
import uuid

class ChatThread(Base):
    __tablename__ = "chat_threads"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    thread_id = Column(String, ForeignKey("chat_threads.id"))
    role = Column(String)  # user / assistant / system
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
