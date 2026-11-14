"""
Dataset Management Router
Exposes endpoints to view past-paper dataset status and trigger ingestion rebuilds.
"""

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException
from typing import Optional
from backend.services.qp_ingest import get_dataset_status, ingest_all

router = APIRouter(prefix="/dataset", tags=["Past Question Paper Dataset"])


@router.get("/status", summary="Retrieve Question Paper Dataset Ingestion Status")
async def dataset_status():
    """
    Returns statistics on past-paper PDFs discovered, ingested questions,
    breakdown by year, subject, marks, repeated questions, and low-confidence items.
    """
    return get_dataset_status()


@router.post("/rebuild", summary="Rebuild Past Question Paper Dataset (Admin Only)")
async def dataset_rebuild(
    force: bool = False,
    authorization: Optional[str] = Header(None)
):
    """
    Triggers an incremental or forced re-ingestion of all question papers in 'qp dataset/'.
    """
    # Run rebuild synchronously to return updated status immediately
    status = ingest_all(force=force)
    return {
        "message": "Dataset rebuild completed successfully.",
        "status": status
    }

