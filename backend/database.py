"""
ExamIQ Backend - In-Memory Database & TN State Board Domain Data
Provides persistent runtime data store for syllabus, question bank, resources,
students, evaluations, marks, and audit logs.
"""

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

# --- School & User Data ---
SCHOOL_DATA = {
    "schools": [
        {
            "id": "33240100201",
            "name": "Govt Model Higher Secondary School, Madurai",
            "district": "Madurai",
            "type": "Government Model"
        },
        {
            "id": "33020300412",
            "name": "Presidency Girls Higher Secondary School, Chennai",
            "district": "Chennai",
            "type": "Government Aided"
        },
        {
            "id": "33120500819",
            "name": "Govt Boys Higher Secondary School, Coimbatore",
            "district": "Coimbatore",
            "type": "Government"
        },
        {
            "id": "33150200104",
            "name": "St. Joseph Higher Secondary School, Tiruchirappalli",
            "district": "Tiruchirappalli",
            "type": "Government Aided"
        }
    ],
    "academicYear": "2024–2025",
    "currentTerm": "Term 2 (HSC Pre-Board Cycle)",
    "classes": [
        {
            "id": "12-A",
            "name": "Class 12-A",
            "stream": "Academic - Science (Maths, Physics, Chemistry, Biology)",
            "studentsCount": 46,
            "medium": "Dual (English & Tamil)"
        },
        {
            "id": "12-B",
            "name": "Class 12-B",
            "stream": "Academic - Science (Maths, Physics, Chemistry, Comp Sci)",
            "studentsCount": 44,
            "medium": "English"
        },
        {
            "id": "12-C",
            "name": "Class 12-C",
            "stream": "Academic - Commerce (Accountancy, Commerce, Economics, BM)",
            "studentsCount": 42,
            "medium": "Tamil"
        },
        {
            "id": "12-V1",
            "name": "Class 12-V1",
            "stream": "Vocational - Electrical Machines & Appliances",
            "studentsCount": 35,
            "medium": "Dual (English & Tamil)"
        },
        {
            "id": "12-V2",
            "name": "Class 12-V2",
            "stream": "Vocational - Automobile Technology",
            "studentsCount": 38,
            "medium": "Dual (English & Tamil)"
        }
    ],
    "currentUser": {
        "id": "T-TN-48291",
        "name": "K. Meenakshi Sundaram",
        "nameTamil": "கே. மீனாட்சி சுந்தரம்",
        "role": "teacher",
        "department": "Department of Mathematics & Vocational Science",
        "email": "meenakshi.pgt@tnschools.gov.in",
        "schoolId": "33240100201",
        "schoolName": "Govt Model HSS, Madurai",
        "classesAssigned": ["12-A", "12-B"],
        "initials": "KM"
    }
}

