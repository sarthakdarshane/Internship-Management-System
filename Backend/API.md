# Backend API quick reference

All protected endpoints use:

```text
Authorization: Bearer <token>
```

## Authentication — port 5001

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/profile` | Signed-in user |
| GET | `/api/auth/users` | Admin, HR |
| GET | `/api/auth/users/:userId` | Admin, HR |
| PATCH | `/api/auth/users/:userId/role` | Admin |

## Internships — port 5002

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/internships` | Admin, HR |
| GET | `/api/internships` | Admin, HR |
| GET | `/api/internships/mine` | Intern |
| GET | `/api/internships/assigned` | Mentor |
| GET | `/api/internships/:id` | Owner, mentor, Admin, HR |
| PUT | `/api/internships/:id` | Admin, HR |
| DELETE | `/api/internships/:id` | Admin |

## Tasks and daily updates — port 5003

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/tasks` | Mentor, Admin, HR |
| GET | `/api/tasks/mine` | Intern |
| GET | `/api/tasks/assigned` | Mentor |
| PATCH | `/api/tasks/:taskId` | Task owner/manager |
| POST | `/api/tasks/:taskId/updates` | Assigned intern |
| GET | `/api/tasks/:taskId/updates` | Assigned intern, mentor, Admin, HR |

## Sentiment — port 5004 (Python)

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/sentiment/analyze` | Intern |
| GET | `/api/sentiment/mine` | Intern |
| GET | `/api/sentiment` | Admin, HR |

`POST /api/sentiment/analyze` accepts `update_id` and `text_content`. It stores a VADER-generated score from 0 to 1 and a positive, neutral, or negative label.

## Evaluations — port 5005

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/evaluations` | Mentor, Admin, HR |
| GET | `/api/evaluations/mine` | Intern |
| GET | `/api/evaluations/assigned` | Mentor |

## Reports — port 5006

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/reports/monthly` | Intern, Admin, HR |
| POST | `/api/reports/generate` | Intern, Admin, HR |
| GET | `/api/reports/mine` | Intern |
| GET | `/api/reports` | Admin, HR |
