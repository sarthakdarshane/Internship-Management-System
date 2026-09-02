"""Python sentiment API for the Internship Management System.

It verifies auth-service JWTs, analyses intern reflections with VADER, and
stores results in the sentiment PostgreSQL database.
"""

from __future__ import annotations

import os
from contextlib import contextmanager
from functools import wraps
from pathlib import Path
from typing import Any

import jwt
import psycopg
from flask import Flask, g, jsonify, request
from jwt import InvalidTokenError
from psycopg.rows import dict_row
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

BASE_DIR = Path(__file__).resolve().parent
MAX_TEXT_LENGTH = 5000
VALID_LABELS = {"POSITIVE", "NEUTRAL", "NEGATIVE"}


def load_env_file() -> None:
    """Load local .env values without overriding real environment variables."""
    env_file = BASE_DIR / ".env"
    if not env_file.exists():
        return
    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file()
app = Flask(__name__)
analyser = SentimentIntensityAnalyzer()


def database_config() -> dict[str, Any]:
    required = ("DB_USER", "DB_HOST", "DB_NAME", "DB_PASSWORD")
    missing = [key for key in required if not os.getenv(key)]
    if missing:
        raise RuntimeError("Missing required database configuration: " + ", ".join(missing))
    return {
        "user": os.environ["DB_USER"],
        "host": os.environ["DB_HOST"],
        "dbname": os.environ["DB_NAME"],
        "password": os.environ["DB_PASSWORD"],
        "port": int(os.getenv("DB_PORT", "5432")),
    }


@contextmanager
def database_connection():
    with psycopg.connect(**database_config()) as connection:
        yield connection