# --- Structured Syllabus Hierarchy ---
INITIAL_SYLLABUS_DATA = [
    {
        "chapterId": 1,
        "volume": "Vol 1",
        "code": "TN-MAT-C12-01",
        "title": "Applications of Matrices and Determinants",
        "titleTamil": "அணிகள் மற்றும் அணிக்கோவைகளின் பயன்பாடுகள்",
        "totalTopics": 5,
        "completedTopics": 5,
        "status": "completed",
        "teachingHours": 16,
        "subtopics": [
            {
                "id": "1.1",
                "title": "Rank of a Matrix (Row Echelon Form & Minor Method)",
                "titleTamil": "அணியின் தரம் (ஏறுபடி வடிவம்)",
                "status": "revised",
                "taughtDate": "2024-07-12",
                "weightage": "5 Marks",
                "bookBackCount": 14,
                "inExamBank": True
            },
            {
                "id": "1.2",
                "title": "Inverse of a Non-Singular Square Matrix by Adjoint Method",
                "titleTamil": "சேர்ப்பு அணி முறையில் நேர்மாறு அணி காணல்",
                "status": "completed",
                "taughtDate": "2024-07-22",
                "weightage": "5 Marks",
                "bookBackCount": 18,
                "inExamBank": True
            },
            {
                "id": "1.3",
                "title": "Applications to System of Linear Equations (Matrix Inversion)",
                "titleTamil": "நேரியல் சமன்பாட்டுத் தொகுப்புகள் (அணி நேர்மாறு)",
                "status": "completed",
                "taughtDate": "2024-08-04",
                "weightage": "5 Marks",
                "bookBackCount": 12,
                "inExamBank": True
            },
            {
                "id": "1.4",
                "title": "Cramer's Rule for Solving Linear Systems",
                "titleTamil": "கிரேமரின் விதி",
                "status": "revised",
                "taughtDate": "2024-08-14",
                "weightage": "3 & 5 Marks",
                "bookBackCount": 16,
                "inExamBank": True
            },
            {
                "id": "1.5",
                "title": "Gaussian Elimination Method",
                "titleTamil": "காசியன் நீக்கல் முறை",
                "status": "completed",
                "taughtDate": "2024-08-25",
                "weightage": "5 Marks",
                "bookBackCount": 10,
                "inExamBank": True
            }
        ]
    },
    {
        "chapterId": 2,
        "volume": "Vol 1",
        "code": "TN-MAT-C12-02",
        "title": "Complex Numbers",
        "titleTamil": "கலப்பு எண்கள்",
        "totalTopics": 4,
        "completedTopics": 4,
        "status": "completed",
        "teachingHours": 14,
        "subtopics": [
            {
                "id": "2.1",
                "title": "Basic Algebraic Properties & Modulus of Complex Numbers",
                "titleTamil": "கலப்பு எண்களின் பண்புகள் மற்றும் மட்டு மதிப்பு",
                "status": "completed",
                "taughtDate": "2024-09-02",
                "weightage": "2 & 3 Marks",
                "bookBackCount": 20,
                "inExamBank": True
            },
            {
                "id": "2.2",
                "title": "Geometric Representation & Triangle Inequality",
                "titleTamil": "முக்கோண சமனின்மை",
                "status": "completed",
                "taughtDate": "2024-09-10",
                "weightage": "3 Marks",
                "bookBackCount": 8,
                "inExamBank": True
            },
            {
                "id": "2.3",
                "title": "Polar Form & Euler's Form of Complex Numbers",
                "titleTamil": "துருவ வடிவம்",
                "status": "revised",
                "taughtDate": "2024-09-18",
                "weightage": "3 & 5 Marks",
                "bookBackCount": 15,
                "inExamBank": True
            },
            {
                "id": "2.4",
                "title": "De Moivre's Theorem and its Applications (Roots of Unity)",
                "titleTamil": "டி மாய்வரின் தேற்றம் மற்றும் ஒன்றின் படிமூலங்கள்",
                "status": "completed",
                "taughtDate": "2024-09-28",
                "weightage": "5 Marks",
                "bookBackCount": 18,
                "inExamBank": True
            }
        ]
    },
    {
        "chapterId": 3,
        "volume": "Vol 1",
        "code": "TN-MAT-C12-03",
        "title": "Theory of Equations",
        "titleTamil": "சமன்பாட்டியல்",
        "totalTopics": 3,
        "completedTopics": 3,
        "status": "completed",
        "teachingHours": 10,
        "subtopics": [
            {
                "id": "3.1",
                "title": "Vieta's Formulas and Formation of Polynomial Equations",
                "titleTamil": "வியேட்டாவின் சூத்திரங்கள்",
                "status": "completed",
                "taughtDate": "2024-10-04",
                "weightage": "2 & 3 Marks",
                "bookBackCount": 12,
                "inExamBank": True
            },
            {
                "id": "3.2",
                "title": "Polynomials with Real and Imaginary Roots (Conjugate Root Theorem)",
                "titleTamil": "இணை மூலங்கள் தேற்றம்",
                "status": "completed",
                "taughtDate": "2024-10-12",
                "weightage": "3 Marks",
                "bookBackCount": 10,
                "inExamBank": True
            },
            {
                "id": "3.3",
                "title": "Descartes Rule of Signs",
                "titleTamil": "டெகார்டேயின் குறி விதி",
                "status": "completed",
                "taughtDate": "2024-10-18",
                "weightage": "2 & 3 Marks",
                "bookBackCount": 8,
                "inExamBank": True
            }
        ]
    },
    {
        "chapterId": 4,
        "volume": "Vol 1",
        "code": "TN-MAT-C12-04",
        "title": "Inverse Trigonometric Functions",
        "titleTamil": "நேர்மாறு முக்கோணவியல் சார்புகள்",
        "totalTopics": 3,
        "completedTopics": 2,
        "status": "partially_completed",
        "teachingHours": 12,
        "subtopics": [
            {
                "id": "4.1",
                "title": "Principal Domain and Range of Inverse Functions",
                "titleTamil": "முதன்மை சார்பகமும் வீச்சகமும்",
                "status": "completed",
                "taughtDate": "2024-10-24",
                "weightage": "2 & 3 Marks",
                "bookBackCount": 16,
                "inExamBank": True
            },
            {
                "id": "4.2",
                "title": "Properties of Inverse Trigonometric Functions",
                "titleTamil": "நேர்மாறு முக்கோணவியல் சார்புகளின் பண்புகள்",
                "status": "completed",
                "taughtDate": "2024-10-29",
                "weightage": "3 & 5 Marks",
                "bookBackCount": 22,
                "inExamBank": True
            },
            {
                "id": "4.3",
                "title": "Sum and Difference Identities for arctan, arcsin, arccos",
                "titleTamil": "கூட்டல் கழித்தல் முற்றொருமைகள்",
                "status": "in_progress",
                "taughtDate": None,
                "weightage": "5 Marks",
                "bookBackCount": 14,
                "inExamBank": False
            }
        ]
    },
    {
        "chapterId": 5,
        "volume": "Vol 1",
        "code": "TN-MAT-C12-05",
        "title": "Two Dimensional Analytical Geometry - II",
        "titleTamil": "இரு பரிமாண பகுமுறை வடிவியல் - II",
        "totalTopics": 4,
        "completedTopics": 0,
        "status": "not_started",
        "teachingHours": 18,
        "subtopics": [
            {
                "id": "5.1",
                "title": "Circle and System of Circles",
                "titleTamil": "வட்டம் மற்றும் வட்டங்களின் தொகுப்பு",
                "status": "not_started",
                "taughtDate": None,
                "weightage": "3 Marks",
                "bookBackCount": 12,
                "inExamBank": False
            },
            {
                "id": "5.2",
                "title": "Conics: Parabola, Ellipse, Hyperbola Standard Equations",
                "titleTamil": "கூம்பு வெட்டுகள்: பரவளையம், நீள்வட்டம், அதிபரவளையம்",
                "status": "not_started",
                "taughtDate": None,
                "weightage": "5 Marks",
                "bookBackCount": 24,
                "inExamBank": False
            },
            {
                "id": "5.3",
                "title": "Tangents and Normals to Conics",
                "titleTamil": "தொடுகோடுகள் மற்றும் செங்கோடுகள்",
                "status": "not_started",
                "taughtDate": None,
                "weightage": "5 Marks",
                "bookBackCount": 16,
                "inExamBank": False
            },
            {
                "id": "5.4",
                "title": "Real-world Applications of Conic Sections (Reflectors, Suspension bridges)",
                "titleTamil": "கூம்பு வெட்டுகளின் நடைமுறைப் பயன்பாடுகள்",
                "status": "not_started",
                "taughtDate": None,
                "weightage": "5 Marks",
                "bookBackCount": 14,
                "inExamBank": False
            }
        ]
    },
    {
        "chapterId": 6,
        "volume": "Vol 1",
        "code": "TN-MAT-C12-06",
        "title": "Applications of Vector Algebra",
        "titleTamil": "வெக்டர் இயற்கணிதத்தின் பயன்பாடுகள்",
        "totalTopics": 4,
        "completedTopics": 0,
        "status": "not_started",
        "teachingHours": 16,
        "subtopics": [
            {
                "id": "6.1",
                "title": "Scalar Triple Product and Vector Triple Product",
                "titleTamil": "திசையிலி மற்றும் வெக்டர் முப்பெருக்கம்",
                "status": "not_started",
                "taughtDate": None,
                "weightage": "3 & 5 Marks",
                "bookBackCount": 15,
                "inExamBank": False
            },
            {
                "id": "6.2",
                "title": "Jacobi and Lagrange Identities",
                "titleTamil": "ஜாகோபி மற்றும் லெக்ராஞ்சி முற்றொருமைகள்",
                "status": "not_started",
                "taughtDate": None,
                "weightage": "3 Marks",
                "bookBackCount": 8,
                "inExamBank": False
            },
            {
                "id": "6.3",
                "title": "Vector and Cartesian Equations of Straight Lines in 3D",
                "titleTamil": "முப்பரிமாணத்தில் நேர்க்கோடுகளின் சமன்பாடுகள்",
                "status": "not_started",
                "taughtDate": None,
                "weightage": "5 Marks",
                "bookBackCount": 18,
                "inExamBank": False
            },
            {
                "id": "6.4",
                "title": "Vector and Cartesian Equations of Planes",
                "titleTamil": "தளங்களின் சமன்பாடுகள்",
                "status": "not_started",
                "taughtDate": None,
                "weightage": "5 Marks",
                "bookBackCount": 20,
                "inExamBank": False
            }
        ]
    },
    {
        "chapterId": 7,
        "volume": "Vol 2",
        "code": "TN-MAT-C12-07",
        "title": "Applications of Differential Calculus",
        "titleTamil": "வகை நுண்கணிதத்தின் பயன்பாடுகள்",
        "totalTopics": 5,
        "completedTopics": 0,
        "status": "not_started",
        "teachingHours": 20,
        "subtopics": [
            {
                "id": "7.1",
                "title": "Meaning of Derivative & Rates of Change",
                "titleTamil": "வகையீட்டின் பொருள் மற்றும் மாறுபாட்டு வீதம்",
                "status": "not_started",
                "taughtDate": None,
                "weightage": "2 & 3 Marks",
                "bookBackCount": 12,
                "inExamBank": False
            },
            {
                "id": "7.2",
                "title": "Mean Value Theorem & Rolles Theorem",
                "titleTamil": "ரோலின் தேற்றம் மற்றும் இடைமதிப்புத் தேற்றம்",
                "status": "not_started",
                "taughtDate": None,
                "weightage": "3 Marks",
                "bookBackCount": 14,
                "inExamBank": False
            },
            {
                "id": "7.3",
                "title": "Series Expansions: Taylor and Maclaurin Series",
                "titleTamil": "டெய்லர் மற்றும் மெக்லாரின் தொடர்கள்",
                "status": "not_started",
                "taughtDate": None,
                "weightage": "3 & 5 Marks",
                "bookBackCount": 10,
                "inExamBank": False
            },
            {
                "id": "7.4",
                "title": "Indeterminate Forms and L'Hopital's Rule",
                "titleTamil": "தேரப் பெறாத வடிவங்கள் மற்றும் லோபிதாலின் விதி",
                "status": "not_started",
                "taughtDate": None,
                "weightage": "2 & 3 Marks",
                "bookBackCount": 16,
                "inExamBank": False
            },
            {
                "id": "7.5",
                "title": "Maxima and Minima, Optimization Problems",
                "titleTamil": "மீப்பெரு மற்றும் மீச்சிறு மதிப்புகள்",
                "status": "not_started",
                "taughtDate": None,
                "weightage": "5 Marks",
                "bookBackCount": 22,
                "inExamBank": False
            }
        ]
    }
]

