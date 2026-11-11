import { STUDENTS_DATA } from '../data/mockData.js';
import { appState, escapeHtml, setActiveTab, t, triggerRender } from '../state.js';

let currentSearchTerm = '';

export function renderSearchModal() {
  if (!appState.searchModalOpen) return '';

  const term = currentSearchTerm.trim().toLowerCase();
  const filteredChapters = appState.chapters
    .filter(
      (c) =>
        c.title.toLowerCase().includes(term) ||
        c.titleTamil.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term)
    )
    .slice(0, 3);

  const filteredQuestions = appState.questions
    .filter(
      (q) =>
        q.questionEn.toLowerCase().includes(term) ||
        q.questionTa.toLowerCase().includes(term) ||
        q.code.toLowerCase().includes(term)
    )
    .slice(0, 3);

  const filteredStudents = STUDENTS_DATA.filter(
    (s) => s.name.toLowerCase().includes(term) || s.rollNo.includes(term)
  ).slice(0, 3);

  return `
    <div id="search-modal-backdrop" class="modal-backdrop top-aligned">
      <div class="modal-card" style="max-width:42rem;padding:0;overflow:hidden;">
        <div class="flex-row" style="padding:0.9rem 1rem;border-bottom:1px solid var(--surface-container);background:rgba(242,243,255,0.6);flex-wrap:nowrap;">
          <span class="material-symbols-outlined" style="color:var(--primary);font-size:1.35rem;">search</span>
          <input
            id="global-search-input"
            type="text"
            value="${escapeHtml(currentSearchTerm)}"
            placeholder="${escapeHtml(
              t(
                'Search chapters, questions, students (e.g. Vignesh), blueprints...',
                'அத்தியாயங்கள், வினாக்கள், மாணவர்கள், பாடநூல்களைத் தேடுங்கள்...'
              )
            )}"
            style="flex:1;border:none;background:transparent;outline:none;font-size:0.92rem;color:var(--on-surface);"
          />
          <button id="btn-close-search-modal" type="button" class="btn-ghost" style="padding:0.25rem;border-radius:0.5rem;">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div id="search-results-body" style="max-height:24rem;overflow-y:auto;padding:0.9rem;display:flex;flex-direction:column;gap:1rem;">
          ${renderSearchResultsHtml(term, filteredChapters, filteredQuestions, filteredStudents)}
        </div>

        <div class="flex-between" style="padding:0.65rem 1rem;background:var(--surface-container-low);border-top:1px solid var(--surface-container);font-size:0.72rem;color:var(--outline);">
          <span>${t('Press ESC or click outside to dismiss', 'மூட ESC அழுத்தவும் அல்லது வெளியே சொடுக்கவும்')}</span>
          <span class="font-mono">TN-HSC-EXAMIQ-v2.1</span>
        </div>
      </div>
    </div>
  `;
}

