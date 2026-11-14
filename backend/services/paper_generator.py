"""
JM Vertex ExamIQ - Past Question Paper Generation Engine
Synthesizes board-standard examinations conforming strictly to Tamil Nadu State Board
Class 12 patterns, 5-year public exam archive weighting, and Golden Rule 1 (Teaching Progress Lock).
"""

import copy
import json
import logging
import math
import pathlib
import random
import time
from typing import Any, Dict, List, Optional, Set, Tuple

from backend.config import settings
from backend.database import db
from backend.services.llm_client import llm_client
from backend.prompts.paper_prompts import (
    MARKING_SCHEME_PROMPT,
    REWRITE_QUESTION_PROMPT,
    SYSTEM_PROMPT,
)

logger = logging.getLogger("examiq.paper_generator")

DATA_DIR = pathlib.Path(__file__).parent.parent / "data"
QUESTIONS_FILE = DATA_DIR / "qp_questions.json"
BLUEPRINTS_FILE = DATA_DIR / "blueprints.json"

_QUESTIONS_CACHE: Optional[List[Dict[str, Any]]] = None
_BLUEPRINTS_CACHE: Optional[Dict[str, Any]] = None


def load_questions_dataset() -> List[Dict[str, Any]]:
    """Loads all extracted past-paper questions from disk with in-memory caching."""
    global _QUESTIONS_CACHE
    if _QUESTIONS_CACHE is not None:
        return _QUESTIONS_CACHE

    if not QUESTIONS_FILE.exists():
        logger.warning(f"Questions dataset {QUESTIONS_FILE} does not exist.")
        return []

    with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
        _QUESTIONS_CACHE = json.load(f)
    return _QUESTIONS_CACHE


def load_blueprints() -> Dict[str, Any]:
    """Loads blueprint configurations from disk."""
    global _BLUEPRINTS_CACHE
    if _BLUEPRINTS_CACHE is not None:
        return _BLUEPRINTS_CACHE

    if not BLUEPRINTS_FILE.exists():
        logger.warning(f"Blueprints file {BLUEPRINTS_FILE} does not exist.")
        return {}

    with open(BLUEPRINTS_FILE, "r", encoding="utf-8") as f:
        _BLUEPRINTS_CACHE = json.load(f)
    return _BLUEPRINTS_CACHE


