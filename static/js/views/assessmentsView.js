import { appState, escapeHtml, setActiveTab, showToast, t, triggerRender } from '../state.js';

let assessModalOpen = false;

export function renderAssessmentsView() {
  return `
    <div class="page-container">
      <header class="flex-between">
        <div>
          <div class="flex-row">
            <h1 class="page-title">${t('Unit Tests & Continuous Assessment Management', 'அலகுத் தேர்வுகள் & தொடர் மதிப்பீடு')}</h1>
            <span class="badge badge-primary">Continuous Evaluation</span>
          </div>
          <p class="page-subtitle">Create 10-, 20-, 25-, 50-mark assessments, select completed topics, and maintain student assessment history.</p>
        </div>

        <button type="button" id="btn-open-assess-modal" class="btn btn-primary">
          <span class="material-symbols-outlined" style="font-size:1rem;">add</span>
          <span>+ Schedule New Assessment</span>
        </button>
      </header>

      <section class="grid grid-2">
        ${appState.assessments
          .map((item) => {
            const badgeClass =
              item.status === 'Completed' ? 'badge-secondary' : item.status === 'Scheduled' ? 'badge-primary' : 'badge-neutral';
            return `
            <article class="card card-hover flex-col" style="justify-content:space-between;gap:0.9rem;">
              <div>
                <div class="flex-between" style="padding-bottom:0.55rem;border-bottom:1px solid var(--surface-container-low);">
                  <span class="font-mono text-xs" style="font-weight:800;color:var(--primary);">${escapeHtml(item.id)}</span>
                  <span class="badge ${badgeClass}">${escapeHtml(item.status)}</span>
                </div>
                <h3 style="margin:0.6rem 0 0.25rem;font-size:0.95rem;font-weight:700;">${escapeHtml(item.name)}</h3>
                <div class="font-mono text-xs muted">${item.marks} Marks • ${escapeHtml(item.duration)} • ${escapeHtml(item.date)}</div>
              </div>

              <div class="soft-panel flex-between text-xs">
                <span class="muted">${t('Class Cohort Average:', 'வகுப்பு சராசரி:')}</span>
                <strong style="color:var(--secondary);font-size:0.95rem;">${escapeHtml(item.avgScore)}</strong>
              </div>

              <div class="flex-between" style="padding-top:0.5rem;border-top:1px solid var(--surface-container);">
                <button type="button" class="btn btn-ghost" style="color:var(--primary);padding-left:0;" data-assess-paper="${escapeHtml(item.name)}">
                  Generate Test Blueprint →
                </button>
                <button type="button" class="btn btn-ghost" data-assess-marks="1">
                  View Marks →
                </button>
              </div>
            </article>
          `;
          })
          .join('')}
      </section>

      ${
        assessModalOpen
          ? `
        <div id="assess-modal-backdrop" class="modal-backdrop">
          <div class="modal-card" style="max-width:28rem;">
            <div class="flex-between" style="padding-bottom:0.65rem;border-bottom:1px solid var(--surface-container);">
              <h2 style="margin:0;font-size:1rem;font-weight:700;">${t('Schedule Continuous Assessment', 'தொடர் மதிப்பீட்டைத் திட்டமிடு')}</h2>
              <button type="button" id="btn-close-assess" class="btn-ghost" style="padding:0.25rem;"><span class="material-symbols-outlined">close</span></button>
            </div>
            <form id="form-new-assessment" class="flex-col" style="margin-top:0.9rem;gap:0.85rem;">
              <div>
                <label class="field-label">${t('Assessment Name', 'மதிப்பீட்டின் பெயர்')}</label>
                <input id="new-assess-name" required class="input" placeholder="e.g. Unit Test 4 — Conics & Vectors" />
              </div>
              <div>
                <label class="field-label">${t('Total Marks', 'மொத்த மதிப்பெண்கள்')}</label>
                <select id="new-assess-marks" class="select">
                  <option value="10">10 Marks (Quick Slip Test)</option>
                  <option value="20">20 Marks (Standard Unit Test)</option>
                  <option value="25" selected>25 Marks (Term Assessment)</option>
                  <option value="50">50 Marks (Mid-Term Cycle)</option>
                </select>
              </div>
              <div class="flex-row" style="justify-content:flex-end;">
                <button type="button" id="btn-cancel-assess" class="btn btn-surface">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Assessment</button>
              </div>
            </form>
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;
}

export function bindAssessmentsEvents() {
  document.getElementById('btn-open-assess-modal')?.addEventListener('click', () => {
    assessModalOpen = true;
    triggerRender();
  });
  document.getElementById('btn-close-assess')?.addEventListener('click', () => {
    assessModalOpen = false;
    triggerRender();
  });
  document.getElementById('btn-cancel-assess')?.addEventListener('click', () => {
    assessModalOpen = false;
    triggerRender();
  });

  document.getElementById('form-new-assessment')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('new-assess-name').value;
    const marks = Number(document.getElementById('new-assess-marks').value);
    appState.assessments.push({
      id: `UT-${appState.assessments.length + 1}`,
      name: title || `Unit Test ${appState.assessments.length + 1}`,
      marks,
      duration: `${marks === 10 ? 20 : marks === 20 ? 40 : 45} mins`,
      date: new Date().toISOString().split('T')[0],
      status: 'Scheduled',
      avgScore: '-'
    });
    assessModalOpen = false;
    showToast('New Unit Test Scheduled and Added to Syllabus Cycle!', 'success');
    triggerRender();
  });

  document.querySelectorAll('[data-assess-paper]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast(`Opening Paper Generator for ${btn.getAttribute('data-assess-paper')}`, 'info');
      setActiveTab('paper-generator');
    });
  });
  document.querySelectorAll('[data-assess-marks]').forEach((btn) => {
    btn.addEventListener('click', () => setActiveTab('marks-management'));
  });
}