def ensure_schema() -> None:
    """Create the table when the service is started against a fresh database."""
    with database_connection() as connection, connection.cursor() as cursor:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS sentiment_analysis (
                sentiment_id SERIAL PRIMARY KEY,
                update_id INTEGER NOT NULL UNIQUE,
                intern_id INTEGER NOT NULL,
                text_content TEXT NOT NULL,
                sentiment VARCHAR(12) NOT NULL CHECK (sentiment IN ('POSITIVE', 'NEUTRAL', 'NEGATIVE')),
                score NUMERIC(4,3) NOT NULL CHECK (score >= 0 AND score <= 1),
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.commit()


def authenticate(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        scheme, _, token = request.headers.get("Authorization", "").partition(" ")
        if scheme != "Bearer" or not token:
            return jsonify(message="A Bearer token is required"), 401
        secret = os.getenv("JWT_SECRET")
        if not secret:
            return jsonify(message="Server JWT configuration is missing"), 500
        try:
            g.user = jwt.decode(token, secret, algorithms=["HS256"])
        except InvalidTokenError:
            return jsonify(message="Invalid or expired token"), 401
        return view(*args, **kwargs)
    return wrapped


def roles_required(*roles: str):
    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            if g.user.get("role") not in roles:
                return jsonify(message="You do not have permission to perform this action"), 403
            return view(*args, **kwargs)
        return wrapped
    return decorator


def classify_sentiment(text: str) -> tuple[str, float]:
    """Return a label and normalized 0..1 VADER compound score."""
    compound = analyser.polarity_scores(text)["compound"]
    score = round((compound + 1) / 2, 3)
    if score >= 0.6:
        return "POSITIVE", score
    if score <= 0.4:
        return "NEGATIVE", score
    return "NEUTRAL", score


def analysis_to_json(row: dict[str, Any]) -> dict[str, Any]:
    result = dict(row)
    result["score"] = float(result["score"])
    if result.get("created_at") is not None:
        result["created_at"] = result["created_at"].isoformat()
    return result


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = os.getenv("CORS_ORIGIN", "http://localhost:5173")
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.before_request
def handle_preflight_request():
    if request.method == "OPTIONS":
        return "", 204
    return None


@app.route("/", methods=["GET"])
def root():
    return jsonify(service="sentiment-service", message="Python Sentiment Service API is running", engine="VADER")


@app.route("/health", methods=["GET"])
def health():
    try:
        ensure_schema()
        with database_connection() as connection, connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except (psycopg.Error, RuntimeError, ValueError) as error:
        app.logger.error("Sentiment health check failed: %s", error)
        return jsonify(status="error", message="Database connection failed"), 503
    return jsonify(status="ok", service="sentiment-service", engine="VADER")


@app.route("/api/sentiment/analyze", methods=["POST", "OPTIONS"])
@authenticate
@roles_required("INTERN")
def analyze():
    payload = request.get_json(silent=True) or {}
    update_id = payload.get("update_id")
    text = payload.get("text_content")
    if type(update_id) is not int or update_id <= 0:
        return jsonify(message="update_id must be a positive integer"), 400
    if not isinstance(text, str) or not text.strip():
        return jsonify(message="text_content must be non-empty text"), 400
    cleaned_text = text.strip()
    if len(cleaned_text) > MAX_TEXT_LENGTH:
        return jsonify(message="text_content must be 5000 characters or fewer"), 400

    sentiment, score = classify_sentiment(cleaned_text)
    with database_connection() as connection, connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """
            INSERT INTO sentiment_analysis (update_id, intern_id, text_content, sentiment, score)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (update_id) DO UPDATE SET
                intern_id = EXCLUDED.intern_id,
                text_content = EXCLUDED.text_content,
                sentiment = EXCLUDED.sentiment,
                score = EXCLUDED.score,
                created_at = CURRENT_TIMESTAMP
            RETURNING sentiment_id, update_id, intern_id, text_content, sentiment, score, created_at
            """,
            (update_id, g.user["user_id"], cleaned_text, sentiment, score),
        )
        result = cursor.fetchone()
        connection.commit()
    return jsonify(message="Sentiment analysed successfully", analysis=analysis_to_json(result)), 201


@app.route("/api/sentiment/mine", methods=["GET", "OPTIONS"])
@authenticate
@roles_required("INTERN")
def mine():
    with database_connection() as connection, connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """SELECT sentiment_id, update_id, intern_id, text_content, sentiment, score, created_at
               FROM sentiment_analysis WHERE intern_id = %s ORDER BY created_at DESC""",
            (g.user["user_id"],),
        )
        rows = cursor.fetchall()
    return jsonify(analyses=[analysis_to_json(row) for row in rows])


@app.route("/api/sentiment", methods=["GET", "OPTIONS"])
@authenticate
@roles_required("ADMIN", "HR")
def all_analyses():
    with database_connection() as connection, connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """SELECT sentiment_id, update_id, intern_id, text_content, sentiment, score, created_at
               FROM sentiment_analysis ORDER BY created_at DESC"""
        )
        rows = cursor.fetchall()
    return jsonify(analyses=[analysis_to_json(row) for row in rows])


@app.route("/api/sentiment/<int:sentiment_id>", methods=["GET", "OPTIONS"])
@authenticate
def get_analysis(sentiment_id: int):
    with database_connection() as connection, connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """SELECT sentiment_id, update_id, intern_id, text_content, sentiment, score, created_at
               FROM sentiment_analysis WHERE sentiment_id = %s""",
            (sentiment_id,),
        )
        result = cursor.fetchone()
    if not result:
        return jsonify(message="Sentiment analysis not found"), 404
    if g.user.get("role") not in {"ADMIN", "HR"} and result["intern_id"] != g.user.get("user_id"):
        return jsonify(message="You do not have access to this sentiment analysis"), 403
    return jsonify(analysis=analysis_to_json(result))


@app.errorhandler(psycopg.Error)
def database_error(error):
    app.logger.exception("Database request failed: %s", error)
    return jsonify(message="Database request failed"), 500


@app.errorhandler(Exception)
def unexpected_error(error):
    app.logger.exception("Unexpected request failure: %s", error)
    return jsonify(message="Internal server error"), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5004")), debug=False)
