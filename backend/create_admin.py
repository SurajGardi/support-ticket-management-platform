import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.session import Session
from app.models.ticket import Ticket, Comment
from app.models.activity_log import ActivityLog
from app.services.auth_service import hash_password
from app.utils.ticket_id_gen import generate_id

Base.metadata.create_all(bind=engine)

db = SessionLocal()

existing = db.query(User).filter(User.email == 'admin@helpdesk.com').first()
if existing:
    print('Admin already exists!')
    print('Email: admin@helpdesk.com')
    print('Password: Admin@123')
else:
    admin = User(
        id=generate_id(),
        name='Super Admin',
        email='admin@helpdesk.com',
        hashed_password=hash_password('Admin@123'),
        role='admin'
    )
    db.add(admin)
    db.commit()
    print('Admin created successfully!')
    print('Email: admin@helpdesk.com')
    print('Password: Admin@123')

db.close()
