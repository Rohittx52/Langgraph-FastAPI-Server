from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from datetime import datetime
from app.database import Base
import uuid

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    thread_id = Column(String, ForeignKey("chat_threads.id"))
    role = Column(String)  # user / assistant / system
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