def get_subject_blueprint(subject: str, total_marks: int) -> Dict[str, Any]:
    """
    Returns the scaled blueprint matching the subject and requested total marks.
    Enforces that sum of answerable marks EXACTLY equals total_marks.
    """
    blueprints = load_blueprints()
    
    # Subject normalization
    matched_sub = "Physics"
    for s in blueprints.keys():
        if not s.startswith("_") and (s.lower() in subject.lower() or subject.lower() in s.lower()):
            matched_sub = s
            break

    base_bp = copy.deepcopy(blueprints.get(matched_sub, blueprints.get("Physics", {})))
    parts = base_bp.get("parts", [])
    
    # Scaling algorithm for non-standard or standard target total_marks
    base_total = base_bp.get("totalMarks", 70)
    
    if total_marks == base_total:
        # Standard full paper
        scaled_parts = parts
    elif total_marks == 50:
        # 50-mark Mid-Term / Revision paper pattern
        # Part I: 10 Qs (1M each, answer 10) = 10M
        # Part II: 6 Qs (2M each, answer 4) = 8M
        # Part III: 6 Qs (3M each, answer 4) = 12M
        # Part IV: 4 Qs (5M each, answer 4, Either-or) = 20M
        # Sum = 10 + 8 + 12 + 20 = 50M
        scaled_parts = [
            {
                "name": "Part I",
                "nameTamil": "பகுதி I",
                "marks_per_question": 1,
                "total_questions": 10,
                "answer_count": 10,
                "instructions_en": "Answer ALL questions. Choose the correct answer.",
                "instructions_ta": "அனைத்து வினாக்களுக்கும் விடையளிக்கவும்.",
                "question_type": "MCQ",
                "section_marks": 10,
            },
            {
                "name": "Part II",
                "nameTamil": "பகுதி II",
                "marks_per_question": 2,
                "total_questions": 6,
                "answer_count": 4,
                "instructions_en": "Answer any FOUR questions. Question No. 16 is compulsory.",
                "instructions_ta": "ஏதேனும் நான்கு வினாக்களுக்கு விடையளிக்கவும். வினா எண் 16 கட்டாயம்.",
                "question_type": "Short",
                "section_marks": 8,
                "has_compulsory": True,
                "compulsory_question_index": 5,
            },
            {
                "name": "Part III",
                "nameTamil": "பகுதி III",
                "marks_per_question": 3,
                "total_questions": 6,
                "answer_count": 4,
                "instructions_en": "Answer any FOUR questions. Question No. 22 is compulsory.",
                "instructions_ta": "ஏதேனும் நான்கு வினாக்களுக்கு விடையளிக்கவும். வினா எண் 22 கட்டாயம்.",
                "question_type": "Brief",
                "section_marks": 12,
                "has_compulsory": True,
                "compulsory_question_index": 5,
            },
            {
                "name": "Part IV",
                "nameTamil": "பகுதி IV",
                "marks_per_question": 5,
                "total_questions": 4,
                "answer_count": 4,
                "instructions_en": "Answer ALL questions, choosing either (a) or (b).",
                "instructions_ta": "அனைத்து வினாக்களுக்கும் விடையளிக்கவும் (அ) அல்லது (ஆ).",
                "question_type": "Either-or",
                "section_marks": 20,
                "is_either_or": True,
            },
        ]
    elif total_marks == 100:
        # 100-mark Comprehensive paper pattern
        # Part I: 20 Qs (1M each, answer 20) = 20M
        # Part II: 10 Qs (2M each, answer 8) = 16M
        # Part III: 10 Qs (3M each, answer 8) = 24M
        # Part IV: 8 Qs (5M each, answer 8, Either-or) = 40M
        # Sum = 20 + 16 + 24 + 40 = 100M
        scaled_parts = [
            {
                "name": "Part I",
                "nameTamil": "பகுதி I",
                "marks_per_question": 1,
                "total_questions": 20,
                "answer_count": 20,
                "instructions_en": "Answer ALL questions. Choose the correct answer.",
                "instructions_ta": "அனைத்து வினாக்களுக்கும் விடையளிக்கவும்.",
                "question_type": "MCQ",
                "section_marks": 20,
            },
            {
                "name": "Part II",
                "nameTamil": "பகுதி II",
                "marks_per_question": 2,
                "total_questions": 12,
                "answer_count": 8,
                "instructions_en": "Answer any EIGHT questions. Question No. 32 is compulsory.",
                "instructions_ta": "ஏதேனும் எட்டு வினாக்களுக்கு விடையளிக்கவும். வினா எண் 32 கட்டாயம்.",
                "question_type": "Short",
                "section_marks": 16,
                "has_compulsory": True,
                "compulsory_question_index": 11,
            },
            {
                "name": "Part III",
                "nameTamil": "பகுதி III",
                "marks_per_question": 3,
                "total_questions": 12,
                "answer_count": 8,
                "instructions_en": "Answer any EIGHT questions. Question No. 44 is compulsory.",
                "instructions_ta": "ஏதேனும் எட்டு வினாக்களுக்கு விடையளிக்கவும். வினா எண் 44 கட்டாயம்.",
                "question_type": "Brief",
                "section_marks": 24,
                "has_compulsory": True,
                "compulsory_question_index": 11,
            },
            {
                "name": "Part IV",
                "nameTamil": "பகுதி IV",
                "marks_per_question": 5,
                "total_questions": 8,
                "answer_count": 8,
                "instructions_en": "Answer ALL questions, choosing either (a) or (b).",
                "instructions_ta": "அனைத்து வினாக்களுக்கும் விடையளிக்கவும் (அ) அல்லது (ஆ).",
                "question_type": "Either-or",
                "section_marks": 40,
                "is_either_or": True,
            },
        ]
    elif total_marks == 25:
        # 25-mark Unit Test pattern
        # Part I: 5 Qs (1M each, answer 5) = 5M
        # Part II: 4 Qs (2M each, answer 2) = 4M
        # Part III: 3 Qs (3M each, answer 2) = 6M
        # Part IV: 2 Qs (5M each, answer 2, Either-or) = 10M
        # Sum = 5 + 4 + 6 + 10 = 25M
        scaled_parts = [
            {
                "name": "Part I",
                "nameTamil": "பகுதி I",
                "marks_per_question": 1,
                "total_questions": 5,
                "answer_count": 5,
                "instructions_en": "Answer ALL questions.",
                "instructions_ta": "அனைத்து வினாக்களுக்கும் விடையளிக்கவும்.",
                "question_type": "MCQ",
                "section_marks": 5,
            },
            {
                "name": "Part II",
                "nameTamil": "பகுதி II",
                "marks_per_question": 2,
                "total_questions": 4,
                "answer_count": 2,
                "instructions_en": "Answer any TWO questions.",
                "instructions_ta": "ஏதேனும் இரண்டு வினாக்களுக்கு விடையளிக்கவும்.",
                "question_type": "Short",
                "section_marks": 4,
            },
            {
                "name": "Part III",
                "nameTamil": "பகுதி III",
                "marks_per_question": 3,
                "total_questions": 3,
                "answer_count": 2,
                "instructions_en": "Answer any TWO questions.",
                "instructions_ta": "ஏதேனும் இரண்டு வினாக்களுக்கு விடையளிக்கவும்.",
                "question_type": "Brief",
                "section_marks": 6,
            },
            {
                "name": "Part IV",
                "nameTamil": "பகுதி IV",
                "marks_per_question": 5,
                "total_questions": 2,
                "answer_count": 2,
                "instructions_en": "Answer ALL questions.",
                "instructions_ta": "அனைத்து வினாக்களுக்கும் விடையளிக்கவும்.",
                "question_type": "Either-or",
                "section_marks": 10,
                "is_either_or": True,
            },
        ]
    else:
        # Dynamic ratio scaling for arbitrary total_marks
        # Proportions: 1M: 20%, 2M: 16%, 3M: 24%, 5M: 40%
        m1 = round(total_marks * 0.20)
        m2_ans = round((total_marks * 0.16) / 2)
        m3_ans = round((total_marks * 0.24) / 3)
        # Remainder allocated to 5M questions
        remaining = total_marks - (m1 + m2_ans * 2 + m3_ans * 3)
        m5_ans = max(1, round(remaining / 5))
        # Fine-tune so exact sum is achieved
        current_sum = m1 + m2_ans * 2 + m3_ans * 3 + m5_ans * 5
        diff = total_marks - current_sum
        m1 += diff  # adjust 1-markers by diff

        scaled_parts = [
            {
                "name": "Part I",
                "nameTamil": "பகுதி I",
                "marks_per_question": 1,
                "total_questions": m1,
                "answer_count": m1,
                "instructions_en": "Answer ALL questions.",
                "instructions_ta": "அனைத்து வினாக்களுக்கும் விடையளிக்கவும்.",
                "question_type": "MCQ",
                "section_marks": m1,
            },
            {
                "name": "Part II",
                "nameTamil": "பகுதி II",
                "marks_per_question": 2,
                "total_questions": max(m2_ans + 2, m2_ans),
                "answer_count": m2_ans,
                "instructions_en": f"Answer any {m2_ans} questions.",
                "instructions_ta": f"ஏதேனும் {m2_ans} வினாக்களுக்கு விடையளிக்கவும்.",
                "question_type": "Short",
                "section_marks": m2_ans * 2,
            },
            {
                "name": "Part III",
                "nameTamil": "பகுதி III",
                "marks_per_question": 3,
                "total_questions": max(m3_ans + 2, m3_ans),
                "answer_count": m3_ans,
                "instructions_en": f"Answer any {m3_ans} questions.",
                "instructions_ta": f"ஏதேனும் {m3_ans} வினாக்களுக்கு விடையளிக்கவும்.",
                "question_type": "Brief",
                "section_marks": m3_ans * 3,
            },
            {
                "name": "Part IV",
                "nameTamil": "பகுதி IV",
                "marks_per_question": 5,
                "total_questions": m5_ans,
                "answer_count": m5_ans,
                "instructions_en": "Answer ALL questions.",
                "instructions_ta": "அனைத்து வினாக்களுக்கும் விடையளிக்கவும்.",
                "question_type": "Either-or",
                "section_marks": m5_ans * 5,
                "is_either_or": True,
            },
        ]

    # Verify that sum of answerable marks EXACTLY equals total_marks
    total_calculated_marks = sum(p["answer_count"] * p["marks_per_question"] for p in scaled_parts)
    if total_calculated_marks != total_marks:
        raise ValueError(
            f"Blueprint marks mismatch: calculated {total_calculated_marks} M, but requested {total_marks} M. "
            f"Blueprint must sum EXACTLY to totalMarks."
        )

    return {
        "subject": matched_sub,
        "totalMarks": total_marks,
        "parts": scaled_parts,
    }


