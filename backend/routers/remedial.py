"""
AI Remedial Learning & Micro-Drill Router
"""

import time
from fastapi import APIRouter
from backend.database import db
from backend.models import RemedialGenerateRequest

router = APIRouter(prefix="/remedial", tags=["Student Learning DNA & Remedial"])


@router.post("/generate-drill", summary="Generate AI Personalized Remedial Worksheet")
async def generate_drill(payload: RemedialGenerateRequest):
    """
    Generates foundation-level and equivalent practice questions for diagnosed weak concepts.
    """
    student = next((s for s in db.students if s["id"] == payload.studentId), None)
    student_name = student["name"] if student else "K. Vignesh"
    drill_id = f"DRILL-2024-REM-{int(time.time()) % 10000:04d}"

    drill = {
        "drillId": drill_id,
        "studentName": student_name,
        "studentTarget": f"{student_name} & 4 others",
        "targetTime": "15 Minutes",
        "concept": payload.conceptTarget,
        "workedExample": {
            "title": f"Concept Clarification: {payload.conceptTarget}",
            "formula": "A_ij = (-1)^(i+j) * M_ij",
            "explanationEn": "Remember that the sign checkerboard matrix [[+, -, +], [-, +, -], [+, -, +]] must be applied before or during cofactor computation. In Step 2, students commonly miss the negative sign for A_12, A_21, A_23, and A_32.",
            "explanationTa": "3x3 அணியின் இணைக்காரணி அணியைக் காணும்போது குறி அணி [[+, -, +], [-, +, -], [+, -, +]]-ஐ கவனத்தில் கொள்ள வேண்டும். A_12, A_21, A_23, A_32 உறுப்புகளுக்கு குறை குறி கட்டாயம் வரும்."
        },
        "practiceQuestions": [
            {
                "id": "Q-REM-1",
                "textEn": "For matrix A = [[1, 2], [3, 4]], find the cofactor of element a_12.",
                "textTa": "A = [[1, 2], [3, 4]] என்ற அணியில் a_12 உறுப்பின் இணைக்காரணியைக் காண்க.",
                "marks": 1,
                "answer": "A_12 = (-1)^(1+2) * (3) = -3"
            },
            {
                "id": "Q-REM-2",
                "textEn": "Evaluate the cofactor matrix and hence adj(A) for A = [[2, 1, 3], [0, 4, -1], [1, 2, 0]].",
                "textTa": "A = [[2, 1, 3], [0, 4, -1], [1, 2, 0]] என்ற அணியின் இணைக்காரணி அணி மற்றும் சேர்ப்பு அணி காண்க.",
                "marks": 3,
                "answer": "adj(A) = [[2, 6, -13], [-1, -3, 2], [-4, -3, 8]]"
            }
        ],
        "scheduledDueDate": "2024-11-14"
    }

    db.add_audit_log(
        user="Teacher (T-TN-48291)",
        action=f"Synthesized personalized remedial drill '{drill_id}' for {student_name} ({payload.conceptTarget})"
    )

    return drill

