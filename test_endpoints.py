"""
Comprehensive Backend Endpoint Verification Script for ExamIQ.
Run this script to verify all FastAPI endpoints without needing a running server:
    python test_endpoints.py
"""

import sys
import unittest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


class TestExamIQBackend(unittest.TestCase):
    def test_01_health_check(self):
        res = client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

        res_v1 = client.get("/api/v1/health")
        self.assertEqual(res_v1.status_code, 200)
        self.assertEqual(res_v1.json()["status"], "healthy")

    def test_02_auth_admin_login(self):
        res = client.post("/api/v1/auth/login", json={
            "schoolCode": "33240100201",
            "userIdentity": "admin@gmail.com",
            "password": "admin@123",
            "role": "admin"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("token", data)
        self.assertEqual(data["user"]["role"], "admin")

    def test_03_auth_teacher_login(self):
        res = client.post("/api/v1/auth/login", json={
            "schoolCode": "33240100201",
            "userIdentity": "meenakshi.pgt@tnschools.gov.in",
            "password": "password123",
            "role": "teacher"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["user"]["role"], "teacher")

    def test_04_auth_emis_sso(self):
        res = client.post("/api/v1/auth/emis-sso", json={
            "emisAuthCode": "emis_oauth_code_xyz123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("token", data)

    def test_05_syllabus_get(self):
        res = client.get("/api/v1/syllabus/12-A/maths")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["classId"], "12-A")
        self.assertIn("chapters", data)
        self.assertGreaterEqual(len(data["chapters"]), 7)

    def test_06_syllabus_sample_id_fallback(self):
        # Frontend API Explorer tests routes with ':param' replaced by 'sample-id'
        res = client.get("/api/v1/syllabus/sample-id/sample-id")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("chapters", data)

    def test_07_syllabus_lock_toggle(self):
        res = client.put("/api/v1/syllabus/lock/toggle", json={
            "classId": "12-A",
            "lockActive": True,
            "enrichmentPreviewAllowed": False,
            "teacherId": "T-TN-48291",
            "notes": "Testing lock toggle"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "updated")
        self.assertTrue(data["lockActive"])

    def test_08_syllabus_subtopic_status_update(self):
        res = client.post("/api/v1/syllabus/subtopic/status", json={
            "classId": "12-A",
            "subtopicId": "4.3",
            "newStatus": "completed",
            "completionDate": "2024-11-10"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["subtopicId"], "4.3")
        self.assertTrue(data["eligibleForPaperGeneration"])

    def test_09_resources_list(self):
        res = client.get("/api/v1/resources?stream=academic&medium=bilingual")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total", data)
        self.assertIn("resources", data)
        self.assertGreater(len(data["resources"]), 0)

    def test_10_resources_import(self):
        res = client.post("/api/v1/resources/import", json={
            "title": "DGE Model Paper 2024",
            "type": "Model Question Paper",
            "medium": "Tamil & English"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "queued_for_ocr")
        self.assertIn("resourceId", data)

    def test_11_resources_version_diff(self):
        res = client.get("/api/v1/resources/version-diff")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("changes", data)

    def test_12_questions_search(self):
        res = client.get("/api/v1/questions?chapterId=1&marks=5")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("totalFound", data)
        self.assertIn("questions", data)
        self.assertGreater(len(data["questions"]), 0)

    def test_13_questions_author(self):
        res = client.post("/api/v1/questions", json={
            "chapterId": 2,
            "topic": "De Moivre Theorem",
            "marks": 5,
            "type": "Long Answer",
            "questionEn": "Prove De Moivre Theorem for rational index n.",
            "questionTa": "விகிதமுறு எண் n-க்கு டி மாய்வரின் தேற்றத்தை நிறுவுக.",
            "rubric": [{"step": "Base case", "marks": 2.5}, {"step": "Induction", "marks": 2.5}],
            "answerKey": "Verified"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "created")
        self.assertIn("questionId", data)

    def test_14_papers_generate(self):
        res = client.post("/api/v1/papers/generate", json={
            "title": "Class 12 Mid-Term Examination — Mathematics",
            "classId": "12-A",
            "testType": "Mid-Term",
            "totalMarks": 50,
            "durationMinutes": 90,
            "language": "bilingual",
            "taughtTopicsOnly": True
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("paperId", data)
        self.assertEqual(data["totalMarks"], 50)
        self.assertEqual(len(data["sections"]), 4)

    def test_15_papers_regenerate_question(self):
        res = client.post("/api/v1/papers/regenerate-question", json={
            "paperId": "PAPER-2024-MT-089",
            "currentQuestionId": "Q-MAT-0102",
            "reason": "Teacher prefers application-oriented variant"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("replacementQuestion", data)

    def test_16_evaluations_upload_scan(self):
        res = client.post("/api/v1/evaluations/upload-scan", json={
            "testId": "TEST-UT2-MAT",
            "studentId": "STD-12A-14",
            "scanFileBase64": "data:image/jpeg;base64,sample"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("evaluationId", data)
        self.assertGreater(data["confidenceScore"], 90)

    def test_17_evaluations_approve(self):
        res = client.put("/api/v1/evaluations/EVAL-2024-UT2-014/approve", json={
            "finalApprovedMarks": 4.0,
            "teacherAdjustmentNotes": "Partial credit for transpose working",
            "teacherId": "T-TN-48291"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "approved")
        self.assertEqual(data["finalApprovedMarks"], 4.0)

    def test_18_marks_get_ledger(self):
        res = client.get("/api/v1/marks/12-A/UT2")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("classAverage", data)
        self.assertIn("students", data)

    def test_19_marks_batch_import(self):
        res = client.post("/api/v1/marks/batch-import", json={
            "testId": "TEST-UT2-MAT",
            "csvRows": [{"rollNo": "12101", "q1": 1, "q2": 2, "q3": 3, "q4": 5, "q5": 5, "total": 16}]
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "imported")

    def test_20_students_learning_dna(self):
        res = client.get("/api/v1/students/STD-12A-14/learning-dna")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["studentId"], "STD-12A-14")
        self.assertIn("conceptMastery", data)

    def test_21_remedial_generate_drill(self):
        res = client.post("/api/v1/remedial/generate-drill", json={
            "studentId": "STD-12A-14",
            "conceptTarget": "Cofactor Matrix Signs & Adjoint Evaluation",
            "questionCount": 5,
            "includeWorkedExamples": True,
            "language": "bilingual"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("drillId", data)
        self.assertIn("workedExample", data)

    def test_22_homework_create(self):
        res = client.post("/api/v1/homework/create", json={
            "classId": "12-A",
            "title": "Adjoint & De Moivre Homework Drill",
            "dueDate": "2024-11-15",
            "targetedStudentIds": ["STD-12A-14"],
            "questionIds": ["Q-MAT-0101"]
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "assigned")

    def test_23_vocational_modules(self):
        res = client.get("/api/v1/vocational/452")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["tradeCode"], "452")

    def test_24_reports_class_summary(self):
        res = client.get("/api/v1/reports/class-summary/12-A")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["classId"], "12-A")
        self.assertIn("averageScore", data)

    def test_25_admin_audit_logs(self):
        res = client.get("/api/v1/admin/audit-logs")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("totalLogs", data)
        self.assertIn("logs", data)

    def test_26_admin_schools(self):
        res = client.get("/api/v1/admin/schools")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("schools", data)
        self.assertGreaterEqual(len(data["schools"]), 4)


if __name__ == "__main__":
    print("=" * 65)
    print("🧪 Running ExamIQ FastAPI Backend Test Suite...")
    print("=" * 65)
    suite = unittest.TestLoader().loadTestsFromTestCase(TestExamIQBackend)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if not result.wasSuccessful():
        sys.exit(1)

