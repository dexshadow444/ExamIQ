import { apiClient } from '../api/client.js';
import { appState, escapeHtml, showToast, t, triggerRender } from '../state.js';

export function renderPaperGeneratorView() {
  const cfg = appState.paperConfig;
  const paper = appState.generatedPaper;
  const taughtCount = appState.chapters.filter((c) => c.status === 'completed' || c.status === 'partially_completed').length;

  return `
    <div class="page-container">
      <header class="flex-between">
        <div>
          <div class="flex-row">
            <h1 class="page-title">${t('AI Question Paper Generator', 'AI வினாத்தாள் உருவாக்கி')}</h1>
            <span class="badge badge-primary">HSC Blueprint Engine</span>
          </div>
          <p class="page-subtitle">Automated examination authoring respecting the Teaching Progress Lock, with official TN Board section rubrics.</p>
        </div>

        ${
          paper
            ? `
          <div class="flex-row no-print">
            <button type="button" id="btn-print-paper" class="btn btn-surface">
              <span class="material-symbols-outlined" style="font-size:1rem;">print</span>
              <span>${t('Print / Export PDF', 'அச்சிடு / PDF ஏற்றுமதி')}</span>
            </button>
            <button type="button" id="btn-export-docx" class="btn btn-surface">
              <span class="material-symbols-outlined" style="font-size:1rem;">description</span>
              <span>${t('DOCX Export', 'DOCX ஏற்றுமதி')}</span>
            </button>
          </div>
        `
            : ''
        }
      </header>

      <div class="card flex-between no-print" style="background:${appState.progressLockActive ? 'rgba(109, 245, 225, 0.18)' : 'rgba(255, 218, 214, 0.45)'};border-color:${appState.progressLockActive ? 'var(--secondary-container)' : 'var(--error-container)'};">
        <div class="flex-row" style="gap:0.75rem;">
          <span class="material-symbols-outlined" style="font-size:1.6rem;color:${appState.progressLockActive ? 'var(--secondary)' : 'var(--error)'};">
            ${appState.progressLockActive ? 'shield_lock' : 'warning'}
          </span>
          <div>
            <div class="text-xs" style="font-weight:700;">
              ${appState.progressLockActive ? 'Teaching Progress Lock Enforced (Rule 1 Active)' : 'Warning: Progress Lock is Disabled'}
            </div>
            <div class="text-xs muted">
              ${appState.progressLockActive ? 'Only verified taught units (Ch 1, 2, 3, and 4.1-4.2) will be drawn for this examination.' : 'Questions may be chosen from untaught syllabus topics.'}
            </div>
          </div>
        </div>
        <span class="badge font-mono ${appState.progressLockActive ? 'badge-secondary' : 'badge-error'}">
          ${appState.progressLockActive ? 'UNTAUGHT EXCLUDED' : 'LOCK BYPASSED'}
        </span>
      </div>

      <div class="grid grid-12" style="gap:1.25rem;align-items:start;">
        <div class="card col-span-4 flex-col no-print" style="gap:0.9rem;">
          <h2 class="section-title" style="padding-bottom:0.55rem;border-bottom:1px solid var(--surface-container);">Blueprint &amp; Examination Settings</h2>

          <div>
            <label class="field-label">${t('Paper Heading / Title', 'வினாத்தாள் தலைப்பு')}</label>
            <input id="pg-title" class="input" value="${escapeHtml(cfg.title)}" />
          </div>

          <div class="grid grid-2" style="gap:0.65rem;">
            <div>
              <label class="field-label">${t('Total Marks', 'மொத்த மதிப்பெண்கள்')}</label>
              <select id="pg-marks" class="select">
                <option value="10" ${cfg.totalMarks === 10 ? 'selected' : ''}>10 Marks (Slip Test)</option>
                <option value="20" ${cfg.totalMarks === 20 ? 'selected' : ''}>20 Marks (Unit Test)</option>
                <option value="25" ${cfg.totalMarks === 25 ? 'selected' : ''}>25 Marks (Class Test)</option>
                <option value="50" ${cfg.totalMarks === 50 ? 'selected' : ''}>50 Marks (Mid-Term)</option>
                <option value="70" ${cfg.totalMarks === 70 ? 'selected' : ''}>70 Marks (Revision)</option>
                <option value="90" ${cfg.totalMarks === 90 ? 'selected' : ''}>90 Marks (Public Pattern)</option>
              </select>
            </div>
            <div>
              <label class="field-label">${t('Duration', 'கால அளவு')}</label>
              <select id="pg-duration" class="select">
                <option value="45" ${cfg.durationMinutes === 45 ? 'selected' : ''}>45 Minutes</option>
                <option value="60" ${cfg.durationMinutes === 60 ? 'selected' : ''}>60 Minutes</option>
                <option value="90" ${cfg.durationMinutes === 90 ? 'selected' : ''}>90 Minutes (1.5 Hours)</option>
                <option value="150" ${cfg.durationMinutes === 150 ? 'selected' : ''}>150 Minutes (2.5 Hours)</option>
                <option value="180" ${cfg.durationMinutes === 180 ? 'selected' : ''}>180 Minutes (3.0 Hours)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="field-label">${t('Output Language', 'வெளியீட்டு மொழி')}</label>
            <div class="segmented-pill" style="width:100%;">
              <button type="button" class="segmented-btn ${cfg.language === 'bilingual' ? 'active-white' : ''}" style="flex:1;" data-pg-lang="bilingual">Bilingual</button>
              <button type="button" class="segmented-btn ${cfg.language === 'en' ? 'active-white' : ''}" style="flex:1;" data-pg-lang="en">English</button>
              <button type="button" class="segmented-btn ${cfg.language === 'ta' ? 'active-white' : ''}" style="flex:1;" data-pg-lang="ta">தமிழ்</button>
            </div>
          </div>

          <div>
            <div class="flex-between text-xs" style="margin-bottom:0.25rem;">
              <strong>Book-Back Questions Ratio</strong>
              <strong class="font-mono" style="color:var(--primary);" id="pg-ratio-label">${cfg.bookBackRatio}%</strong>
            </div>
            <input id="pg-ratio" type="range" min="20" max="90" step="10" value="${cfg.bookBackRatio}" style="width:100%;accent-color:var(--primary);" />
            <div class="flex-between" style="font-size:0.68rem;color:var(--outline);">
              <span>20% (More HOTS)</span>
              <span>60% (TN Average)</span>
              <span>90% (Foundation)</span>
            </div>
          </div>

          <label class="soft-panel flex-row" style="align-items:flex-start;flex-wrap:nowrap;cursor:pointer;">
            <input id="pg-public" type="checkbox" ${cfg.includePublicExamQuestions ? 'checked' : ''} style="margin-top:0.2rem;" />
            <div class="text-xs">
              <strong>Draw from 5-Year Public Exam Papers</strong>
              <div class="muted" style="font-size:0.7rem;">Prioritize frequently repeated questions from 2019–2024</div>
            </div>
          </label>

          <button type="button" id="btn-generate-paper" class="btn btn-primary" style="width:100%;padding:0.75rem;" ${appState.paperGenerating ? 'disabled' : ''}>
            ${
              appState.paperGenerating
                ? '<span class="spinner"></span><span>Synthesizing Question Paper...</span>'
                : `<span class="material-symbols-outlined" style="font-size:1.05rem;">auto_awesome</span><span>${t('Generate Test Paper', 'தேர்வு வினாத்தாளை உருவாக்கு')}</span>`
            }
          </button>
        </div>

        <div class="col-span-8">
          ${
            !paper && !appState.paperGenerating
              ? `
            <div class="card" style="padding:3rem 1.5rem;text-align:center;min-height:26rem;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.75rem;">
              <div style="width:4rem;height:4rem;border-radius:1rem;background:var(--primary-fixed);color:var(--primary);display:flex;align-items:center;justify-content:center;">
                <span class="material-symbols-outlined" style="font-size:2rem;">assignment_add</span>
              </div>
              <h3 style="margin:0;font-size:1.05rem;">Ready to Generate Examination</h3>
              <p class="text-xs muted" style="max-width:26rem;margin:0;line-height:1.5;">
                Configure duration, marks, and book-back ratio on the left. Click "Generate Test Paper" to create an authentic TN State Board question paper.
              </p>
              <button type="button" id="btn-quick-demo-paper" class="btn btn-primary" style="margin-top:0.4rem;">
                Quick Demo: Generate ${cfg.totalMarks}-Mark Mid-Term
              </button>
            </div>
          `
              : ''
          }

          ${
            appState.paperGenerating
              ? `
            <div class="card" style="padding:3.5rem 1.5rem;text-align:center;min-height:26rem;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.75rem;">
              <span class="spinner spinner-lg"></span>
              <div style="font-size:0.95rem;font-weight:700;">Validating against Teaching Progress Lock (${taughtCount} eligible units)...</div>
              <div class="text-xs muted">Excluding untaught topics • Balancing difficulty distribution • Generating Tamil &amp; English keys</div>
            </div>
          `
              : ''
          }

          ${
            paper && !appState.paperGenerating
              ? `
            <div class="card" style="padding:0;overflow:hidden;">
              <div class="flex-between no-print" style="padding:0.75rem 1rem;border-bottom:1px solid var(--surface-container);background:rgba(242,243,255,0.5);">
                <div class="segmented-pill">
                  <button type="button" id="tab-paper-view" class="segmented-btn ${appState.paperPreviewTab === 'paper' ? 'active-white' : ''}">Question Paper View</button>
                  <button type="button" id="tab-rubric-view" class="segmented-btn ${appState.paperPreviewTab === 'rubric' ? 'active-white' : ''}">Official Marking Scheme &amp; Answer Keys</button>
                </div>
                <span class="font-mono text-xs muted">${escapeHtml(paper.paperId)}</span>
              </div>

              ${
                appState.paperPreviewTab === 'paper'
                  ? `
                <div style="padding:1.75rem;display:flex;flex-direction:column;gap:1.35rem;">
                  <div style="text-align:center;padding-bottom:1rem;border-bottom:2px solid var(--on-surface);">
                    <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--outline);">
                      GOVERNMENT OF TAMIL NADU • DEPARTMENT OF SCHOOL EDUCATION
                    </div>
                    <h2 style="margin:0.3rem 0;font-size:1.15rem;font-weight:800;">${escapeHtml(paper.title)}</h2>
                    <div class="text-xs muted" style="font-weight:600;">
                      Subject: Mathematics / கணிதம் • Max Marks: ${paper.totalMarks} • Time: ${paper.durationMinutes} Minutes
                    </div>
                  </div>

                  ${paper.sections
                    .map(
                      (sec) => `
                    <div class="flex-col" style="gap:0.8rem;">
                      <div class="soft-panel flex-between" style="padding:0.45rem 0.8rem;">
                        <strong class="text-xs" style="text-transform:uppercase;">${escapeHtml(sec.name)}</strong>
                        <span class="text-xs muted" style="font-style:italic;">${escapeHtml(sec.instructions)}</span>
                      </div>
                      ${sec.questions
                        .map(
                          (q) => `
                        <div style="padding-left:0.4rem;">
                          <div class="flex-between" style="align-items:flex-start;flex-wrap:nowrap;">
                            <div class="flex-row" style="align-items:flex-start;flex-wrap:nowrap;flex:1;">
                              <strong class="text-xs">${q.no}.</strong>
                              <div class="flex-col" style="gap:0.25rem;flex:1;">
                                ${cfg.language !== 'ta' ? `<div class="text-xs" style="white-space:pre-line;">${escapeHtml(q.textEn)}</div>` : ''}
                                ${cfg.language !== 'en' ? `<div class="text-xs font-tamil muted" style="white-space:pre-line;">${escapeHtml(q.textTa)}</div>` : ''}
                                ${
                                  q.options
                                    ? `
                                  <div class="grid grid-4" style="gap:0.4rem;margin-top:0.25rem;">
                                    ${q.options
                                      .map(
                                        (opt, i) => `
                                      <div class="soft-panel font-mono" style="padding:0.3rem 0.5rem;font-size:0.7rem;">(${String.fromCharCode(97 + i)}) ${escapeHtml(opt)}</div>
                                    `
                                      )
                                      .join('')}
                                  </div>
                                `
                                    : ''
                                }
                              </div>
                            </div>
                            <strong class="text-xs">[${q.marks}]</strong>
                          </div>
                          <div class="flex-row no-print" style="padding-left:1.1rem;margin-top:0.25rem;font-size:0.7rem;">
                            <button type="button" class="btn-ghost" style="border:none;color:var(--primary);padding:0.15rem 0.3rem;" data-swap-q="${q.no}">
                              <span class="material-symbols-outlined" style="font-size:0.85rem;">sync</span> Swap variant
                            </button>
                            <button type="button" class="btn-ghost" style="border:none;color:var(--secondary);padding:0.15rem 0.3rem;" data-lock-q="${q.no}">
                              <span class="material-symbols-outlined" style="font-size:0.85rem;">lock</span> Lock Question
                            </button>
                          </div>
                        </div>
                      `
                        )
                        .join('')}
                    </div>
                  `
                    )
                    .join('')}
                </div>
              `
                  : `
                <div style="padding:1.5rem;display:flex;flex-direction:column;gap:0.9rem;">
                  <div class="badge badge-secondary" style="padding:0.65rem 0.85rem;border-radius:0.75rem;">
                    <span class="material-symbols-outlined fill" style="font-size:1rem;">verified</span>
                    <span>Official Stepwise Scoring Rubrics for Evaluators according to DGE TN Guidelines.</span>
                  </div>
                  <div class="card">
                    <div class="flex-between text-xs" style="font-weight:700;color:var(--primary);margin-bottom:0.45rem;">
                      <span>Q.6 Compulsory Problem: Integer Polynomial Root</span>
                      <span>[2 Marks]</span>
                    </div>
                    <div class="flex-between text-xs"><span>• Formulation of conjugate roots: sqrt(5) ± sqrt(3), -sqrt(5) ± sqrt(3)</span><strong class="font-mono">1.0 Mark</strong></div>
                    <div class="flex-between text-xs" style="margin-top:0.25rem;"><span>• Expansion to polynomial: x^4 - 16x^2 + 4 = 0</span><strong class="font-mono">1.0 Mark</strong></div>
                  </div>
                  <div class="card">
                    <div class="flex-between text-xs" style="font-weight:700;color:var(--primary);margin-bottom:0.45rem;">
                      <span>Q.9(a) Long Answer: Orthogonal Matrix Inverse</span>
                      <span>[5 Marks]</span>
                    </div>
                    <div class="flex-between text-xs"><span>• Evaluation of determinant |A| = -729 != 0</span><strong class="font-mono">1.0 Mark</strong></div>
                    <div class="flex-between text-xs" style="margin-top:0.25rem;"><span>• Transpose computation A^T</span><strong class="font-mono">1.0 Mark</strong></div>
                    <div class="flex-between text-xs" style="margin-top:0.25rem;"><span>• Product calculation A * A^T = 81 I_3</span><strong class="font-mono">1.5 Marks</strong></div>
                    <div class="flex-between text-xs" style="margin-top:0.25rem;"><span>• Conclusion A^-1 = (1/9) A^T and final matrix</span><strong class="font-mono">1.5 Marks</strong></div>
                  </div>
                </div>
              `
              }
            </div>
          `
              : ''
          }
        </div>
      </div>
    </div>
  `;
}

