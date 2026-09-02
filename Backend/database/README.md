# Database setup

Create the six databases listed below, then run the matching script while connected to that database:

| Database | Script |
| --- | --- |
| `auth_db` | `auth_db.sql` |
| `internship_db` | `internship_db.sql` |
| `task_db` | `task_db.sql` |
| `sentiment_db` | `sentiment_db.sql` |
| `evaluation_db` | `evaluation_db.sql` |
| `report_db` | `report_db.sql` |

Example from PostgreSQL's `psql` shell: `\i C:/path/to/auth_db.sql`.

Each service must have its own `.env` based on `.env.example`, set to the matching database. All services must use the same `JWT_SECRET`.
