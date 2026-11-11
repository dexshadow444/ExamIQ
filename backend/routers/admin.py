"""
Platform Administration & Security Router
"""

from fastapi import APIRouter
from backend.database import db

router = APIRouter(prefix="/admin", tags=["Admin & Security"])


@router.get("/audit-logs", summary="Retrieve System Audit Trails")
async def get_audit_logs():
    """
    Tracks teacher approvals, mark adjustments, lock overrides, and login activity.
    """
    return {
        "totalLogs": len(db.audit_logs),
        "logs": db.audit_logs
    }


@router.get("/schools", summary="List Connected School Tenants (U-DISE Registry)")
async def get_schools():
    """
    Returns verified government and aided school tenants with U-DISE IDs.
    """
    return {
        "total": len(db.school_data["schools"]),
        "schools": db.school_data["schools"]
    }

