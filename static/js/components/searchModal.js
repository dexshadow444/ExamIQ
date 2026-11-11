import { STUDENTS_DATA } from '../data/mockData.js';
import { appState, setActiveTab, t, triggerRender } from '../state.js';
import { clearChildren, cloneTemplate, qs, setText } from '../utils/dom.js';

let currentSearchTerm = '';

function buildResultRow({ icon, iconColor, title, sub, rightText, jumpTab, studentId }) {
  const row = cloneTemplate('tpl-search-result-row');
  row.setAttribute('data-search-jump', jumpTab);
  if (studentId) row.setAttribute('data-search-student', studentId);

  const iconEl = qs(row, '[data-el="row-icon"]');
  if (iconEl) {
    iconEl.textContent = icon;
    iconEl.style.color = iconColor;
  }
  setText(row, '[data-el="row-title"]', title);
  setText(row, '[data-el="row-sub"]', sub);
  setText(row, '[data-el="row-right"]', rightText);
  return row;
}

function populateSearchResults(container, term) {
  clearChildren(container);

  if (!term) {
    const qn = cloneTemplate('tpl-search-quick-nav');
    setText(qn, '[data-el="quick-nav-title"]', t('Quick Navigation', 'விரைவு வழிசெலுத்தல்'));
    setText(qn, '[data-el="qn-tp-title"]', t('Teaching Progress Lock', 'கற்பித்தல் முன்னேற்றப் பூட்டு'));
    setText(qn, '[data-el="qn-tp-sub"]', t('Verify taught chapters', 'கற்பித்த அத்தியாயங்களைச் சரிபார்க்கவும்'));
    setText(qn, '[data-el="qn-pg-title"]', t('AI Paper Generator', 'AI வினாத்தாள் உருவாக்கி'));
    setText(qn, '[data-el="qn-pg-sub"]', t('Create new test blueprint', 'புதிய தேர்வு வடிவமைப்பை உருவாக்கவும்'));
    setText(qn, '[data-el="qn-ae-title"]', t('Answer Sheet Evaluation', 'விடைத்தாள் மதிப்பீடு'));
    setText(qn, '[data-el="qn-ae-sub"]', t('AI handwritten OCR & marks', 'கையெழுத்து OCR மற்றும் மதிப்பெண்கள்'));
    setText(qn, '[data-el="qn-api-title"]', t('Backend API Explorer', 'பின்தள API உலாவி'));
    setText(qn, '[data-el="qn-api-sub"]', t('Backend API endpoints', 'பின்தள API முகவரிகள்'));
    container.appendChild(qn);
    return;
  }

  const chapters = appState.chapters
    .filter(
      (c) =>
        c.title.toLowerCase().includes(term) ||
        c.titleTamil.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term)
    )
    .slice(0, 3);

  const questions = appState.questions
    .filter(
      (q) =>
        q.questionEn.toLowerCase().includes(term) ||
        q.questionTa.toLowerCase().includes(term) ||
        q.code.toLowerCase().includes(term)
    )
    .slice(0, 3);

  const students = STUDENTS_DATA.filter(
    (s) => s.name.toLowerCase().includes(term) || s.rollNo.includes(term)
  ).slice(0, 3);

  if (chapters.length > 0) {
    const sec = cloneTemplate('tpl-search-section');
    setText(sec, '[data-el="section-title"]', t('Syllabus Chapters', 'பாடத்திட்ட அத்தியாயங்கள்'));
    const itemsEl = qs(sec, '[data-el="section-items"]');
    chapters.forEach((c) => {
      itemsEl.appendChild(
        buildResultRow({
          icon: 'menu_book',
          iconColor: 'var(--primary)',
          title: t(c.title, c.titleTamil),
          sub: `Unit Code: ${c.code}`,
          rightText: `${c.completionPercent}%`,
          jumpTab: 'teaching-progress'
        })
      );
    });
    container.appendChild(sec);
  }

  if (questions.length > 0) {
    const sec = cloneTemplate('tpl-search-section');
    setText(sec, '[data-el="section-title"]', t('Question Bank Matches', 'வினா வங்கி முடிவுகள்'));
    const itemsEl = qs(sec, '[data-el="section-items"]');
    questions.forEach((q) => {
      itemsEl.appendChild(
        buildResultRow({
          icon: 'quiz',
          iconColor: 'var(--secondary)',
          title: t(q.questionEn, q.questionTa),
          sub: `${q.chapter} • ${q.type}`,
          rightText: `${q.marks} Marks`,
          jumpTab: 'question-bank'
        })
      );
    });
    container.appendChild(sec);
  }

  if (students.length > 0) {
    const sec = cloneTemplate('tpl-search-section');
    setText(sec, '[data-el="section-title"]', t('Student Records', 'மாணவர் விவரங்கள்'));
    const itemsEl = qs(sec, '[data-el="section-items"]');
    students.forEach((s) => {
      itemsEl.appendChild(
        buildResultRow({
          icon: 'person',
          iconColor: 'var(--tertiary)',
          title: `${t(s.name, s.nameTamil)} (Roll #${s.rollNo})`,
          sub: `EMIS: ${s.emisId} • Overall: ${s.overallPercentage}%`,
          rightText: `Rank #${s.rank}`,
          jumpTab: 'student-insights',
          studentId: s.id
        })
      );
    });
    container.appendChild(sec);
  }

  if (chapters.length === 0 && questions.length === 0 && students.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'text-xs muted';
    empty.style.cssText = 'padding:1.5rem;text-align:center;';
    empty.textContent = 'No matching chapters, questions, or students found.';
    container.appendChild(empty);
  }
}

export function renderSearchModal() {
  if (!appState.searchModalOpen) return null;

  const root = cloneTemplate('tpl-search-modal');
  const input = qs(root, '#global-search-input');
  if (input) {
    input.value = currentSearchTerm;
    input.placeholder = t(
      'Search chapters, questions, students (e.g. Vignesh), blueprints...',
      'அத்தியாயங்கள், வினாக்கள், மாணவர்கள், பாடநூல்களைத் தேடுங்கள்...'
    );
  }

  populateSearchResults(qs(root, '#search-results-body'), currentSearchTerm.trim().toLowerCase());
  setText(root, '[data-el="search-footer-hint"]', t('Press ESC or click outside to dismiss', 'மூட ESC அழுத்தவும் அல்லது வெளியே சொடுக்கவும்'));
  return root;
}

export function bindSearchModalEvents() {
  if (!appState.searchModalOpen) return;

  const backdrop = document.getElementById('search-modal-backdrop');
  const input = document.getElementById('global-search-input');
  const closeBtn = document.getElementById('btn-close-search-modal');

  const bindJumpButtons = () => {
    document.querySelectorAll('[data-search-jump]').forEach((el) => {
      el.addEventListener('click', () => {
        const studentId = el.getAttribute('data-search-student');
        if (studentId) appState.selectedStudentId = studentId;
        appState.searchModalOpen = false;
        setActiveTab(el.getAttribute('data-search-jump'));
      });
    });
  };

  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    input.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value;
      const body = document.getElementById('search-results-body');
      if (body) {
        populateSearchResults(body, currentSearchTerm.trim().toLowerCase());
        bindJumpButtons();
      }
    });
  }

  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      appState.searchModalOpen = false;
      triggerRender();
    }
  });

  closeBtn?.addEventListener('click', () => {
    appState.searchModalOpen = false;
    triggerRender();
  });

  bindJumpButtons();
}
