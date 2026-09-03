# AI-Based Internship Management and Performance Evaluation System

A web-based internship management system built using React, Node.js, Express.js, PostgreSQL, JWT authentication, and a microservices architecture.

The system is designed to manage internships, tasks, daily intern updates, mentor evaluations, sentiment analysis, and performance reporting.

---

## 📌 Overview

The AI-Based Internship Management and Performance Evaluation System provides a centralized platform for managing the internship lifecycle.

The system supports:

- User registration and login
- JWT-based authentication
- Role-based authorization
- Internship management
- Intern and mentor assignment
- Task management
- Daily intern work updates
- Sentiment analysis of daily updates
- Mentor-based performance evaluation
- Performance score calculation
- Monthly performance reporting

The backend is organized using a **microservices architecture**, with separate services responsible for different business functionalities.

---

# 🏗️ Architecture

The application consists of:

### Frontend

- React.js
- Vite
- React Router
- Axios

### Backend

- Node.js
- Express.js
- REST APIs
- Microservices

### Database

- PostgreSQL
- Separate database for each major service

### Authentication

- JWT
- bcrypt
- Role-based authorization

### AI Component

- Python-based sentiment analysis service

---

# 👥 User Roles

The system supports the following roles:

### Admin

- Manage users
- Manage internships
- Assign interns and mentors
- Access system information

### HR

- Manage internships
- Manage interns
- Assign interns and mentors
- View performance reports

### Mentor

- Manage assigned tasks
- View intern progress
- Review daily updates
- Evaluate interns
- View performance reports

### Intern

- Register and login
- View internship
- View assigned tasks
- Submit daily updates
- View performance information
- View reports

---

# 🧩 Microservices

| Service | Technology | Port | Responsibility |
|---|---|---:|---|
| Auth Service | Node.js + Express | 5001 | Authentication and authorization |
| Internship Service | Node.js + Express | 5002 | Internship management |
| Task Service | Node.js + Express | 5003 | Tasks and daily updates |
| Sentiment Service | Python | 5004 | Sentiment analysis |
| Evaluation Service | Node.js + Express | 5005 | Mentor evaluation and scoring |
| Report Service | Node.js + Express | 5006 | Performance reports |

> Ports should match the actual `.env` configuration of each service.

---

# 🗄️ Database Architecture

Each service has its own PostgreSQL database.

| Service | Database |
|---|---|
| Auth Service | `auth_db` |
| Internship Service | `internship_db` |
| Task Service | `task_db` |
| Sentiment Service | `sentiment_db` |
| Evaluation Service | `evaluation_db` |
| Report Service | `report_db` |

Each service is responsible for its own database.

Services communicate through APIs rather than directly accessing another service's database.

---

# 📂 Project Structure

```text
InternshipManagement/
│
├── Backend/
│   │
│   ├── database/
│   │   ├── auth_db.sql
│   │   ├── internship_db.sql
│   │   ├── task_db.sql
│   │   ├── sentiment_db.sql
│   │   ├── evaluation_db.sql
│   │   └── report_db.sql
│   │
│   ├── scripts/
│   │   ├── Start-Services.ps1
│   │   └── Test-Services.ps1
│   │
│   ├── shared/
│   │   ├── auth.js
│   │   └── database.js
│   │
│   └── services/
│       ├── auth-service/
│       ├── internship-service/
│       ├── task-service/
│       ├── sentiment-service/
│       ├── evaluation-service/
│       └── report-service/
│
├── Frontend/
│   └── Frontend/
│       ├── public/
│       └── src/
│           ├── components/
│           ├── context/
│           ├── pages/
│           └── services/
│
├── docs/
│   └── diagrams/
│
└── README.md
