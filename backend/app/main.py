from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.schema import router as schema_router
from app.api.ai_generation import router as ai_generation_router
from app.api.sql_execution import router as sql_execution_router
from app.api.sql_validation import router as sql_validation_router
from app.api.history import router as history_router
from app.core.config import settings
from app.database import engine

app = FastAPI(title=settings.app_name)
app.include_router(schema_router)
app.include_router(ai_generation_router)
app.include_router(sql_validation_router)
app.include_router(sql_execution_router)
app.include_router(history_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {
        "status": "healthy",
        "application": settings.app_name,
    }


@app.get("/api/health/database")
def database_health_check() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail={"status": "unhealthy", "database": "unavailable"},
        ) from None

    return {"status": "healthy", "database": "available"}
