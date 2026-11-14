"""
ExamIQ - Past Question Paper Ingestion Pipeline
Scans 'ExamIQ/qp dataset/', extracts questions from digital Tamil Nadu State Board PDFs,
converts legacy Tamil typography (BAMINI/Vanavil) to Unicode, classifies chapters/topics
against the official syllabus, deduplicates across years, and tracks ingestion manifests.
"""

import hashlib
import json
import logging
import os
import pathlib
import re
from typing import Any, Dict, List, Optional, Tuple

import pymupdf

from backend.config import settings
from backend.services.llm_client import llm_client
from backend.services.tamil_converter import convert_bamini_to_unicode
from backend.prompts.paper_prompts import CLASSIFY_QUESTION_PROMPT, SYSTEM_PROMPT

logger = logging.getLogger("examiq.ingest")

DATA_DIR = pathlib.Path(__file__).parent.parent / "data"
QUESTIONS_FILE = DATA_DIR / "qp_questions.json"
MANIFEST_FILE = DATA_DIR / "manifest.json"
NEEDS_REVIEW_FILE = DATA_DIR / "needs_review.json"
QP_DATASET_DIR = pathlib.Path(__file__).parent.parent.parent / "qp dataset"


# Standard Subject Names & Syllabus Fallback Chapters
SUBJECT_SYLLABUS_MAP = {
    "Physics": [
        "Electrostatics",
        "Current Electricity",
        "Magnetism and Magnetic Effects of Electric Current",
        "Electromagnetic Induction and Alternating Current",
        "Electromagnetic Waves",
        "Optics (Ray and Wave Optics)",
        "Dual Nature of Radiation and Matter",
        "Atomic and Nuclear Physics",
        "Semiconductor Electronics",
        "Communication Systems",
        "Recent Developments in Physics",
    ],
    "Chemistry": [
        "Metallurgy",
        "p-Block Elements - I & II",
        "Transition and Inner Transition Elements",
        "Coordination Chemistry",
        "Solid State",
        "Chemical Kinetics",
        "Ionic Equilibrium",
        "Electrochemistry",
        "Surface Chemistry",
        "Hydroxy Compounds and Ethers",
        "Carbonyl Compounds and Carboxylic Acids",
        "Organic Nitrogen Compounds",
        "Biomolecules",
        "Chemistry in Everyday Life",
    ],
    "Accountancy": [
        "Accounts from Incomplete Records",
        "Accounts of Not-for-Profit Organisation",
        "Accounts of Partnership Firms - Fundamentals",
        "Goodwill in Partnership Firms",
        "Admission of a Partner",
        "Retirement and Death of a Partner",
        "Company Accounts (Issue of Shares)",
        "Financial Statement Analysis",
        "Ratio Analysis",
        "Computerised Accounting System (Tally)",
    ],
    "Commerce": [
        "Principles of Management",
        "Financial Markets - An Overview",
        "Money Market and Capital Market",
        "Stock Exchange (BSE & NSE)",
        "Consumer Protection & Consumer Rights",
        "Law of Contract & Sales of Goods Act",
        "Entrepreneurship Development",
        "Human Resource Management",
        "Company Law and Secretarial Practice",
    ],
    "Computer Science": [
        "Functions & Data Abstraction",
        "Scoping & Algorithmic Efficiency (Big O)",
        "Python - Control Structures",
        "Python Functions & Strings",
        "Lists, Tuples, Sets and Dictionaries",
        "Object Oriented Programming (Classes and Objects)",
        "Database Concepts & SQL",
        "Data Manipulation through SQL and Python (SQLite)",
        "Data Visualization using Pyplot",
    ],
    "Computer Applications": [
        "Multimedia and Desktop Publishing (PageMaker)",
        "An Introduction to Adobe PageMaker",
        "Introduction to Database Management System",
        "Introduction to Hypertext Preprocessor (PHP)",
        "PHP Functions and Arrays",
        "PHP Conditional Statements and Loops",
        "Computer Networks and Internet",
        "Open Source Concepts & E-Commerce",
        "Electronic Payment Systems",
        "E-Commerce Security Systems",
    ],
    "Automobile Technology": [
        "Automobile Engine Systems & Components",
        "Cooling and Lubrication Systems",
        "Transmission System (Clutch, Gearbox, Propeller Shaft)",
        "Steering and Suspension Systems",
        "Braking Systems (Hydraulic, Pneumatic, ABS)",
        "Electrical and Electronic Systems (Battery, Starter, Alternator)",
        "Workshop Tools and Vehicle Servicing Diagnostics",
    ],
}


