from fastapi import FastAPI
from sqlalchemy import text

from app.db.base import SessionLocal

app = FastAPI(title="Resume Builder API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/db")
def health_db() -> dict[str, str]:
    with SessionLocal() as session:
        session.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}