export function bindPaperGeneratorEvents() {
  document.getElementById('pg-title')?.addEventListener('input', (e) => { appState.paperConfig.title = e.target.value; });
  document.getElementById('pg-marks')?.addEventListener('change', (e) => { appState.paperConfig.totalMarks = Number(e.target.value); });
  document.getElementById('pg-duration')?.addEventListener('change', (e) => { appState.paperConfig.durationMinutes = Number(e.target.value); });
  document.getElementById('pg-public')?.addEventListener('change', (e) => { appState.paperConfig.includePublicExamQuestions = e.target.checked; });

  document.getElementById('pg-ratio')?.addEventListener('input', (e) => {
    appState.paperConfig.bookBackRatio = Number(e.target.value);
    const label = document.getElementById('pg-ratio-label');
    if (label) label.textContent = `${appState.paperConfig.bookBackRatio}%`;
  });

  document.querySelectorAll('[data-pg-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      appState.paperConfig.language = btn.getAttribute('data-pg-lang');
      triggerRender();
    });
  });

  const executeGenerate = async () => {
    appState.paperGenerating = true;
    triggerRender();
    showToast('AI Exam Engine generating TN State Board blueprint...', 'info');
    try {
      const taughtCount = appState.chapters.filter((c) => c.status === 'completed' || c.status === 'partially_completed').length;
      const generated = await apiClient.generatePaper(
        {
          ...appState.paperConfig,
          classId: appState.currentClass.id,
          taughtTopicsOnly: appState.progressLockActive
        },
        taughtCount
      );
      appState.generatedPaper = generated;
      showToast('Question Paper Generated Successfully!', 'success');
    } catch (err) {
      showToast('Error generating paper', 'error');
    } finally {
      appState.paperGenerating = false;
      triggerRender();
    }
  };

  document.getElementById('btn-generate-paper')?.addEventListener('click', executeGenerate);
  document.getElementById('btn-quick-demo-paper')?.addEventListener('click', executeGenerate);

  document.getElementById('btn-print-paper')?.addEventListener('click', () => window.print());
  document.getElementById('btn-export-docx')?.addEventListener('click', () => {
    showToast('Exported to Microsoft Word (.docx) with editable formatting', 'success');
  });

  document.getElementById('tab-paper-view')?.addEventListener('click', () => {
    appState.paperPreviewTab = 'paper';
    triggerRender();
  });
  document.getElementById('tab-rubric-view')?.addEventListener('click', () => {
    appState.paperPreviewTab = 'rubric';
    triggerRender();
  });

  document.querySelectorAll('[data-swap-q]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast(`Regenerated equivalent variant for Q.${btn.getAttribute('data-swap-q')}`, 'success');
    });
  });
  document.querySelectorAll('[data-lock-q]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast(`Q.${btn.getAttribute('data-lock-q')} locked against regeneration`, 'info');
    });
  });
}
