"""
AI Homework Generator Router
"""

import time
from fastapi import APIRouter
from backend.database import db
from backend.models import HomeworkCreateRequest

router = APIRouter(prefix="/homework", tags=["AI Homework Generator"])


@router.post("/create", summary="Create Differentiated or Class-Wide Homework Assignment")
async def create_homework(payload: HomeworkCreateRequest):
    """
    Generates weak-topic or chapter-wise assignments with automatic submission tracking.
    """
    hw_id = f"HW-2024-W{int(time.time()) % 52:02d}-{int(time.time()) % 100:02d}"
    assigned_count = len(payload.targetedStudentIds) if payload.targetedStudentIds else 46

    assignment = {
        "homeworkId": hw_id,
        "classId": payload.classId,
        "title": payload.title,
        "dueDate": payload.dueDate,
        "targetedStudentIds": payload.targetedStudentIds,
        "questionIds": payload.questionIds,
        "status": "assigned",
        "totalAssigned": assigned_count
    }

    db.homework_assignments.append(assignment)
    db.add_audit_log(
        user="Teacher (T-TN-48291)",
        action=f"Dispatched homework assignment '{payload.title}' to {assigned_count} students in Class {payload.classId}"
    )

    return {
        "homeworkId": hw_id,
        "status": "assigned",
        "totalAssigned": assigned_count
    }

