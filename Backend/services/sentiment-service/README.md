# Python sentiment service

This service uses Python, VADER, PostgreSQL, and the same JWT secret as the authentication service.

## Run it

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python app.py
```

Set the `.env` values before running it. `DB_NAME` must be `sentiment_db`; `JWT_SECRET` must match the authentication service.

## Test the classifier

```powershell
.\.venv\Scripts\python -m unittest test_app.py
```

Endpoints: `GET /health`, `POST /api/sentiment/analyze`, `GET /api/sentiment/mine`, and `GET /api/sentiment` for HR/Admin.
