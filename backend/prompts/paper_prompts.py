"""
ExamIQ - Tamil Nadu State Board Class 12 HSC Prompt Templates
Aligns strictly with DGE / SCERT Tamil Nadu Curriculum & Terminology.
"""

SYSTEM_PROMPT = """You are an expert Tamil Nadu State Board Higher Secondary (Class 12 / +2) Curriculum Specialist and Examination Evaluator.
All your responses must conform strictly to the SCERT Tamil Nadu Class 12 Syllabus, textbook conventions, and official Directorate of Government Examinations (DGE) blueprint patterns.
Return valid JSON only. Never invent facts. Preserve exact numerical values, formulas, and terminology."""

CLASSIFY_QUESTION_PROMPT = """Analyze the following Tamil Nadu Class 12 examination questions for Subject: {subject}.
Map each question to its syllabus chapter, topic, difficulty (Easy, Medium, Hard), and whether it is a textbook Book-Back question (true/false).
Valid Syllabus Chapters for {subject}:
{syllabus_context}

Questions to classify:
{questions_json}

Return a JSON object with a single key "classified" containing a list of objects with fields:
- "id": question id
- "chapter": official chapter name from the valid list above
- "topic": specific topic / concept tested
- "difficulty": "Easy" | "Medium" | "Hard"
- "is_book_back": boolean
"""

FILL_BILINGUAL_PROMPT = """You are given Tamil Nadu Class 12 examination questions where either the Tamil or English version is incomplete or needs validation.
Subject: {subject}

Questions:
{questions_json}

Ensure standard SCERT Tamil Nadu textbook terminology is used (e.g. அணிகள் for Matrices, வகை நுண்கணிதம் for Differential Calculus).
Return a JSON object with key "questions" containing a list of objects:
- "id": question id
- "question_en": pristine English question text
- "question_ta": accurate Tamil question text in proper Unicode (தமிழ்)
- "options_en": list of English options (if MCQ, else empty)
- "options_ta": list of Tamil options in proper Unicode (if MCQ, else empty)
"""

MARKING_SCHEME_PROMPT = """Generate an official DGE Tamil Nadu Class 12 step-wise marking scheme and rubric for this question:
Subject: {subject}
Marks: {marks}
Question (English): {question_en}
Question (Tamil): {question_ta}

Return a JSON object with:
- "answer_key": concise expected final answer / expression
- "rubric": list of objects each having:
    - "step": specific step description (formula, intermediate substitution, final step)
    - "marks": step mark allocation (sum must exactly equal {marks})
- "needs_teacher_review": true
"""

REWRITE_QUESTION_PROMPT = """Generate a fresh numerical or conceptual variation of this Tamil Nadu Class 12 question while keeping the same difficulty, marks ({marks}), chapter, and testing outcome:
Subject: {subject}
Original Question (EN): {question_en}
Original Question (TA): {question_ta}
Original Options: {options}

Return a JSON object with:
- "question_en": rewritten question in English
- "question_ta": rewritten question in Tamil Unicode
- "options": list of rewritten options (if MCQ)
- "answer": correct answer
- "marking_scheme": step-wise rubric for {marks} marks
"""

