from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class TicketStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"

class TicketPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class CreateTicketRequest(BaseModel):
    title: str
    description: str
    priority: TicketPriority = TicketPriority.medium

class UpdateTicketStatus(BaseModel):
    status: TicketStatus

class AssignTicketRequest(BaseModel):
    agent_id: str

class AddCommentRequest(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: str
    user_id: str
    content: str
    created_at: datetime
    user_name: str
    user_role: str

    class Config:
        from_attributes = True

class ActivityLogResponse(BaseModel):
    id: str
    user_id: str
    action: str
    detail: Optional[str]
    created_at: datetime
    user_name: str

class TicketResponse(BaseModel):
    id: str
    title: str
    description: str
    status: str
    priority: str
    created_by: str
    assigned_to: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]
    creator_name: str
    assignee_name: Optional[str]

    class Config:
        from_attributes = True