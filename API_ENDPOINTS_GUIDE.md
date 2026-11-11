# JM Vertex ExamIQ — Backend REST API Specification & Integration Guide

> **For the Backend Developer Partner**  
> System: **AI Examination & Learning Intelligence System**  
> Initial Scope: **Tamil Nadu State Board • Class 12 (+2)**  
> Mediums: **Tamil & English Medium (Academic & Vocational Streams)**  
> Frontend Tech Stack: **HTML5 + Vanilla CSS3 + Modular JavaScript (ES Modules) + Python (Flask Jinja2 Frontend Server)**  
> Frontend Port: `http://localhost:3000`  
> Suggested Backend Base URL: `http://localhost:8000/api/v1`

---

## 1. Quick Integration Overview

The frontend includes a built-in **dual-mode system**:
- **Mock Data Mode (Default)**: Allows frontend testing and presentation without requiring a running backend.
- **Live API Mode**: Connects directly to `API_BASE_URL` (configured in `.env`, injected by `app.py` into `window.EXAMIQ_CONFIG.apiBaseUrl`, and consumed by `static/js/api/endpoints.js`).
- **In-App API Explorer**: You can test endpoints and review live payloads directly inside the web application by clicking **"Backend API Explorer"** in the sidebar.

### CORS Configuration Needed in Backend
Ensure your backend enables Cross-Origin Resource Sharing (CORS) for:
```
http://localhost:3000
http://127.0.0.1:3000
```
Headers: `Content-Type`, `Authorization`, `Accept`.

---

## 2. Core Business Rules (Golden Differentiators)

1. **Teaching Progress Lock (Rule 1)**:
   - When `lockActive: true` for a class, the `/papers/generate` endpoint **must exclude** all topics marked as `not_started`.
   - If `enrichmentPreviewAllowed: true`, HOTS questions may draw from untaught units with an explicit preview warning flag.
2. **Student Learning DNA**:
   - Scores are tracked down to granular concepts (e.g. *3x3 Cofactor Matrix Sign Transposition* rather than just "Matrices").
   - Diagnosed misconceptions feed directly into `/remedial/generate-drill`.
3. **AI Handwritten Answer Evaluation**:
   - Accepts scanned PDF/JPEG/PNG of student handwriting.
   - Outputs step-by-step mark allocations against the DGE marking rubric with confidence scores.
   - Supports teacher overrides and logs all adjustments into audit history.

---

## 3. Complete Endpoints Catalog

### A. Authentication & EMIS Gateway

#### 1. Teacher / Admin / Student Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Request Body**:
```json
{
  "schoolCode": "33240100201",
  "userIdentity": "meenakshi.pgt@tnschools.gov.in",
  "password": "password123",
  "role": "teacher" // "teacher" | "admin" | "evaluator" | "student"
}
```
- **Response `200 OK`**:
```json
{
  "status": "success",
  "token": "eyJhbGciOi...",
  "user": {
    "id": "T-TN-48291",
    "name": "K. Meenakshi Sundaram",
    "role": "teacher",
    "schoolId": "33240100201",
    "schoolName": "Govt Model HSS, Madurai",
    "classesAssigned": ["12-A", "12-B"]
  }
}
```

#### 2. Tamil Nadu EMIS Single Sign-On Callback
- **Endpoint**: `POST /api/v1/auth/emis-sso`
- **Request Body**:
```json
{
  "emisAuthCode": "emis_oauth_code_xyz123"
}
```

---

### B. Syllabus & Teaching Progress Management (Differentiator 1)

#### 3. Get Structured Syllabus & Teaching Status
- **Endpoint**: `GET /api/v1/syllabus/:classId/:subjectId`
- **Example**: `GET /api/v1/syllabus/12-A/maths`
- **Response `200 OK`**:
```json
{
  "classId": "12-A",
  "subject": "Mathematics",
  "lockActive": true,
  "enrichmentPreviewAllowed": false,
  "chapters": [
    {
      "chapterId": 1,
      "volume": "Vol 1",
      "code": "TN-MAT-C12-01",
      "title": "Applications of Matrices and Determinants",
      "titleTamil": "அணிகள் மற்றும் அணிக்கோவைகளின் பயன்பாடுகள்",
      "status": "completed",
      "subtopics": [
        {
          "id": "1.1",
          "title": "Rank of a Matrix",
          "status": "revised", // "not_started" | "in_progress" | "completed" | "revised"
          "taughtDate": "2024-07-12",
          "weightage": "5 Marks"
        }
      ]
    }
  ]
}
```

