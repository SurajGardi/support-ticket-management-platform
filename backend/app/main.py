from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, users, tickets
from app.models import user, ticket, session, activity_log

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Support Ticket Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tickets.router)

@app.get("/health")
def health():
    return {"status": "ok"}