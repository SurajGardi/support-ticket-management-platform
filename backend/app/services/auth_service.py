from sqlalchemy.orm import Session
from app.models.session import Session as UserSession
from app.models.user import User
from app.config import settings
from passlib.context import CryptContext
from datetime import datetime, timedelta
from app.utils.ticket_id_gen import generate_id
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def create_session(db: Session, user: User) -> str:
    session_id = str(uuid.uuid4())
    expires = datetime.utcnow() + timedelta(minutes=settings.SESSION_EXPIRE_MINUTES)
    session = UserSession(
        session_id=session_id,
        user_id=user.id,
        expires_at=expires
    )
    db.add(session)
    db.commit()
    return session_id

def invalidate_session(db: Session, session_id: str):
    session = db.query(UserSession).filter_by(session_id=session_id).first()
    if session:
        session.is_active = False
        db.commit()