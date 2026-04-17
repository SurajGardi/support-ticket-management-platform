from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import LoginRequest, SessionResponse
from app.models.user import User
from app.services.auth_service import verify_password, create_session, invalidate_session
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email, User.is_active == True).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session_id = create_session(db, user)
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        max_age=settings.SESSION_EXPIRE_MINUTES * 60,
        samesite="lax"
    )
    return {"message": "Login successful", "user_id": user.id, "role": user.role, "name": user.name}

@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    session_id = request.cookies.get("session_id")
    if session_id:
        invalidate_session(db, session_id)
    response.delete_cookie("session_id")
    return {"message": "Logged out successfully"}