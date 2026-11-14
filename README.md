# JM Vertex ExamIQ

> **AI Examination & Learning Intelligence System**  
> Tamil Nadu State Board • Class 12 Higher Secondary (Academic & Vocational Streams)  
> Version `2.1.0`

---

## Overview

**ExamIQ** is a full-stack, bilingual (Tamil & English) AI-powered examination management platform built for Tamil Nadu State Board Class 12 educators, school administrators, and evaluators. It automates the complete assessment lifecycle — from syllabus-aware paper generation to AI handwriting evaluation, student learning diagnostics, and personalized remedial drill generation.

The system is split into two independently runnable services:

| Service | Technology | Default Port |
|---|---|---|
| **Frontend** | Flask (Python) serving HTML5 + Vanilla JS (ES Modules) | `3000` |
| **Backend API** | FastAPI (Python) with Uvicorn | `8000` |

---

## Key Features

### 🔒 Rule 1 — Teaching Progress Lock
When active for a class, the paper generator **strictly excludes** all syllabus topics marked as `not_started`. Teachers toggle this live per-class via `PUT /api/v1/syllabus/lock/toggle`. If `enrichmentPreviewAllowed` is set, HOTS questions may preview untaught units with a warning flag.

### 🧬 Student Learning DNA
Performance is tracked at granular concept-level (e.g., *"3×3 Cofactor Matrix Sign Transposition"*, not just *"Matrices"*). Diagnosed misconceptions feed directly into auto-generated personalized remedial drills.

### 🤖 AI Answer Sheet Evaluation
Upload scanned PDFs, JPEGs, or PNGs of handwritten answer scripts. The backend produces step-by-step mark allocations against the DGE marking rubric with confidence scores and full support for teacher overrides and audit trail logging.

### 📄 Blueprint-Based Paper Generator
Generates complete bilingual question papers following Tamil Nadu blueprint specifications. Respects the taught-topics-only constraint, configurable difficulty mix (Easy/Medium/Hard), book-back ratio, public exam archive inclusion, and multi-part structure (1M MCQ / 2M Short / 3M Brief / 5M Long).

### 🎓 Vocational Education Support
Full support for vocational trades (Electrical Machines & Appliances, Automobile Technology, etc.) with separate trade module APIs and workshop rubrics alongside the academic stream.

### 🌐 Bilingual Interface
Full Tamil (`Noto Sans Tamil`) and English (`Inter`) support throughout — question papers, rubrics, UI labels, and student profiles.

---

## Architecture

```
ExamIQ/
├── app.py                       # Flask frontend server (HTML/CSS/JS shell)
├── run_backend.py               # Convenience runner for the FastAPI backend
├── run_all.py                   # Starts both servers concurrently
├── start.bat                    # Windows one-click start script
├── docker-compose.yml           # Docker Compose for containerised deployment
├── Dockerfile.backend           # Backend container definition
├── Dockerfile.frontend          # Frontend container definition
├── requirements.txt             # Frontend Python dependencies
├── requirements-backend.txt     # Backend Python dependencies
├── .env.example                 # Environment variable template
├── API_ENDPOINTS_GUIDE.md       # Full backend integration specification
│
├── backend/                     # FastAPI application
│   ├── main.py                  # App setup, CORS middleware, router registration
│   ├── config.py                # Settings loaded from environment
│   ├── database.py              # In-memory data store (TN HSC Class 12 domain data)
│   ├── models.py                # Pydantic request/response schemas
│   └── routers/
│       ├── auth.py              # /auth/login, /auth/emis-sso
│       ├── syllabus.py          # Syllabus hierarchy & Teaching Progress Lock
│       ├── resources.py         # SCERT textbooks, public exam archives
│       ├── questions.py         # Question bank (search & author)
│       ├── papers.py            # Blueprint paper generation & question swap
│       ├── evaluations.py       # Answer sheet OCR upload & teacher approval
│       ├── marks.py             # Class marks grid & CSV batch import
│       ├── students.py          # Student Learning DNA profiles
│       ├── remedial.py          # AI remedial drill generation
│       ├── homework.py          # Homework assignment creation
│       ├── vocational.py        # Vocational trade modules & rubrics
│       ├── reports.py           # Class curricular progress reports
│       └── admin.py             # Audit logs & school tenants
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
│       ├── api/                 # API client & endpoint registry
│       ├── components/          # Header, sidebar, search modal
│       ├── data/mockData.js     # Mock data (used in Mock Data Mode)
│       ├── utils/
│       └── views/               # 15 view controllers
│
├── qp dataset/                  # Historical question paper PDFs (2021–2025)
│   ├── 2021 qp/
│   ├── 2022 qp/
│   ├── 2023 qp/
│   ├── 2024 qp/
│   └── 2025 qp/
│
├── vertex_intelligence/
│   └── DESIGN.md                # Brand, design system & component specifications
│
└── tests/
    ├── test_api.py
    └── test_endpoints.py
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- pip

### 1. Clone & Configure

```bash
git clone <repo-url>
cd ExamIQ
cp .env.example .env
```

The `.env` defaults work out of the box for local development:

```env
FRONTEND_PORT=3000
API_BASE_URL=http://localhost:8000/api/v1
EMIS_CLIENT_ID=emis_tn_prod_hsc_492
EMIS_AUTH_URL=https://emis.tnschools.gov.in/oauth/authorize
```

### 2. Install Dependencies

```bash
# Frontend dependencies
pip install -r requirements.txt