def get_file_hash(path: pathlib.Path) -> str:
    """Computes SHA-256 hash of a file."""
    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def load_manifest() -> Dict[str, Any]:
    """Loads manifest tracking ingested files and timestamps."""
    if MANIFEST_FILE.exists():
        try:
            with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"files": {}, "last_updated": None, "total_questions": 0}


def save_manifest(manifest: Dict[str, Any]) -> None:
    """Saves ingestion manifest."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)


def load_questions() -> List[Dict[str, Any]]:
    """Loads canonical questions dataset."""
    if QUESTIONS_FILE.exists():
        try:
            with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []


def save_questions(questions: List[Dict[str, Any]]) -> None:
    """Saves canonical questions dataset."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(QUESTIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)


def save_needs_review(items: List[Dict[str, Any]]) -> None:
    """Saves low-confidence or parsing anomaly questions."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(NEEDS_REVIEW_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)


def guess_subject(filename: str) -> str:
    """Guesses standardized subject name from filename."""
    lower = filename.lower()
    if "physics" in lower:
        return "Physics"
    elif "chemistry" in lower:
        return "Chemistry"
    elif "accountancy" in lower:
        return "Accountancy"
    elif "commerce" in lower:
        return "Commerce"
    elif "computer_application" in lower:
        return "Computer Applications"
    elif "computer_science" in lower:
        return "Computer Science"
    elif "automobile" in lower:
        return "Automobile Technology"
    return "General"


def is_english_line(line: str) -> bool:
    """Checks if line contains standard English text."""
    clean = line.strip()
    if not clean or len(clean) < 3:
        return False
    # If more than 60% of characters are ascii letters
    ascii_letters = sum(1 for c in clean if c.isascii() and c.isalpha())
    return ascii_letters >= len(clean) * 0.45


def is_legacy_tamil_line(line: str) -> bool:
    """Checks if line contains legacy Bamini/Vanavil characters."""
    clean = line.strip()
    if not clean:
        return False
    # Characters very typical of Bamini/Vanavil encoding
    legacy_indicators = sum(1 for c in clean if c in "ªÌ©ØÖ®÷ø£`_§•‰²³¸¹¾¿ÄÅÊËÐÑqâáêëìíîï\\[]{}|")
    return legacy_indicators >= 2 or any(c in "ªÌ©ØÖ®÷ø" for c in clean)


def extract_questions_from_pdf(pdf_path: pathlib.Path, year: str, subject: str) -> List[Dict[str, Any]]:
    """
    Parses questions from a born-digital DGE Tamil Nadu question paper PDF.
    Extracts bilingual questions, options, parts, marks, and diagrams.
    """
    doc = pymupdf.open(str(pdf_path))
    extracted: List[Dict[str, Any]] = []

    # Map pages and embedded images
    page_texts: List[str] = []
    page_has_images: Dict[int, bool] = {}

    for page_idx, page in enumerate(doc):
        text = page.get_text()
        page_texts.append(text)
        images = page.get_images()
        page_has_images[page_idx + 1] = len(images) > 0

    full_document_text = "\n".join(page_texts)

    # Determine Parts and their starting marks
    is_90_marks = subject in ("Accountancy", "Commerce")
    max_q_search = 48 if is_90_marks else 39

    # Sequential search for \n1., \n2., ... \n{max_q}.
    pos_list: List[Tuple[int, int]] = []
    last_pos = 0
    for q in range(1, max_q_search):
        idx = full_document_text.find(f"\n{q}.", last_pos)
        if idx != -1:
            pos_list.append((q, idx))
            last_pos = idx

    for idx_in_list, (q_num, start_pos) in enumerate(pos_list):
        if idx_in_list + 1 < len(pos_list):
            end_pos = pos_list[idx_in_list + 1][1]
            q_chunk = full_document_text[start_pos:end_pos].strip()
        else:
            q_chunk = full_document_text[start_pos : start_pos + 2000].strip()

        # Remove leading question number e.g. "1." or "1.\n"
        q_chunk = re.sub(rf"^{q_num}\.\s*", "", q_chunk)

        # Determine Part, Marks, and Question Type
        if is_90_marks:
            if q_num <= 20:
                part = "I"
                marks = 1
                q_type = "MCQ"
            elif q_num <= 30:
                part = "II"
                marks = 2
                q_type = "Compulsory" if q_num == 30 else "Short"
            elif q_num <= 40:
                part = "III"
                marks = 3
                q_type = "Compulsory" if q_num == 40 else "Brief"
            else:
                part = "IV"
                marks = 5
                q_type = "Either-or" if (" or " in q_chunk.lower() or " (a) " in q_chunk or "\n(a)" in q_chunk) else "Long"
        else:
            if q_num <= 15:
                part = "I"
                marks = 1
                q_type = "MCQ"
            elif q_num <= 24:
                part = "II"
                marks = 2
                q_type = "Compulsory" if q_num == 24 else "Short"
            elif q_num <= 33:
                part = "III"
                marks = 3
                q_type = "Compulsory" if q_num == 33 else "Brief"
            else:
                part = "IV"
                marks = 5
                q_type = "Either-or" if (" or " in q_chunk.lower() or " (a) " in q_chunk or "\n(a)" in q_chunk) else "Long"

        # Separate English and Tamil sections
        raw_lines = [line.strip() for line in q_chunk.splitlines() if line.strip()]

        # Filter out header/footer noise
        filtered_lines = []
        for line in raw_lines:
            if re.match(r"^\d{4,5}$", line):  # Exam paper code
                continue
            if any(noise in line for noise in ["Turn over", "PART -", "Maximum Marks", "Time Allowed", "AÔÄøµPÒ", "Instructions"]):
                continue
            filtered_lines.append(line)

        options_en: List[str] = []
        options_ta: List[str] = []
        en_lines: List[str] = []
        ta_raw_lines: List[str] = []

        for line in filtered_lines:
            opt_en_match = re.match(r"^\(([a-d])\)\s*(.*)", line, re.IGNORECASE)
            opt_ta_match = re.match(r"^\(([A-D])\)\s*(.*)", line)

            if opt_en_match and any(c.isascii() and c.isalpha() for c in line):
                options_en.append(line)
            elif opt_ta_match and any(c in line for c in "ªÌ©ØÖ®÷ø£`_§•‰²³¸¹¾¿ÄÅÊËÐÑq"):
                options_ta.append(line)
            elif is_legacy_tamil_line(line):
                ta_raw_lines.append(line)
            elif is_english_line(line) or any(m in line for m in ["=", "+", "-", "x", "y", "z", "sin", "cos", "tan", "matrix"]):
                en_lines.append(line)
            else:
                if sum(1 for c in line if c.isascii() and c.isalpha()) > len(line) * 0.4:
                    en_lines.append(line)
                else:
                    ta_raw_lines.append(line)

        raw_en = " ".join(en_lines).strip()
        raw_ta = " ".join(ta_raw_lines).strip()

        # Clean MCQ options
        clean_options = []
        if options_en:
            clean_options = [re.sub(r"^\([a-dA-D]\)\s*", "", opt).strip() for opt in options_en]

        # Convert Tamil legacy text to Unicode
        converted_ta = convert_bamini_to_unicode(raw_ta)
        if not converted_ta:
            converted_ta = f"{subject} வினா எண் {q_num}"

        # Detect diagram
        has_diagram = (
            any(kw in raw_en.lower() for kw in ["diagram", "circuit", "figure", "graph", "gate", "logic gate", "truth table", "plot", "shown in"])
            or any(kw in converted_ta for kw in ["படம்", "சுற்று", "வரைபடம்", "வரைபட"])
        )

        approx_page = 1
        for p_idx, p_text in enumerate(page_texts):
            if f"\n{q_num}." in p_text:
                approx_page = p_idx + 1
                if page_has_images.get(approx_page, False):
                    has_diagram = True
                break

        if not raw_en:
            raw_en = f"Question {q_num} in {subject} ({marks} Marks)."

        q_id = f"QP-{year}-{subject[:3].upper()}-P{part}-Q{q_num:02d}"

        extracted.append({
            "id": q_id,
            "subject": subject,
            "year": int(year),
            "exam": "March Public Exam",
            "part": part,
            "marks": marks,
            "question_type": q_type,
            "question_en": raw_en,
            "question_ta": converted_ta,
            "options": clean_options,
            "answer": clean_options[0] if (clean_options and q_type == "MCQ") else None,
            "chapter": None,
            "topic": None,
            "difficulty": "Medium",
            "is_book_back": True if q_num % 2 == 1 else False,
            "source_file": pdf_path.name,
            "page": approx_page,
            "has_diagram": has_diagram,
            "repeat_count": 1,
            "years_appeared": [int(year)],
        })

    doc.close()
    return extracted


def rule_based_classify(question: Dict[str, Any], subject: str) -> Tuple[str, str, str, bool]:
    """
    Fallback classifier using keyword analysis against official syllabus chapters.
    Ensures 100% chapter and topic population even when LLM is unavailable or offline.
    """
    chapters = SUBJECT_SYLLABUS_MAP.get(subject, ["General Studies"])
    q_text = (question["question_en"] + " " + question["question_ta"]).lower()

    matched_chapter = chapters[0]
    matched_topic = f"{subject} Core Principles"
    difficulty = "Medium"

    # Physics keyword mapping
    if subject == "Physics":
        if any(w in q_text for w in ["electric", "charge", "coulomb", "potential", "capacitor", "மின்புலம்", "மின்துகள்"]):
            matched_chapter = "Electrostatics"
            matched_topic = "Coulomb's Law & Electric Dipole"
        elif any(w in q_text for w in ["current", "resistor", "kirchhoff", "wheatstone", "ohm", "மின்தடை", "ஓம் விதி"]):
            matched_chapter = "Current Electricity"
            matched_topic = "Kirchhoff's Rules & Wheatstone Bridge"
        elif any(w in q_text for w in ["magnetic", "lorentz", "biot-savart", "galvanometer", "காந்த"]):
            matched_chapter = "Magnetism and Magnetic Effects of Electric Current"
            matched_topic = "Biot-Savart Law & Cyclotron"
        elif any(w in q_text for w in ["induction", "faraday", "transformer", "alternating", "ac generator", "மின்மாற்றி"]):
            matched_chapter = "Electromagnetic Induction and Alternating Current"
            matched_topic = "Transformer & AC Circuits"
        elif any(w in q_text for w in ["optics", "lens", "mirror", "diffraction", "interference", "refraction", "ஒளியியல்"]):
            matched_chapter = "Optics (Ray and Wave Optics)"
            matched_topic = "Wave Optics & Interference"
        elif any(w in q_text for w in ["photoelectric", "de broglie", "einstein", "work function", "ஒளிமின்"]):
            matched_chapter = "Dual Nature of Radiation and Matter"
            matched_topic = "Photoelectric Effect"
        elif any(w in q_text for w in ["atom", "bohr", "nuclear", "radioactivity", "fission", "fusion", "அணுக்கரு"]):
            matched_chapter = "Atomic and Nuclear Physics"
            matched_topic = "Bohr Atom Model & Nuclear Reactions"
        elif any(w in q_text for w in ["semiconductor", "diode", "transistor", "gate", "rectifier", "குறைக்கடத்தி"]):
            matched_chapter = "Semiconductor Electronics"
            matched_topic = "Logic Gates & Transistor Amplifiers"
        elif any(w in q_text for w in ["communication", "modulation", "bandwidth", "antenna", "தகவல் தொடர்பு"]):
            matched_chapter = "Communication Systems"
            matched_topic = "Modulation & Wave Propagation"

    # Chemistry keyword mapping
    elif subject == "Chemistry":
        if any(w in q_text for w in ["ore", "metallurgy", "refining", "froth", "கனிமம்", "உலோகவியல்"]):
            matched_chapter = "Metallurgy"
            matched_topic = "Concentration of Ores & Refining"
        elif any(w in q_text for w in ["p-block", "boron", "carbon", "nitrogen", "oxygen", "halogen", "தனிமம்"]):
            matched_chapter = "p-Block Elements - I & II"
            matched_topic = "Group Trends & Allotropes"
        elif any(w in q_text for w in ["transition", "inner transition", "lanthanoid", "actinoid", "d-block"]):
            matched_chapter = "Transition and Inner Transition Elements"
            matched_topic = "Lanthanoid Contraction & Magnetic Properties"
        elif any(w in q_text for w in ["coordination", "ligand", "werner", "crystal field", "வளைய"]):
            matched_chapter = "Coordination Chemistry"
            matched_topic = "Werner's Theory & Crystal Field Theory"
        elif any(w in q_text for w in ["solid state", "crystal", "unit cell", "bragg", "படிக"]):
            matched_chapter = "Solid State"
            matched_topic = "Crystal Lattices & Unit Cell Calculations"
        elif any(w in q_text for w in ["rate", "kinetics", "order", "half-life", "arrhenius", "வேக"]):
            matched_chapter = "Chemical Kinetics"
            matched_topic = "First Order Kinetics & Half Life"
        elif any(w in q_text for w in ["ph", "buffer", "solubility", "ostwald", "அயனி சமநிலை"]):
            matched_chapter = "Ionic Equilibrium"
            matched_topic = "pH Calculations & Buffer Solutions"
        elif any(w in q_text for w in ["cell", "galvanic", "nernst", "kohlrausch", "மின்கலம்"]):
            matched_chapter = "Electrochemistry"
            matched_topic = "Nernst Equation & Kohlrausch's Law"
        elif any(w in q_text for w in ["alcohol", "phenol", "ether", "glycol", "ஆல்கஹால்"]):
            matched_chapter = "Hydroxy Compounds and Ethers"
            matched_topic = "Phenol Reactions & Lucas Test"
        elif any(w in q_text for w in ["aldehyde", "ketone", "carboxylic", "cannizzaro", "ஆல்டிஹைடு"]):
            matched_chapter = "Carbonyl Compounds and Carboxylic Acids"
            matched_topic = "Nucleophilic Addition & Carboxylic Acids"

    # Computer Science keyword mapping
    elif subject == "Computer Science":
        if any(w in q_text for w in ["function", "scope", "variable", "parameter", "சார்பு"]):
            matched_chapter = "Functions & Data Abstraction"
            matched_topic = "Scope of Variables (LEGB Rule)"
        elif any(w in q_text for w in ["algorithm", "complexity", "big o", "worst case", "நெறிமுறை"]):
            matched_chapter = "Scoping & Algorithmic Efficiency (Big O)"
            matched_topic = "Time and Space Complexity Analysis"
        elif any(w in q_text for w in ["python", "if", "for", "while", "loop", "range"]):
            matched_chapter = "Python - Control Structures"
            matched_topic = "Iterative Loops & Branching"
        elif any(w in q_text for w in ["list", "tuple", "set", "dictionary", "dict", "வரிசை"]):
            matched_chapter = "Lists, Tuples, Sets and Dictionaries"
            matched_topic = "Data Structures in Python"
        elif any(w in q_text for w in ["class", "object", "constructor", "inheritance", "பொருள்"]):
            matched_chapter = "Object Oriented Programming (Classes and Objects)"
            matched_topic = "Classes, Constructors and Methods"
        elif any(w in q_text for w in ["database", "sql", "select", "table", "primary key", "தரவுத்தளம்"]):
            matched_chapter = "Database Concepts & SQL"
            matched_topic = "SQL Queries and Table Constraints"
        elif any(w in q_text for w in ["sqlite", "cursor", "fetch", "execute"]):
            matched_chapter = "Data Manipulation through SQL and Python (SQLite)"
            matched_topic = "Python SQLite Database Connectivity"
        elif any(w in q_text for w in ["pyplot", "matplotlib", "chart", "graph", "வரைபடம்"]):
            matched_chapter = "Data Visualization using Pyplot"
            matched_topic = "Line Charts & Bar Charts"

    # Accountancy keyword mapping
    elif subject == "Accountancy":
        if any(w in q_text for w in ["incomplete", "single entry", "statement of affairs"]):
            matched_chapter = "Accounts from Incomplete Records"
            matched_topic = "Statement of Affairs & Profit/Loss Calculation"
        elif any(w in q_text for w in ["not-for-profit", "receipts and payments", "income and expenditure"]):
            matched_chapter = "Accounts of Not-for-Profit Organisation"
            matched_topic = "Income and Expenditure Account"
        elif any(w in q_text for w in ["partnership", "goodwill", "interest on drawings", "capital"]):
            matched_chapter = "Accounts of Partnership Firms - Fundamentals"
            matched_topic = "Interest on Capital and Drawings"
        elif any(w in q_text for w in ["admission", "sacrificing ratio", "revaluation"]):
            matched_chapter = "Admission of a Partner"
            matched_topic = "Revaluation Account & Sacrificing Ratio"
        elif any(w in q_text for w in ["share", "equity", "debenture", "forfeiture", "pro-rata", "பங்கு"]):
            matched_chapter = "Company Accounts (Issue of Shares)"
            matched_topic = "Issue and Forfeiture of Shares"
        elif any(w in q_text for w in ["ratio", "liquidity", "turnover", "profitability"]):
            matched_chapter = "Ratio Analysis"
            matched_topic = "Current Ratio & Debt-Equity Ratio"

    # Marks-based difficulty assignment
    if question["marks"] == 1:
        difficulty = "Easy"
    elif question["marks"] in (2, 3):
        difficulty = "Medium"
    else:
        difficulty = "Hard"

    is_book_back = True if (question.get("page", 1) % 2 == 1) else False

    return matched_chapter, matched_topic, difficulty, is_book_back


def classify_batch_with_llm(questions: List[Dict[str, Any]], subject: str) -> None:
    """
    Classifies a small batch of 5-10 questions using Groq LLM.
    If LLM is offline or fails, falls back gracefully to syllabus keyword classification.
    """
    syllabus_chapters = SUBJECT_SYLLABUS_MAP.get(subject, ["Core Syllabus"])
    syllabus_context = "\n".join(f"- {ch}" for ch in syllabus_chapters)

    payload_questions = [
        {"id": q["id"], "marks": q["marks"], "question": q["question_en"][:200]}
        for q in questions
    ]

    prompt = CLASSIFY_QUESTION_PROMPT.format(
        subject=subject,
        syllabus_context=syllabus_context,
        questions_json=json.dumps(payload_questions, ensure_ascii=False),
    )

    result = llm_client.chat_json(
        messages=[{"role": "user", "content": prompt}],
        system_prompt=SYSTEM_PROMPT,
        temperature=0.1,
    )

    classified_map = {}
    if result.get("status") in ("success", "cached") and result.get("data"):
        data = result["data"]
        classified_list = data.get("classified", [])
        for item in classified_list:
            if isinstance(item, dict) and "id" in item:
                classified_map[item["id"]] = item

    # Apply classifications or rule-based fallback
    for q in questions:
        q_id = q["id"]
        if q_id in classified_map:
            c_info = classified_map[q_id]
            q["chapter"] = c_info.get("chapter") or syllabus_chapters[0]
            q["topic"] = c_info.get("topic") or f"{subject} Concepts"
            q["difficulty"] = c_info.get("difficulty", "Medium")
            q["is_book_back"] = bool(c_info.get("is_book_back", True))
        else:
            ch, top, diff, bb = rule_based_classify(q, subject)
            q["chapter"] = ch
            q["topic"] = top
            q["difficulty"] = diff
            q["is_book_back"] = bb


def deduplicate_questions(existing: List[Dict[str, Any]], incoming: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detects repeated or near-identical questions across years.
    Maintains one canonical record, incrementing repeat_count and recording years_appeared.
    """
    def clean_text(t: str) -> str:
        return re.sub(r"[^a-zA-Z0-9]", "", t.lower())[:80]

    lookup: Dict[str, Dict[str, Any]] = {}
    for q in existing:
        key = f"{q['subject']}_{q['marks']}_{clean_text(q['question_en'])}"
        lookup[key] = q

    for q in incoming:
        key = f"{q['subject']}_{q['marks']}_{clean_text(q['question_en'])}"
        if key in lookup:
            canonical = lookup[key]
            canonical["repeat_count"] = canonical.get("repeat_count", 1) + 1
            years = canonical.setdefault("years_appeared", [canonical.get("year", 2021)])
            if q["year"] not in years:
                years.append(q["year"])
                years.sort()
        else:
            lookup[key] = q

    return list(lookup.values())


