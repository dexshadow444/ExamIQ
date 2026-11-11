// API Endpoint Specifications & Contracts for Backend Integration
// External backend base URL is injected by Python (app.py) via window.EXAMIQ_CONFIG.apiBaseUrl

export const API_BASE_URL =
  (typeof window !== 'undefined' && window.EXAMIQ_CONFIG?.apiBaseUrl) ||
  'http://localhost:8000/api/v1';

export const API_ENDPOINTS = [
  {
    category: 'Authentication & EMIS Gateway',
    method: 'POST',
    path: '/auth/login',
    summary: 'Teacher / Staff / Admin login with EMIS Credentials',
    description: 'Authenticates a user against TN EMIS database or school U-DISE registry.',
    requestBody: {
      schoolCode: '33240100201',
      userIdentity: 'meenakshi.pgt@tnschools.gov.in',
      password: 'password123',
      role: 'teacher'
    },
    responseSample: {
      status: 'success',
      token: 'jwt_token_sample_eyJhbGciOi...',
      user: {
        id: 'T-TN-48291',
        name: 'K. Meenakshi Sundaram',
        role: 'teacher',
        schoolId: '33240100201',
        schoolName: 'Govt Model HSS, Madurai',
        classesAssigned: ['12-A', '12-B']
      }
    }
  },
  {
    category: 'Authentication & EMIS Gateway',
    method: 'POST',
    path: '/auth/emis-sso',
    summary: 'TN EMIS State Portal Single Sign-On Callback',
    description: 'Verifies state single sign-on token and initiates authorized session.',
    requestBody: {
      emisAuthCode: 'emis_oauth_code_xyz123'
    },
    responseSample: {
      status: 'success',
      token: 'jwt_token_sample...',
      user: { id: 'T-TN-48291', name: 'K. Meenakshi Sundaram' }
    }
  },
  {
    category: 'Teaching Progress & Lock',
    method: 'GET',
    path: '/syllabus/:classId/:subjectId',
    summary: 'Retrieve Structured Syllabus Hierarchy & Teaching Status',
    description: 'Returns chapter, topic, subtopic hierarchy with completion statuses (not_started, in_progress, completed, revised).',
    parameters: [
      { name: 'classId', type: 'string', example: '12-A' },
      { name: 'subjectId', type: 'string', example: 'maths' }
    ],
    responseSample: {
      classId: '12-A',
      subject: 'Mathematics',
      lockActive: true,
      enrichmentPreviewAllowed: false,
      chapters: [
        {
          chapterId: 1,
          code: 'TN-MAT-C12-01',
          title: 'Applications of Matrices and Determinants',
          status: 'completed',
          subtopics: [
            { id: '1.1', title: 'Rank of a Matrix', status: 'revised', taughtDate: '2024-07-12' },
            { id: '1.2', title: 'Inverse by Adjoint Method', status: 'completed', taughtDate: '2024-07-22' }
          ]
        }
      ]
    }
  },
  {
    category: 'Teaching Progress & Lock',
    method: 'PUT',
    path: '/syllabus/lock/toggle',
    summary: 'Toggle Teaching Progress Lock or Enrichment Preview',
    description: 'Enforces Golden Rule: Prevents untaught topics from appearing in generated test papers.',
    requestBody: {
      classId: '12-A',
      lockActive: true,
      enrichmentPreviewAllowed: false,
      teacherId: 'T-TN-48291',
      notes: 'Locked prior to Mid-term revision cycle'
    },
    responseSample: {
      status: 'updated',
      lockActive: true,
      enrichmentPreviewAllowed: false,
      timestamp: '2024-10-24T10:30:00Z',
      auditId: 'AUDIT-LOCK-9842'
    }
  },
  {
    category: 'Teaching Progress & Lock',
    method: 'POST',
    path: '/syllabus/subtopic/status',
    summary: 'Update Topic / Subtopic Teaching Status',
    description: 'Marks a subtopic as not_started, in_progress, completed, or revised.',
    requestBody: {
      classId: '12-A',
      subtopicId: '4.3',
      newStatus: 'completed',
      completionDate: '2024-11-10'
    },
    responseSample: {
      status: 'success',
      subtopicId: '4.3',
      newStatus: 'completed',
      eligibleForPaperGeneration: true
    }
  },
  {
    category: 'Academic Resource Hub',
    method: 'GET',
    path: '/resources',
    summary: 'List SCERT Textbooks, Public Exam Archives & Guides',
    description: 'Fetches verified curriculum materials with OCR status and metadata filters.',
    parameters: [
      { name: 'stream', type: 'string', example: 'academic' },
      { name: 'medium', type: 'string', example: 'bilingual' },
      { name: 'category', type: 'string', example: 'all' }
    ],
    responseSample: {
      total: 42,
      resources: [
        {
          id: 'res-scert-mat-v1-en',
          title: 'SCERT Class 12 Mathematics (Volume 1) — English Medium',
          code: 'TN-TEXT-MAT-12-V1-EN',
          allowedForAI: true,
          ocrConfidence: 99.4
        }
      ]
    }
  },
  {
    category: 'Academic Resource Hub',
    method: 'POST',
    path: '/resources/import',
    summary: 'Upload and Ingest New Textbook, Model Paper, or Question Set',
    description: 'Uploads PDF/Doc for automated OCR extraction, chapter indexing, and question parsing.',
    requestBody: {
      title: 'DGE Model Paper 2024',
      type: 'Model Question Paper',
      medium: 'Tamil & English',
      sourceUrl: 'https://dge.tn.gov.in/...',
      fileBase64OrUrl: 'data:application/pdf;base64,...'
    },
    responseSample: {
      status: 'queued_for_ocr',
      resourceId: 'res-new-9812',
      estimatedExtractionTimeSeconds: 45
    }
  },
  {
    category: 'Academic Resource Hub',
    method: 'GET',
    path: '/resources/version-diff',
    summary: 'Get Syllabus Differential Audit Comparison',
    description: 'Returns topic-by-topic comparison (Added, Removed, Modified) between syllabus editions.',
    responseSample: {
      baseEdition: '2023–24 SCERT Syllabus',
      currentEdition: '2024–25 SCERT Revised Syllabus',
      changes: [
        { type: 'removed', chapter: 'Chapter 1: Matrices', topic: 'Rank of 4x4 matrix' },
        { type: 'added', chapter: 'Chapter 2: Complex Numbers', topic: 'AC Circuit Impedance representation' }
      ]
    }
  },
  {
    category: 'Question Bank & OCR Engine',
    method: 'GET',
    path: '/questions',
    summary: 'Search and Filter Question Repository',
    description: 'Supports searching by marks (1, 2, 3, 5), HOTS, book-back, Tamil/English keywords, and chapter.',
    parameters: [
      { name: 'chapterId', type: 'integer', example: 1 },
      { name: 'marks', type: 'integer', example: 5 },
      { name: 'difficulty', type: 'string', example: 'Medium' },
      { name: 'type', type: 'string', example: 'Long Answer' }
    ],
    responseSample: {
      totalFound: 184,
      questions: [
        {
          id: 'Q-MAT-0102',
          questionEn: 'If A = [[-8, 1, 4], [4, 4, 7], [1, -8, 4]], prove that A^-1 = (1/9) A^T...',
          questionTa: 'A = [[-8, 1, 4], [4, 4, 7], [1, -8, 4]] எனில், A^-1 = (1/9) A^T என நிறுவுக...',
          marks: 5,
          source: 'Book-Back Exercise 1.1, Q.8'
        }
      ]
    }
  },
  {
    category: 'Question Bank & OCR Engine',
    method: 'POST',
    path: '/questions',
    summary: 'Add / Author New Question with Stepwise Rubric',
    description: 'Creates a teacher-authored or imported question in the repository.',
    requestBody: {
      chapterId: 2,
      topic: 'De Moivre Theorem',
      marks: 5,
      type: 'Long Answer',
      questionEn: 'Prove that...',
      questionTa: 'நிறுவுக...',
      rubric: [{ step: 'Step 1 description', marks: 2.5 }, { step: 'Step 2 description', marks: 2.5 }],
      answerKey: 'Final expression'
    },
    responseSample: {
      status: 'created',
      questionId: 'Q-MAT-NEW-1029'
    }
  },
  {
    category: 'AI Question Paper Generator',
    method: 'POST',
    path: '/papers/generate',
    summary: 'Generate Complete Question Paper via AI Blueprint Engine',
    description: 'Generates a balanced question paper conforming strictly to TN State Board pattern while excluding untaught topics.',
    requestBody: {
      title: 'Class 12 Mid-Term Examination — Mathematics',
      classId: '12-A',
      testType: 'Mid-Term',
      totalMarks: 50,
      durationMinutes: 90,
      language: 'bilingual',
      blueprint: {
        part1_1M_MCQ: 10,
        part2_2M_Short: 5,
        part3_3M_Brief: 5,
        part4_5M_Long: 3
      },
      taughtTopicsOnly: true,
      includeBookBackRatio: 0.6,
      includePublicExamArchives: true,
      difficultyMix: { easy: 30, medium: 50, hard: 20 }
    },
    responseSample: {
      paperId: 'PAPER-2024-MT-089',
      title: 'Class 12 Mid-Term Examination — Mathematics',
      totalMarks: 50,
      durationMinutes: 90,
      lockEnforced: true,
      excludedUntaughtTopics: ['5.1 - 5.4 Conics', '6.1 - 6.4 Vector Algebra'],
      sections: [
        { sectionName: 'Part I', questionType: 'MCQ (1 Mark)', totalMarks: 10, questions: [] },
        { sectionName: 'Part II', questionType: 'Short Answer (2 Marks)', totalMarks: 10, questions: [] },
        { sectionName: 'Part III', questionType: 'Brief Answer (3 Marks)', totalMarks: 15, questions: [] },
        { sectionName: 'Part IV', questionType: 'Long Answer (5 Marks)', totalMarks: 15, questions: [] }
      ],
      stepwiseMarkingScheme: []
    }
  },
  {
    category: 'AI Question Paper Generator',
    method: 'POST',
    path: '/papers/regenerate-question',
    summary: 'Swap / Regenerate Individual Question in Paper',
    description: 'Suggests alternative equivalent question testing identical concept and difficulty.',
    requestBody: {
      paperId: 'PAPER-2024-MT-089',
      currentQuestionId: 'Q-MAT-0102',
      reason: 'Teacher prefers application-oriented variant'
    },
    responseSample: {
      status: 'success',
      replacementQuestion: {
        id: 'Q-MAT-0103',
        questionEn: "Solve the system of linear equations by Cramer's rule...",
        marks: 5
      }
    }
  },
  {
    category: 'AI Answer Evaluation',
    method: 'POST',
    path: '/evaluations/upload-scan',
    summary: 'Upload Scanned Answer Sheet Image / PDF for AI OCR & Scoring',
    description: 'Extracts handwritten Tamil & English answers, maps to question numbers, and computes rubrics.',
    requestBody: {
      testId: 'TEST-UT2-MAT',
      studentId: 'STD-12A-14',
      scanFileBase64: 'data:image/jpeg;base64,...'
    },
    responseSample: {
      evaluationId: 'EVAL-2024-UT2-014',
      studentName: 'K. Vignesh',
      confidenceScore: 94.2,
      extractedTextTamilEn: 'Step 1: Given matrix A. |A| = -729...',
      suggestedMarks: 3.5,
      maxMarks: 5.0,
      rubricFeedback: [
        { stepNo: 1, marks: 1.0, comment: 'Determinant correct' },
        { stepNo: 4, marks: 0.0, comment: 'Missed final factor relationship' }
      ]
    }
  },
  {
    category: 'AI Answer Evaluation',
    method: 'PUT',
    path: '/evaluations/:evaluationId/approve',
    summary: 'Teacher Approves or Adjusts AI Evaluation Marks',
    description: 'Records teacher sign-off with audit trail and marks history.',
    parameters: [{ name: 'evaluationId', type: 'string', example: 'EVAL-2024-UT2-014' }],
    requestBody: {
      finalApprovedMarks: 4.0,
      teacherAdjustmentNotes: 'Partial credit for writing correct intermediate transpose formula',
      teacherId: 'T-TN-48291'
    },
    responseSample: {
      status: 'approved',
      evaluationId: 'EVAL-2024-UT2-014',
      finalApprovedMarks: 4.0,
      discrepancyDelta: +0.5,
      auditTimestamp: '2024-11-10T14:20:00Z'
    }
  },
  {
    category: 'Marks Management',
    method: 'GET',
    path: '/marks/:classId/:testId',
    summary: 'Get Class Marks Grid with Discrepancy Flags',
    description: 'Returns question-wise and total marks for all enrolled students with AI vs Teacher delta.',
    parameters: [
      { name: 'classId', type: 'string', example: '12-A' },
      { name: 'testId', type: 'string', example: 'UT2' }
    ],
    responseSample: {
      classAverage: 74.2,
      totalStudents: 46,
      students: [
        { rollNo: '12101', name: 'Ananya S.', totalMarks: 49, maxMarks: 50, flags: [] },
        { rollNo: '12114', name: 'K. Vignesh', totalMarks: 31, maxMarks: 50, flags: ['AI-Teacher Delta: +0.5'] }
      ]
    }
  },
  {
    category: 'Marks Management',
    method: 'POST',
    path: '/marks/batch-import',
    summary: 'Import Marks from CSV or Excel Spreadsheet',
    description: 'Validates roll numbers, computes section totals, and flags arithmetic discrepancies.',
    requestBody: {
      testId: 'TEST-UT2-MAT',
      csvRows: [{ rollNo: '12101', q1: 1, q2: 2, q3: 3, q4: 5, q5: 5, total: 49 }]
    },
    responseSample: {
      status: 'imported',
      rowsProcessed: 46,
      discrepanciesDetected: 0
    }
  },
  {
    category: 'Student Learning DNA & Remedial',
    method: 'GET',
    path: '/students/:studentId/learning-dna',
    summary: 'Get Granular Student Learning DNA Profile',
    description: 'Returns concept-level mastery scores, persistent misconceptions, and accuracy indicators.',
    parameters: [{ name: 'studentId', type: 'string', example: 'STD-12A-14' }],
    responseSample: {
      studentId: 'STD-12A-14',
      name: 'K. Vignesh',
      conceptMastery: {
        matrices: 54,
        complexNumbers: 68,
        theoryOfEquations: 70,
        inverseTrig: 58
      },
      diagnosedMisconceptions: [
        {
          concept: 'Cofactor Matrix Sign Transposition (A_ij)',
          evidence: 'Drops marks on Step 2 of Adjoint Method by confusing (-1)^(i+j) signs.'
        }
      ],
      recommendedIntervention: 'Generate targeted 5-question micro-remedial drill.'
    }
  },
  {
    category: 'Student Learning DNA & Remedial',
    method: 'POST',
    path: '/remedial/generate-drill',
    summary: 'Generate AI Personalized Remedial Worksheet',
    description: 'Generates foundation-level and equivalent practice questions for diagnosed weak concepts.',
    requestBody: {
      studentId: 'STD-12A-14',
      conceptTarget: 'Cofactor Matrix Signs & Adjoint Evaluation',
      questionCount: 5,
      includeWorkedExamples: true,
      language: 'bilingual'
    },
    responseSample: {
      drillId: 'DRILL-REM-014-MAT',
      studentName: 'K. Vignesh',
      concept: 'Cofactor Matrix Sign Transposition',
      workedExample: {
        problem: 'Find cofactor matrix of [[1, 2], [3, 4]] with step-by-step sign rule explanation.',
        solutionTamilEn: 'Step 1: Write sign grid (+ - / - +)...'
      },
      questions: [{ id: 'REM-Q1', question: 'Evaluate cofactor A_12 for matrix...', marks: 2 }],
      scheduledDueDate: '2024-11-14'
    }
  },
  {
    category: 'AI Homework Generator',
    method: 'POST',
    path: '/homework/create',
    summary: 'Create Differentiated or Class-Wide Homework Assignment',
    description: 'Generates weak-topic or chapter-wise assignments with automatic submission tracking.',
    requestBody: {
      classId: '12-A',
      title: 'Chapter 1 & 2 Adjoint & De Moivre Homework Drill',
      dueDate: '2024-11-15',
      targetedStudentIds: ['STD-12A-14', 'STD-12A-35'],
      questionIds: ['Q-MAT-0101', 'Q-MAT-0201']
    },
    responseSample: {
      homeworkId: 'HW-2024-W10-01',
      status: 'assigned',
      totalAssigned: 2
    }
  },
  {
    category: 'Vocational Education Intelligence',
    method: 'GET',
    path: '/vocational/:tradeCode',
    summary: 'Get Vocational Trade Modules & Workshop Rubrics',
    description: 'Retrieves trade syllabus, practical rubrics, and skill assessment logs.',
    parameters: [{ name: 'tradeCode', type: 'string', example: '452' }],
    responseSample: {
      tradeName: 'Electrical Machines and Appliances',
      practicalRubrics: [{ skill: 'Insulation Resistance Testing with Megger', maxMarks: 20 }]
    }
  },
  {
    category: 'Reports & Analytics',
    method: 'GET',
    path: '/reports/class-summary/:classId',
    summary: 'Generate Comprehensive Class Curricular Progress & Mark Reports',
    description: 'Produces data for printable PDF progress cards and departmental review.',
    parameters: [{ name: 'classId', type: 'string', example: '12-A' }],
    responseSample: {
      classId: '12-A',
      averageScore: 74.2,
      topPerformers: ['Ananya S. (94.2%)'],
      prioritySupportCount: 9,
      syllabusCompletedPercentage: 68
    }
  },
  {
    category: 'Admin & Security',
    method: 'GET',
    path: '/admin/audit-logs',
    summary: 'Retrieve System Audit Trails',
    description: 'Tracks teacher approvals, mark adjustments, lock overrides, and login activity.',
    responseSample: {
      totalLogs: 1240,
      logs: [
        { id: 'LOG-891', user: 'K. Meenakshi Sundaram', action: 'Approved Evaluation EVAL-2024-UT2-014', timestamp: '2024-11-10T14:20:00Z' },
        { id: 'LOG-890', user: 'System AI Engine', action: 'Progress Lock Guard Enforced on Paper Gen', timestamp: '2024-11-10T10:15:00Z' }
      ]
    }
  }
];