# Backend dependencies
pip install -r requirements-backend.txt
```

### 3. Start Both Servers

**Option A — Single command (recommended)**
```bash
python run_all.py
```

**Option B — Windows batch script**
```bat
start.bat
```

**Option C — Separate terminals**
```bash
# Terminal 1 — Backend (FastAPI)
python run_backend.py
# or directly:
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Frontend (Flask)
python app.py
```

### 4. Open the App

| URL | Purpose |
|---|---|
| `http://localhost:3000` | Frontend application |
| `http://localhost:8000/docs` | Swagger UI (interactive API docs) |
| `http://localhost:8000/redoc` | ReDoc alternative docs |
| `http://localhost:8000/health` | Backend health check |

### 5. Sign In

| Field | Value |
|---|---|
| Email / Identity | `admin@gmail.com` |
| Password | `admin@123` |

---

## Docker Deployment

```bash
docker-compose up --build
```

This starts:
- `examiq-backend` on port `8000`
- `examiq-frontend` on port `3000` (configured to reach backend via internal DNS `http://backend:8000/api/v1`)

---

## Dual-Mode Frontend

The frontend ships with a built-in **Mock Data Mode** (default) so the UI can be demoed without a running backend.

To switch to **Live API Mode**:
1. Navigate to **System & Settings → API Explorer** in the sidebar.
2. Toggle the mode from **Mock Data** to **Live API** in the hero card.
3. Select any endpoint and click **Test Endpoint (LIVE MODE)**.

---

## API Endpoints

All routes are mounted with the `/api/v1` prefix **and** mirrored at the root path for maximum compatibility (e.g., both `/api/v1/auth/login` and `/auth/login` work).

