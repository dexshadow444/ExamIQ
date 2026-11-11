import { VOCATIONAL_MODULES_DATA } from '../data/mockData.js';
import { appState, escapeHtml, showToast, t, triggerRender } from '../state.js';

export function renderVocationalModuleView() {
  const trade =
    VOCATIONAL_MODULES_DATA.find((tr) => tr.tradeCode === appState.selectedTradeCode) ||
    VOCATIONAL_MODULES_DATA[0];

  return `
    <div class="page-container">
      <header class="flex-between">
        <div>
          <div class="flex-row">
            <h1 class="page-title">${t('Vocational Education Intelligence', 'தொழிற்கல்வி நுண்ணறிவுப் பிரிவு')}</h1>
            <span class="badge badge-primary">Trade &amp; Practical Rubrics</span>
          </div>
          <p class="page-subtitle">Tamil Nadu State Board Vocational Stream (Class 12) theory blueprints, workshop safety protocols, and hands-on skill logs.</p>
        </div>

        <div class="flex-row">
          <label class="text-xs" style="font-weight:700;">${t('Select Trade:', 'தொழிற்பிரிவைத் தேர்ந்தெடுக்கவும்:')}</label>
          <select id="voc-trade-select" class="select" style="width:auto;min-width:18rem;">
            ${VOCATIONAL_MODULES_DATA.map(
              (tr) => `<option value="${escapeHtml(tr.tradeCode)}" ${tr.tradeCode === trade.tradeCode ? 'selected' : ''}>Trade ${escapeHtml(tr.tradeCode)}: ${escapeHtml(tr.name)}</option>`
            ).join('')}
          </select>
        </div>
      </header>

      <section class="card card-lg flex-between">
        <div>
          <div class="flex-row">
            <span class="badge badge-primary font-mono">Trade Code #${escapeHtml(trade.tradeCode)}</span>
            <span class="text-xs muted">${trade.enrolledStudents} Enrolled Candidates</span>
          </div>
          <h2 style="margin:0.45rem 0 0;font-size:1.15rem;font-weight:800;">${escapeHtml(t(trade.name, trade.nameTamil))}</h2>
        </div>

        <button type="button" id="btn-gen-workshop-sheet" class="btn btn-secondary">
          <span class="material-symbols-outlined" style="font-size:1rem;">precision_manufacturing</span>
          <span>${t('Generate Workshop Practical Sheet', 'பட்டறை செய்முறைத் தாளை உருவாக்கு')}</span>
        </button>
      </section>

      <div class="grid grid-2" style="gap:1.25rem;">
        <section class="card flex-col" style="gap:0.85rem;">
          <strong class="text-sm flex-row"><span class="material-symbols-outlined" style="color:var(--primary);">menu_book</span>Vocational Trade Curriculum Modules</strong>
          ${trade.modules
            .map(
              (mod) => `
            <div class="soft-panel flex-col" style="gap:0.25rem;">
              <div class="flex-between">
                <span class="font-mono text-xs" style="font-weight:700;color:var(--primary);">${escapeHtml(mod.id)}</span>
                <span class="badge ${mod.status === 'Completed' ? 'badge-secondary' : 'badge-neutral'}">${escapeHtml(mod.status)}</span>
              </div>
              <div class="text-xs" style="font-weight:700;">${escapeHtml(mod.title)}</div>
              <div class="font-mono text-xs muted">${mod.practicalHours} Practical Workshop Hours • ${mod.theoryHours} Theory Hours</div>
            </div>
          `
            )
            .join('')}
        </section>

        <section class="card flex-col" style="gap:0.85rem;">
          <strong class="text-sm flex-row"><span class="material-symbols-outlined" style="color:var(--secondary);">build</span>Skill-Based Evaluation &amp; Practical Rubrics</strong>
          ${trade.practicalRubrics
            .map((rubric) => {
              const pct = Math.round((rubric.completedStudents / trade.enrolledStudents) * 100);
              return `
              <div class="card" style="box-shadow:none;padding:0.85rem;display:flex;flex-direction:column;gap:0.4rem;">
                <div class="flex-between">
                  <strong class="text-xs">${escapeHtml(rubric.skill)}</strong>
                  <strong class="font-mono text-xs" style="color:var(--primary);">${rubric.maxMarks} Marks</strong>
                </div>
                <div class="flex-between text-xs muted">
                  <span>Completed: ${rubric.completedStudents} / ${trade.enrolledStudents} Students</span>
                  <strong style="color:var(--secondary);">${pct}% Verified</strong>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width:${pct}%;background:var(--secondary);"></div>
                </div>
              </div>
            `;
            })
            .join('')}
        </section>
      </div>
    </div>
  `;
}

export function bindVocationalModuleEvents() {
  document.getElementById('voc-trade-select')?.addEventListener('change', (e) => {
    appState.selectedTradeCode = e.target.value;
    triggerRender();
  });

  document.getElementById('btn-gen-workshop-sheet')?.addEventListener('click', () => {
    const trade = VOCATIONAL_MODULES_DATA.find((tr) => tr.tradeCode === appState.selectedTradeCode) || VOCATIONAL_MODULES_DATA[0];
    showToast(`Generated practical workshop assessment for ${trade.name}`, 'success');
  });
}