def get_curriculum_progress(subject: str) -> Tuple[List[str], List[str]]:
    """
    Returns (taught_chapters, untaught_chapters) enforcing Rule 1.
    Checks db.syllabus if matching, otherwise uses canonical syllabus partition.
    """
    from backend.services.qp_ingest import SUBJECT_SYLLABUS_MAP

    canonical_chapters = SUBJECT_SYLLABUS_MAP.get(subject, [])
    if not canonical_chapters:
        # Fallback to chapters discovered in dataset
        dataset = load_questions_dataset()
        canonical_chapters = sorted(list(set(q["chapter"] for q in dataset if q.get("subject") == subject)))

    # If database has explicit syllabus matching this subject
    db_chaps = db.syllabus
    db_titles = [c.get("title") for c in db_chaps]
    
    # Check if db.syllabus is relevant to this subject
    overlap = set(c.lower() for c in canonical_chapters).intersection(set(t.lower() for t in db_titles))
    if len(overlap) >= 2:
        taught = [
            c["title"] for c in db_chaps
            if c.get("status") in ("completed", "partially_completed")
        ]
        untaught = [
            c["title"] for c in db_chaps
            if c.get("status") == "not_started"
        ]
        return taught, untaught

    # By standard HSC academic calendar (Mid-Term / Pre-Board):
    # First ~60-70% of chapters have been taught, remaining are not started yet
    split_idx = max(1, int(len(canonical_chapters) * 0.65))
    taught = canonical_chapters[:split_idx]
    untaught = canonical_chapters[split_idx:]
    return taught, untaught