# --- Question Bank Repository ---
INITIAL_QUESTION_BANK_DATA = [
    {
        "id": "Q-MAT-0101",
        "code": "TN-MAT-12-0101",
        "chapterId": 1,
        "chapterTitle": "Applications of Matrices and Determinants",
        "topic": "Rank of a Matrix",
        "marks": 2,
        "type": "Short Answer",
        "difficulty": "Easy",
        "questionEn": "Find the rank of the matrix A = [[2, -4], [-1, 2]] using elementary row operations.",
        "questionTa": "தொடக்க நிலை உருமாற்றங்களைப் பயன்படுத்தி A = [[2, -4], [-1, 2]] என்ற அணியின் தரத்தைக் காண்க.",
        "source": "Book-Back Exercise 1.2, Q.1(ii)",
        "historicalExam": "March 2020 Public Exam",
        "learningOutcome": "Apply elementary row transformations to reduce to row-echelon form and evaluate rank.",
        "rubric": [
            {"step": "Row operation R2 -> 2R2 + R1", "marks": 1.0},
            {"step": "Row echelon form [[2, -4], [0, 0]] and Rank rho(A) = 1", "marks": 1.0}
        ],
        "answerKey": "rho(A) = 1 since there is only 1 non-zero row in echelon form.",
        "ocrConfidence": 99.2,
        "status": "Approved",
        "tags": ["Echelon Form", "Rank", "Book-Back"]
    },
    {
        "id": "Q-MAT-0102",
        "code": "TN-MAT-12-0102",
        "chapterId": 1,
        "chapterTitle": "Applications of Matrices and Determinants",
        "topic": "Inverse by Adjoint Method",
        "marks": 5,
        "type": "Long Answer",
        "difficulty": "Medium",
        "questionEn": "If A = [[-8, 1, 4], [4, 4, 7], [1, -8, 4]], prove that A^-1 = (1/9) A^T and hence find A^-1.",
        "questionTa": "A = [[-8, 1, 4], [4, 4, 7], [1, -8, 4]] எனில், A^-1 = (1/9) A^T என நிறுவுக. இதிலிருந்து A^-1 காண்க.",
        "source": "Book-Back Exercise 1.1, Q.8",
        "historicalExam": "March 2023 Public Exam (Compulsory Option)",
        "learningOutcome": "Evaluate determinant, adjoint matrix, orthogonality and inverse of a 3x3 matrix.",
        "rubric": [
            {"step": "Computing |A| = -729 != 0", "marks": 1.0},
            {"step": "Computing transpose matrix A^T", "marks": 1.0},
            {"step": "Matrix multiplication A * A^T = 81 * I_3", "marks": 1.5},
            {"step": "Deducing A^-1 = (1/81) A^T = (1/9) * (A^T / 9) and final value", "marks": 1.5}
        ],
        "answerKey": "A^-1 = 1/9 * [[-8, 4, 1], [1, 4, -8], [4, 7, 4]]",
        "ocrConfidence": 98.7,
        "status": "Approved",
        "tags": ["Adjoint", "Matrix Inverse", "HOTS", "Public Exam 2023"]
    },
    {
        "id": "Q-MAT-0103",
        "code": "TN-MAT-12-0103",
        "chapterId": 1,
        "chapterTitle": "Applications of Matrices and Determinants",
        "topic": "Cramer's Rule",
        "marks": 5,
        "type": "Long Answer",
        "difficulty": "Medium",
        "questionEn": "Solve the system of linear equations by Cramer's rule: 3x + 3y - z = 11, 2x - y + 2z = 9, 4x + 3y + 2z = 25.",
        "questionTa": "கிரேமரின் விதியைப் பயன்படுத்தி சமன்பாடுகளின் தொகுப்பைத் தீர்க்க: 3x + 3y - z = 11, 2x - y + 2z = 9, 4x + 3y + 2z = 25.",
        "source": "Book-Back Exercise 1.4, Q.1(i)",
        "historicalExam": "August 2022 Supplementary Exam",
        "learningOutcome": "Calculate determinants Delta, Delta_x, Delta_y, Delta_z and solve consistent system.",
        "rubric": [
            {"step": "Determinant Delta = -22 != 0", "marks": 1.0},
            {"step": "Delta_x = -44, x = Delta_x / Delta = 2", "marks": 1.5},
            {"step": "Delta_y = -66, y = Delta_y / Delta = 3", "marks": 1.5},
            {"step": "Delta_z = -88, z = Delta_z / Delta = 4", "marks": 1.0}
        ],
        "answerKey": "x = 2, y = 3, z = 4",
        "ocrConfidence": 99.5,
        "status": "Approved",
        "tags": ["Cramer Rule", "Determinants", "Linear Equations"]
    },
    {
        "id": "Q-MAT-0201",
        "code": "TN-MAT-12-0201",
        "chapterId": 2,
        "chapterTitle": "Complex Numbers",
        "topic": "Triangle Inequality",
        "marks": 3,
        "type": "Short Answer",
        "difficulty": "Medium",
        "questionEn": "For any two complex numbers z1 and z2, state and prove the Triangle Inequality |z1 + z2| <= |z1| + |z2|.",
        "questionTa": "ஏதேனும் இரு கலப்பு எண்கள் z1 மற்றும் z2-விற்கு முக்கோண சமனின்மை |z1 + z2| <= |z1| + |z2| என நிறுவுக.",
        "source": "SCERT Textbook Vol 1, Page 68, Theorem 2.1",
        "historicalExam": "March 2022 Public Exam",
        "learningOutcome": "Geometric and algebraic proof of modulus properties and complex conjugates.",
        "rubric": [
            {"step": "State |z1 + z2|^2 = (z1 + z2)(conjugate(z1) + conjugate(z2))", "marks": 1.0},
            {"step": "Expand and use Re(z) <= |z| relation", "marks": 1.0},
            {"step": "Obtain (|z1| + |z2|)^2 and take square root", "marks": 1.0}
        ],
        "answerKey": "|z1 + z2| <= |z1| + |z2|",
        "ocrConfidence": 97.9,
        "status": "Approved",
        "tags": ["Modulus", "Triangle Inequality", "Core Theorem"]
    },
    {
        "id": "Q-MAT-0202",
        "code": "TN-MAT-12-0202",
        "chapterId": 2,
        "chapterTitle": "Complex Numbers",
        "topic": "De Moivre's Theorem",
        "marks": 5,
        "type": "Long Answer",
        "difficulty": "Hard",
        "questionEn": "Simplify [(1 + sin(pi/10) + i cos(pi/10)) / (1 + sin(pi/10) - i cos(pi/10))]^10.",
        "questionTa": "[(1 + sin(pi/10) + i cos(pi/10)) / (1 + sin(pi/10) - i cos(pi/10))]^10 -ன் மதிப்பைக் காண்க.",
        "source": "SCERT Textbook Vol 1, Ex 2.8, Q.4",
        "historicalExam": "March 2024 Public Exam (HOTS)",
        "learningOutcome": "Convert Cartesian/polar trigonometric forms, apply conjugate substitution and De Moivre exponentiation.",
        "rubric": [
            {"step": "Let z = sin(pi/10) + i cos(pi/10), recognize 1/z = sin(pi/10) - i cos(pi/10)", "marks": 1.5},
            {"step": "Numerator/denominator simplification to z^10", "marks": 1.5},
            {"step": "Applying De Moivre to (cos(2pi/5) + i sin(2pi/5))^10", "marks": 1.0},
            {"step": "Final value = -1", "marks": 1.0}
        ],
        "answerKey": "-1",
        "ocrConfidence": 98.4,
        "status": "Approved",
        "tags": ["De Moivre", "Polar Form", "HOTS", "Public Exam 2024"]
    },
    {
        "id": "Q-MAT-0301",
        "code": "TN-MAT-12-0301",
        "chapterId": 3,
        "chapterTitle": "Theory of Equations",
        "topic": "Descartes Rule of Signs",
        "marks": 2,
        "type": "Short Answer",
        "difficulty": "Easy",
        "questionEn": "Discuss the maximum number of positive and negative real roots of the polynomial P(x) = 9x^9 - 4x^8 + 4x^7 - 3x^6 + 2x^5 + x^3 + 7x^2 + 7x + 2.",
        "questionTa": "P(x) = 9x^9 - 4x^8 + 4x^7 - 3x^6 + 2x^5 + x^3 + 7x^2 + 7x + 2 என்ற பல்லுறுப்புக் கோவைக்கு அதிகபட்ச மிகை மற்றும் குறை மூலங்களின் எண்ணிக்கையை ஆராய்க.",
        "source": "Book-Back Exercise 3.6, Q.1",
        "historicalExam": "March 2023 Public Exam",
        "learningOutcome": "Analyze sign changes in P(x) and P(-x) using Descartes rule.",
        "rubric": [
            {"step": "Number of sign variations in P(x) = 4, max positive roots = 4", "marks": 1.0},
            {"step": "Sign variations in P(-x) = 1, max negative roots = 1", "marks": 1.0}
        ],
        "answerKey": "Max positive real roots = 4, max negative real roots = 1.",
        "ocrConfidence": 99.8,
        "status": "Approved",
        "tags": ["Descartes Rule", "Polynomial Roots", "Book-Back"]
    },
    {
        "id": "Q-VOC-0101",
        "code": "TN-VOC-EMA-01",
        "chapterId": 101,
        "chapterTitle": "Electrical Machines and Appliances (Vocational)",
        "topic": "Single Phase Induction Motor Starting Methods",
        "marks": 5,
        "type": "Vocational Theory & Practical",
        "difficulty": "Medium",
        "questionEn": "Explain with a neat circuit diagram the construction and working of a Capacitor-Start Capacitor-Run Induction Motor. List three workshop safety precautions.",
        "questionTa": "மின்தேக்கி தொடக்க மற்றும் இயங்கு ஒற்றைக்கட்ட தூண்டல் மோட்டாரின் அமைப்பு மற்றும் வேலை செய்யும் விதத்தை தெளிவான மின்சுற்று வரைபடத்துடன் விளக்குக. 3 பணிமனை பாதுகாப்பு விதிகளைக் குறிப்பிடுக.",
        "source": "DGE Vocational Syllabus Manual 2024-25, Trade Code 452",
        "historicalExam": "Vocational Public Examination March 2024",
        "learningOutcome": "Trace dual capacitor phase splitting circuits and enforce T&CP workshop standards.",
        "rubric": [
            {"step": "Schematic wiring diagram with centrifugal switch", "marks": 2.0},
            {"step": "Explanation of starting torque and running characteristics", "marks": 2.0},
            {"step": "Three valid workshop safety precautions", "marks": 1.0}
        ],
        "answerKey": "Schematic, phase split angle near 90 degrees, rubber matting & earthing verification.",
        "ocrConfidence": 96.5,
        "status": "Approved",
        "tags": ["Vocational", "Electrical", "Practical Rubric", "Trade Theory"]
    }
]

