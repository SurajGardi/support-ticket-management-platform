from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.ticket import Ticket, Comment, TicketStatus
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.schemas.ticket import (
    CreateTicketRequest, UpdateTicketStatus, AssignTicketRequest,
    AddCommentRequest, TicketResponse, CommentResponse, ActivityLogResponse
)
from app.services.mail_service import send_status_update_email, send_comment_email
from app.utils.dependencies import get_current_user, require_admin, require_agent_or_admin
from app.utils.ticket_id_gen import generate_ticket_id, generate_id
from app.cache import get_cache, set_cache, delete_pattern

router = APIRouter(prefix="/tickets", tags=["Tickets"])

VALID_TRANSITIONS = {
    "open": ["in_progress"],
    "in_progress": ["resolved", "open"],
    "resolved": ["closed", "in_progress"],
    "closed": []
}

@router.post("/", response_model=TicketResponse)
def create_ticket(
    payload: CreateTicketRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = Ticket(
        id=generate_ticket_id(),
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        created_by=current_user.id
    )
    db.add(ticket)
    log = ActivityLog(
        id=generate_id(),
        ticket_id=ticket.id,
        user_id=current_user.id,
        action="Ticket created",
        detail=None
    )
    db.add(log)
    db.commit()
    db.refresh(ticket)
    delete_pattern("tickets:*")
    return _build_ticket_response(ticket)

@router.get("/", response_model=List[TicketResponse])
def list_tickets(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    created_by: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Ticket)

    # Role-based filtering
    if current_user.role == "viewer":
        # Viewer sees only their own tickets
        query = query.filter(Ticket.created_by == current_user.id)
    elif current_user.role == "agent":
        # Agent sees only assigned tickets
        query = query.filter(Ticket.assigned_to == current_user.id)
    # Admin sees all

    # Additional filters
    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if assigned_to:
        query = query.filter(Ticket.assigned_to == assigned_to)
    if created_by:
        query = query.filter(Ticket.created_by == created_by)
    if date_from:
        query = query.filter(Ticket.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Ticket.created_at <= datetime.fromisoformat(date_to + "T23:59:59"))

    tickets = query.order_by(Ticket.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return [_build_ticket_response(t) for t in tickets]

@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _build_ticket_response(ticket)

@router.patch("/{ticket_id}/status")
def update_status(
    ticket_id: str,
    payload: UpdateTicketStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_status = ticket.status.value
    new_status = payload.status.value

    if new_status not in VALID_TRANSITIONS.get(old_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition: {old_status} → {new_status}"
        )

    ticket.status = payload.status
    if new_status == "resolved":
        ticket.resolved_at = datetime.utcnow()

    log = ActivityLog(
        id=generate_id(),
        ticket_id=ticket.id,
        user_id=current_user.id,
        action="Status changed",
        detail=f"{old_status.replace('_',' ').title()} → {new_status.replace('_',' ').title()}"
    )
    db.add(log)
    db.commit()
    delete_pattern("tickets:*")

    creator = db.query(User).filter(User.id == ticket.created_by).first()
    if creator:
        try:
            send_status_update_email(
                to=creator.email,
                ticket_id=ticket.id,
                title=ticket.title,
                description=ticket.description,
                old_status=old_status,
                new_status=new_status,
                updated_by=current_user.name,
                ticket_url=f"http://localhost:5173/tickets/{ticket.id}"
            )
        except Exception as e:
            print(f"Mail error: {e}")

    return {"message": "Status updated", "new_status": new_status}

@router.post("/{ticket_id}/assign")
def assign_ticket(
    ticket_id: str,
    payload: AssignTicketRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Block assignment if ticket is resolved or closed
    if ticket.status.value in ["resolved", "closed"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot assign agent — ticket is {ticket.status.value}"
        )

    agent = db.query(User).filter(
        User.id == payload.agent_id,
        User.role == "agent"
    ).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    ticket.assigned_to = payload.agent_id
    log = ActivityLog(
        id=generate_id(),
        ticket_id=ticket.id,
        user_id=current_user.id,
        action="Ticket assigned",
        detail=f"Assigned to {agent.name}"
    )
    db.add(log)
    db.commit()
    delete_pattern("tickets:*")
    return {"message": f"Ticket assigned to {agent.name}"}

@router.post("/{ticket_id}/comment", response_model=CommentResponse)
def add_comment(
    ticket_id: str,
    payload: AddCommentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    comment = Comment(
        id=generate_id(),
        ticket_id=ticket_id,
        user_id=current_user.id,
        content=payload.content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    creator = db.query(User).filter(User.id == ticket.created_by).first()
    if creator and creator.id != current_user.id:
        try:
            send_comment_email(
                to=creator.email,
                ticket_id=ticket.id,
                title=ticket.title,
                comment=payload.content,
                commented_by=current_user.name,
                ticket_url=f"http://localhost:5173/tickets/{ticket.id}"
            )
        except Exception as e:
            print(f"Mail error: {e}")

    return CommentResponse(
        id=comment.id,
        user_id=comment.user_id,
        content=comment.content,
        created_at=comment.created_at,
        user_name=current_user.name,
        user_role=current_user.role.value
    )

@router.get("/{ticket_id}/comments", response_model=List[CommentResponse])
def get_comments(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comments = db.query(Comment).filter(
        Comment.ticket_id == ticket_id
    ).order_by(Comment.created_at.asc()).all()
    return [
        CommentResponse(
            id=c.id,
            user_id=c.user_id,
            content=c.content,
            created_at=c.created_at,
            user_name=c.user.name,
            user_role=c.user.role.value
        ) for c in comments
    ]

@router.get("/{ticket_id}/activity", response_model=List[ActivityLogResponse])
def get_activity(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logs = db.query(ActivityLog).filter(
        ActivityLog.ticket_id == ticket_id
    ).order_by(ActivityLog.created_at.desc()).all()
    return [
        ActivityLogResponse(
            id=l.id,
            user_id=l.user_id,
            action=l.action,
            detail=l.detail,
            created_at=l.created_at,
            user_name=l.user.name
        ) for l in logs
    ]

def _build_ticket_response(ticket: Ticket) -> dict:
    return {
        "id": ticket.id,
        "title": ticket.title,
        "description": ticket.description,
        "status": ticket.status.value,
        "priority": ticket.priority.value,
        "created_by": ticket.created_by,
        "assigned_to": ticket.assigned_to,
        "created_at": ticket.created_at,
        "resolved_at": ticket.resolved_at,
        "creator_name": ticket.creator.name if ticket.creator else "",
        "assignee_name": ticket.assignee.name if ticket.assignee else None
    }