| Category | Method | Path | Description |
|---|---|---|---|
| **Auth** | POST | `/api/v1/auth/login` | Teacher / Admin login with EMIS credentials |
| **Auth** | POST | `/api/v1/auth/emis-sso` | TN EMIS State Portal SSO callback |
| **Syllabus** | GET | `/api/v1/syllabus/{classId}/{subjectId}` | Retrieve syllabus hierarchy & lock status |
| **Syllabus** | PUT | `/api/v1/syllabus/lock/toggle` | Toggle Teaching Progress Lock (Rule 1) |
| **Syllabus** | POST | `/api/v1/syllabus/subtopic/status` | Update topic / subtopic teaching status |
| **Resources** | GET | `/api/v1/resources` | List SCERT textbooks & public exam archives |
| **Resources** | POST | `/api/v1/resources/import` | Upload & ingest new resource for OCR |
| **Resources** | GET | `/api/v1/resources/version-diff` | Syllabus differential audit |
| **Question Bank** | GET | `/api/v1/questions` | Search & filter question repository |
| **Question Bank** | POST | `/api/v1/questions` | Add a new question with stepwise rubric |
| **Paper Generator** | POST | `/api/v1/papers/generate` | Generate AI blueprint question paper |
| **Paper Generator** | POST | `/api/v1/papers/regenerate-question` | Swap individual question in a paper |
| **Evaluations** | POST | `/api/v1/evaluations/upload-scan` | Upload scanned answer sheet for AI OCR |
| **Evaluations** | PUT | `/api/v1/evaluations/{id}/approve` | Teacher approves / adjusts AI marks |
| **Marks** | GET | `/api/v1/marks/{classId}/{testId}` | Class marks grid with discrepancy flags |
| **Marks** | POST | `/api/v1/marks/batch-import` | Import marks from CSV / Excel |
| **Student DNA** | GET | `/api/v1/students/{studentId}/learning-dna` | Granular student learning profile |
| **Remedial** | POST | `/api/v1/remedial/generate-drill` | Generate AI personalized remedial worksheet |
| **Homework** | POST | `/api/v1/homework/create` | Create homework assignment |
| **Vocational** | GET | `/api/v1/vocational/{tradeCode}` | Vocational trade modules & workshop rubrics |
| **Reports** | GET | `/api/v1/reports/class-summary/{classId}` | Class curricular progress report |
| **Admin** | GET | `/api/v1/admin/audit-logs` | System audit trails |
| **Admin** | GET | `/api/v1/admin/schools` | List connected school tenants |
| **Health** | GET | `/health` | Backend health check |

> See [API_ENDPOINTS_GUIDE.md](./API_ENDPOINTS_GUIDE.md) for the full request/response payload specifications.

---

## Application Views

| View | Description |
|---|---|
| Dashboard | KPI overview — marks distribution, syllabus coverage, pending evaluations |
| Teaching Progress | Syllabus lock management, topic-by-topic completion tracking |
| Resource Hub | SCERT textbooks, model papers, and syllabus diff viewer |
| Question Bank | Search, filter, and author questions with bilingual rubrics |
| Paper Generator | Blueprint-based AI paper generation wizard |
| Answer Evaluation | Scanned script upload, AI grading, and teacher sign-off |
| Marks Management | Class marks grid, CSV import, and discrepancy flags |
| Student Learning DNA | Granular per-student concept mastery profiles |
| Remedial Learning | AI-generated personalized remedial worksheets |
| Assessments | Unit test and assessment calendar |
| Reports & Analytics | Class-wide curricular progress and performance analytics |
| Vocational Module | Trade-specific modules and workshop assessment rubrics |
| Admin & Security | Audit logs, school tenant management, system settings |
| API Explorer | In-app live endpoint tester (Mock ↔ Live toggle) |

---

## Domain Scope

| Attribute | Value |
|---|---|
| Board | Tamil Nadu State Board (TN HSC) |
| Level | Class 12 (+2) |
| Streams | Academic (Science / Commerce) & Vocational |
| Mediums | Tamil & English (bilingual) |
| Schools (demo) | Government Model, Government Aided, Government |
| Academic Year (demo) | 2024–2025 |
| Historical QP Dataset | 2021 – 2025 (7 subjects across 5 years) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Server | Python / Flask |
| Frontend UI | HTML5, Vanilla CSS3, ES Modules JavaScript |
| Backend API | Python / FastAPI + Uvicorn |
| Data Validation | Pydantic v2 |
| Data Store | In-memory (runtime) |
| Containerisation | Docker + Docker Compose |
| API Docs | OpenAPI 3.0 (Swagger UI + ReDoc) |
| Design System | Vertex Intelligence (`vertex_intelligence/DESIGN.md`) |

---

## Development Notes

- **CORS** is fully enabled for all local origins (`localhost:3000`, `localhost:5000`, `localhost:8000`, and wildcard `*`).
- **Dual routing** mounts every router both at `/api/v1` and at the root path to prevent path-mismatch errors during development.
- **Mock Data Mode** allows full UI testing without a running backend — all 15 views are functional out of the box.
- **Question Paper PDFs** (2021–2025, 7 subjects) are included in `qp dataset/` for reference and OCR testing.
- The backend uses an **in-memory data store** seeded with realistic TN HSC Class 12 domain data; data resets on each server restart.

---

## License

Internal project — JM Vertex. All rights reserved.
