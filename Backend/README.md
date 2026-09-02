# Internship Management Backend

## Services

| Service | Port | Database | Main API prefix |
| --- | ---: | --- | --- |
| Authentication | 5001 | `auth_db` | `/api/auth` |
| Internships | 5002 | `internship_db` | `/api/internships` |
| Tasks and daily updates | 5003 | `task_db` | `/api/tasks` |
| Sentiment (Python + VADER) | 5004 | `sentiment_db` | `/api/sentiment` |
| Evaluations | 5005 | `evaluation_db` | `/api/evaluations` |
| Reports | 5006 | `report_db` | `/api/reports` |

## Setup

1. Create the six PostgreSQL databases listed above.
2. Run each matching script from [`database`](./database/README.md).
3. In every service directory, create a `.env` file from `.env.example` and fill in the PostgreSQL password. Every service must use the same `JWT_SECRET` as the authentication service.
4. Install dependencies once with `npm install` in each Node.js service (authentication, internships, tasks, evaluations, and reports).
5. Set up the Python sentiment service once with `python -m venv .venv`, then `.\.venv\Scripts\python -m pip install -r requirements.txt`, from its service folder.
6. Start Node.js services with `npm start`; start the sentiment service with `.\.venv\Scripts\python app.py` (or `npm start` after its virtual environment exists).

## Start all services

From the `Backend` folder, run:

```powershell
.\scripts\Start-Services.ps1
```

This starts every service in the background and saves its logs in `Backend\logs`. Then check them with:

```powershell
.\scripts\Test-Services.ps1
```

## Authentication

Every protected endpoint expects this header:

```text
Authorization: Bearer <JWT token from /api/auth/login>
```

## Main endpoints

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile`
- `POST /api/internships`, `GET /api/internships`, `GET /api/internships/:id`
- `POST /api/tasks`, `GET /api/tasks/mine`, `GET /api/tasks/assigned`, `POST /api/tasks/:taskId/updates`
- `POST /api/sentiment/analyze`, `GET /api/sentiment/mine`
- `POST /api/evaluations`, `GET /api/evaluations/mine`, `GET /api/evaluations/assigned`
- `POST /api/reports/monthly`, `GET /api/reports/mine`

HR and admins manage programme records. Mentors create tasks and submit evaluations. Interns see their own assignments, task updates, sentiment results, and reports.

The sentiment service uses Python's VADER analyser. It converts VADER's compound score to a 0–1 score, labels it positive/neutral/negative, and stores the result in PostgreSQL.