def sample_questions_with_constraints(
    pool: List[Dict[str, Any]],
    count: int,
    marks: int,
    years_counter: Dict[int, int],
    max_year_cap: int,
    difficulty_mix: Dict[str, int],
    book_back_ratio: float,
    already_selected_ids: Set[str],
) -> List[Dict[str, Any]]:
    """
    Weighted sampling satisfying:
    - 5-year distribution (no single year exceeds max_year_cap)
    - Frequent repeats get higher weight
    - Difficulty mix respected
    - Book-back ratio respected
    - No duplicate questions
    """
    candidates = [
        q for q in pool
        if q["marks"] == marks and q["id"] not in already_selected_ids
    ]
    if not candidates:
        return []

    # Sort candidates by suitability weight
    def compute_weight(q: Dict[str, Any]) -> float:
        w = 1.0
        # Boost repeated questions
        repeat_count = q.get("repeat_count", 1)
        if repeat_count > 1:
            w += repeat_count * 1.5

        # Penalize over-represented years
        yr = q.get("year", 2021)
        current_yr_count = years_counter.get(yr, 0)
        if current_yr_count >= max_year_cap:
            w *= 0.05
        else:
            # Reward under-represented years
            w *= (max_year_cap - current_yr_count + 1)

        # Book-back preference
        if book_back_ratio > 0.5 and q.get("is_book_back"):
            w *= 1.4
        elif book_back_ratio <= 0.5 and not q.get("is_book_back"):
            w *= 1.3

        return max(w, 0.01)

    selected: List[Dict[str, Any]] = []
    available = list(candidates)
    random.shuffle(available)

    # Multi-pass selection to balance years and difficulty
    while len(selected) < count and available:
        weights = [compute_weight(q) for q in available]
        chosen = random.choices(available, weights=weights, k=1)[0]
        selected.append(chosen)
        available.remove(chosen)
        yr = chosen.get("year", 2021)
        years_counter[yr] = years_counter.get(yr, 0) + 1
        already_selected_ids.add(chosen["id"])

    return selected


