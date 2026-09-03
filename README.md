# 🤖 AI-Based Internship Management and Performance Evaluation System

> A microservices-based web application for managing internships, tasks, daily work updates, mentor evaluations, sentiment analysis, and performance reports.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Objectives](#-objectives)
- [Key Features](#-key-features)
- [User Roles](#-user-roles)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Microservices](#-microservices)
- [Database Architecture](#-database-architecture)
- [Project Structure](#-project-structure)
- [System Workflow](#-system-workflow)
- [Use Case Diagram](#-use-case-diagram)
- [DFD Level 0](#-dfd-level-0)
- [DFD Level 1](#-dfd-level-1)
- [ER Diagram](#-er-diagram)
- [Login Sequence Diagram](#-login-sequence-diagram)
- [Daily Update and Sentiment Analysis](#-daily-update-and-sentiment-analysis)
- [Mentor Evaluation Sequence](#-mentor-evaluation-sequence)
- [Activity Diagram](#-activity-diagram)
- [Deployment Diagram](#-deployment-diagram)
- [Authentication](#-authentication)
- [Sentiment Analysis](#-sentiment-analysis)
- [Performance Evaluation](#-performance-evaluation)
- [Monthly Reports](#-monthly-reports)
- [API Endpoints](#-api-endpoints)
- [Installation](#-installation)
- [Running the Project](#-running-the-project)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Future Enhancements](#-future-enhancements)

---

# 📖 Project Overview

The **AI-Based Internship Management and Performance Evaluation System** is a web-based platform designed to manage and monitor the complete internship lifecycle.

The system provides different functionalities for:

- Admin
- HR
- Mentor
- Intern

The platform allows organizations to manage internships, assign tasks, track daily work, analyze intern sentiment, evaluate performance, and generate monthly performance reports.

The backend follows a **microservices architecture**, where different business functionalities are separated into independent services.

---

# 🎯 Objectives

The main objectives of the system are:

- Automate internship management.
- Manage interns and mentors.
- Assign internships and tasks.
- Track daily intern activities.
- Analyze sentiment from intern updates.
- Evaluate intern performance.
- Calculate performance scores.
- Generate monthly performance reports.
- Provide secure authentication.
- Implement role-based authorization.
- Use independent databases for microservices.

---

# 🚀 Key Features

### Authentication

- User registration
- User login
- JWT authentication
- Password hashing using bcrypt
- Role-based authorization
- Protected API routes

### Internship Management

- Create internships
- Manage internships
- Assign interns
- Assign mentors
- Track internship status

### Task Management

- Create tasks
- Assign tasks to interns
- Track task status
- Submit daily work updates
- Track task completion

### AI Sentiment Analysis

- Analyze intern daily updates
- Detect positive, neutral, and negative sentiment
- Generate sentiment scores
- Store sentiment results

### Performance Evaluation

- Mentor evaluation
- Technical skills evaluation
- Communication evaluation
- Work quality evaluation
- Punctuality evaluation
- Problem-solving evaluation
- Overall performance score

### Reporting

- Monthly performance reports
- Task completion statistics
- Sentiment information
- Mentor evaluation information
- Overall performance information

---

# 👥 User Roles

| Role | Responsibilities |
|---|---|
| **Admin** | Manage users, internships and system information |
| **HR** | Manage internships, interns and performance reports |
| **Mentor** | Assign tasks, monitor interns and evaluate performance |
| **Intern** | View internship, complete tasks and submit daily updates |

---

# 🛠️ Technology Stack

## Frontend

- React.js
- Vite
- React Router
- Axios
- JavaScript
- HTML
- CSS

## Backend

- Node.js
- Express.js
- REST API
- Microservices Architecture
- JWT
- bcrypt
- CORS
- dotenv

## AI / Sentiment Analysis

- Python
- Sentiment Analysis Service

## Database

- PostgreSQL

## Development Tools

- Visual Studio Code
- Postman
- Git
- GitHub
- Mermaid
- pgAdmin

---

# 🏗️ System Architecture

```mermaid
flowchart TB

    USERS["Users<br/>Admin | HR | Mentor | Intern"]

    FRONTEND["React.js + Vite<br/>Frontend"]

    AUTH["Auth Service<br/>Node.js + Express<br/>Port 5001"]
    INTERNSHIP["Internship Service<br/>Node.js + Express<br/>Port 5002"]
    TASK["Task Service<br/>Node.js + Express<br/>Port 5003"]
    SENTIMENT["Sentiment Service<br/>Python<br/>Port 5004"]
    EVALUATION["Evaluation Service<br/>Node.js + Express<br/>Port 5005"]
    REPORT["Report Service<br/>Node.js + Express<br/>Port 5006"]

    AUTHDB[("auth_db<br/>PostgreSQL")]
    INTERNSHIPDB[("internship_db<br/>PostgreSQL")]
    TASKDB[("task_db<br/>PostgreSQL")]
    SENTIMENTDB[("sentiment_db<br/>PostgreSQL")]
    EVALUATIONDB[("evaluation_db<br/>PostgreSQL")]
    REPORTDB[("report_db<br/>PostgreSQL")]

    USERS --> FRONTEND

    FRONTEND --> AUTH
    FRONTEND --> INTERNSHIP
    FRONTEND --> TASK
    FRONTEND --> EVALUATION
    FRONTEND --> REPORT

    AUTH --> AUTHDB
    INTERNSHIP --> INTERNSHIPDB
    TASK --> TASKDB
    SENTIMENT --> SENTIMENTDB
    EVALUATION --> EVALUATIONDB
    REPORT --> REPORTDB

    TASK -->|"Daily Update"| SENTIMENT

    REPORT -->|"REST API"| INTERNSHIP
    REPORT -->|"REST API"| TASK
    REPORT -->|"REST API"| SENTIMENT
    REPORT -->|"REST API"| EVALUATION
```

---

# 🔧 Microservices

The backend consists of six major services.

| Service | Port | Responsibility |
|---|---:|---|
| Auth Service | 5001 | Authentication and authorization |
| Internship Service | 5002 | Internship management |
| Task Service | 5003 | Tasks and daily updates |
| Sentiment Service | 5004 | Sentiment analysis |
| Evaluation Service | 5005 | Mentor evaluation and scoring |
| Report Service | 5006 | Monthly performance reports |

Each service is independently developed and communicates through APIs.

---

# 🗄️ Database Architecture

The system uses separate PostgreSQL databases for individual services.

| Database | Service |
|---|---|
| `auth_db` | Auth Service |
| `internship_db` | Internship Service |
| `task_db` | Task Service |
| `sentiment_db` | Sentiment Service |
| `evaluation_db` | Evaluation Service |
| `report_db` | Report Service |

### Database Principle

```text
Auth Service        → auth_db
Internship Service  → internship_db
Task Service        → task_db
Sentiment Service   → sentiment_db
Evaluation Service  → evaluation_db
Report Service      → report_db
```

Services should not directly access another service's database.

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
│       │
│       ├── auth-service/
│       │   ├── config/
│       │   ├── controllers/
│       │   ├── middleware/
│       │   ├── routes/
│       │   ├── server.js
│       │   └── package.json
│       │
│       ├── internship-service/
│       │   ├── config/
│       │   ├── controllers/
│       │   ├── routes/
│       │   ├── server.js
│       │   └── package.json
│       │
│       ├── task-service/
│       │   ├── server.js
│       │   └── package.json
│       │
│       ├── sentiment-service/
│       │   ├── app.py
│       │   ├── server.js
│       │   ├── requirements.txt
│       │   └── package.json
│       │
│       ├── evaluation-service/
│       │   ├── server.js
│       │   └── package.json
│       │
│       └── report-service/
│           ├── server.js
│           └── package.json
│
├── Frontend/
│   └── Frontend/
│       ├── public/
│       ├── src/
│       │   ├── components/
│       │   ├── context/
│       │   ├── pages/
│       │   ├── services/
│       │   ├── App.jsx
│       │   ├── App.css
│       │   └── main.jsx
│       ├── package.json
│       └── vite.config.js
│
└── README.md
```

---

# 🔄 System Workflow

```mermaid
flowchart TD

    START([Start])

    LOGIN["User Login"]

    AUTH{"Credentials Valid?"}

    DASHBOARD["Role-Based Dashboard"]

    INTERNSHIP["Internship Management"]

    TASK["Task Assignment"]

    UPDATE["Intern Submits Daily Update"]

    SENTIMENT["Sentiment Analysis"]

    EVALUATION["Mentor Evaluation"]

    SCORE["Performance Score"]

    REPORT["Monthly Report"]

    VIEW["View Report"]

    END([End])

    START --> LOGIN
    LOGIN --> AUTH

    AUTH -->|No| LOGIN
    AUTH -->|Yes| DASHBOARD

    DASHBOARD --> INTERNSHIP
    INTERNSHIP --> TASK
    TASK --> UPDATE
    UPDATE --> SENTIMENT
    SENTIMENT --> EVALUATION
    EVALUATION --> SCORE
    SCORE --> REPORT
    REPORT --> VIEW
    VIEW --> END
```

---

# 👤 Use Case Diagram

```mermaid
flowchart LR

    ADMIN([Admin])
    HR([HR])
    MENTOR([Mentor])
    INTERN([Intern])

    subgraph SYSTEM["AI-Based Internship Management System"]

        LOGIN((Login / Register))
        USERS((Manage Users))
        INTERNSHIP((Manage Internships))
        ASSIGN((Assign Intern & Mentor))
        TASKS((Manage Tasks))
        UPDATE((Submit Daily Update))
        SENTIMENT((Analyze Sentiment))
        EVALUATE((Evaluate Intern))
        SCORE((Calculate Performance Score))
        REPORT((Generate Monthly Report))
        VIEWREPORT((View Performance Report))

    end

    ADMIN --> LOGIN
    ADMIN --> USERS
    ADMIN --> INTERNSHIP
    ADMIN --> ASSIGN

    HR --> LOGIN
    HR --> INTERNSHIP
    HR --> ASSIGN
    HR --> REPORT
    HR --> VIEWREPORT

    MENTOR --> LOGIN
    MENTOR --> TASKS
    MENTOR --> EVALUATE
    MENTOR --> VIEWREPORT

    INTERN --> LOGIN
    INTERN --> UPDATE
    INTERN --> VIEWREPORT

    UPDATE --> SENTIMENT
    EVALUATE --> SCORE
    SENTIMENT --> REPORT
    SCORE --> REPORT
```

---

# 📊 DFD Level 0

```mermaid
flowchart LR

    ADMIN["Admin"]
    HR["HR"]
    MENTOR["Mentor"]
    INTERN["Intern"]

    SYSTEM(("AI-Based Internship Management and Performance Evaluation System"))

    DATABASE[("System Databases")]

    ADMIN -->|"User and Internship Management"| SYSTEM
    HR -->|"Internship and Report Requests"| SYSTEM
    MENTOR -->|"Tasks and Evaluations"| SYSTEM
    INTERN -->|"Daily Updates and Requests"| SYSTEM

    SYSTEM -->|"System Information"| ADMIN
    SYSTEM -->|"Reports and Information"| HR
    SYSTEM -->|"Intern Performance"| MENTOR
    SYSTEM -->|"Tasks and Reports"| INTERN

    SYSTEM <--> DATABASE
```

---

# 📊 DFD Level 1

```mermaid
flowchart LR

    ADMIN["Admin"]
    HR["HR"]
    MENTOR["Mentor"]
    INTERN["Intern"]

    AUTH(("1. Authentication"))
    INTERNSHIP(("2. Internship Management"))
    TASK(("3. Task Management"))
    SENTIMENT(("4. Sentiment Analysis"))
    EVALUATION(("5. Performance Evaluation"))
    REPORT(("6. Report Generation"))

    AUTHDB[("Auth DB")]
    INTERNSHIPDB[("Internship DB")]
    TASKDB[("Task DB")]
    SENTIMENTDB[("Sentiment DB")]
    EVALUATIONDB[("Evaluation DB")]
    REPORTDB[("Report DB")]

    ADMIN --> AUTH
    HR --> AUTH
    MENTOR --> AUTH
    INTERN --> AUTH

    AUTH <--> AUTHDB

    ADMIN --> INTERNSHIP
    HR --> INTERNSHIP

    INTERNSHIP <--> INTERNSHIPDB

    MENTOR --> TASK
    INTERN --> TASK

    TASK <--> TASKDB

    TASK -->|"Daily Update"| SENTIMENT
    SENTIMENT <--> SENTIMENTDB

    MENTOR --> EVALUATION
    EVALUATION <--> EVALUATIONDB

    INTERNSHIP --> REPORT
    TASK --> REPORT
    SENTIMENT --> REPORT
    EVALUATION --> REPORT

    REPORT <--> REPORTDB

    REPORT --> HR
    REPORT --> MENTOR
    REPORT --> INTERN
```

---

# 🗃️ ER Diagram

```mermaid
erDiagram

    USERS {
        int user_id PK
        string full_name
        string email
        string password
        string role
        datetime created_at
    }

    INTERNSHIPS {
        int internship_id PK
        int intern_id
        int mentor_id
        string company_name
        string internship_title
        date start_date
        date end_date
        string status
        string description
        datetime created_at
    }

    TASKS {
        int task_id PK
        int intern_id
        int mentor_id
        string title
        string description
        date due_date
        string status
        datetime created_at
    }

    DAILY_UPDATES {
        int update_id PK
        int task_id
        int intern_id
        date update_date
        string work_description
        float hours_worked
        string status
        datetime created_at
    }

    SENTIMENT_RESULTS {
        int sentiment_id PK
        int update_id
        int intern_id
        string sentiment
        float score
        string analyzed_text
        datetime created_at
    }

    EVALUATIONS {
        int evaluation_id PK
        int intern_id
        int mentor_id
        date evaluation_date
        float technical_skills
        float communication
        float work_quality
        float punctuality
        float problem_solving
        float overall_score
        string feedback
        datetime created_at
    }

    MONTHLY_REPORTS {
        int report_id PK
        int intern_id
        int month
        int year
        int tasks_assigned
        int tasks_completed
        float completion_percentage
        float average_sentiment
        float average_mentor_rating
        float overall_score
        string mentor_feedback
        datetime created_at
    }

    TASKS ||--o{ DAILY_UPDATES : contains
    DAILY_UPDATES ||--o{ SENTIMENT_RESULTS : analyzed_by
```

> Note: The microservices use separate databases. IDs such as `intern_id` and `mentor_id` can represent application-level references rather than cross-database foreign keys.

---

# 🔐 Login Sequence Diagram

```mermaid
sequenceDiagram

    actor User
    participant Frontend as React Frontend
    participant Auth as Auth Service
    participant DB as Auth Database

    User->>Frontend: Enter email and password
    Frontend->>Auth: POST /api/auth/login
    Auth->>DB: Find user by email
    DB-->>Auth: User data

    Auth->>Auth: Compare password using bcrypt

    alt Valid credentials
        Auth->>Auth: Generate JWT
        Auth-->>Frontend: JWT + user information
        Frontend-->>User: Open dashboard
    else Invalid credentials
        Auth-->>Frontend: Authentication error
        Frontend-->>User: Display error
    end
```

---

# 🤖 Daily Update and Sentiment Analysis

```mermaid
sequenceDiagram

    actor Intern
    participant Frontend as React Frontend
    participant Task as Task Service
    participant TaskDB as Task DB
    participant Sentiment as Sentiment Service
    participant SentimentDB as Sentiment DB

    Intern->>Frontend: Submit daily work update

    Frontend->>Task: POST daily update
    Task->>TaskDB: Save update
    TaskDB-->>Task: Update saved

    Task->>Sentiment: Send update text

    Sentiment->>Sentiment: Analyze sentiment

    Sentiment->>SentimentDB: Save sentiment result
    SentimentDB-->>Sentiment: Result saved

    Sentiment-->>Task: Sentiment + score
    Task-->>Frontend: Update submitted
    Frontend-->>Intern: Display result
```

---

# 📈 Mentor Evaluation Sequence

```mermaid
sequenceDiagram

    actor Mentor
    participant Frontend as React Frontend
    participant Evaluation as Evaluation Service
    participant DB as Evaluation DB

    Mentor->>Frontend: Open intern evaluation

    Frontend->>Evaluation: Request intern evaluation data
    Evaluation-->>Frontend: Intern information

    Mentor->>Frontend: Enter evaluation scores

    Frontend->>Evaluation: Submit evaluation

    Evaluation->>Evaluation: Validate scores
    Evaluation->>Evaluation: Calculate overall score

    Evaluation->>DB: Save evaluation
    DB-->>Evaluation: Evaluation saved

    Evaluation-->>Frontend: Evaluation result
    Frontend-->>Mentor: Display performance score
```

---

# 📊 Monthly Report Generation

```mermaid
sequenceDiagram

    actor User
    participant Report as Report Service
    participant Internship as Internship Service
    participant Task as Task Service
    participant Sentiment as Sentiment Service
    participant Evaluation as Evaluation Service
    participant DB as Report DB

    User->>Report: Request monthly report

    Report->>Internship: Get internship data
    Internship-->>Report: Internship data

    Report->>Task: Get task statistics
    Task-->>Report: Task data

    Report->>Sentiment: Get sentiment results
    Sentiment-->>Report: Sentiment data

    Report->>Evaluation: Get evaluation data
    Evaluation-->>Report: Evaluation data

    Report->>Report: Calculate monthly performance

    Report->>DB: Save report
    DB-->>Report: Report saved

    Report-->>User: Monthly performance report
```

---

# 🔄 Activity Diagram

```mermaid
flowchart TD

    START([Start])

    LOGIN["Login"]

    VALID{"Valid Credentials?"}

    DASHBOARD["Open Dashboard"]

    INTERNSHIP["View / Manage Internship"]

    TASK["View / Manage Tasks"]

    UPDATE["Submit Daily Update"]

    SENTIMENT["Analyze Sentiment"]

    EVALUATION["Mentor Evaluation"]

    SCORE["Calculate Performance Score"]

    REPORT["Generate Monthly Report"]

    VIEW["View Report"]

    END([End])

    START --> LOGIN
    LOGIN --> VALID

    VALID -->|No| LOGIN
    VALID -->|Yes| DASHBOARD

    DASHBOARD --> INTERNSHIP
    INTERNSHIP --> TASK
    TASK --> UPDATE
    UPDATE --> SENTIMENT
    SENTIMENT --> EVALUATION
    EVALUATION --> SCORE
    SCORE --> REPORT
    REPORT --> VIEW
    VIEW --> END
```

---

# 🖥️ Deployment Diagram

```mermaid
flowchart TB

    CLIENT["User Browser"]

    FRONTEND["Frontend Server<br/>React + Vite"]

    subgraph BACKEND["Backend Server"]

        AUTH["Auth Service<br/>:5001"]

        INTERNSHIP["Internship Service<br/>:5002"]

        TASK["Task Service<br/>:5003"]

        SENTIMENT["Sentiment Service<br/>:5004"]

        EVALUATION["Evaluation Service<br/>:5005"]

        REPORT["Report Service<br/>:5006"]

    end

    subgraph POSTGRES["PostgreSQL"]

        AUTHDB[("auth_db")]

        INTERNSHIPDB[("internship_db")]

        TASKDB[("task_db")]

        SENTIMENTDB[("sentiment_db")]

        EVALUATIONDB[("evaluation_db")]

        REPORTDB[("report_db")]

    end

    CLIENT --> FRONTEND

    FRONTEND --> AUTH
    FRONTEND --> INTERNSHIP
    FRONTEND --> TASK
    FRONTEND --> EVALUATION
    FRONTEND --> REPORT

    AUTH --> AUTHDB
    INTERNSHIP --> INTERNSHIPDB
    TASK --> TASKDB
    SENTIMENT --> SENTIMENTDB
    EVALUATION --> EVALUATIONDB
    REPORT --> REPORTDB

    TASK --> SENTIMENT

    REPORT --> INTERNSHIP
    REPORT --> TASK
    REPORT --> SENTIMENT
    REPORT --> EVALUATION
```

---

# 🔐 Authentication

Authentication is handled by the Auth Service.

### Registration

```http
POST /api/auth/register
```

### Login

```http
POST /api/auth/login
```

After successful login, the Auth Service generates a JWT token.

Protected endpoints use:

```http
Authorization: Bearer <JWT_TOKEN>
```

Passwords are hashed using bcrypt before being stored.

---

# 🤖 Sentiment Analysis

The Sentiment Service analyzes the text submitted by interns in their daily work updates.

Example:

```text
Today I successfully completed my assigned task.
```

Possible sentiment results:

```text
POSITIVE
NEUTRAL
NEGATIVE
```

The service also produces a sentiment score.

---

# 📊 Performance Evaluation

Mentors evaluate interns using multiple dimensions:

- Technical Skills
- Communication
- Work Quality
- Punctuality
- Problem Solving

The Evaluation Service calculates the overall performance score based on the configured scoring logic.

---

# 📑 Monthly Reports

The Report Service collects information from different services and generates monthly performance information.

Reports can contain:

- Tasks assigned
- Tasks completed
- Completion percentage
- Sentiment information
- Mentor evaluation
- Overall performance score
- Mentor feedback

---

# 🔌 API Endpoints

## Auth Service

```text
POST /api/auth/register
POST /api/auth/login
```

Protected endpoints require:

```text
Authorization: Bearer <JWT_TOKEN>
```

Additional service endpoints are documented in:

```text
Backend/API.md
```

---

# ⚙️ Environment Variables

Each service contains an `.env.example` file.

Create a `.env` file for each service.

Example:

```env
PORT=5001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key
```

### Important

Never commit real `.env` files.

Do not expose:

```text
DB_PASSWORD
JWT_SECRET
API_KEYS
```

---

# 🚀 Installation

## 1. Clone Repository

```bash
git clone <YOUR-GITHUB-REPOSITORY-URL>
cd InternshipManagement
```

---

# Backend Setup

Install dependencies for each service.

### Auth Service

```bash
cd Backend/services/auth-service
npm install
```

### Internship Service

```bash
cd ../internship-service
npm install
```

### Task Service

```bash
cd ../task-service
npm install
```

### Evaluation Service

```bash
cd ../evaluation-service
npm install
```

### Report Service

```bash
cd ../report-service
npm install
```

### Sentiment Service

```bash
cd ../sentiment-service
npm install
pip install -r requirements.txt
```

---

# 🗃️ Database Setup

Create the PostgreSQL databases:

```text
auth_db
internship_db
task_db
sentiment_db
evaluation_db
report_db
```

SQL scripts are available in:

```text
Backend/database/
```

Execute the corresponding SQL file for each database.

---

# ▶️ Running the Backend

Each microservice can be started independently.

Example:

```bash
cd Backend/services/auth-service
npm run dev
```

or:

```bash
node server.js
```

Repeat the process for the remaining services.

The project also contains:

```text
Backend/scripts/Start-Services.ps1
Backend/scripts/Test-Services.ps1
```

---

# 💻 Running the Frontend

```bash
cd Frontend/Frontend
npm install
npm run dev
```

The frontend normally runs at:

```text
http://localhost:5173
```

---

# 🧪 Testing

Postman can be used to test the REST APIs.

Example:

```http
POST http://localhost:5001/api/auth/register
```

Login:

```http
POST http://localhost:5001/api/auth/login
```

Protected request:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# 🔄 Git Workflow

Get latest changes:

```bash
git pull origin main
```

Check changes:

```bash
git status
```

Add changes:

```bash
git add .
```

Commit:

```bash
git commit -m "Update project"
```

Push:

```bash
git push origin main
```

---

# 📌 Future Enhancements

- Email notifications
- Automated reminders
- PDF report generation
- Excel report generation
- Advanced sentiment analysis
- Attendance management
- Mentor-intern communication
- Docker deployment
- Cloud deployment
- Automated scheduled reports

---

# 🎓 Project Information

| Property | Details |
|---|---|
| **Project** | AI-Based Internship Management and Performance Evaluation System |
| **Architecture** | Microservices |
| **Frontend** | React.js + Vite |
| **Backend** | Node.js + Express.js |
| **AI Component** | Python Sentiment Analysis |
| **Database** | PostgreSQL |
| **Authentication** | JWT + bcrypt |
| **API** | REST API |
| **Purpose** | Academic Project |

---

# 👨‍💻 Developed For

**MSc Computer Applications**

---

## ⭐ Project Summary

The system combines **internship management, task tracking, AI-based sentiment analysis, mentor evaluation, and performance reporting** into a single platform.

The microservices architecture provides separation of responsibilities, independent database ownership, and scalable backend services.

---