function renderSearchResultsHtml(term, chapters, questions, students) {
  if (!term) {
    return `
      <div>
        <div class="nav-section-label" style="padding-left:0.25rem;">${t('Quick Navigation', 'விரைவு வழிசெலுத்தல்')}</div>
        <div class="grid grid-2" style="gap:0.55rem;margin-top:0.35rem;">
          <button type="button" class="soft-panel" data-search-jump="teaching-progress" style="text-align:left;display:flex;align-items:center;gap:0.6rem;border:1px solid var(--surface-container);">
            <span class="material-symbols-outlined" style="color:var(--secondary);">fact_check</span>
            <div>
              <div style="font-weight:700;font-size:0.78rem;">${t('Teaching Progress Lock', 'கற்பித்தல் முன்னேற்றப் பூட்டு')}</div>
              <div class="text-xs muted">${t('Verify taught chapters', 'கற்பித்த அத்தியாயங்களைச் சரிபார்க்கவும்')}</div>
            </div>
          </button>
          <button type="button" class="soft-panel" data-search-jump="paper-generator" style="text-align:left;display:flex;align-items:center;gap:0.6rem;border:1px solid var(--surface-container);">
            <span class="material-symbols-outlined" style="color:var(--primary);">auto_awesome</span>
            <div>
              <div style="font-weight:700;font-size:0.78rem;">${t('AI Paper Generator', 'AI வினாத்தாள் உருவாக்கி')}</div>
              <div class="text-xs muted">${t('Create new test blueprint', 'புதிய தேர்வு வடிவமைப்பை உருவாக்கவும்')}</div>
            </div>
          </button>
          <button type="button" class="soft-panel" data-search-jump="answer-evaluation" style="text-align:left;display:flex;align-items:center;gap:0.6rem;border:1px solid var(--surface-container);">
            <span class="material-symbols-outlined" style="color:var(--tertiary);">draw</span>
            <div>
              <div style="font-weight:700;font-size:0.78rem;">${t('Answer Sheet Evaluation', 'விடைத்தாள் மதிப்பீடு')}</div>
              <div class="text-xs muted">${t('AI handwritten OCR & marks', 'கையெழுத்து OCR மற்றும் மதிப்பெண்கள்')}</div>
            </div>
          </button>
          <button type="button" class="soft-panel" data-search-jump="api-explorer" style="text-align:left;display:flex;align-items:center;gap:0.6rem;border:1px solid var(--surface-container);">
            <span class="material-symbols-outlined" style="color:var(--secondary);">api</span>
            <div>
              <div style="font-weight:700;font-size:0.78rem;">${t('Backend API Explorer', 'பின்தள API உலாவி')}</div>
              <div class="text-xs muted">${t('Backend API endpoints', 'பின்தள API முகவரிகள்')}</div>
            </div>
          </button>
        </div>
      </div>
    `;
  }

  let html = '';
  if (chapters.length > 0) {
    html += `
      <div>
        <div class="nav-section-label">${t('Chapters & Topics', 'அத்தியாயங்கள்')}</div>
        ${chapters
          .map(
            (c) => `
          <div class="flex-between" data-search-jump="teaching-progress" style="padding:0.55rem;border-radius:0.6rem;cursor:pointer;">
            <div class="flex-row" style="gap:0.55rem;">
              <span class="material-symbols-outlined" style="color:var(--primary);font-size:1.1rem;">menu_book</span>
              <div>
                <div style="font-size:0.78rem;font-weight:700;">${escapeHtml(t(c.title, c.titleTamil))}</div>
                <div class="font-mono" style="font-size:0.68rem;color:var(--outline);">${escapeHtml(c.code)} • ${escapeHtml(c.volume)}</div>
              </div>
            </div>
            <span class="badge ${c.status === 'completed' ? 'badge-secondary' : 'badge-neutral'}">${escapeHtml(c.status)}</span>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  if (questions.length > 0) {
    html += `
      <div>
        <div class="nav-section-label">${t('Questions in Repository', 'கேள்வி களஞ்சியம்')}</div>
        ${questions
          .map(
            (q) => `
          <div class="flex-between" data-search-jump="question-bank" style="padding:0.55rem;border-radius:0.6rem;cursor:pointer;">
            <div class="flex-row" style="gap:0.55rem;flex:1;min-width:0;flex-wrap:nowrap;">
              <span class="material-symbols-outlined" style="color:var(--secondary);font-size:1.1rem;">help_outline</span>
              <div style="min-width:0;">
                <div style="font-size:0.78rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(t(q.questionEn, q.questionTa))}</div>
                <div style="font-size:0.68rem;color:var(--outline);">${escapeHtml(q.code)} • ${q.marks} Marks • ${escapeHtml(q.source)}</div>
              </div>
            </div>
            <span style="font-size:0.74rem;font-weight:700;color:var(--primary);">${q.marks}M</span>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  if (students.length > 0) {
    html += `
      <div>
        <div class="nav-section-label">${t('Students & Learning DNA', 'மாணவர்கள்')}</div>
        ${students
          .map(
            (s) => `
          <div class="flex-between" data-search-jump="student-insights" data-search-student="${escapeHtml(s.id)}" style="padding:0.55rem;border-radius:0.6rem;cursor:pointer;">
            <div class="flex-row" style="gap:0.55rem;">
              <span class="material-symbols-outlined" style="color:var(--tertiary);font-size:1.1rem;">person</span>
              <div>
                <div style="font-size:0.78rem;font-weight:700;">${escapeHtml(t(s.name, s.nameTamil))} (Roll #${escapeHtml(s.rollNo)})</div>
                <div style="font-size:0.68rem;color:var(--outline);">EMIS: ${escapeHtml(s.emisId)} • Overall: ${s.overallPercentage}%</div>
              </div>
            </div>
            <span style="font-size:0.74rem;font-weight:700;color:var(--secondary);">Rank #${s.rank}</span>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  if (!html) {
    html = `<div style="padding:1.5rem;text-align:center;" class="text-xs muted">No matching chapters, questions, or students found.</div>`;
  }

  return html;
}

export function bindSearchModalEvents() {
  if (!appState.searchModalOpen) return;

  const backdrop = document.getElementById('search-modal-backdrop');
  const input = document.getElementById('global-search-input');
  const closeBtn = document.getElementById('btn-close-search-modal');

  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    input.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value;
      const body = document.getElementById('search-results-body');
      if (body) {
        const term = currentSearchTerm.trim().toLowerCase();
        const chaps = appState.chapters.filter(
          (c) => c.title.toLowerCase().includes(term) || c.titleTamil.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)
        ).slice(0, 3);
        const qs = appState.questions.filter(
          (q) => q.questionEn.toLowerCase().includes(term) || q.questionTa.toLowerCase().includes(term) || q.code.toLowerCase().includes(term)
        ).slice(0, 3);
        const stds = STUDENTS_DATA.filter(
          (s) => s.name.toLowerCase().includes(term) || s.rollNo.includes(term)
        ).slice(0, 3);
        body.innerHTML = renderSearchResultsHtml(term, chaps, qs, stds);
        bindJumpButtons();
      }
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        appState.searchModalOpen = false;
        triggerRender();
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      appState.searchModalOpen = false;
      triggerRender();
    });
  }

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
  bindJumpButtons();
}
