import { apiClient } from '../api/client.js';
import { appState, escapeHtml, showToast, t, triggerRender } from '../state.js';

const CONCEPTS = [
  'Cofactor Matrix Sign Transposition (18 students)',
  'Rank by Row Echelon Reduction (4 students)',
  'Euler Form to Cartesian Coordinates (7 students)',
  "Vieta's Polynomial Degree n Formulas (3 students)"
];

export function renderRemedialLearningView() {
  const drill = appState.generatedDrill;

  return `
    <div class="page-container">
      <header class="flex-between">
        <div>
          <div class="flex-row">
            <h1 class="page-title">${t('AI Personalized Remedial Learning & Homework', 'பரிகாரக் கற்றல் & வீட்டுப்பாட மேலாண்மை')}</h1>
            <span class="badge badge-secondary">Core Differentiator</span>
          </div>
          <p class="page-subtitle">Targeted micro-remedial drills, foundation practice questions, and bilingual worked solutions generated from diagnosed gaps.</p>
        </div>

        <button type="button" id="btn-gen-remedial" class="btn btn-primary" ${appState.remedialGenerating ? 'disabled' : ''}>
          ${appState.remedialGenerating ? '<span class="spinner"></span>' : '<span class="material-symbols-outlined" style="font-size:1rem;">auto_awesome</span>'}
          <span>${
            appState.remedialGenerating
              ? t('Compiling Drill...', 'பயிற்சி உருவாகிறது...')
              : t('+ Generate 15-Min Micro Drill', '+ 15 நிமிட விரைவு பயிற்சியை உருவாக்கு')
          }</span>
        </button>
      </header>

      <div class="card flex-between">
        <div>
          <label class="field-label">${t('Diagnosed Target Concept for Intervention:', 'மேம்படுத்த வேண்டிய கண்டறியப்பட்ட கருத்து:')}</label>
          <select id="remedial-concept-select" class="select" style="min-width:20rem;">
            ${CONCEPTS.map(
              (c) => `<option value="${escapeHtml(c)}" ${appState.remedialConcept === c ? 'selected' : ''}>${escapeHtml(c)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="flex-row">
          <span class="badge badge-tertiary" style="padding:0.45rem 0.75rem;">Cohort: 18 Students Flagged</span>
          <span class="badge badge-secondary" style="padding:0.45rem 0.75rem;">Pacing: Period 3 Tomorrow</span>
        </div>
      </div>

      ${
        drill
          ? `
        <section class="card card-lg flex-col" style="gap:1.15rem;">
          <div class="flex-between" style="padding-bottom:0.75rem;border-bottom:1px solid var(--surface-container);">
            <div>
              <span class="badge badge-primary">${escapeHtml(drill.drillId)} • Micro Remedial</span>
              <h2 style="margin:0.4rem 0 0;font-size:1.05rem;font-weight:700;">Targeted Remedial Drill: ${escapeHtml(drill.concept)}</h2>
            </div>
            <div style="text-align:right;">
              <div class="text-xs" style="font-weight:700;color:var(--secondary);">Target Time: ${escapeHtml(drill.targetTime)}</div>
              <div class="text-xs muted">Target: ${escapeHtml(drill.studentTarget)}</div>
            </div>
          </div>

          <div class="soft-panel flex-col" style="gap:0.55rem;">
            <div class="flex-row text-xs" style="font-weight:700;color:var(--primary);">
              <span class="material-symbols-outlined" style="font-size:1rem;">lightbulb</span>
              <span>${escapeHtml(drill.workedExample.title)}</span>
            </div>
            <div class="card font-mono text-xs" style="padding:0.55rem 0.75rem;color:var(--secondary);font-weight:700;box-shadow:none;">
              Formula: ${escapeHtml(drill.workedExample.formula)}
            </div>
            <p class="text-xs" style="margin:0;line-height:1.5;">${escapeHtml(drill.workedExample.explanationEn)}</p>
            <p class="text-xs font-tamil muted" style="margin:0;line-height:1.55;">${escapeHtml(drill.workedExample.explanationTa)}</p>
          </div>

          <div class="flex-col" style="gap:0.75rem;">
            <div class="text-xs" style="font-weight:700;text-transform:uppercase;">Practice Question Set (Foundation &amp; Progression)</div>
            ${drill.practiceQuestions
              .map(
                (q, idx) => `
              <div class="card" style="box-shadow:none;display:flex;flex-direction:column;gap:0.4rem;">
                <div class="flex-between">
                  <strong class="text-xs" style="color:var(--primary);">Exercise ${idx + 1}</strong>
                  <span class="font-mono text-xs muted">${q.marks} Mark</span>
                </div>
                <div class="text-xs">${escapeHtml(q.textEn)}</div>
                <div class="text-xs font-tamil muted">${escapeHtml(q.textTa)}</div>
                <div class="font-mono text-xs" style="padding-top:0.45rem;border-top:1px solid var(--surface-container-low);color:var(--secondary);">
                  Solution: ${escapeHtml(q.answer)}
                </div>
              </div>
            `
              )
              .join('')}
          </div>

          <div class="flex-between no-print" style="padding-top:0.65rem;border-top:1px solid var(--surface-container);">
            <button type="button" id="btn-print-remedial" class="btn btn-ghost" style="color:var(--primary);padding-left:0;">
              <span class="material-symbols-outlined" style="font-size:1rem;">print</span>
              <span>${t('Print Worksheet Slips for Class', 'வகுப்பிற்கான பயிற்சித் தாள்களை அச்சிடு')}</span>
            </button>
            <button type="button" id="btn-dispatch-remedial" class="btn btn-secondary">Dispatch to Student App</button>
          </div>
        </section>
      `
          : `
        <section class="card" style="padding:3rem 1.5rem;text-align:center;display:flex;flex-direction:column;align-items:center;gap:0.55rem;">
          <span class="material-symbols-outlined" style="font-size:2.5rem;color:var(--primary);">assignment_late</span>
          <h3 style="margin:0;font-size:1rem;">${t('No Active Remedial Sheet Loaded', 'செயலில் உள்ள கூடுதல் பயிற்சித் தாள் இல்லை')}</h3>
          <p class="text-xs muted" style="max-width:24rem;margin:0 0 0.5rem;">
            Select a target diagnosed concept above and click "Generate 15-Min Micro Drill" to create differentiated practice problems.
          </p>
          <button type="button" id="btn-sample-remedial" class="btn btn-primary">Generate Sample Drill for Vignesh &amp; Cohort</button>
        </section>
      `
      }
    </div>
  `;
}

export function bindRemedialLearningEvents() {
  document.getElementById('remedial-concept-select')?.addEventListener('change', (e) => {
    appState.remedialConcept = e.target.value;
  });

  const runGenerate = async () => {
    appState.remedialGenerating = true;
    triggerRender();
    showToast('Generating targeted micro-remedial drill with worked examples...', 'info');
    try {
      const drill = await apiClient.generateRemedialDrill({
        studentId: appState.selectedStudentId,
        conceptTarget: appState.remedialConcept,
        questionCount: 5,
        includeWorkedExamples: true,
        language: 'bilingual'
      });
      appState.generatedDrill = drill;
      showToast('Remedial Drill Generated! Assigned to target student cohort.', 'success');
    } catch (err) {
      showToast('Failed to generate remedial drill', 'error');
    } finally {
      appState.remedialGenerating = false;
      triggerRender();
    }
  };

  document.getElementById('btn-gen-remedial')?.addEventListener('click', runGenerate);
  document.getElementById('btn-sample-remedial')?.addEventListener('click', runGenerate);
  document.getElementById('btn-print-remedial')?.addEventListener('click', () => window.print());
  document.getElementById('btn-dispatch-remedial')?.addEventListener('click', () => {
    showToast('Pushed directly to student EMIS portals & mobile notices', 'success');
  });
}
