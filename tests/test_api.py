"""
Automated Comprehensive Test Suite for ExamIQ FastAPI Backend
Tests all endpoints against frontend contract specifications.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["database"] == "online"

    res_v1 = client.get("/api/v1/health")
    assert res_v1.status_code == 200
    assert res_v1.json()["status"] == "healthy"


def test_auth_login_admin():
    res = client.post("/api/v1/auth/login", json={
        "schoolCode": "33240100201",
        "userIdentity": "admin@gmail.com",
        "password": "admin@123",
        "role": "admin"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "token" in data
    assert data["user"]["role"] == "admin"


def test_auth_login_teacher():
    res = client.post("/api/v1/auth/login", json={
        "schoolCode": "33240100201",
        "userIdentity": "meenakshi.pgt@tnschools.gov.in",
        "password": "password123",
        "role": "teacher"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["user"]["role"] == "teacher"


def test_auth_emis_sso():
    res = client.post("/api/v1/auth/emis-sso", json={
        "emisAuthCode": "emis_oauth_code_xyz123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "token" in data


def test_syllabus_hierarchy():
    res = client.get("/api/v1/syllabus/12-A/maths")
    assert res.status_code == 200
    data = res.json()
    assert data["classId"] == "12-A"
    assert "chapters" in data
    assert len(data["chapters"]) >= 7


def test_syllabus_sample_id():
    # Frontend API explorer uses 'sample-id' for parameterized routes
    res = client.get("/api/v1/syllabus/sample-id/sample-id")
    assert res.status_code == 200
    data = res.json()
    assert "chapters" in data


def test_syllabus_lock_toggle():
    res = client.put("/api/v1/syllabus/lock/toggle", json={
        "classId": "12-A",
        "lockActive": True,
        "enrichmentPreviewAllowed": False,
        "teacherId": "T-TN-48291",
        "notes": "Testing lock toggle"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "updated"
    assert data["lockActive"] is True


def test_syllabus_subtopic_status():
    res = client.post("/api/v1/syllabus/subtopic/status", json={
        "classId": "12-A",
        "subtopicId": "4.3",
        "newStatus": "completed",
        "completionDate": "2024-11-10"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["subtopicId"] == "4.3"
    assert data["eligibleForPaperGeneration"] is True


def test_resources_list():
    res = client.get("/api/v1/resources?stream=academic&medium=bilingual")
    assert res.status_code == 200
    data = res.json()
    assert "total" in data
    assert "resources" in data
    assert len(data["resources"]) > 0


def test_resources_import():
    res = client.post("/api/v1/resources/import", json={
        "title": "DGE Model Paper 2024",
        "type": "Model Question Paper",
        "medium": "Tamil & English"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "queued_for_ocr"
    assert "resourceId" in data


def test_resources_version_diff():
    res = client.get("/api/v1/resources/version-diff")
    assert res.status_code == 200
    data = res.json()
    assert "changes" in data


def test_questions_get():
    res = client.get("/api/v1/questions?chapterId=1&marks=5")
    assert res.status_code == 200
    data = res.json()
    assert "totalFound" in data
    assert "questions" in data
    assert len(data["questions"]) > 0


def test_questions_add():
    res = client.post("/api/v1/questions", json={
        "chapterId": 2,
        "topic": "De Moivre Theorem",
        "marks": 5,
        "type": "Long Answer",
        "questionEn": "Prove De Moivre Theorem for rational index n.",
        "questionTa": "விகிதமுறு எண் n-க்கு டி மாய்வரின் தேற்றத்தை நிறுவுக.",
        "rubric": [{"step": "Base case n=1", "marks": 2.5}, {"step": "Induction step", "marks": 2.5}],
        "answerKey": "Proof verified."
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "created"
    assert "questionId" in data


def test_paper_generate():
    res = client.post("/api/v1/papers/generate", json={
        "title": "Class 12 Mid-Term Examination — Mathematics",
        "classId": "12-A",
        "testType": "Mid-Term",
        "totalMarks": 50,
        "durationMinutes": 90,
        "language": "bilingual",
        "taughtTopicsOnly": True
    })
    assert res.status_code == 200
    data = res.json()
    assert "paperId" in data
    assert data["totalMarks"] == 50
    assert "sections" in data
    assert len(data["sections"]) == 4


def test_paper_regenerate():
    res = client.post("/api/v1/papers/regenerate-question", json={
        "paperId": "PAPER-2024-MT-089",
        "currentQuestionId": "Q-MAT-0102",
        "reason": "Teacher prefers alternative"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "replacementQuestion" in data


def test_evaluations_upload_scan():
    res = client.post("/api/v1/evaluations/upload-scan", json={
        "testId": "TEST-UT2-MAT",
        "studentId": "STD-12A-14",
        "scanFileBase64": "data:image/jpeg;base64,..."
    })
    assert res.status_code == 200
    data = res.json()
    assert "evaluationId" in data
    assert data["confidenceScore"] > 90


def test_evaluations_approve():
    res = client.put("/api/v1/evaluations/EVAL-2024-UT2-014/approve", json={
        "finalApprovedMarks": 4.0,
        "teacherAdjustmentNotes": "Partial credit for intermediate transpose matrix formula.",
        "teacherId": "T-TN-48291"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "approved"
    assert data["finalApprovedMarks"] == 4.0


def test_evaluations_approve_sample_id():
    res = client.put("/api/v1/evaluations/sample-id/approve", json={
        "finalApprovedMarks": 4.0,
        "teacherAdjustmentNotes": "Sample test note",
        "teacherId": "T-TN-48291"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "approved"


def test_marks_get():
    res = client.get("/api/v1/marks/12-A/UT2")
    assert res.status_code == 200
    data = res.json()
    assert "classAverage" in data
    assert "students" in data
    assert len(data["students"]) > 0


def test_marks_batch_import():
    res = client.post("/api/v1/marks/batch-import", json={
        "testId": "TEST-UT2-MAT",
        "csvRows": [{"rollNo": "12101", "q1": 1, "q2": 2, "q3": 3, "q4": 5, "q5": 5, "total": 16}]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "imported"


def test_student_dna():
    res = client.get("/api/v1/students/STD-12A-14/learning-dna")
    assert res.status_code == 200
    data = res.json()
    assert data["studentId"] == "STD-12A-14"
    assert "conceptMastery" in data
    assert "diagnosedMisconceptions" in data


def test_student_dna_sample_id():
    res = client.get("/api/v1/students/sample-id/learning-dna")
    assert res.status_code == 200
    data = res.json()
    assert "conceptMastery" in data


def test_remedial_generate_drill():
    res = client.post("/api/v1/remedial/generate-drill", json={
        "studentId": "STD-12A-14",
        "conceptTarget": "Cofactor Matrix Signs & Adjoint Evaluation",
        "questionCount": 5,
        "includeWorkedExamples": True,
        "language": "bilingual"
    })
    assert res.status_code == 200
    data = res.json()
    assert "drillId" in data
    assert "workedExample" in data
    assert "practiceQuestions" in data


def test_homework_create():
    res = client.post("/api/v1/homework/create", json={
        "classId": "12-A",
        "title": "Chapter 1 & 2 Adjoint & De Moivre Homework Drill",
        "dueDate": "2024-11-15",
        "targetedStudentIds": ["STD-12A-14", "STD-12A-35"],
        "questionIds": ["Q-MAT-0101", "Q-MAT-0201"]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "assigned"
    assert data["totalAssigned"] == 2


def test_vocational():
    res = client.get("/api/v1/vocational/452")
    assert res.status_code == 200
    data = res.json()
    assert data["tradeCode"] == "452"
    assert "modules" in data
    assert "practicalRubrics" in data


def test_reports_class_summary():
    res = client.get("/api/v1/reports/class-summary/12-A")
    assert res.status_code == 200
    data = res.json()
    assert data["classId"] == "12-A"
    assert "averageScore" in data
    assert "syllabusCompletedPercentage" in data


def test_admin_audit_logs():
    res = client.get("/api/v1/admin/audit-logs")
    assert res.status_code == 200
    data = res.json()
    assert "totalLogs" in data
    assert "logs" in data
    assert len(data["logs"]) > 0


def test_admin_schools():
    res = client.get("/api/v1/admin/schools")
    assert res.status_code == 200
    data = res.json()
    assert "schools" in data
    assert len(data["schools"]) >= 4


if __name__ == "__main__":
    print("Running automated endpoint verification...")
    tests = [
        test_health,
        test_auth_login_admin,
        test_auth_login_teacher,
        test_auth_emis_sso,
        test_syllabus_hierarchy,
        test_syllabus_sample_id,
        test_syllabus_lock_toggle,
        test_syllabus_subtopic_status,
        test_resources_list,
        test_resources_import,
        test_resources_version_diff,
        test_questions_get,
        test_questions_add,
        test_paper_generate,
        test_paper_regenerate,
        test_evaluations_upload_scan,
        test_evaluations_approve,
        test_evaluations_approve_sample_id,
        test_marks_get,
        test_marks_batch_import,
        test_student_dna,
        test_student_dna_sample_id,
        test_remedial_generate_drill,
        test_homework_create,
        test_vocational,
        test_reports_class_summary,
        test_admin_audit_logs,
        test_admin_schools
    ]
    passed = 0
    failed = 0
    for t in tests:
        try:
            t()
            passed += 1
            print(f"  [PASS] {t.__name__}")
        except Exception as e:
            failed += 1
            print(f"  [FAIL] {t.__name__}: {e}")

    print(f"\nResult: {passed}/{len(tests)} tests passed. ({failed} failed)")
    if failed > 0:
        sys.exit(1)

