# JM Vertex ExamIQ

> **AI Examination & Learning Intelligence System**  
> Tamil Nadu State Board • Class 12 Higher Secondary (Academic & Vocational Streams)  
> Version `2.1.0`

---

## Overview

**ExamIQ** is a full-stack, bilingual (Tamil & English) AI-powered examination management platform built for Tamil Nadu State Board Class 12 educators, school administrators, and evaluators. It automates the complete assessment lifecycle — from syllabus-aware paper generation to AI handwriting evaluation, student learning diagnostics, and personalized remedial drill generation.

The system is split into two independently runnable services:

| Service | Technology | Default Port | Health / Status URL |
|---|---|---|---|
| **Frontend** | Flask (Python) serving HTML5 + Vanilla JS (ES Modules) | `3000` | [http://localhost:3000](http://localhost:3000) |
| **Backend API** | FastAPI (Python) with Uvicorn & Pydantic v2 | `8000` | [http://localhost:8000/docs](http://localhost:8000/docs) |

---

## 🚀 Completed Milestones & Feature Implementation Status

The platform has completed all milestones spanning dataset ingestion, examination blueprint synthesis, LLM integration, bilingual exports, and automated verification:

| Milestone | Scope / Objective | Implementation Details | Status |
|---|---|---|:---:|
| **Step 0 — PDF Dataset Inspection** | Comprehensive scan of `qp dataset/` (35 PDFs, 5 years, 7 subjects) | Discovered vector digital PDFs, identified legacy BAMINI/Vanavil Tamil typography (0 Unicode chars, hundreds of legacy font glyphs), formulated text extraction + deterministic Unicode converter strategy. | ✅ **Completed** |
| **Step 1 — Ingestion Pipeline** | Canonical extraction of past-paper questions into structured JSON dataset | Built `backend/services/qp_ingest.py`, `backend/services/tamil_converter.py`, and `scripts/build_qp_dataset.py`. Extracted **1,361 questions** across 2021–2025. Implemented SHA-256 incremental manifest (`manifest.json`), deduplication, diagram tagging, and dataset endpoints (`/dataset/status`, `/dataset/rebuild`). | ✅ **Completed** |
| **Step 2 — Paper Generation Engine** | Blueprint exam synthesis engine reading strictly from `qp_questions.json` | Built `backend/services/paper_generator.py`, `backend/data/blueprints.json`, and `backend/services/paper_exporter.py`. Enforces Rule 1 (Teaching Progress Lock), exact marks sum (25/50/70/90/100M), 5-year distribution (no year >35%), Groq LLM rubric generation with safe offline fallback, question swap, and PDF/DOCX export with embedded Noto Sans Tamil. | ✅ **Completed** |
| **Step 3 — Frontend Integration** | Full connection of Paper Generator UI to live API with fallback & mock support | Updated `paperGeneratorView.js` and `paper_generator.html`: added 7-subject selector, live dataset status panel (1,361 questions breakdown), 4-step generation progress stepper, coverage report summary strip, bilingual/English/Tamil toggle, question source badges, and PDF/DOCX download triggers. | ✅ **Completed** |
| **Step 4 — Test Suites & Documentation** | Automated unit/integration tests and complete operations guide | Built `tests/test_paper_engine.py` (9 passing tests in 0.26s) validating marks equality, Rule 1, 35% year cap, deduplication, bilingual text, offline fallback, incremental caching, and Groq mocking. Updated `tests/test_api.py` (28/28 tests passing). | ✅ **Completed** |

---

## Key Features

### 🔒 Rule 1 — Teaching Progress Lock
When active for a class, the paper generator **strictly excludes** all syllabus topics marked as `not_started`. Teachers toggle this live per-class via `PUT /api/v1/syllabus/lock/toggle`. If `enrichmentPreviewAllowed` is set, a few HOTS questions may preview untaught units with an explicit warning flag (`preview: true`).

### 📚 5-Year Past Exam Question Paper Ingestion Pipeline
Processes all 5 years of DGE Tamil Nadu Higher Secondary public exam PDFs (2021–2025 across 7 subjects) directly from `qp dataset/`:
- **Total Questions Extracted**: **1,361 canonical questions** across 35 PDFs.
- **Subjects**: Physics, Chemistry, Accountancy, Commerce, Computer Science, Computer Applications, Automobile Technology.
- **Marks Distribution**: 543 (1M), 311 (2M), 318 (3M), 189 (5M).
- **Tamil Typography Converter**: Deterministic mapping from legacy BAMINI / Vanavil fonts into pristine Unicode Tamil (`தமிழ்`).
- **Incremental Manifest**: SHA-256 hash tracking skips unchanged PDFs, scanning the entire dataset in **0.65 seconds**.

### 📄 Blueprint-Based Paper Generator
Generates balanced bilingual question papers following Tamil Nadu DGE blueprint specifications:
- **Exact Mark Scaling**: Supports 25M (Unit Test), 50M (Mid-Term), 70M (Science Board Pattern), 90M (Commerce/Accountancy Pattern), and 100M (Full Test). Calculated answerable marks **always sum exactly to totalMarks**.
- **Year Distribution**: Weighted sampling ensures all five years (2021–2025) contribute with a strict cap preventing any single year from exceeding 35% of the paper.
- **Difficulty & Book-Back Mix**: Fully configurable difficulty distribution (Easy / Medium / Hard) and book-back question ratio.
- **Groq LLM Enrichment with Safe Fallback**: Generates step-by-step scoring rubrics. If the Groq key is absent or hits rate limits, the system automatically falls back to deterministic dataset rubrics without crashing (`ai_status: "fallback"`).
- **Question Swapping**: Live replacement of individual questions with identical marks, subject, and chapter without duplicates via `POST /api/v1/papers/regenerate-question`.
- **High-Fidelity Export**: Direct export to printable A4 PDF (with embedded `NotoSansTamil-Regular.ttf`) and editable Microsoft Word (.docx) for both Question Papers and Answer Keys.

### 🧬 Student Learning DNA
Performance is tracked at granular concept-level (e.g., *"3×3 Cofactor Matrix Sign Transposition"*, not just *"Matrices"*). Diagnosed misconceptions feed directly into auto-generated personalized remedial drills.

### 🤖 AI Answer Sheet Evaluation
Upload scanned PDFs, JPEGs, or PNGs of handwritten answer scripts. The backend produces step-by-step mark allocations against the DGE marking rubric with confidence scores and full support for teacher overrides and audit trail logging.

### 🎓 Vocational Education Support
Full support for vocational trades (Electrical Machines & Appliances, Automobile Technology, etc.) with separate trade module APIs and workshop rubrics alongside the academic stream.

### 🌐 Bilingual Interface
Full Tamil (`Noto Sans Tamil`) and English (`Inter`) support throughout — question papers, rubrics, UI labels, and student profiles.

---

## Past Question Paper Dataset Pipeline

### Ingestion Data Source
The sole authoritative source of past examination questions is the local directory:
```
ExamIQ/qp dataset/
├── 2021 qp/    # 7 Subject PDFs (March 2021 Public Exam)
├── 2022 qp/    # 7 Subject PDFs (March 2022 Public Exam)
├── 2023 qp/    # 7 Subject PDFs (March 2023 Public Exam)
├── 2024 qp/    # 7 Subject PDFs (March 2024 Public Exam)
└── 2025 qp/    # 7 Subject PDFs (March 2025 Public Exam)
```

### Adding New Question Paper PDFs
To introduce a newly published public examination paper or supplementary paper:
1. Place the PDF inside the appropriate year folder under `qp dataset/` (e.g., `qp dataset/2025 qp/2025_physics_supplementary_QP.pdf`).
2. Run the dataset builder script:
   ```bash
   python scripts/build_qp_dataset.py
   ```
   *The pipeline uses an incremental manifest (`backend/data/manifest.json`). It automatically detects only new or modified files via SHA-256 hashes and processes them in sub-second time without re-extracting unchanged files.*
3. To force a complete re-build from scratch across all PDFs:
   ```bash
   python scripts/build_qp_dataset.py --force
   ```
4. Verify dataset status via the API:
   - `GET /api/v1/dataset/status`: View total files, questions count per year, subject, and marks distribution.
   - `POST /api/v1/dataset/rebuild`: Trigger on-demand re-ingestion directly from the administrative portal.

---

## Architecture & Project Structure

```
ExamIQ/
├── app.py                       # Flask frontend server (port 3000)
├── run_backend.py               # Convenience runner for FastAPI backend (port 8000)
├── run_all.py                   # Unified launcher for both servers concurrently
├── start.bat                    # Windows one-click start script
├── docker-compose.yml           # Multi-container deployment configuration
├── requirements.txt             # Frontend Python dependencies
├── requirements-backend.txt     # Backend Python dependencies (FastAPI, Groq, PyMuPDF, ReportLab, docx)
├── .env.example                 # Environment variable template
├── API_ENDPOINTS_GUIDE.md       # Full backend integration specification
│
├── backend/                     # FastAPI application
│   ├── main.py                  # App setup, CORS middleware, router registration
│   ├── config.py                # Environment configuration (Groq settings, ports)
│   ├── database.py              # In-memory runtime data store (TN HSC Class 12 data)
│   ├── models.py                # Pydantic v2 schemas conforming to API contracts
│   │
│   ├── data/                    # Generated runtime data & assets
│   │   ├── qp_questions.json    # Canonical database of 1,361 past exam questions
│   │   ├── blueprints.json      # Per-subject examination blueprints and scaling rules
│   │   ├── manifest.json        # Incremental SHA-256 file ingestion tracking
│   │   ├── needs_review.json    # Low-confidence items flagged for teacher review
│   │   ├── llm_cache.json       # On-disk Groq response cache keyed by prompt hash
│   │   └── NotoSansTamil-Regular.ttf # Embedded Tamil font for PDF rendering
│   │
│   ├── prompts/
│   │   └── paper_prompts.py     # SCERT-aligned prompt templates (marking schemes, classification)
│   │
│   ├── services/
│   │   ├── qp_ingest.py         # PDF parsing, question splitting, and manifest tracking
│   │   ├── tamil_converter.py   # Legacy BAMINI/Vanavil typography to Unicode Tamil
│   │   ├── llm_client.py        # Groq client with backoff, rate limits, and disk cache
│   │   ├── paper_generator.py   # Synthesis engine, Rule 1 validation, 5-year sampling
│   │   └── paper_exporter.py    # ReportLab PDF & python-docx DOCX generation
│   │
│   └── routers/
│       ├── auth.py              # /auth/login, /auth/emis-sso
│       ├── dataset.py           # /dataset/status, /dataset/rebuild
│       ├── syllabus.py          # Syllabus hierarchy & Teaching Progress Lock
│       ├── resources.py         # SCERT textbooks, public exam archives
│       ├── questions.py         # Question bank (search & author)
│       ├── papers.py            # /papers/generate, /papers/regenerate-question, export PDF/DOCX
│       ├── evaluations.py       # Answer sheet OCR upload & teacher approval
│       ├── marks.py             # Class marks grid & CSV batch import
│       ├── students.py          # Student Learning DNA profiles
│       ├── remedial.py          # AI remedial drill generation
│       ├── homework.py          # Homework assignment creation
│       ├── vocational.py        # Vocational trade modules & rubrics
│       ├── reports.py           # Class curricular progress reports
│       └── admin.py             # Audit logs & school tenants
│
├── scripts/
│   └── build_qp_dataset.py      # CLI runner for PDF dataset ingestion (--force, --limit)
│
├── templates/                   # Jinja2 HTML templates
│   ├── index.html               # Single-page shell
│   └── views/                   # Per-view HTML partials (15 views)
│
├── static/                      # Frontend static assets
│   ├── css/styles.css
│   └── js/
│       ├── app.js               # SPA router & view orchestration
│       ├── state.js             # Global state management
│       ├── api/client.js        # API client & live/mock switching
│       ├── components/          # Header, sidebar, search modal
│       ├── data/mockData.js     # Fallback mock data (used in Mock Data Mode)
│       └── views/               # 15 view controllers (paperGeneratorView.js, etc.)
│
├── qp dataset/                  # 35 Past Public Exam Question Papers (2021–2025)
│   ├── 2021 qp/
│   ├── 2022 qp/
│   ├── 2023 qp/
│   ├── 2024 qp/
│   └── 2025 qp/
│
└── tests/
    ├── test_api.py              # 28 contract tests for all backend REST endpoints
    └── test_paper_engine.py     # 9 tests for marks equality, Rule 1, year cap, and exports
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- pip

### 1. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` (optional, for live AI enrichment):
```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b
LLM_MAX_RETRIES=3
LLM_TIMEOUT=30
```
*Note: If `GROQ_API_KEY` is not provided, the system automatically runs in deterministic dataset fallback mode with zero downtime.*

### 2. Install Dependencies

```bash
# Frontend dependencies
pip install -r requirements.txt

# Backend dependencies (FastAPI, Groq, PyMuPDF, ReportLab, python-docx)
pip install -r requirements-backend.txt
```

### 3. Ingest Question Paper Dataset (Runs Once)

```bash
python scripts/build_qp_dataset.py
```
*This extracts all 35 PDFs in `qp dataset/` and compiles `backend/data/qp_questions.json`.*

### 4. Start Both Servers

```bash
python run_all.py
```

Both services will be running:
- **Frontend Portal**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend**: [http://localhost:8000/api/v1](http://localhost:8000/api/v1)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 5. Sign In Credentials

| Field | Demo Value |
|---|---|
| Email / Identity | `admin@gmail.com` (or `meenakshi.pgt@tnschools.gov.in`) |
| Password | `admin@123` (or `password123`) |

---

## Automated Test Suites

Run the test suites to verify backend integrity:

```bash
# 1. Past-paper engine, marks scaling, Rule 1, and export tests
python tests/test_paper_engine.py

# 2. Comprehensive REST API contract test suite (28 endpoints)
python tests/test_api.py

# 3. Run all unit tests together
python -m unittest discover tests
```

---

## API Endpoints Reference

All routes are mounted under `/api/v1` and mirrored directly under the root path for dual routing compatibility:

| Category | Method | Path | Description |
|---|---|---|---|
| **Dataset** | GET | `/api/v1/dataset/status` | Ingestion statistics, questions by year & subject |
| **Dataset** | POST | `/api/v1/dataset/rebuild` | Trigger on-demand incremental/forced dataset rebuild |
| **Paper Generator** | POST | `/api/v1/papers/generate` | Synthesize blueprint exam from 5-year past paper dataset |
| **Paper Generator** | POST | `/api/v1/papers/regenerate-question` | Swap individual question with past-paper variant |
| **Paper Generator** | GET | `/api/v1/papers/{id}/export/pdf` | Export question paper or answer key to PDF (Noto Sans Tamil) |
| **Paper Generator** | GET | `/api/v1/papers/{id}/export/docx` | Export question paper or answer key to Microsoft Word (.docx) |
| **Syllabus** | GET | `/api/v1/syllabus/{classId}/{subjectId}` | Syllabus hierarchy & Teaching Progress Lock status |
| **Syllabus** | PUT | `/api/v1/syllabus/lock/toggle` | Toggle Teaching Progress Lock (Rule 1) |
| **Syllabus** | POST | `/api/v1/syllabus/subtopic/status` | Update topic teaching completion status |
| **Question Bank** | GET | `/api/v1/questions` | Search and filter questions by chapter and marks |
| **Question Bank** | POST | `/api/v1/questions` | Author new question with stepwise rubric |
| **Resources** | GET | `/api/v1/resources` | List SCERT textbooks & public exam archives |
| **Resources** | POST | `/api/v1/resources/import` | Upload & ingest new resource for OCR |
| **Resources** | GET | `/api/v1/resources/version-diff` | Syllabus differential audit |
| **Evaluations** | POST | `/api/v1/evaluations/upload-scan` | Upload scanned handwritten answer sheet for AI OCR |
| **Evaluations** | PUT | `/api/v1/evaluations/{id}/approve` | Teacher approves/adjusts AI rubric marks |
| **Marks** | GET | `/api/v1/marks/{classId}/{testId}` | Class marks ledger with discrepancy alerts |
| **Marks** | POST | `/api/v1/marks/batch-import` | Batch import student marks from CSV |
| **Student DNA** | GET | `/api/v1/students/{studentId}/learning-dna` | Diagnostic concept mastery profile |
| **Remedial** | POST | `/api/v1/remedial/generate-drill` | Generate targeted remedial drill worksheet |
| **Homework** | POST | `/api/v1/homework/create` | Assign homework to specific students |
| **Vocational** | GET | `/api/v1/vocational/{tradeCode}` | Vocational modules & workshop rubrics |
| **Reports** | GET | `/api/v1/reports/class-summary/{classId}` | Class curricular progress and performance analytics |
| **Admin** | GET | `/api/v1/admin/audit-logs` | Administrative security audit trails |
| **Admin** | GET | `/api/v1/admin/schools` | List connected school tenants |
| **Health** | GET | `/health` | Service health and database status |

---

## License

Internal project — JM Vertex. All rights reserved.
