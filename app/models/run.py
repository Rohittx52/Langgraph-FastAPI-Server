from sqlalchemy import Column, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.database import Base

class Run(Base):
    __tablename__ = "runs"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False, default="running")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    run_meta = Column(JSON, nullable=True)
    result = Column(JSON, nullable=True)