# --- Resource Hub Data ---
RESOURCE_HUB_DATA = {
    "stats": {
        "totalAssets": 14820,
        "termAdditions": 680,
        "ocrFidelity": "99.4%",
        "publicArchivesYears": "5 Years (2019–2024)",
        "syllabusAligned": "100% TN-SCERT"
    },
    "resources": [
        {
            "id": "res-scert-mat-v1-en",
            "title": "SCERT Class 12 Mathematics (Volume 1) — English Medium",
            "titleTamil": "வகுப்பு 12 கணிதம் (தொகுதி 1) — ஆங்கில வழி",
            "type": "Official SCERT Textbook",
            "code": "TN-TEXT-MAT-12-V1-EN",
            "edition": "2024–25 Revised Edition",
            "publisher": "State Council of Educational Research & Training, Tamil Nadu",
            "chaptersCount": 6,
            "totalPages": 298,
            "fileSize": "42.4 MB",
            "ocrStatus": "OCR Completed (100%)",
            "confidence": 99.4,
            "sourceUrl": "https://textbookcorp.tn.gov.in/mat12_v1_en.pdf",
            "allowedForAI": True,
            "badgeColor": "#3525cd"
        },
        {
            "id": "res-scert-mat-v1-ta",
            "title": "SCERT Class 12 Mathematics (Volume 1) — Tamil Medium",
            "titleTamil": "வகுப்பு 12 கணிதம் (தொகுதி 1) — தமிழ் வழி",
            "type": "Official SCERT Textbook",
            "code": "TN-TEXT-MAT-12-V1-TA",
            "edition": "2024–25 Revised Edition",
            "publisher": "State Council of Educational Research & Training, Tamil Nadu",
            "chaptersCount": 6,
            "totalPages": 312,
            "fileSize": "45.1 MB",
            "ocrStatus": "OCR Completed (100%)",
            "confidence": 99.1,
            "sourceUrl": "https://textbookcorp.tn.gov.in/mat12_v1_ta.pdf",
            "allowedForAI": True,
            "badgeColor": "#006b5f"
        },
        {
            "id": "res-pub-2024-mar-keys",
            "title": "March 2024 Public Examination Official Question Paper & Stepwise Rubrics",
            "titleTamil": "மார்ச் 2024 பொதுத் தேர்வு வினாத்தாள் மற்றும் அதிகாரப்பூர்வ விடைக்குறிப்பு",
            "type": "5-Year Public Exam Archive",
            "code": "DGE-HSC-PUB-2024-MAR",
            "edition": "March 2024 Session",
            "publisher": "Directorate of Government Examinations (DGE), Chennai",
            "chaptersCount": 12,
            "totalPages": 36,
            "fileSize": "8.2 MB",
            "ocrStatus": "Indexed with LaTeX Math",
            "confidence": 99.8,
            "sourceUrl": "https://dge.tn.gov.in/archive/hsc_march_2024_keys.pdf",
            "allowedForAI": True,
            "badgeColor": "#684000"
        },
        {
            "id": "res-scert-voc-ema",
            "title": "Vocational Trade Manual: Electrical Machines and Appliances (Theory & Practical)",
            "titleTamil": "தொழிற்கல்வி பாடநூல்: மின்சார இயந்திரங்கள் மற்றும் சாதனங்கள்",
            "type": "Vocational Trade Manual",
            "code": "TN-VOC-TRADE-452",
            "edition": "2024 Edition",
            "publisher": "TN SCERT & Directorate of Technical Education",
            "chaptersCount": 8,
            "totalPages": 240,
            "fileSize": "31.8 MB",
            "ocrStatus": "OCR Completed (96.5%)",
            "confidence": 96.5,
            "sourceUrl": "https://dge.tn.gov.in/voc/ema_curriculum.pdf",
            "allowedForAI": True,
            "badgeColor": "#4f46e5"
        }
    ],
    "versionDiff": {
        "baseEdition": "2023–24 SCERT Syllabus",
        "currentEdition": "2024–25 SCERT Revised Syllabus",
        "lastAuditedDate": "24 Oct 2024",
        "auditedBy": "Curriculum Committee (HOD Mathematics)",
        "changes": [
            {
                "type": "removed",
                "chapter": "Chapter 1: Matrices",
                "topic": "Rank of 4x4 matrix reduced echelon exercises (Exercise 1.2 Q6)",
                "rationale": "Streamlined to focus on standard 3x3 systems and practical computational efficiency for Class 12 Board exams."
            },
            {
                "type": "added",
                "chapter": "Chapter 2: Complex Numbers",
                "topic": "Real-world AC Circuit Impedance representation examples (Page 74)",
                "rationale": "Interdisciplinary bridge between Class 12 Physics (Alternating Currents) and Mathematics."
            },
            {
                "type": "modified",
                "chapter": "Chapter 4: Inverse Trig",
                "topic": "Principal value branch limits notation standardized with NCERT parity",
                "rationale": "Eliminates discrepancies for students appearing in both TN State Board and competitive entrance tests."
            }
        ]
    }
}

