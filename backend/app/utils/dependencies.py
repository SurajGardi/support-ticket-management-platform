from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.session import Session as UserSession
from app.models.user import User
from datetime import datetime

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(UserSession).filter(
        UserSession.session_id == session_id,
        UserSession.is_active == True
    ).first()

    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    if session.expires_at < datetime.utcnow():
        session.is_active = False
        db.commit()
        raise HTTPException(status_code=401, detail="Session expired")

    return session.user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def require_agent_or_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "agent"]:
        raise HTTPException(status_code=403, detail="Agent or Admin access required")
    return current_user