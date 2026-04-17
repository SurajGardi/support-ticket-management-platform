# 🎫 Support Ticket Management & Analytics Platform

A full-stack support ticket management system built with FastAPI, React, PostgreSQL, Redis, and Apache Superset.

---

## 📌 Table of Contents

Project Overview  
System Objectives  
Tech Stack  
Features  
Architecture Overview  
Project Structure  
Prerequisites  
Installation & Setup  
Running the Application  
API Endpoints  
User Roles & Permissions  
Analytics Dashboard  
Screenshots  
Caching Strategy  
Database Design  
Security Considerations  
Environment Variables  
Known Limitations & Future Enhancements  

---

## 🚀 1. Project Overview

This is a full-stack application for managing customer support tickets and visualizing operational analytics. The system allows users to authenticate, manage support tickets, and view analytics dashboards with real-time data powered by Apache Superset.

The objective of this assignment is to design and implement a small full-stack application for managing customer support tickets and visualizing operational analytics.

---

## 🎯 2. System Objectives

The platform was developed to achieve the following objectives:

- Provide a secure, session-based authentication system with role-based access control  
- Enable structured ticket lifecycle management from creation to resolution  
- Automate email communications for ticket status updates and user onboarding  
- Offer performance analytics through Apache Superset integration  
- Implement caching strategies to optimize system performance  
- Deliver a clean, responsive user interface accessible across devices  

---

## 🛠️ 3. Tech Stack

Backend: FastAPI (Python 3.11)  
Frontend: React + Vite + Tailwind CSS  
Database: PostgreSQL  
Cache: Redis  
Analytics: Apache Superset  
Auth: Session-based Authentication  
Email: SMTP (Gmail)  

---

## ✨ 4. Features

### 🔐 Authentication

- Session-based login and logout  
- Session expiry with configurable duration  
- Protected routes on frontend  
- Role-based access control  

### 👤 User Management (Admin Only)

- Admin can create Agent and Viewer accounts  
- Welcome email sent automatically with credentials  
- Admin can deactivate or permanently delete users  
- Activate deactivated users  

### 🎫 Ticket Management

- Create, view, update tickets  
- Status transitions: Open → In Progress → Resolved → Closed  
- Priority levels: Low, Medium, High  
- Assign tickets to agents (with workload visibility)  
- Comments and activity log on each ticket  
- Filter tickets by status, priority, assigned agent, creator, date range  
- Email notifications on status change and new comments  

### 📊 Analytics Dashboard

- Apache Superset embedded dashboard  
- Built-in fallback charts  
- Metrics: Tickets per day, by status, by priority, avg resolution time, tickets per agent  

---

## 🏗️ 5. Architecture Overview

The system follows a three-tier architecture:

Presentation Layer: React frontend application served via Vite development server, communicating with the backend through RESTful API calls using Axios.  

Application Layer: FastAPI Python backend handling business logic, session management, caching, and email services.  

Data Layer: PostgreSQL relational database for persistent storage with Redis in-memory cache for performance optimization.  

Analytics Layer: Apache Superset connected to the PostgreSQL database, embedded within the frontend via iframe for live dashboard visualization.  

---

## 📂 6. Project Structure

```bash
support-ticket-platform/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── ticket.py
│   │   │   ├── session.py
│   │   │   └── activity_log.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── tickets.py
│   │   │   └── users.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── ticket.py
│   │   │   └── user.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   └── mail_service.py
│   │   ├── utils/
│   │   │   ├── dependencies.py
│   │   │   └── ticket_id_gen.py
│   │   ├── middleware/
│   │   │   └── session_middleware.py
│   │   ├── cache.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── create_admin.py
│   ├── requirements.txt
│   └── .env
├── frontend/
├── screenshots/
├── docker-compose.yml


⚙️ 7. Prerequisites

Python 3.11
Node.js 18+
PostgreSQL
Docker Desktop
Git

🔧 8. Installation & Setup

Step 1 — Clone the repository
git clone https://github.com/SurajGardi/support-ticket-management-platform
cd support-ticket-management-platform

Step 2 — Backend Setup
cd backend
py -3.11 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

Step 3 — Create PostgreSQL Database

Create database:

supportdb

Step 4 — Configure Environment Variables
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/supportdb
REDIS_URL=redis://localhost:6379
SECRET_KEY=supersecretkey123456
SESSION_EXPIRE_MINUTES=60
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your-gmail-app-password
MAIL_FROM=your@gmail.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587

Step 5 — Start Redis via Docker
docker run -d -p 6379:6379 --name redis-helpdesk redis

Step 6 — Create Admin User
python create_admin.py

Default credentials:

Email: admin@helpdesk.com
Password: Admin@123

Step 7 — Frontend Setup
cd frontend
npm install


▶️ 9. Running the Application

Backend:

uvicorn app.main:app --reload --port 8000

Frontend:

npm run dev

Redis:

docker start redis-helpdesk

Superset:

docker start superset

Open:

http://localhost:5173


🔗 10. API Endpoints

Authentication

POST /auth/login
POST /auth/logout

Users

GET /users
GET /users/me
GET /users/{id}
POST /users
PATCH /users/{id}/deactivate
PATCH /users/{id}/activate
DELETE /users/{id}

Tickets

GET /tickets
POST /tickets
GET /tickets/{id}
PATCH /tickets/{id}/status
POST /tickets/{id}/assign
POST /tickets/{id}/comment
GET /tickets/{id}/comments
GET /tickets/{id}/activity

👥 11. User Roles & Permissions

Admin: full access
Agent: assigned ticket access
Viewer: read-only access

📊 12. Analytics Dashboard

Apache Superset integration
Embedded iframe dashboard
Built-in fallback charts

Metrics:

Tickets Created Per Day
Tickets by Status
Tickets by Priority
Average Ticket Resolution Time
Tickets Per Support Agent

## 📸 Screenshots

### 🔐 Login Page
![Login Page](../screenshots/user_login.png)

### 👤 User Profile
![User Profile](../screenshots/user_profile.png)

### 🎫 Ticket Creation
![Ticket Creation](../screenshots/ticket_form.png)

### 📊 Admin Dashboard
![Admin Dashboard](../screenshots/admin_tickets_dashboard.png)

### 🧑‍💼 Agent Dashboard
![Agent Dashboard](../screenshots/agent_dashboard.png)

### 📄 Ticket Details
![Ticket Details](../screenshots/ticket_info.png)

### 📧 Email Notification
![Email Notification](../screenshots/ticket_status_mail.png)

⚡ 14. Caching Strategy
GET /tickets cached (120 sec)
GET /users cached (300 sec)
Cache invalidated on updates
Redis fallback supported

🗄️ 15. Database Design

Tables:

users
tickets
sessions
comments
activity_logs

Ticket ID format:

TKT-YYYYMMDD-XXXXXX
🔐 16. Security Considerations
Password hashing using bcrypt
HTTP-only cookies
Role-based API protection
CORS restrictions
Session validation
⚙️ 17. Environment Variables

DATABASE_URL
REDIS_URL
SECRET_KEY
SESSION_EXPIRE_MINUTES
MAIL_USERNAME
MAIL_PASSWORD

⚠️ 18. Known Limitations
Superset requires manual login
No file attachments
No password change UI

🚀 19. Future Enhancements
File attachment support
WebSocket notifications
SLA tracking
Advanced search
Mobile application

📌 Conclusion

This project demonstrates:

Full-stack system design
FastAPI backend development
React frontend integration
Redis caching implementation
Real-world analytics integration