#### 4. Toggle Teaching Progress Lock
- **Endpoint**: `PUT /api/v1/syllabus/lock/toggle`
- **Request Body**:
```json
{
  "classId": "12-A",
  "lockActive": true,
  "enrichmentPreviewAllowed": false,
  "teacherId": "T-TN-48291",
  "notes": "Locked prior to Mid-term revision cycle"
}
```

#### 5. Update Subtopic Teaching Status
- **Endpoint**: `POST /api/v1/syllabus/subtopic/status`
- **Request Body**:
```json
{
  "classId": "12-A",
  "subtopicId": "4.3",
  "newStatus": "completed",
  "completionDate": "2024-11-10"
}
```

---

### C. Online Academic Resource Hub

#### 6. List Verified Resources
- **Endpoint**: `GET /api/v1/resources?stream=academic&medium=bilingual&category=all`
- **Response `200 OK`**:
```json
{
  "total": 42,
  "resources": [
    {
      "id": "res-scert-mat-v1-en",
      "title": "SCERT Class 12 Mathematics (Volume 1) — English Medium",
      "code": "TN-TEXT-MAT-12-V1-EN",
      "edition": "2024–25 Revised Edition",
      "allowedForAI": true,
      "ocrConfidence": 99.4,
      "sourceUrl": "https://textbookcorp.tn.gov.in/mat12_v1_en.pdf"
    }
  ]
}
```

#### 7. Import & OCR Ingestion of PDF / Exam Papers
- **Endpoint**: `POST /api/v1/resources/import`
- **Request Body**:
```json
{
  "title": "DGE Model Paper 2024",
  "type": "Model Question Paper",
  "medium": "Bilingual",
  "sourceUrl": "https://dge.tn.gov.in/...",
  "fileBase64OrUrl": "data:application/pdf;base64,..."
}
```

#### 8. Syllabus Differential Version Comparison
- **Endpoint**: `GET /api/v1/resources/version-diff`
- **Response `200 OK`**: Returns added, removed, and modified topics with pedagogical rationales.

---

### D. Intelligent Question Bank & OCR Extraction

#### 9. Query Question Repository
- **Endpoint**: `GET /api/v1/questions?chapterId=1&marks=5&difficulty=Medium`
- **Response `200 OK`**:
```json
{
  "totalFound": 184,
  "questions": [
    {
      "id": "Q-MAT-0102",
      "code": "TN-MAT-12-0102",
      "chapterId": 1,
      "topic": "Inverse by Adjoint Method",
      "marks": 5,
      "type": "Long Answer",
      "difficulty": "Medium",
      "questionEn": "If A = [[-8, 1, 4], [4, 4, 7], [1, -8, 4]], prove that A^-1 = (1/9) A^T...",
      "questionTa": "A = [[-8, 1, 4], [4, 4, 7], [1, -8, 4]] எனில், A^-1 = (1/9) A^T என நிறுவுக...",
      "rubric": [
        { "step": "Computing |A| = -729 != 0", "marks": 1.0 },
        { "step": "Computing transpose matrix A^T", "marks": 1.0 },
        { "step": "Matrix multiplication A * A^T = 81 * I_3", "marks": 1.5 },
        { "step": "Deducing A^-1 and final value", "marks": 1.5 }
      ],
      "answerKey": "A^-1 = 1/9 * [[-8, 4, 1], [1, 4, -8], [4, 7, 4]]",
      "ocrConfidence": 98.7,
      "status": "Approved"
    }
  ]
}
```

#### 10. Add New Question with Stepwise Rubric
- **Endpoint**: `POST /api/v1/questions`

---

### E. AI Question Paper Generator

