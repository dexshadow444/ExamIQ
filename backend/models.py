"""
Pydantic Request & Response Schemas for ExamIQ Backend
Conforms strictly to frontend API contract specifications.
"""

from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


# --- Auth Models ---
class LoginRequest(BaseModel):
    schoolCode: Optional[str] = "33240100201"
    userIdentity: str
    password: str
    role: Optional[str] = "teacher"


class UserProfile(BaseModel):
    id: str
    name: str
    nameTamil: Optional[str] = None
    role: str
    schoolId: str
    schoolName: str
    classesAssigned: Optional[List[str]] = None


class LoginResponse(BaseModel):
    status: str = "success"
    token: str
    user: Dict[str, Any]


class EmisSsoRequest(BaseModel):
    emisAuthCode: str


# --- Syllabus Models ---
class LockToggleRequest(BaseModel):
    classId: str = "12-A"
    lockActive: bool = True
    enrichmentPreviewAllowed: bool = False
    teacherId: Optional[str] = "T-TN-48291"
    notes: Optional[str] = ""


class LockToggleResponse(BaseModel):
    status: str = "updated"
    lockActive: bool
    enrichmentPreviewAllowed: bool
    timestamp: str
    auditId: str


class SubtopicStatusRequest(BaseModel):
    classId: str = "12-A"
    subtopicId: str
    newStatus: str
    completionDate: Optional[str] = None


class SubtopicStatusResponse(BaseModel):
    status: str = "success"
    subtopicId: str
    newStatus: str
    eligibleForPaperGeneration: bool


# --- Resource Hub Models ---
class ResourceImportRequest(BaseModel):
    title: str
    type: str = "Model Question Paper"
    medium: str = "Tamil & English"
    sourceUrl: Optional[str] = None
    fileBase64OrUrl: Optional[str] = None


class ResourceImportResponse(BaseModel):
    status: str = "queued_for_ocr"
    resourceId: str
    estimatedExtractionTimeSeconds: int = 45


# --- Question Bank Models ---
class RubricStep(BaseModel):
    step: str
    marks: float


class QuestionCreateRequest(BaseModel):
    id: Optional[str] = None
    code: Optional[str] = None
    chapterId: int = 1
    chapterTitle: Optional[str] = None
    topic: str
    marks: int = 2
    type: str = "Short Answer"
    difficulty: Optional[str] = "Medium"
    questionEn: str
    questionTa: Optional[str] = None
    source: Optional[str] = "Teacher Created"
    historicalExam: Optional[str] = "Class 12 Diagnostic Pool"
    learningOutcome: Optional[str] = None
    rubric: Optional[List[Dict[str, Any]]] = None
    answerKey: Optional[str] = ""


# --- Paper Generator Models ---
class PaperBlueprint(BaseModel):
    part1_1M_MCQ: Optional[int] = 10
    part2_2M_Short: Optional[int] = 5
    part3_3M_Brief: Optional[int] = 5
    part4_5M_Long: Optional[int] = 3


class DifficultyMix(BaseModel):
    easy: Optional[int] = 30
    medium: Optional[int] = 50
    hard: Optional[int] = 20


class PaperGenerateRequest(BaseModel):
    title: Optional[str] = "Class 12 Mid-Term Examination — Mathematics"
    classId: Optional[str] = "12-A"
    testType: Optional[str] = "Mid-Term"
    subject: Optional[str] = None
    totalMarks: Optional[int] = 50
    durationMinutes: Optional[int] = 90
    duration: Optional[int] = None
    language: Optional[str] = "bilingual"
    blueprint: Optional[Dict[str, Any]] = None
    taughtTopicsOnly: Optional[bool] = True
    enrichmentPreviewAllowed: Optional[bool] = False
    includeBookBackRatio: Optional[float] = 0.6
    bookBackRatio: Optional[int] = 60
    includePublicExamQuestions: Optional[bool] = True
    includePublicExamArchives: Optional[bool] = True
    includePublicExamArchive: Optional[bool] = None
    difficultyMix: Optional[Dict[str, int]] = None


class PaperRegenerateRequest(BaseModel):
    paperId: str
    currentQuestionId: str
    reason: Optional[str] = "Teacher prefers alternative equivalent question"


# --- Evaluation Models ---
class ScanUploadRequest(BaseModel):
    testId: str = "TEST-UT2-MAT"
    studentId: str = "STD-12A-14"
    scanFileBase64: Optional[str] = None


class EvaluationApproveRequest(BaseModel):
    finalApprovedMarks: float
    teacherAdjustmentNotes: Optional[str] = ""
    teacherId: Optional[str] = "T-TN-48291"


# --- Marks Management Models ---
class BatchMarksImportRequest(BaseModel):
    testId: str = "TEST-UT2-MAT"
    csvRows: List[Dict[str, Any]]


# --- Remedial Learning Models ---
class RemedialGenerateRequest(BaseModel):
    studentId: Optional[str] = "STD-12A-14"
    conceptTarget: str = "Cofactor Matrix Signs & Adjoint Evaluation"
    questionCount: Optional[int] = 5
    includeWorkedExamples: Optional[bool] = True
    language: Optional[str] = "bilingual"


# --- Homework Models ---
class HomeworkCreateRequest(BaseModel):
    classId: str = "12-A"
    title: str = "Chapter 1 & 2 Adjoint & De Moivre Homework Drill"
    dueDate: Optional[str] = "2024-11-15"
    targetedStudentIds: Optional[List[str]] = Field(default_factory=list)
    questionIds: Optional[List[str]] = Field(default_factory=list)

