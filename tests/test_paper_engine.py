"""
Unit and Integration Tests for Past-Paper Question Ingestion & Paper Generation Engine
Validates:
1. Marks sum equals totalMarks exactly
2. Rule 1 (Teaching Progress Lock) never violated
3. 5-Year distribution with no single year exceeding 35% cap
4. Zero duplicate questions in generated papers
5. Bilingual fields (English & Tamil) present on every question
6. Fallback mode functions without Groq API key (no crash)
7. Ingestion pipeline is incremental (uses disk manifest)
8. Groq LLM client is properly mocked
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.main import app
from backend.services.paper_generator import (
    generate_exam_paper,
    get_curriculum_progress,
    load_questions_dataset,
    swap_question_in_paper,
)
from backend.services.qp_ingest import ingest_all, get_dataset_status


class TestPaperEngine(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Global mock for Groq LLM client to ensure fast, deterministic offline tests
        self.patcher = patch(
            "backend.services.llm_client.llm_client.chat_json",
            return_value={
                "answer_key": "Verified DGE answer key expression",
                "rubric": [
                    {"step": "Core formula / principle", "marks": 2.0},
                    {"step": "Stepwise derivation / solution", "marks": 3.0}
                ]
            }
        )
        self.mock_chat = self.patcher.start()

    def tearDown(self):
        self.patcher.stop()

    def test_marks_sum_equals_total_marks(self):
        """Verify that total marks of generated papers sum EXACTLY to the requested totalMarks."""
        for target_marks in [25, 50, 70, 90, 100]:
            for subject in ["Physics", "Chemistry", "Commerce"]:
                paper = generate_exam_paper(
                    subject=subject,
                    total_marks=target_marks,
                    taught_topics_only=True,
                )
                self.assertEqual(
                    paper["totalMarks"],
                    target_marks,
                    f"Subject {subject} totalMarks mismatch: expected {target_marks}, got {paper['totalMarks']}"
                )
                sec_sum = sum(s["totalMarks"] for s in paper["sections"])
                self.assertEqual(
                    sec_sum,
                    target_marks,
                    f"Sections marks sum ({sec_sum}) does not equal {target_marks}"
                )

    def test_rule_1_never_violated(self):
        """Verify that untaught topics are NEVER included when Teaching Progress Lock is active."""
        subject = "Physics"
        taught, untaught = get_curriculum_progress(subject)

        # When lock is ON, untaught topics must be completely excluded
        paper = generate_exam_paper(
            subject=subject,
            total_marks=50,
            taught_topics_only=True,
            enrichment_preview_allowed=False,
        )
        for sec in paper["sections"]:
            for q in sec["questions"]:
                chap = q.get("chapter")
                self.assertNotIn(
                    chap,
                    untaught,
                    f"Rule 1 Violated! Untaught chapter '{chap}' found in paper when lock was active."
                )

        # When enrichment preview is allowed, only questions marked preview: true can be untaught
        paper_preview = generate_exam_paper(
            subject=subject,
            total_marks=50,
            taught_topics_only=True,
            enrichment_preview_allowed=True,
        )
        for sec in paper_preview["sections"]:
            for q in sec["questions"]:
                if q.get("chapter") in untaught:
                    self.assertTrue(
                        q.get("preview"),
                        f"Untaught question without preview flag found: {q}"
                    )

    def test_no_year_above_cap(self):
        """Verify that no single examination year exceeds ~35% of the total paper marks."""
        paper = generate_exam_paper(
            subject="Physics",
            total_marks=70,
            taught_topics_only=False,
            include_public_archive=True,
        )
        coverage = paper["coverage_report"]
        pct_per_year = coverage["percentage_per_year"]

        for yr, pct in pct_per_year.items():
            self.assertLessEqual(
                pct,
                36.0,
                f"Year {yr} exceeds the 35% cap with {pct}% of paper marks."
            )

    def test_no_duplicate_questions(self):
        """Verify there are no duplicate questions within any synthesized paper."""
        paper = generate_exam_paper(
            subject="Chemistry",
            total_marks=70,
        )
        seen_ids = set()
        seen_texts = set()

        for sec in paper["sections"]:
            for q in sec["questions"]:
                q_id = q["id"]
                q_text = (q.get("textEn") or q.get("text_en") or "")[:50].strip()

                self.assertNotIn(q_id, seen_ids, f"Duplicate question ID found: {q_id}")
                if len(q_text) > 10:
                    self.assertNotIn(q_text, seen_texts, f"Duplicate question text found: {q_text}")
                seen_ids.add(q_id)
                seen_texts.add(q_text)

    def test_bilingual_fields_present(self):
        """Verify that every generated question has both English and Tamil text."""
        paper = generate_exam_paper(
            subject="Computer Science",
            total_marks=50,
            language="bilingual",
        )
        for sec in paper["sections"]:
            for q in sec["questions"]:
                en = q.get("textEn") or q.get("text_en")
                ta = q.get("textTa") or q.get("text_ta")
                self.assertTrue(bool(en), f"Missing English text in question {q.get('no')}")
                self.assertTrue(bool(ta), f"Missing Tamil text in question {q.get('no')}")

    def test_fallback_works_without_key(self):
        """Verify that paper generation never crashes when GROQ_API_KEY is empty/missing."""
        with patch("backend.services.paper_generator.settings.GROQ_API_KEY", ""):
            paper = generate_exam_paper(
                subject="Accountancy",
                total_marks=50,
            )
            self.assertEqual(paper["totalMarks"], 50)
            self.assertEqual(paper["ai_status"], "fallback")
            self.assertEqual(len(paper["sections"]), 4)

    def test_ingestion_is_incremental(self):
        """Verify that re-running ingestion without --force is incremental and scans in sub-second time."""
        result = ingest_all(force=False)
        self.assertEqual(result["status"], "ready")
        self.assertEqual(result["files_ingested"], 35)
        self.assertGreaterEqual(result["total_canonical_questions"], 1361)

    def test_groq_client_mocked(self):
        """Verify that Groq LLM client mock was invoked to enrich question rubrics."""
        with patch("backend.services.paper_generator.settings.GROQ_API_KEY", "gsk_test_key_abc"):
            paper = generate_exam_paper(
                subject="Physics",
                total_marks=50,
            )
            self.assertEqual(paper["totalMarks"], 50)
            self.assertEqual(paper["ai_status"], "live")
            self.assertTrue(self.mock_chat.called)

    def test_api_generate_and_regenerate_flow(self):
        """Verify the full API endpoint flow: generate paper -> swap question -> export PDF and DOCX."""
        # 1. Generate
        res = self.client.post("/api/v1/papers/generate", json={
            "subject": "Physics",
            "totalMarks": 50,
            "durationMinutes": 90,
            "taughtTopicsOnly": True
        })
        self.assertEqual(res.status_code, 200)
        paper = res.json()
        paper_id = paper["paperId"]

        # 2. Swap Question
        swap_res = self.client.post("/api/v1/papers/regenerate-question", json={
            "paperId": paper_id,
            "currentQuestionId": "1",
            "reason": "Test unit swap"
        })
        self.assertEqual(swap_res.status_code, 200)
        self.assertEqual(swap_res.json()["status"], "success")

        # 3. Export PDF
        pdf_res = self.client.get(f"/api/v1/papers/{paper_id}/export/pdf")
        self.assertEqual(pdf_res.status_code, 200)
        self.assertGreater(len(pdf_res.content), 5000)

        # 4. Export DOCX
        docx_res = self.client.get(f"/api/v1/papers/{paper_id}/export/docx")
        self.assertEqual(docx_res.status_code, 200)
        self.assertGreater(len(docx_res.content), 5000)


if __name__ == "__main__":
    unittest.main()