#### 11. Generate Full Question Paper
- **Endpoint**: `POST /api/v1/papers/generate`
- **Request Body**:
```json
{
  "title": "Class 12 Mid-Term Examination — Mathematics",
  "classId": "12-A",
  "totalMarks": 50,
  "durationMinutes": 90,
  "language": "bilingual", // "en" | "ta" | "bilingual"
  "taughtTopicsOnly": true, // Respects Teaching Progress Lock
  "bookBackRatio": 60,
  "includePublicExamQuestions": true
}
```
- **Response `200 OK`**:
```json
{
  "paperId": "TN-HSC-PAPER-9821",
  "title": "Class 12 Mid-Term Examination — Mathematics",
  "totalMarks": 50,
  "durationMinutes": 90,
  "lockEnforced": true,
  "sections": [
    { "name": "Part I", "instructions": "Answer all questions. (1 Mark each)", "questions": [...] },
    { "name": "Part II", "instructions": "Answer any 3 questions. (2 Marks each)", "questions": [...] },
    { "name": "Part III", "instructions": "Answer any 2 questions. (3 Marks each)", "questions": [...] },
    { "name": "Part IV", "instructions": "Answer either (a) or (b). (5 Marks each)", "questions": [...] }
  ]
}
```

#### 12. Regenerate / Swap Equivalent Question
- **Endpoint**: `POST /api/v1/papers/regenerate-question`
- **Request Body**: `{ "paperId": "...", "currentQuestionId": "Q-MAT-0102" }`

---

### F. AI Handwritten Answer Sheet Evaluation (Differentiator 3)

#### 13. Upload Scanned Script for OCR & Rubric Scoring
- **Endpoint**: `POST /api/v1/evaluations/upload-scan`
- **Request Body**:
```json
{
  "testId": "TEST-UT2-MAT",
  "studentId": "STD-12A-14",
  "scanFileBase64": "data:image/jpeg;base64,..."
}
```
- **Response `200 OK`**:
```json
{
  "evaluationId": "EVAL-2024-UT2-014",
  "studentName": "K. Vignesh",
  "confidenceScore": 94.2,
  "extractedTextTamilEn": "Step 1: Given matrix A. |A| = -729...",
  "suggestedMarks": 3.5,
  "maxMarks": 5.0,
  "stepwiseBreakdown": [
    { "stepNo": 1, "description": "Determinant |A| calculated correctly", "maxMarks": 1.0, "aiMarks": 1.0, "verified": true },
    { "stepNo": 4, "description": "Rigorous derivation of final answer", "maxMarks": 1.5, "aiMarks": 0.0, "verified": false, "note": "Missed factor 9 relationship" }
  ]
}
```

#### 14. Teacher Approves or Modifies Evaluation Marks
- **Endpoint**: `PUT /api/v1/evaluations/:evaluationId/approve`
- **Request Body**:
```json
{
  "finalApprovedMarks": 4.0,
  "teacherAdjustmentNotes": "Partial credit for intermediate transpose matrix",
  "teacherId": "T-TN-48291"
}
```

---

### G. Marks Management & Discrepancies

#### 15. Get Class Marks Grid
- **Endpoint**: `GET /api/v1/marks/:classId/:testId`

#### 16. Batch Import CSV / Excel Marks
- **Endpoint**: `POST /api/v1/marks/batch-import`

---

### H. Student Learning DNA & Personalized Remedial (Differentiators 2 & 4)

#### 17. Get Student Learning DNA Profile
- **Endpoint**: `GET /api/v1/students/:studentId/learning-dna`
- **Response `200 OK`**: Returns concept scores, diagnosed persistent slips, and learning gaps.

#### 18. Generate AI Personalized Remedial Drill
- **Endpoint**: `POST /api/v1/remedial/generate-drill`
- **Request Body**:
```json
{
  "studentId": "STD-12A-14",
  "conceptTarget": "Cofactor Matrix Sign Transposition",
  "questionCount": 5,
  "includeWorkedExamples": true,
  "language": "bilingual"
}
```

---

### I. Vocational Education Intelligence

#### 19. Get Vocational Trade Curriculum & Workshop Rubrics
- **Endpoint**: `GET /api/v1/vocational/:tradeCode`
- **Example**: `GET /api/v1/vocational/452` (Electrical Machines & Appliances)

---

### J. Platform Administration & Security

#### 20. Retrieve Security Audit Logs
- **Endpoint**: `GET /api/v1/admin/audit-logs`

---

## 4. How to Run the Frontend Locally

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the Python Frontend Server
python app.py

# Open in Browser
http://127.0.0.1:3000
```