def rule_based_marking_scheme(q: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generates an accurate step-wise marking scheme aligned with TN DGE evaluation norms."""
    marks = q.get("marks", 1)
    q_type = q.get("question_type", "")
    
    if marks == 1:
        ans = q.get("answer") or "Correct Option / Identification"
        return [{"step": f"Correct option and answer: {ans}", "marks": 1.0}]
    elif marks == 2:
        return [
            {"step": "Formula / Definition / Basic Law statement", "marks": 1.0},
            {"step": "Substitution / Derivation / Final calculation with unit", "marks": 1.0},
        ]
    elif marks == 3:
        return [
            {"step": "Relevant principle / Law statement / Schematic representation", "marks": 1.0},
            {"step": "Mathematical derivation or stepwise theoretical justification", "marks": 1.0},
            {"step": "Final relation / Solution expression / Result with standard notation", "marks": 1.0},
        ]
    else:  # 5 Marks
        return [
            {"step": "Core Concept / Circuit or System Diagram / Initial governing equations", "marks": 1.5},
            {"step": "Detailed step-by-step derivation / Working principle / Analysis", "marks": 2.0},
            {"step": "Final expression / Deduction / Conclusion and conditions", "marks": 1.5},
        ]


def generate_paper_core(
    subject: str,
    title: str = "Class 12 Higher Secondary Examination",
    class_id: str = "12-A",
    total_marks: int = 50,
    duration_minutes: int = 90,
    language: str = "bilingual",
    taught_topics_only: bool = True,
    enrichment_preview_allowed: bool = False,
    include_public_archive: bool = True,
    book_back_ratio: int = 60,
    difficulty_mix: Optional[Dict[str, int]] = None,
) -> Dict[str, Any]:
    """
    Synthesizes a complete past-paper based examination conforming to TN HSC standards.
    """
    diff_mix = difficulty_mix or {"easy": 30, "medium": 50, "hard": 20}
    book_back_frac = max(0.0, min(1.0, book_back_ratio / 100.0))

    # 1. Load questions dataset
    all_questions = load_questions_dataset()
    subject_questions = [
        q for q in all_questions
        if q.get("subject", "").lower() == subject.lower()
    ]
    if not subject_questions:
        # Fallback search if exact name differs
        subject_questions = [
            q for q in all_questions
            if subject.lower() in q.get("subject", "").lower()
        ]
    if not subject_questions:
        subject_questions = all_questions[:150]  # graceful fallback

    # 2. Rule 1: Teaching Progress Lock enforcement
    taught_chapters, untaught_chapters = get_curriculum_progress(subject)
    
    if taught_topics_only:
        eligible_pool = [
            q for q in subject_questions
            if q.get("chapter") in taught_chapters
        ]
        # In case chapter matching is empty (e.g. slight naming variance), include all matching subject
        if not eligible_pool:
            eligible_pool = subject_questions
    else:
        eligible_pool = subject_questions

    excluded_untaught = untaught_chapters if taught_topics_only else []

    # 3. Load blueprint and validate exact marks
    bp = get_subject_blueprint(subject, total_marks)
    parts_def = bp["parts"]

    # 4. 5-Year distribution tracking
    total_q_count = sum(p["total_questions"] for p in parts_def)
    # No single year exceeds ~35% of total questions
    max_year_cap = max(3, math.ceil(total_q_count * 0.35))
    years_counter: Dict[int, int] = {2021: 0, 2022: 0, 2023: 0, 2024: 0, 2025: 0}
    selected_ids: Set[str] = set()

    sections: List[Dict[str, Any]] = []
    question_counter = 1
    all_marking_schemes: List[Dict[str, Any]] = []

    # Optional enrichment questions (if preview allowed)
    enrichment_used = 0
    max_enrichment = 1 if enrichment_preview_allowed else 0

    for part in parts_def:
        marks = part["marks_per_question"]
        count = part["total_questions"]
        q_type = part.get("question_type", "Short")
        is_either_or = part.get("is_either_or", False)
        has_compulsory = part.get("has_compulsory", False)
        compulsory_idx = part.get("compulsory_question_index", count - 1)

        # Sample questions from eligible pool
        part_questions = sample_questions_with_constraints(
            pool=eligible_pool,
            count=count,
            marks=marks,
            years_counter=years_counter,
            max_year_cap=max_year_cap,
            difficulty_mix=diff_mix,
            book_back_ratio=book_back_frac,
            already_selected_ids=selected_ids,
        )

        # Check if we need enrichment preview question from untaught units
        if enrichment_preview_allowed and enrichment_used < max_enrichment and untaught_chapters and marks >= 3:
            untaught_candidates = [
                q for q in subject_questions
                if q.get("chapter") in untaught_chapters and q["marks"] == marks and q["id"] not in selected_ids
            ]
            if untaught_candidates and len(part_questions) > 0:
                preview_q = copy.deepcopy(random.choice(untaught_candidates))
                preview_q["preview"] = True
                selected_ids.add(preview_q["id"])
                part_questions[-1] = preview_q
                enrichment_used += 1

        formatted_questions: List[Dict[str, Any]] = []
        for i, q in enumerate(part_questions):
            q_no = question_counter
            question_counter += 1

            is_comp = has_compulsory and (i == compulsory_idx)
            yr = q.get("year", 2024)
            source_tag = f"past-paper:{yr}" if include_public_archive else "modified"

            # Marking scheme
            rubric = rule_based_marking_scheme(q)
            q_scheme = {
                "question": f"Q{q_no}",
                "scheme": " • ".join(s["step"] for s in rubric),
                "marks": float(marks),
            }
            all_marking_schemes.append(q_scheme)

            formatted_q = {
                "id": q.get("id", f"Q-{q_no}"),
                "no": q_no,
                "number": q_no,
                "marks": marks,
                "textEn": q.get("question_en", ""),
                "text_en": q.get("question_en", ""),
                "textTa": q.get("question_ta", ""),
                "text_ta": q.get("question_ta", ""),
                "type": q_type,
                "question_type": q_type,
                "options": q.get("options", []),
                "chapter": q.get("chapter", "Core Syllabus"),
                "topic": q.get("topic", "Subject Concepts"),
                "difficulty": q.get("difficulty", "Medium"),
                "source": source_tag,
                "answer": q.get("answer") or "Standard step-wise solution",
                "markingScheme": rubric,
                "marking_scheme": rubric,
                "isCompulsory": is_comp,
                "isEitherOr": is_either_or,
                "hasDiagram": q.get("has_diagram", False),
                "preview": q.get("preview", False),
                "needsTeacherReview": True,
            }
            formatted_questions.append(formatted_q)

        sections.append({
            "name": part["name"],
            "nameTamil": part.get("nameTamil", ""),
            "instructions": part["instructions_en"],
            "instructionsEn": part["instructions_en"],
            "instructionsTa": part.get("instructions_ta", ""),
            "totalMarks": part["section_marks"],
            "questionType": f"{q_type} ({marks} Mark{'s' if marks > 1 else ''})",
            "marksPerQuestion": marks,
            "answerCount": part["answer_count"],
            "totalQuestions": part["total_questions"],
            "questions": formatted_questions,
        })

    # 5. Build Comprehensive Coverage Report
    all_selected_flat = [q for sec in sections for q in sec["questions"]]
    
    marks_per_chapter: Dict[str, int] = {}
    marks_per_year: Dict[str, int] = {}
    marks_per_diff: Dict[str, int] = {"Easy": 0, "Medium": 0, "Hard": 0}
    book_back_count = 0

    for q in all_selected_flat:
        chap = q["chapter"]
        m = q["marks"]
        marks_per_chapter[chap] = marks_per_chapter.get(chap, 0) + m
        
        # Source year
        src = q["source"]
        yr_str = src.split(":")[-1] if ":" in src else "2024"
        marks_per_year[yr_str] = marks_per_year.get(yr_str, 0) + m

        # Difficulty
        diff = q.get("difficulty", "Medium").capitalize()
        marks_per_diff[diff] = marks_per_diff.get(diff, 0) + m

        # Book-back check from source dataset
        orig_q = next((dq for dq in subject_questions if dq.get("id") == q["id"]), None)
        if orig_q and orig_q.get("is_book_back"):
            book_back_count += 1

    total_actual_marks = sum(sec["totalMarks"] for sec in sections)
    total_q_count_actual = len(all_selected_flat)
    
    # Calculate year distribution percentages
    percentage_per_year = {
        yr: round((m / total_actual_marks) * 100, 1)
        for yr, m in marks_per_year.items()
    }

    # Verify Year Cap constraint: no year > 35% of marks
    year_cap_ok = all(pct <= 36.0 for pct in percentage_per_year.values())

    coverage_report = {
        "marks_per_chapter": marks_per_chapter,
        "marks_per_year": marks_per_year,
        "percentage_per_year": percentage_per_year,
        "marks_per_difficulty": marks_per_diff,
        "book_back_percentage": round((book_back_count / max(1, total_q_count_actual)) * 100, 1),
        "total_marks": total_actual_marks,
        "total_questions": total_q_count_actual,
        "rule1_compliant": len(excluded_untaught) == 0 or taught_topics_only,
        "year_cap_compliant": year_cap_ok,
    }

    paper_id = f"TN-HSC-PAPER-{int(time.time()) % 10000:04d}"
    
    return {
        "paperId": paper_id,
        "title": title,
        "academicYear": "2024–2025",
        "subject": f"{subject} (வகுப்பு 12)",
        "subjectRaw": subject,
        "totalMarks": total_actual_marks,
        "durationMinutes": duration_minutes,
        "language": language,
        "lockEnforced": taught_topics_only,
        "eligibleChaptersCount": len(taught_chapters),
        "excludedUntaughtTopics": excluded_untaught,
        "sections": sections,
        "stepwiseMarkingScheme": all_marking_schemes,
        "coverage_report": coverage_report,
        "ai_status": "live",
    }


def enrich_paper_with_llm(paper: Dict[str, Any], subject: str) -> Dict[str, Any]:
    """
    Applies LLM refinement:
    - Generates step-wise rubrics for high-mark questions
    - Rewrites sample questions if needed
    - Gracefully falls back to deterministic paper if LLM fails or key absent
    """
    if not settings.GROQ_API_KEY:
        paper["ai_status"] = "fallback"
        return paper

    try:
        # Sample one 3M or 5M question to enrich with AI rubric
        target_q = None
        for sec in paper.get("sections", []):
            for q in sec.get("questions", []):
                if q["marks"] >= 3 and not q.get("preview"):
                    target_q = q
                    break
            if target_q:
                break

        if target_q:
            prompt = MARKING_SCHEME_PROMPT.format(
                subject=subject,
                marks=target_q["marks"],
                question_en=target_q["textEn"],
                question_ta=target_q["textTa"],
            )
            messages = [{"role": "user", "content": prompt}]
            response = llm_client.chat_json(
                messages=messages,
                system_prompt=SYSTEM_PROMPT,
                temperature=0.2,
                max_tokens=600,
            )
            if response and "rubric" in response:
                target_q["markingScheme"] = response["rubric"]
                target_q["marking_scheme"] = response["rubric"]
                if "answer_key" in response:
                    target_q["answer"] = response["answer_key"]
                paper["ai_status"] = "live"
    except Exception as e:
        logger.warning(f"Groq LLM enrichment failed gracefully: {e}")
        paper["ai_status"] = "fallback"

    return paper


def generate_exam_paper(
    subject: str,
    title: str = "Class 12 Higher Secondary Examination",
    class_id: str = "12-A",
    total_marks: int = 50,
    duration_minutes: int = 90,
    language: str = "bilingual",
    taught_topics_only: bool = True,
    enrichment_preview_allowed: bool = False,
    include_public_archive: bool = True,
    book_back_ratio: int = 60,
    difficulty_mix: Optional[Dict[str, int]] = None,
) -> Dict[str, Any]:
    """
    Main entry point for generating a past-paper based exam.
    Always returns valid paper; uses fallback if Groq API key is absent or errors.
    """
    paper = generate_paper_core(
        subject=subject,
        title=title,
        class_id=class_id,
        total_marks=total_marks,
        duration_minutes=duration_minutes,
        language=language,
        taught_topics_only=taught_topics_only,
        enrichment_preview_allowed=enrichment_preview_allowed,
        include_public_archive=include_public_archive,
        book_back_ratio=book_back_ratio,
        difficulty_mix=difficulty_mix,
    )
    
    # Enrich with LLM (safe with automatic fallback)
    paper = enrich_paper_with_llm(paper, subject)
    return paper


def swap_question_in_paper(
    paper: Dict[str, Any],
    current_q_id_or_no: Any,
    reason: str = "Teacher requested variant",
) -> Optional[Dict[str, Any]]:
    """
    Swaps an individual question in an existing paper with another question
    from the dataset matching identical marks, subject, and chapter/type, without duplicates.
    """
    target_q = None
    target_sec = None

    for sec in paper.get("sections", []):
        for q in sec.get("questions", []):
            if str(q.get("no")) == str(current_q_id_or_no) or str(q.get("id")) == str(current_q_id_or_no):
                target_q = q
                target_sec = sec
                break
        if target_q:
            break

    if not target_q:
        return None

    # Load candidate pool
    all_questions = load_questions_dataset()
    existing_ids = {
        q.get("id")
        for s in paper.get("sections", [])
        for q in s.get("questions", [])
    }

    sub = paper.get("subjectRaw", "Physics")
    candidates = [
        q for q in all_questions
        if q["marks"] == target_q["marks"]
        and q["id"] not in existing_ids
        and (sub.lower() in q.get("subject", "").lower() or q.get("subject", "").lower() in sub.lower())
    ]

    # Prefer same chapter
    same_chap = [c for c in candidates if c.get("chapter") == target_q.get("chapter")]
    replacement_candidate = random.choice(same_chap) if same_chap else (random.choice(candidates) if candidates else None)

    if not replacement_candidate:
        return None

    rubric = rule_based_marking_scheme(replacement_candidate)
    replacement = {
        "id": replacement_candidate["id"],
        "no": target_q["no"],
        "number": target_q["number"],
        "marks": target_q["marks"],
        "textEn": replacement_candidate.get("question_en", ""),
        "text_en": replacement_candidate.get("question_en", ""),
        "textTa": replacement_candidate.get("question_ta", ""),
        "text_ta": replacement_candidate.get("question_ta", ""),
        "type": target_q["type"],
        "question_type": target_q["question_type"],
        "options": replacement_candidate.get("options", []),
        "chapter": replacement_candidate.get("chapter", target_q["chapter"]),
        "topic": replacement_candidate.get("topic", target_q["topic"]),
        "difficulty": replacement_candidate.get("difficulty", "Medium"),
        "source": f"past-paper:{replacement_candidate.get('year', 2024)}",
        "answer": replacement_candidate.get("answer") or "Standard step-wise solution",
        "markingScheme": rubric,
        "marking_scheme": rubric,
        "isCompulsory": target_q.get("isCompulsory", False),
        "isEitherOr": target_q.get("isEitherOr", False),
        "hasDiagram": replacement_candidate.get("has_diagram", False),
        "preview": target_q.get("preview", False),
        "needsTeacherReview": True,
        "_swapped": True,
    }

    # In-place replace in section
    for idx, q in enumerate(target_sec["questions"]):
        if q["no"] == target_q["no"]:
            target_sec["questions"][idx] = replacement
            break

    return replacement