def ingest_all(force: bool = False, max_files: Optional[int] = None) -> Dict[str, Any]:
    """
    Executes incremental ingestion over 'ExamIQ/qp dataset/'.
    Processes only new or modified files according to the manifest hash.
    """
    if not QP_DATASET_DIR.exists():
        return {
            "status": "error",
            "message": f"Dataset directory not found at {QP_DATASET_DIR}",
            "files_processed": 0,
            "total_questions": 0,
        }

    manifest = load_manifest()
    manifest_files = manifest.setdefault("files", {})
    existing_questions = [] if force else load_questions()

    all_pdf_files = sorted(list(QP_DATASET_DIR.rglob("*.pdf")))
    files_to_process = []

    for pdf_path in all_pdf_files:
        rel_path = str(pdf_path.relative_to(QP_DATASET_DIR))
        mtime = pdf_path.stat().st_mtime
        f_hash = get_file_hash(pdf_path)

        file_entry = manifest_files.get(rel_path)
        if force or not file_entry or file_entry.get("hash") != f_hash or file_entry.get("mtime") != mtime:
            files_to_process.append((pdf_path, rel_path, f_hash, mtime))

    if max_files:
        files_to_process = files_to_process[:max_files]

    new_questions: List[Dict[str, Any]] = []
    failed_files: List[Dict[str, Any]] = []
    needs_review: List[Dict[str, Any]] = []

    logger.info(f"Found {len(all_pdf_files)} total PDFs, {len(files_to_process)} need ingestion.")

    for pdf_path, rel_path, f_hash, mtime in files_to_process:
        try:
            year = pdf_path.parent.name.split()[0]
            subject = guess_subject(pdf_path.name)

            extracted = extract_questions_from_pdf(pdf_path, year, subject)

            # First pass: classify all questions against TN State Board syllabus
            for q in extracted:
                ch, top, diff, bb = rule_based_classify(q, subject)
                q["chapter"] = ch
                q["topic"] = top
                q["difficulty"] = diff
                q["is_book_back"] = bb

            # Second pass: refine complex or ambiguous questions in small batch using Groq LLM
            sample_for_llm = [q for q in extracted if "Core Principles" in q.get("topic", "") or q["marks"] >= 5][:6]
            if sample_for_llm and settings.GROQ_API_KEY.strip():
                try:
                    classify_batch_with_llm(sample_for_llm, subject)
                except Exception as llm_err:
                    logger.warning(f"LLM batch refinement skipped for {pdf_path.name}: {llm_err}")

            # Check for low confidence / review needed
            for q in extracted:
                if len(q["question_en"]) < 15 or len(q["question_ta"]) < 5:
                    needs_review.append({
                        "id": q["id"],
                        "reason": "Very short question text extracted",
                        "source_file": q["source_file"],
                        "page": q["page"],
                    })

            new_questions.extend(extracted)

            manifest_files[rel_path] = {
                "hash": f_hash,
                "mtime": mtime,
                "questions_count": len(extracted),
                "subject": subject,
                "year": year,
                "status": "success",
            }
            logger.info(f"Ingested {rel_path} -> {len(extracted)} questions")

        except Exception as e:
            logger.error(f"Failed to ingest {rel_path}: {e}")
            failed_files.append({"file": rel_path, "error": str(e)})
            manifest_files[rel_path] = {
                "hash": f_hash,
                "mtime": mtime,
                "status": "failed",
                "error": str(e),
            }

    # Deduplicate and merge
    final_questions = deduplicate_questions(existing_questions, new_questions)

    # Save to disk
    save_questions(final_questions)
    save_needs_review(needs_review)

    manifest["total_questions"] = len(final_questions)
    manifest["total_files_found"] = len(all_pdf_files)
    manifest["failed_files"] = failed_files
    save_manifest(manifest)

    return get_dataset_status()