# --- Student Learning DNA Data ---
STUDENTS_DATA = [
    {
        "id": "STD-12A-01",
        "rollNo": "12101",
        "emisId": "33240100201201",
        "name": "Ananya S.",
        "nameTamil": "அனன்யா எஸ்.",
        "overallPercentage": 94.2,
        "attendance": "98%",
        "rank": 1,
        "learningDna": {
            "matricesMastery": 96,
            "complexNumbersMastery": 92,
            "theoryOfEquations": 95,
            "inverseTrig": 94,
            "accuracyRate": "96.2%",
            "stepwiseAdherence": "98%",
            "learningGaps": [],
            "strengths": ["Adjoint Matrix Calculation", "De Moivre's Proofs", "Vieta's Higher Degree Polynomials"],
            "recommendedAction": "Provide Advanced Olympiad / JEE Enrichment problems on Conics and Vectors."
        }
    },
    {
        "id": "STD-12A-14",
        "rollNo": "12114",
        "emisId": "33240100201214",
        "name": "K. Vignesh",
        "nameTamil": "கே. விக்னேஷ்",
        "overallPercentage": 62.4,
        "attendance": "91%",
        "rank": 29,
        "learningDna": {
            "matricesMastery": 54,
            "complexNumbersMastery": 68,
            "theoryOfEquations": 70,
            "inverseTrig": 58,
            "accuracyRate": "68.5%",
            "stepwiseAdherence": "58%",
            "learningGaps": [
                {
                    "concept": "Cofactor Matrix Sign Transposition (A_ij)",
                    "severity": "Critical",
                    "frequency": "4 out of 5 tests",
                    "evidence": "Drops marks on Step 2 of Adjoint Method by confusing (-1)^(i+j) signs in off-diagonal terms."
                },
                {
                    "concept": "Polar Form Modulus Angle Conversion (Arg z)",
                    "severity": "Moderate",
                    "frequency": "2 tests",
                    "evidence": "Inverts principal quadrant signs when computing arg(z) for negative real and imaginary parts."
                }
            ],
            "strengths": ["Vieta's Formulas", "Basic Modulus calculations"],
            "recommendedAction": "Generate Targeted 5-question micro-remedial drill on 3x3 Cofactor Sign Matrices."
        }
    },
    {
        "id": "STD-12A-23",
        "rollNo": "12123",
        "emisId": "33240100201223",
        "name": "M. Kavitha",
        "nameTamil": "எம். கவிதா",
        "overallPercentage": 78.5,
        "attendance": "94%",
        "rank": 15,
        "learningDna": {
            "matricesMastery": 82,
            "complexNumbersMastery": 74,
            "theoryOfEquations": 80,
            "inverseTrig": 76,
            "accuracyRate": "81.0%",
            "stepwiseAdherence": "85%",
            "learningGaps": [
                {
                    "concept": "Euler to Cartesian Trigonometric Reduction",
                    "severity": "Minor",
                    "frequency": "1 test",
                    "evidence": "Slight hesitation during roots of unity expansions."
                }
            ],
            "strengths": ["Matrix Rank Row Echelon", "Cramer Rule Determinants"],
            "recommendedAction": "Maintain current practice schedule with weekly consolidation tests."
        }
    },
    {
        "id": "STD-12A-35",
        "rollNo": "12135",
        "emisId": "33240100201235",
        "name": "R. Rajesh",
        "nameTamil": "ஆர். ராஜேஷ்",
        "overallPercentage": 58.0,
        "attendance": "86%",
        "rank": 38,
        "learningDna": {
            "matricesMastery": 51,
            "complexNumbersMastery": 60,
            "theoryOfEquations": 65,
            "inverseTrig": 52,
            "accuracyRate": "64.0%",
            "stepwiseAdherence": "52%",
            "learningGaps": [
                {
                    "concept": "Gaussian Elimination Back Substitution",
                    "severity": "Critical",
                    "frequency": "3 tests",
                    "evidence": "Arithmetic calculation slips in fractional matrix rows."
                }
            ],
            "strengths": ["Descartes Rule of Signs"],
            "recommendedAction": "Enroll in Peer Study Group with Ananya S. & review worked solution videos in Tamil."
        }
    }
]

