"""
Student Learning DNA & Granular Diagnostic Router
"""

from fastapi import APIRouter
from backend.database import db

router = APIRouter(prefix="/students", tags=["Student Learning DNA & Remedial"])


@router.get("", summary="List All Enrolled Students")
async def list_students():
    """
    Returns enrolled students roster with attendance and academic rank.
    """
    return db.students


@router.get("/{student_id}/learning-dna", summary="Get Granular Student Learning DNA Profile")
async def get_student_learning_dna(student_id: str = "STD-12A-14"):
    """
    Returns concept-level mastery scores, persistent misconceptions, and accuracy indicators.
    """
    student = next((s for s in db.students if s["id"] == student_id), None)
    if not student:
        # Fallback to K. Vignesh for 'sample-id' or missing lookup
        student = db.students[1] if len(db.students) > 1 else db.students[0]

    dna = student.get("learningDna", {})

    return {
        "studentId": student["id"],
        "name": student["name"],
        "nameTamil": student.get("nameTamil"),
        "rollNo": student["rollNo"],
        "emisId": student["emisId"],
        "overallPercentage": student["overallPercentage"],
        "attendance": student["attendance"],
        "rank": student["rank"],
        "conceptMastery": {
            "matrices": dna.get("matricesMastery", 54),
            "complexNumbers": dna.get("complexNumbersMastery", 68),
            "theoryOfEquations": dna.get("theoryOfEquations", 70),
            "inverseTrig": dna.get("inverseTrig", 58)
        },
        "diagnosedMisconceptions": dna.get("learningGaps", []),
        "strengths": dna.get("strengths", []),
        "recommendedIntervention": dna.get("recommendedAction", "Generate targeted 5-question micro-remedial drill.")
    }

