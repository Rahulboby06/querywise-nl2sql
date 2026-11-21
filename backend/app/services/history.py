"""Persistent single-user assistant history in an internal PostgreSQL schema."""
from pathlib import Path
from threading import Lock

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine

_setup_lock = Lock()
_setup_done = False
_SETUP_SQL = (Path(__file__).resolve().parents[3] / "database" / "history.sql").read_text(encoding="utf-8-sig")


def ensure_history() -> None:
    global _setup_done
    if _setup_done:
        return
    with _setup_lock:
        if _setup_done:
            return
        with engine.begin() as connection:
            for statement in _SETUP_SQL.split(";"):
                if statement.strip():
                    connection.execute(text(statement))
        _setup_done = True


def _database_error() -> HTTPException:
    return HTTPException(status_code=503, detail="Query history is unavailable. Check the database connection and setup.")


def create(question: str) -> int:
    try:
        ensure_history()
        with engine.begin() as connection:
            return int(connection.execute(text("INSERT INTO nl2sql_internal.query_history (question) VALUES (:question) RETURNING id"), {"question": question}).scalar_one())
    except SQLAlchemyError:
        raise _database_error() from None


def update(history_id: int, **values: object) -> None:
    allowed = {"generated_sql", "validated_sql", "attempted_sql", "generation_status", "generation_error", "validation_status", "validation_error", "execution_status", "execution_error", "execution_duration_ms", "row_count", "truncated"}
    if not values or not values.keys() <= allowed:
        raise ValueError("Invalid history update")
    try:
        ensure_history()
        assignments = ", ".join(f"{key} = :{key}" for key in values)
        with engine.begin() as connection:
            result = connection.execute(text(f"UPDATE nl2sql_internal.query_history SET {assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = :history_id"), {**values, "history_id": history_id})
            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="History entry not found.")
    except SQLAlchemyError:
        raise _database_error() from None


def get(history_id: int) -> dict:
    try:
        ensure_history()
        with engine.connect() as connection:
            row = connection.execute(text("SELECT * FROM nl2sql_internal.query_history WHERE id = :id"), {"id": history_id}).mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="History entry not found.")
        return dict(row)
    except SQLAlchemyError:
        raise _database_error() from None


def list_entries(limit: int, offset: int) -> dict:
    try:
        ensure_history()
        with engine.connect() as connection:
            total = connection.execute(text("SELECT count(*) FROM nl2sql_internal.query_history")).scalar_one()
            rows = connection.execute(text("SELECT * FROM nl2sql_internal.query_history ORDER BY created_at DESC, id DESC LIMIT :limit OFFSET :offset"), {"limit": limit, "offset": offset}).mappings().all()
        return {"items": [dict(row) for row in rows], "total": total, "limit": limit, "offset": offset}
    except SQLAlchemyError:
        raise _database_error() from None


def delete(history_id: int) -> None:
    try:
        ensure_history()
        with engine.begin() as connection:
            result = connection.execute(text("DELETE FROM nl2sql_internal.query_history WHERE id = :id"), {"id": history_id})
            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="History entry not found.")
    except SQLAlchemyError:
        raise _database_error() from None