# --- Answer Evaluations Samples ---
ANSWER_EVALUATION_SAMPLES = [
    {
        "evaluationId": "EVAL-2024-UT2-014",
        "studentId": "STD-12A-14",
        "studentName": "K. Vignesh",
        "rollNo": "12114",
        "testName": "Unit Test 2 — Matrices & Complex Numbers",
        "questionCode": "TN-MAT-12-0102",
        "questionTextEn": "If A = [[-8, 1, 4], [4, 4, 7], [1, -8, 4]], prove that A^-1 = (1/9) A^T and hence find A^-1.",
        "maxMarks": 5.0,
        "aiSuggestedMarks": 3.5,
        "teacherApprovedMarks": 3.5,
        "status": "Pending Review",
        "confidenceScore": 94.2,
        "confidenceTier": "High",
        "extractedTextTamilEn": "Step 1: Given matrix A. |A| = -729... Product A*A^T = 81 I_3...",
        "stepwiseBreakdown": [
            {
                "stepNo": 1,
                "description": "Determinant |A| calculated correctly (-729 != 0)",
                "maxMarks": 1.0,
                "aiMarks": 1.0,
                "verified": True
            },
            {
                "stepNo": 2,
                "description": "Transpose A^T written accurately",
                "maxMarks": 1.0,
                "aiMarks": 1.0,
                "verified": True
            },
            {
                "stepNo": 3,
                "description": "Product A * A^T evaluated to 81 I_3 with working",
                "maxMarks": 1.5,
                "aiMarks": 1.5,
                "verified": True
            },
            {
                "stepNo": 4,
                "description": "Rigorous derivation of A^-1 = (1/9) A^T and final answer substitution",
                "maxMarks": 1.5,
                "aiMarks": 0.0,
                "verified": False,
                "note": "Calculation concluded at (1/81) A^T without linking 9^2 formulation specified in question."
            }
        ]
    }
]

