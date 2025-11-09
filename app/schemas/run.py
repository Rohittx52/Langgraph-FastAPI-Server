# ...existing code...
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class RunCreate(BaseModel):
    name: Optional[str] = None
    workflow_id: Optional[str] = None
    input: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    payload: Optional[Dict[str, Any]] = None

class RunInfo(BaseModel):
    id: str
    name: Optional[str] = None
    workflow_id: Optional[str] = None
    status: Optional[str] = None
    input: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None
