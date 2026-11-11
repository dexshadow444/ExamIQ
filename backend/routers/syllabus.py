"""
Teaching Progress & Curricular Lock Router
Enforces Golden Rule 1: Prevents untaught topics from appearing in generated test papers.
"""

from fastapi import APIRouter
from backend.database import db
from backend.models import (
    LockToggleRequest,
    LockToggleResponse,
    SubtopicStatusRequest,
    SubtopicStatusResponse,
)

router = APIRouter(prefix="/syllabus", tags=["Teaching Progress & Lock"])


@router.get("/{class_id}/{subject_id}", summary="Retrieve Structured Syllabus Hierarchy & Teaching Status")
async def get_syllabus(class_id: str = "12-A", subject_id: str = "maths"):
    """
    Returns chapter, topic, subtopic hierarchy with completion statuses
    (not_started, in_progress, completed, revised) and current lock state.
    """
    return db.get_syllabus(class_id=class_id, subject_id=subject_id)


@router.put("/lock/toggle", response_model=LockToggleResponse, summary="Toggle Teaching Progress Lock or Enrichment Preview")
async def toggle_lock(payload: LockToggleRequest):
    """
    Enforces Rule 1: Prevents untaught topics from appearing in generated test papers.
    """
    return db.toggle_lock(
        class_id=payload.classId,
        lock_active=payload.lockActive,
        enrichment_allowed=payload.enrichmentPreviewAllowed,
        teacher_id=payload.teacherId or "T-TN-48291",
        notes=payload.notes or ""
    )


@router.post("/subtopic/status", response_model=SubtopicStatusResponse, summary="Update Topic / Subtopic Teaching Status")
async def update_subtopic_status(payload: SubtopicStatusRequest):
    """
    Marks a subtopic as not_started, in_progress, completed, or revised,
    updating eligibility for AI paper generation.
    """
    return db.update_subtopic_status(
        class_id=payload.classId,
        subtopic_id=payload.subtopicId,
        new_status=payload.newStatus,
        completion_date=payload.completionDate
    )