# --- Vocational Modules Data ---
VOCATIONAL_MODULES_DATA = [
    {
        "tradeCode": "452",
        "name": "Electrical Machines and Appliances",
        "nameTamil": "மின்சார இயந்திரங்கள் மற்றும் சாதனங்கள்",
        "enrolledStudents": 35,
        "modules": [
            {
                "id": "MOD-EMA-01",
                "title": "Single Phase and Three Phase Transformers",
                "status": "Completed",
                "practicalHours": 24,
                "theoryHours": 16
            },
            {
                "id": "MOD-EMA-02",
                "title": "AC & DC Motor Starters & Maintenance",
                "status": "In Progress",
                "practicalHours": 30,
                "theoryHours": 20
            },
            {
                "id": "MOD-EMA-03",
                "title": "Domestic Appliances Rewinding & Workshop Safety Standards",
                "status": "Not Started",
                "practicalHours": 20,
                "theoryHours": 12
            }
        ],
        "practicalRubrics": [
            {
                "skill": "Insulation Resistance Testing with Megger",
                "maxMarks": 20,
                "completedStudents": 32
            },
            {
                "skill": "Earth Continuity & Loop Impedance Verification",
                "maxMarks": 20,
                "completedStudents": 30
            },
            {
                "skill": "Star-Delta Starter Wiring and Control Interlock",
                "maxMarks": 30,
                "completedStudents": 22
            },
            {
                "skill": "Workshop Safety & Fire Extinguisher Drill Protocol",
                "maxMarks": 10,
                "completedStudents": 35
            }
        ]
    },
    {
        "tradeCode": "454",
        "name": "Automobile Technology",
        "nameTamil": "தானியங்கி ஊர்தி தொழில்நுட்பம்",
        "enrolledStudents": 38,
        "modules": [
            {
                "id": "MOD-AUT-01",
                "title": "Internal Combustion Engine Overhauling",
                "status": "Completed",
                "practicalHours": 32,
                "theoryHours": 18
            },
            {
                "id": "MOD-AUT-02",
                "title": "Automotive Electrical, Battery and Sensor Diagnostics",
                "status": "In Progress",
                "practicalHours": 28,
                "theoryHours": 16
            }
        ],
        "practicalRubrics": [
            {
                "skill": "Cylinder Bore Measurement using Dial Gauge",
                "maxMarks": 25,
                "completedStudents": 35
            },
            {
                "skill": "Hydraulic Brake Bleeding and Pad Replacement",
                "maxMarks": 25,
                "completedStudents": 31
            }
        ]
    }
]

# --- Assessments & Marks Ledger ---
INITIAL_ASSESSMENTS = [
    {"id": "UT-1", "name": "Unit Test 1 (Matrices & Determinants)", "marks": 25, "duration": "45 mins", "date": "2024-08-20", "status": "Completed", "avgScore": "78.4%"},
    {"id": "UT-2", "name": "Unit Test 2 (Complex Numbers & Equations)", "marks": 25, "duration": "45 mins", "date": "2024-10-15", "status": "Completed", "avgScore": "74.2%"},
    {"id": "UT-3", "name": "Unit Test 3 (Inverse Trig Functions)", "marks": 25, "duration": "45 mins", "date": "2024-11-20", "status": "Scheduled", "avgScore": "-"},
    {"id": "MID-1", "name": "Mid-Term Comprehensive Exam", "marks": 50, "duration": "90 mins", "date": "2024-12-05", "status": "Draft", "avgScore": "-"}
]

INITIAL_MARKS_LEDGER = [
    {"rollNo": "12101", "name": "Ananya S.", "q1": 1, "q2": 2, "q3": 3, "q4": 5, "q5": 5, "total": 16, "maxTotal": 16, "delta": 0.0, "flag": None},
    {"rollNo": "12114", "name": "K. Vignesh", "q1": 1, "q2": 1, "q3": 2, "q4": 4, "q5": 3, "total": 11, "maxTotal": 16, "delta": 0.5, "flag": "AI Delta Review (+0.5)"},
    {"rollNo": "12123", "name": "M. Kavitha", "q1": 1, "q2": 2, "q3": 3, "q4": 4, "q5": 4, "total": 14, "maxTotal": 16, "delta": 0.0, "flag": None},
    {"rollNo": "12135", "name": "R. Rajesh", "q1": 0, "q2": 1, "q3": 2, "q4": 3, "q5": 2, "total": 8, "maxTotal": 16, "delta": -1.0, "flag": "Step 3 Calculation Slip"}
]

INITIAL_AUDIT_LOGS = [
    {
        "id": "LOG-9821",
        "user": "K. Meenakshi Sundaram (PGT)",
        "action": "Enforced Teaching Progress Lock on Class 12-A",
        "time": "10 Nov 2024, 18:30:12",
        "timestamp": "2024-11-10T18:30:12Z",
        "ip": "10.24.1.84",
        "status": "Success"
    },
    {
        "id": "LOG-9820",
        "user": "K. Meenakshi Sundaram (PGT)",
        "action": "Approved Evaluation EVAL-2024-UT2-014 (+0.5 marks adjusted)",
        "time": "10 Nov 2024, 17:15:45",
        "timestamp": "2024-11-10T17:15:45Z",
        "ip": "10.24.1.84",
        "status": "Success"
    },
    {
        "id": "LOG-9819",
        "user": "System AI Engine",
        "action": "DGE March 2024 Answer Keys OCR ingestion completed",
        "time": "10 Nov 2024, 14:02:11",
        "timestamp": "2024-11-10T14:02:11Z",
        "ip": "ELCOT-DC-TN01",
        "status": "Success"
    },
    {
        "id": "LOG-9818",
        "user": "Principal Office",
        "action": "Multi-School Isolation Policy Verified for AY 2024–25",
        "time": "09 Nov 2024, 11:20:00",
        "timestamp": "2024-11-09T11:20:00Z",
        "ip": "10.24.1.10",
        "status": "Success"
    }
]