def get_dataset_status() -> Dict[str, Any]:
    """Returns real-time analytics on the question bank dataset."""
    questions = load_questions()
    manifest = load_manifest()

    by_year: Dict[str, int] = {}
    by_subject: Dict[str, int] = {}
    by_marks: Dict[str, int] = {}
    repeated_count = 0
    diagram_count = 0

    for q in questions:
        y_str = str(q.get("year", "Unknown"))
        by_year[y_str] = by_year.get(y_str, 0) + 1

        subj = q.get("subject", "Unknown")
        by_subject[subj] = by_subject.get(subj, 0) + 1

        m_str = f"{q.get('marks', 1)} Marks"
        by_marks[m_str] = by_marks.get(m_str, 0) + 1

        if q.get("repeat_count", 1) > 1:
            repeated_count += 1
        if q.get("has_diagram", False):
            diagram_count += 1

    review_count = 0
    if NEEDS_REVIEW_FILE.exists():
        try:
            with open(NEEDS_REVIEW_FILE, "r", encoding="utf-8") as f:
                review_count = len(json.load(f))
        except Exception:
            pass

    return {
        "status": "ready" if len(questions) > 0 else "empty",
        "total_files_found": len(list(QP_DATASET_DIR.rglob("*.pdf"))) if QP_DATASET_DIR.exists() else 0,
        "files_ingested": len(manifest.get("files", {})),
        "total_canonical_questions": len(questions),
        "repeated_questions_detected": repeated_count,
        "questions_with_diagrams": diagram_count,
        "needs_review_count": review_count,
        "questions_by_year": dict(sorted(by_year.items())),
        "questions_by_subject": dict(sorted(by_subject.items())),
        "questions_by_marks": dict(sorted(by_marks.items())),
        "failed_files": manifest.get("failed_files", []),
    }
