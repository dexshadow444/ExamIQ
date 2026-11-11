"""
Question Bank & OCR Engine Router
"""

from typing import Optional
from fastapi import APIRouter, Query
from backend.database import db
from backend.models import QuestionCreateRequest

router = APIRouter(prefix="/questions", tags=["Question Bank & OCR Engine"])


@router.get("", summary="Search and Filter Question Repository")
async def get_questions(
    chapterId: Optional[int] = Query(None, description="Chapter numeric ID"),
    marks: Optional[int] = Query(None, description="Marks weightage (1, 2, 3, 5)"),
    difficulty: Optional[str] = Query(None, description="Difficulty (Easy, Medium, Hard)"),
    type: Optional[str] = Query(None, description="Question type (MCQ, Short Answer, Long Answer)"),
    search: Optional[str] = Query(None, description="Free text search in Tamil/English/Code")
):
    """
    Supports searching by marks, HOTS, book-back, Tamil/English keywords, and chapter.
    """
    questions = db.get_questions(
        chapter_id=chapterId,
        marks=marks,
        difficulty=difficulty,
        q_type=type,
        search=search
    )
    return {
        "totalFound": len(questions),
        "questions": questions
    }


@router.post("", summary="Add / Author New Question with Stepwise Rubric")
async def add_question(payload: QuestionCreateRequest):
    """
    Creates a teacher-authored or imported question with stepwise marking rubrics.
    """
    result = db.add_question(payload.model_dump(exclude_unset=True))
    db.add_audit_log(
        user="Teacher (T-TN-48291)",
        action=f"Created new question '{result['questionId']}' in Question Bank"
    )
    return result