class Database:
    """In-Memory Thread-Safe State & Database Store."""

    def __init__(self):
        self.school_data = deepcopy(SCHOOL_DATA)
        self.syllabus = deepcopy(INITIAL_SYLLABUS_DATA)
        self.question_bank = deepcopy(INITIAL_QUESTION_BANK_DATA)
        self.resource_hub = deepcopy(RESOURCE_HUB_DATA)
        self.students = deepcopy(STUDENTS_DATA)
        self.evaluations = deepcopy(ANSWER_EVALUATION_SAMPLES)
        self.vocational = deepcopy(VOCATIONAL_MODULES_DATA)
        self.assessments = deepcopy(INITIAL_ASSESSMENTS)
        self.marks_ledger = deepcopy(INITIAL_MARKS_LEDGER)
        self.audit_logs = deepcopy(INITIAL_AUDIT_LOGS)

        # Progress lock state
        self.lock_active: bool = True
        self.enrichment_preview_allowed: bool = False

        # Generated items cache
        self.generated_papers: Dict[str, Any] = {}
        self.homework_assignments: List[Dict[str, Any]] = []

    def get_syllabus(self, class_id: str = "12-A", subject_id: str = "maths") -> Dict[str, Any]:
        return {
            "classId": class_id if class_id != "sample-id" else "12-A",
            "subject": "Mathematics",
            "lockActive": self.lock_active,
            "enrichmentPreviewAllowed": self.enrichment_preview_allowed,
            "chapters": self.syllabus
        }

    def toggle_lock(self, class_id: str, lock_active: bool, enrichment_allowed: bool, teacher_id: str = "T-TN-48291", notes: str = "") -> Dict[str, Any]:
        self.lock_active = lock_active
        self.enrichment_preview_allowed = enrichment_allowed
        audit_id = f"AUDIT-LOCK-{int(datetime.now(timezone.utc).timestamp())}"
        
        # Record audit log
        self.add_audit_log(
            user=f"Teacher ({teacher_id})",
            action=f"{'Enforced' if lock_active else 'Paused'} Teaching Progress Lock on Class {class_id}. Notes: {notes or 'Updated via portal'}"
        )

        return {
            "status": "updated",
            "lockActive": self.lock_active,
            "enrichmentPreviewAllowed": self.enrichment_preview_allowed,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "auditId": audit_id
        }

    def update_subtopic_status(self, class_id: str, subtopic_id: str, new_status: str, completion_date: Optional[str] = None) -> Dict[str, Any]:
        target_subtopic = None
        target_chapter = None
        for chap in self.syllabus:
            for sub in chap.get("subtopics", []):
                if sub["id"] == subtopic_id:
                    target_subtopic = sub
                    target_chapter = chap
                    break
            if target_subtopic:
                break

        if target_subtopic:
            target_subtopic["status"] = new_status
            if new_status in ("completed", "revised"):
                target_subtopic["taughtDate"] = completion_date or datetime.now().strftime("%Y-%m-%d")
            elif new_status == "not_started":
                target_subtopic["taughtDate"] = None

            # Recompute chapter rollups
            completed_count = sum(
                1 for s in target_chapter["subtopics"]
                if s["status"] in ("completed", "revised")
            )
            target_chapter["completedTopics"] = completed_count
            if completed_count == len(target_chapter["subtopics"]):
                target_chapter["status"] = "completed"
            elif completed_count > 0:
                target_chapter["status"] = "partially_completed"
            else:
                target_chapter["status"] = "not_started"

        eligible = new_status in ("completed", "revised")
        return {
            "status": "success",
            "subtopicId": subtopic_id,
            "newStatus": new_status,
            "eligibleForPaperGeneration": eligible
        }

    def get_questions(self, chapter_id: Optional[int] = None, marks: Optional[int] = None,
                      difficulty: Optional[str] = None, q_type: Optional[str] = None,
                      search: Optional[str] = None) -> List[Dict[str, Any]]:
        results = self.question_bank
        if chapter_id is not None:
            results = [q for q in results if q.get("chapterId") == chapter_id]
        if marks is not None:
            results = [q for q in results if q.get("marks") == marks]
        if difficulty and difficulty.lower() != "all":
            results = [q for q in results if q.get("difficulty", "").lower() == difficulty.lower()]
        if q_type and q_type.lower() != "all":
            results = [q for q in results if q_type.lower() in q.get("type", "").lower()]
        if search:
            sq = search.lower()
            results = [
                q for q in results
                if sq in q.get("questionEn", "").lower()
                or sq in q.get("questionTa", "").lower()
                or sq in q.get("code", "").lower()
                or sq in q.get("topic", "").lower()
            ]
        return results

    def add_question(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        new_id = f"Q-MAT-{len(self.question_bank) + 101:04d}"
        created = {
            "id": question_data.get("id") or new_id,
            "code": question_data.get("code") or f"TN-MAT-12-{len(self.question_bank) + 101:04d}",
            "chapterId": question_data.get("chapterId", 1),
            "chapterTitle": question_data.get("chapterTitle") or "Applications of Matrices and Determinants",
            "topic": question_data.get("topic", "Teacher Authored Concept"),
            "marks": question_data.get("marks", 2),
            "type": question_data.get("type", "Short Answer"),
            "difficulty": question_data.get("difficulty", "Medium"),
            "questionEn": question_data.get("questionEn", ""),
            "questionTa": question_data.get("questionTa", ""),
            "source": question_data.get("source", "Teacher Created"),
            "historicalExam": question_data.get("historicalExam", "Class 12 Diagnostic Pool"),
            "learningOutcome": question_data.get("learningOutcome", "Standard TN HSC Curriculum Objective"),
            "rubric": question_data.get("rubric", [
                {"step": "Method and representation", "marks": question_data.get("marks", 2) * 0.4},
                {"step": "Intermediate & final solution", "marks": question_data.get("marks", 2) * 0.6}
            ]),
            "answerKey": question_data.get("answerKey", "Stepwise solution verified."),
            "ocrConfidence": 99.9,
            "status": "Approved",
            "tags": ["Teacher Created", "Custom Question"]
        }
        self.question_bank.insert(0, created)
        return {"status": "created", "questionId": created["id"], "question": created}

    def add_audit_log(self, user: str, action: str, ip: str = "127.0.0.1", status: str = "Success") -> None:
        log_id = f"LOG-{len(self.audit_logs) + 9822}"
        now_dt = datetime.now(timezone.utc)
        self.audit_logs.insert(0, {
            "id": log_id,
            "user": user,
            "action": action,
            "time": now_dt.strftime("%d %b %Y, %H:%M:%S"),
            "timestamp": now_dt.isoformat(),
            "ip": ip,
            "status": status
        })


# Global Database Instance
db = Database()

