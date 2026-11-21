"""Local single-user history API."""
from fastapi import APIRouter, Query, Response
from app.services import history

router = APIRouter(prefix="/api/history", tags=["history"])

@router.get("")
def list_history(limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)) -> dict:
    return history.list_entries(limit, offset)

@router.get("/{history_id}")
def get_history(history_id: int) -> dict:
    return history.get(history_id)

@router.delete("/{history_id}", status_code=204)
def delete_history(history_id: int) -> Response:
    history.delete(history_id)
    return Response(status_code=204)
