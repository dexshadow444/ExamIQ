// Central Application State Store & Shared Utilities

import {
  SCHOOL_DATA,
  INITIAL_SYLLABUS_DATA,
  INITIAL_QUESTION_BANK_DATA,
  RESOURCE_HUB_DATA,
  INITIAL_ASSESSMENTS,
  INITIAL_MARKS_LEDGER,
  ANSWER_EVALUATION_SAMPLES,
  STUDENTS_DATA
} from './data/mockData.js';
import { getApiMode, setApiMode } from './api/client.js';
import { API_ENDPOINTS } from './api/endpoints.js';

const clone = (obj) => JSON.parse(JSON.stringify(obj));

export const TAB_GROUP_MAP = {
  dashboard: null,
  'teaching-progress': 'curriculum',
  'resource-hub': 'curriculum',
  'question-bank': 'curriculum',
  'paper-generator': 'exams',
  'tests-and-assessments': 'exams',
  'answer-evaluation': 'exams',
  'marks-management': 'exams',
  'student-insights': 'intelligence',
  'remedial-and-homework': 'intelligence',
  'vocational-module': 'intelligence',
  'reports-center': 'system',
  'admin-and-security': 'system',
  'api-explorer': 'system'
};

export const appState = {
  isLoggedIn: false,
  currentRole: 'admin',
  activeTab: 'dashboard',
  language: localStorage.getItem('app-language') === 'ta' ? 'ta' : 'en',
  currentSchool: SCHOOL_DATA.schools[0],
  currentClass: SCHOOL_DATA.classes[0],
  progressLockActive: true,
  enrichmentPreview: false,
  apiMode: getApiMode(),
  searchModalOpen: false,
  notificationsOpen: false,
  headerMenuOpen: null,
  mobileSidebarOpen: false,
  sidebarOpenGroups: {
    curriculum: true,
    exams: false,
    intelligence: false,
    system: false
  },
  toasts: [],
  pendingEvalCount: 12,
  lockedPaperQuestions: [],
  paperVariantOffsets: {},

  // Persistent domain state across views
  notifications: [
    {
      id: 1,
      title: 'New DGE Answer Keys Indexed',
      desc: 'March 2024 Public Examination rubrics ready for evaluation.',
      time: '10m ago',
      unread: true
    },
    {
      id: 2,
      title: 'Progress Lock Verification Reminder',
      desc: 'Term 2 cutoff in 4 days. 2 topics pending sign-off.',
      time: '1h ago',
      unread: true
    },
    {
      id: 3,
      title: 'Evaluation Queue Alert',
      desc: '12 handwritten answer sheets waiting for teacher review.',
      time: '3h ago',
      unread: false
    }
  ],
  chapters: clone(INITIAL_SYLLABUS_DATA),
  expandedChapter: 1,
  questions: clone(INITIAL_QUESTION_BANK_DATA),
  expandedQuestion: INITIAL_QUESTION_BANK_DATA[0].id,
  resources: clone(RESOURCE_HUB_DATA.resources),
  assessments: clone(INITIAL_ASSESSMENTS),
  marksLedger: clone(INITIAL_MARKS_LEDGER),
  evaluations: clone(ANSWER_EVALUATION_SAMPLES),
  selectedStudentId: STUDENTS_DATA[1].id,

  // View-local state preserved cleanly
  dashboardRecs: [
    {
      id: 1,
      type: 'critical',
      badge: 'Critical Diagnostic Alert • Unit Test 2',
      chapter: 'Ch 1: Matrices',
      title: '38% students struggled with Question 17 (Inverse by Adjoint Method)',
      evidence: '18 of 46 students dropped marks specifically on the cofactor matrix transposition calculation (A_ij sign convention in Step 2).',
      plan: 'Generate a targeted 5-question micro-remedial drill (15 min) and schedule a 20-min concept revision in Period 3 tomorrow.'
    },
    {
      id: 2,
      type: 'pacing',
      badge: 'Pacing Risk • Half-Yearly Cutoff',
      chapter: 'Ch 7: Diff Calc',
      title: 'Differential Calculus (Chapter 7) is 2 lectures behind board schedule',
      evidence: 'State Board milestone requires completion of Tangents, Normals & Mean Value Theorems by Friday to maintain alignment with district common tests.',
      plan: 'Auto-adjust weekly homework plan to integrate 6 Tangents & Normals practice problems directly from the March 2023 TN Public Exam bank.'
    }
  ],
  dashboardTopicFilter: 'all',

  paperConfig: {
    title: 'Class 12 Mid-Term Assessment — Mathematics',
    totalMarks: 50,
    durationMinutes: 90,
    language: 'bilingual',
    bookBackRatio: 60,
    includePublicExamQuestions: true
  },
  generatedPaper: null,
  paperPreviewTab: 'paper',
  paperGenerating: false,

  selectedEndpointIdx: 0,
  apiCategory: 'All',
  apiSnippetTab: 'curl',
  apiTestResult: null,
  apiTesting: false,

  remedialConcept: 'Cofactor Matrix Sign Transposition (18 students)',
  generatedDrill: null,
  remedialGenerating: false,

  selectedTradeCode: '452',
  reportType: 'class-summary'
};

