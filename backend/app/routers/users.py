from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.ticket import Ticket, Comment
from app.models.activity_log import ActivityLog
from app.models.session import Session as UserSession
from app.schemas.user import CreateUserRequest, UserResponse
from app.services.auth_service import hash_password
from app.services.mail_service import send_welcome_email
from app.utils.dependencies import get_current_user, require_admin
from app.utils.ticket_id_gen import generate_id
from app.cache import get_cache, set_cache, delete_pattern
from typing import List

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserResponse)
def create_user(
    payload: CreateUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=generate_id(),
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    delete_pattern("users:*")

    try:
        send_welcome_email(user.email, user.name, user.role, payload.password)
    except Exception as e:
        print(f"⚠️ Welcome email failed: {e}")

    return user

@router.get("/", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cached = get_cache("users:all")
    if cached:
        return cached
    users = db.query(User).all()
    result = [UserResponse.model_validate(u).model_dump(mode="json") for u in users]
    set_cache("users:all", result, ttl=300)
    return result

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/{user_id}/deactivate")
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    delete_pattern("users:*")
    return {"message": f"{user.name} deactivated successfully"}

@router.patch("/{user_id}/activate")
def activate_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    delete_pattern("users:*")
    return {"message": f"{user.name} activated successfully"}

@router.delete("/{user_id}")
def delete_user_permanently(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_active:
        raise HTTPException(status_code=400, detail="Deactivate user before deleting")

    # Delete sessions
    db.query(UserSession).filter(UserSession.user_id == user_id).delete()
    # Delete activity logs
    db.query(ActivityLog).filter(ActivityLog.user_id == user_id).delete()
    # Delete comments
    db.query(Comment).filter(Comment.user_id == user_id).delete()
    # Delete user
    db.delete(user)
    db.commit()
    delete_pattern("users:*")
    return {"message": f"User permanently deleted"}


@router.get("/agents/workload")
def get_agent_workload(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    from app.models.ticket import Ticket, TicketStatus
    agents = db.query(User).filter(User.role == "agent", User.is_active == True).all()
    result = []
    for agent in agents:
        in_progress = db.query(Ticket).filter(
            Ticket.assigned_to == agent.id,
            Ticket.status == TicketStatus.in_progress
        ).count()
        open_count = db.query(Ticket).filter(
            Ticket.assigned_to == agent.id,
            Ticket.status == TicketStatus.open
        ).count()
        total_active = in_progress + open_count
        result.append({
            "id": agent.id,
            "name": agent.name,
            "email": agent.email,
            "in_progress": in_progress,
            "open": open_count,
            "total_active": total_active
        })
    # Sort by least busy first
    result.sort(key=lambda x: x["total_active"])
    return result