// API Client for Frontend-Backend Communication
// Supports 'mock' mode (standalone frontend simulation) and 'live' mode (calls external backend via fetch)

import { API_BASE_URL } from './endpoints.js';
import {
  SCHOOL_DATA,
  INITIAL_SYLLABUS_DATA,
  INITIAL_QUESTION_BANK_DATA,
  RESOURCE_HUB_DATA,
  STUDENTS_DATA,
  ANSWER_EVALUATION_SAMPLES,
  VOCATIONAL_MODULES_DATA
} from '../data/mockData.js';

export const getApiMode = () => localStorage.getItem('examiq_api_mode') || 'mock';
export const setApiMode = (mode) => localStorage.setItem('examiq_api_mode', mode);
export const getAuthToken = () => localStorage.getItem('examiq_auth_token') || '';
export const setAuthToken = (token) => localStorage.setItem('examiq_auth_token', token || '');

async function requestJson(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const apiClient = {
  async login(credentials) {
    if (getApiMode() === 'live') {
      try {
        const res = await requestJson('/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials)
        });
        if (res.token) setAuthToken(res.token);
        return res;
      } catch (err) {
        console.warn('Live login failed, falling back to mock auth:', err);
      }
    }
    return {
      status: 'success',
      token: 'jwt_mock_token_tn_emis_2024',
      user: {
        ...SCHOOL_DATA.currentUser,
        role: credentials.role || 'admin'
      }
    };
  },

  async getSyllabus(classId = '12-A', subjectId = 'maths') {
    if (getApiMode() === 'live') {
      try {
        return await requestJson(`/syllabus/${encodeURIComponent(classId)}/${encodeURIComponent(subjectId)}`);
      } catch (err) {
        console.warn('Live API error, using mock syllabus:', err);
      }
    }
    return INITIAL_SYLLABUS_DATA;
  },

  async toggleProgressLock(payload) {
    if (getApiMode() === 'live') {
      try {
        return await requestJson('/syllabus/lock/toggle', {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Live lock toggle fallback:', err);
      }
    }
    return { status: 'updated', ...payload };
  },

  async updateSubtopicStatus(payload) {
    if (getApiMode() === 'live') {
      try {
        return await requestJson('/syllabus/subtopic/status', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Live subtopic update fallback:', err);
      }
    }
    return { status: 'success', ...payload };
  },

  async getResources(filters = {}) {
    if (getApiMode() === 'live') {
      try {
        const q = new URLSearchParams(filters).toString();
        return await requestJson(`/resources${q ? '?' + q : ''}`);
      } catch (err) {
        console.warn('Live resources fallback:', err);
      }
    }
    return RESOURCE_HUB_DATA;
  },

  async importResource(payload) {
    if (getApiMode() === 'live') {
      try {
        return await requestJson('/resources/import', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Live import fallback:', err);
      }
    }
    return { status: 'queued_for_ocr', resourceId: `res-new-${Date.now().toString().slice(-4)}` };
  },

  async getQuestions(filters = {}) {
    if (getApiMode() === 'live') {
      try {
        const q = new URLSearchParams(filters).toString();
        return await requestJson(`/questions${q ? '?' + q : ''}`);
      } catch (err) {
        console.warn('Live questions fallback:', err);
      }
    }
    return INITIAL_QUESTION_BANK_DATA;
  },

  async addQuestion(payload) {
    if (getApiMode() === 'live') {
      try {
        return await requestJson('/questions', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Live add question fallback:', err);
      }
    }
    return { status: 'created', questionId: `Q-MAT-NEW-${Date.now().toString().slice(-4)}` };
  },

  async generatePaper(payload, taughtChaptersCount = 4) {
    if (getApiMode() === 'live') {
      try {
        return await requestJson('/papers/generate', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Live paper gen fallback:', err);
      }
    }
    return {
      paperId: `TN-HSC-PAPER-${Date.now().toString().slice(-4)}`,
      title: payload.title || 'Class 12 Higher Secondary Examination',
      academicYear: '2024–2025',
      subject: 'Mathematics (வகுப்பு 12 கணிதம்)',
      totalMarks: payload.totalMarks || 50,
      durationMinutes: payload.durationMinutes || 90,
      lockEnforced: payload.taughtTopicsOnly !== false,
      eligibleChaptersCount: taughtChaptersCount,
      sections: [
        {
          name: 'Part I (பகுதி I)',
          instructions: 'Answer all questions. Each question carries 1 mark.',
          questions: [
            {
              no: 1,
              textEn: 'If A is a non-singular matrix of order 3x3, then |adj A| is equal to:',
              textTa: 'A என்பது 3x3 வரிசையுடைய பூஜ்ஜியமற்ற அணிக்கோவை எனில் |adj A| என்பது:',
              marks: 1,
              type: 'MCQ',
              options: ['|A|', '|A|^2', '|A|^3', '3|A|'],
              answer: '|A|^2'
            },
            {
              no: 2,
              textEn: 'The value of i + i^2 + i^3 + i^4 is:',
              textTa: 'i + i^2 + i^3 + i^4 -ன் மதிப்பு:',
              marks: 1,
              type: 'MCQ',
              options: ['0', '1', '-1', 'i'],
              answer: '0'
            },
            {
              no: 3,
              textEn: 'A polynomial equation in x of degree n has exactly:',
              textTa: 'n படியுள்ள ஒரு பல்லுறுப்புக் கோவை சமன்பாட்டிற்கு எத்தனை மூலங்கள் இருக்கும்?',
              marks: 1,
              type: 'MCQ',
              options: ['n roots', '1 root', '2n roots', 'infinite roots'],
              answer: 'n roots'
            }
          ]
        },
        {
          name: 'Part II (பகுதி II)',
          instructions: 'Answer any 3 questions. Question No. 6 is compulsory. (2 Marks each)',
          questions: [
            { no: 4, textEn: 'Find the rank of the matrix [[2, -4], [-1, 2]].', textTa: '[[2, -4], [-1, 2]] என்ற அணியின் தரத்தைக் காண்க.', marks: 2, type: 'Short', chapter: 'Ch 1: Matrices' },
            { no: 5, textEn: 'Simplify: (1 + i)^18.', textTa: '(1 + i)^18 -ன் மதிப்பைக் காண்க.', marks: 2, type: 'Short', chapter: 'Ch 2: Complex Numbers' },
            { no: 6, isCompulsory: true, textEn: 'Form a polynomial equation with integer coefficients having sqrt(5) - sqrt(3) as a root.', textTa: 'sqrt(5) - sqrt(3) என்பதை ஒரு மூலமாகக் கொண்ட முழு எண் கெழுக்களுடைய பல்லுறுப்புக் கோவை சமன்பாட்டைக் காண்க.', marks: 2, type: 'Short', chapter: 'Ch 3: Theory of Equations' }
          ]
        },
        {
          name: 'Part III (பகுதி III)',
          instructions: 'Answer any 2 questions. (3 Marks each)',
          questions: [
            { no: 7, textEn: 'State and prove the Triangle Inequality for any two complex numbers.', textTa: 'இரு கலப்பு எண்களுக்கு முக்கோண சமனின்மையை எழுதி நிறுவுக.', marks: 3, type: 'Brief', chapter: 'Ch 2: Complex Numbers' },
            { no: 8, textEn: "Solve: 2x - y = 5, 3x + 2y = 11 using Cramer's Rule.", textTa: 'கிரேமரின் விதியைப் பயன்படுத்தித் தீர்க்க: 2x - y = 5, 3x + 2y = 11.', marks: 3, type: 'Brief', chapter: 'Ch 1: Matrices' }
          ]
        },
        {
          name: 'Part IV (பகுதி IV)',
          instructions: 'Answer all questions, choosing either (a) or (b). (5 Marks each)',
          questions: [
            {
              no: 9,
              isEitherOr: true,
              textEn: '(a) If A = [[-8, 1, 4], [4, 4, 7], [1, -8, 4]], prove that A^-1 = (1/9) A^T.\nOR\n(b) Solve by Gauss Elimination: 2x - 2y + 3z = 2, x + 2y - z = 3, 3x - y + 2z = 1.',
              textTa: '(அ) A = [[-8, 1, 4], [4, 4, 7], [1, -8, 4]] எனில் A^-1 = (1/9) A^T என நிறுவுக.\nஅல்லது\n(ஆ) காசியன் நீக்கல் முறையில் தீர்க்க: 2x - 2y + 3z = 2, x + 2y - z = 3, 3x - y + 2z = 1.',
              marks: 5,
              type: 'Long',
              chapter: 'Ch 1: Matrices'
            },
            {
              no: 10,
              isEitherOr: true,
              textEn: '(a) Simplify [(1 + sin(pi/10) + i cos(pi/10)) / (1 + sin(pi/10) - i cos(pi/10))]^10.\nOR\n(b) Find all cube roots of sqrt(3) + i.',
              textTa: '(அ) [(1 + sin(pi/10) + i cos(pi/10)) / (1 + sin(pi/10) - i cos(pi/10))]^10 -ன் மதிப்பைக் காண்க.\nஅல்லது\n(ஆ) sqrt(3) + i -ன் மூன்றாம் படி மூலங்களை காண்க.',
              marks: 5,
              type: 'Long',
              chapter: 'Ch 2: Complex Numbers'
            }
          ]
        }
      ]
    };
  },

  async approveEvaluation(evaluationId, payload) {
    if (getApiMode() === 'live') {
      try {
        return await requestJson(`/evaluations/${encodeURIComponent(evaluationId)}/approve`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Live approve evaluation fallback:', err);
      }
    }
    return { status: 'approved', evaluationId, ...payload };
  },

  async generateRemedialDrill(payload) {
    if (getApiMode() === 'live') {
      try {
        return await requestJson('/remedial/generate-drill', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Live remedial fallback:', err);
      }
    }
    return {
      drillId: 'DRILL-2024-REM-04',
      concept: payload.conceptTarget,
      studentTarget: 'K. Vignesh & 4 others',
      targetTime: '15 Minutes',
      workedExample: {
        title: 'Concept Clarification: The Sign Matrix in 3x3 Cofactors',
        formula: 'A_ij = (-1)^(i+j) * M_ij',
        explanationEn: 'Remember that the sign checkerboard matrix [[+, -, +], [-, +, -], [+, -, +]] must be applied before or during cofactor computation. In Step 2, students commonly miss the negative sign for A_12, A_21, A_23, and A_32.',
        explanationTa: '3x3 அணியின் இணைக்காரணி அணியைக் காணும்போது குறி அணி [[+, -, +], [-, +, -], [+, -, +]]-ஐ கவனத்தில் கொள்ள வேண்டும். A_12, A_21, A_23, A_32 உறுப்புகளுக்கு குறை குறி கட்டாயம் வரும்.'
      },
      practiceQuestions: [
        {
          id: 'Q-REM-1',
          textEn: 'For matrix A = [[1, 2], [3, 4]], find the cofactor of element a_12.',
          textTa: 'A = [[1, 2], [3, 4]] என்ற அணியில் a_12 உறுப்பின் இணைக்காரணியைக் காண்க.',
          marks: 1,
          answer: 'A_12 = (-1)^(1+2) * (3) = -3'
        },
        {
          id: 'Q-REM-2',
          textEn: 'Evaluate the cofactor matrix and hence adj(A) for A = [[2, 1, 3], [0, 4, -1], [1, 2, 0]].',
          textTa: 'A = [[2, 1, 3], [0, 4, -1], [1, 2, 0]] என்ற அணியின் இணைக்காரணி அணி மற்றும் சேர்ப்பு அணி காண்க.',
          marks: 3,
          answer: 'adj(A) = [[2, 6, -13], [-1, -3, 2], [-4, -3, 8]]'
        }
      ]
    };
  },

  async getStudentDNA(studentId = 'STD-12A-14') {
    if (getApiMode() === 'live') {
      try {
        return await requestJson(`/students/${encodeURIComponent(studentId)}/learning-dna`);
      } catch (err) {
        console.warn('Live student DNA fallback:', err);
      }
    }
    return STUDENTS_DATA.find((s) => s.id === studentId) || STUDENTS_DATA[1];
  },

  async getEvaluations() {
    return ANSWER_EVALUATION_SAMPLES;
  },

  async getVocationalData() {
    return VOCATIONAL_MODULES_DATA;
  },

  async getDatasetStatus() {
    if (getApiMode() === 'live') {
      try {
        return await requestJson('/dataset/status');
      } catch (err) {
        console.warn('Live dataset status fallback:', err);
      }
    }
    return {
      status: 'ready',
      total_files_found: 35,
      files_ingested: 35,
      total_canonical_questions: 1361,
      repeated_questions_detected: 51,
      questions_with_diagrams: 73,
      needs_review_count: 17,
      questions_by_year: { '2021': 283, '2022': 273, '2023': 273, '2024': 267, '2025': 265 },
      questions_by_subject: {
        'Physics': 186,
        'Chemistry': 187,
        'Commerce': 224,
        'Accountancy': 220,
        'Computer Science': 180,
        'Computer Applications': 181,
        'Automobile Technology': 183
      },
      questions_by_marks: { '1 Marks': 543, '2 Marks': 311, '3 Marks': 318, '5 Marks': 189 }
    };
  },

  async regenerateQuestion(payload) {
    if (getApiMode() === 'live') {
      try {
        return await requestJson('/papers/regenerate-question', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Live regenerate question fallback:', err);
      }
    }
    return {
      status: 'success',
      replacementQuestion: {
        id: 'Q-MOCK-SWAP',
        no: Number(payload.currentQuestionId) || 1,
        textEn: 'An alternative standard TN HSC examination question.',
        textTa: 'மாற்று தமிழ்நாடு மேல்நிலை தேர்வு வினா.',
        marks: 2,
        type: 'Short',
        answer: 'Verified solution step'
      }
    };
  },

  getExportUrl(paperId, format = 'pdf', includeAnswers = false) {
    return `${API_BASE_URL}/papers/${encodeURIComponent(paperId)}/export/${format}?include_answers=${includeAnswers}`;
  },

  async testEndpoint(ep) {
    if (getApiMode() === 'live') {
      const resolvedPath = ep.path.replace(/:([a-zA-Z]+)/g, 'sample-id');
      const fullUrl = `${API_BASE_URL}${resolvedPath}`;
      try {
        const opts = {
          method: ep.method,
          headers: { 'Content-Type': 'application/json' }
        };
        if (ep.requestBody && (ep.method === 'POST' || ep.method === 'PUT')) {
          opts.body = JSON.stringify(ep.requestBody);
        }
        const res = await fetch(fullUrl, opts);
        const data = await res.json();
        return {
          status: res.status,
          statusText: res.statusText,
          source: 'Live Backend Server',
          data
        };
      } catch (err) {
        return {
          status: 'Connection Refused',
          error: err.message,
          hint: `Ensure backend is running at ${API_BASE_URL} and CORS allows origin ${window.location.origin}.`,
          simulatedFallback: ep.responseSample
        };
      }
    }
    return {
      status: 200,
      statusText: 'OK (Simulated Contract Response)',
      source: 'In-Browser Contract Engine',
      data: ep.responseSample
    };
  }
};