let renderCallback = null;
export const registerRenderer = (fn) => {
  renderCallback = fn;
};

export const triggerRender = () => {
  if (renderCallback) renderCallback();
};

export const setLanguage = (lang) => {
  appState.language = lang === 'ta' ? 'ta' : 'en';
  appState.headerMenuOpen = null;
  document.documentElement.lang = appState.language;
  localStorage.setItem('app-language', appState.language);
  showToast(lang === 'ta' ? 'மொழி தமிழாக மாற்றப்பட்டது' : 'Language switched to English', 'info');
  triggerRender();
};

export const switchApiMode = (mode) => {
  setApiMode(mode);
  appState.apiMode = mode;
  appState.headerMenuOpen = null;
  showToast(`Switched API mode to: ${mode.toUpperCase()}`, 'info');
  triggerRender();
};

export const setActiveTab = (tabId) => {
  appState.activeTab = tabId;
  appState.mobileSidebarOpen = false;
  appState.notificationsOpen = false;
  appState.headerMenuOpen = null;
  const groupKey = TAB_GROUP_MAP[tabId];
  if (groupKey) {
    appState.sidebarOpenGroups[groupKey] = true;
  }
  triggerRender();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export const showToast = (message, type = 'success', duration = 3500) => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  appState.toasts.push({ id, message, type });
  renderToasts();
  setTimeout(() => {
    appState.toasts = appState.toasts.filter((t) => String(t.id) !== String(id));
    renderToasts();
  }, duration);
};

export const renderToasts = () => {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const iconNames = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    warning: 'warning'
  };
  root.innerHTML = appState.toasts
    .map(
      (t) => `
      <div class="toast toast-${escapeHtml(t.type)}">
        <div class="flex-row" style="gap:0.45rem;flex-wrap:nowrap;">
          <span class="material-symbols-outlined" style="font-size:1.1rem;">${iconNames[t.type] || 'info'}</span>
          <span>${escapeHtml(t.message)}</span>
        </div>
        <button type="button" data-dismiss-toast="${escapeHtml(t.id)}" style="border:none;background:transparent;color:inherit;opacity:0.8;padding:0;display:flex;">
          <span class="material-symbols-outlined" style="font-size:1rem;">close</span>
        </button>
      </div>
    `
    )
    .join('');

  root.querySelectorAll('[data-dismiss-toast]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-dismiss-toast');
      appState.toasts = appState.toasts.filter((t) => String(t.id) !== String(id));
      renderToasts();
    });
  });
};

export const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export const t = (en, ta) => (appState.language === 'ta' ? ta : en);

export const getSelectedEndpoint = () => API_ENDPOINTS[appState.selectedEndpointIdx] || API_ENDPOINTS[0];
