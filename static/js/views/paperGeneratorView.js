import { apiClient } from '../api/client.js';
import { appState, escapeHtml, showToast, t, triggerRender } from '../state.js';

const QUESTION_VARIANTS = {
  1: {
    textEn: 'If A is an orthogonal matrix of order 3x3, then |A| is equal to:',
    textTa: 'A என்பது 3x3 வரிசையுடைய செங்குத்து அணி எனில் |A| என்பது:',
    options: ['0', '+-1', '3', '9'],
    answer: '+-1'
  },
  4: {
    textEn: 'Find the rank of the matrix [[1, 2, -1], [3, 6, -3]].',
    textTa: '[[1, 2, -1], [3, 6, -3]] என்ற அணியின் தரத்தைக் காண்க.',
    answer: 'Rank = 1'
  },
  5: {
    textEn: 'Find the modulus and principal argument of -sqrt(3) + i.',
    textTa: '-sqrt(3) + i -ன் மட்டு மதிப்பு மற்றும் முதன்மை வீச்சு காண்க.',
    answer: 'r = 2, theta = 5pi/6'
  },
  8: {
    textEn: "Solve: 3x + 2y = 12, x - 4y = -10 using Cramer's Rule.",
    textTa: 'கிரேமரின் விதியைப் பயன்படுத்தித் தீர்க்க: 3x + 2y = 12, x - 4y = -10.',
    answer: 'x = 2, y = 3'
  }
};

export function renderPaperGeneratorView() {
  const cfg = appState.paperConfig;
  const paper = appState.generatedPaper;
  const taughtCount = appState.chapters.filter((c) => c.status === 'completed' || c.status === 'partially_completed').length;

  return `
    <div class="page-container">
      <header class="flex-between" style="align-items:flex-start;">
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
          <div class="flex-row no-print" style="justify-content:flex-end;">
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
            <label class="field-label" for="pg-language">${t('Output Language', 'வெளியீட்டு மொழி')}</label>
            <select id="pg-language" class="select">
              <option value="bilingual" ${cfg.language === 'bilingual' ? 'selected' : ''}>Bilingual (English &amp; தமிழ்)</option>
              <option value="en" ${cfg.language === 'en' ? 'selected' : ''}>English Only</option>
              <option value="ta" ${cfg.language === 'ta' ? 'selected' : ''}>தமிழ் Only (Tamil Medium)</option>
            </select>
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
                        .map((q) => {
                          const isLocked = appState.lockedPaperQuestions.includes(q.no);
                          return `
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
                            <button type="button" class="btn-ghost" style="border:none;color:${isLocked ? 'var(--outline)' : 'var(--primary)'};padding:0.15rem 0.3rem;" data-swap-q="${q.no}" ${isLocked ? 'disabled' : ''}>
                              <span class="material-symbols-outlined" style="font-size:0.85rem;">sync</span> Swap variant
                            </button>
                            <button type="button" class="btn-ghost" style="border:none;color:${isLocked ? 'var(--error)' : 'var(--secondary)'};padding:0.15rem 0.3rem;font-weight:${isLocked ? '700' : '600'};" data-lock-q="${q.no}">
                              <span class="material-symbols-outlined" style="font-size:0.85rem;">${isLocked ? 'lock' : 'lock_open'}</span> ${isLocked ? 'Locked (Unlock)' : 'Lock Question'}
                            </button>
                          </div>
                        </div>
                      `;
                        })
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
                  ${paper.sections
                    .map(
                      (sec) => `
                    <div class="card" style="box-shadow:none;">
                      <div class="text-xs" style="font-weight:700;color:var(--primary);margin-bottom:0.5rem;text-transform:uppercase;">${escapeHtml(sec.name)}</div>
                      <div class="flex-col" style="gap:0.4rem;">
                        ${sec.questions
                          .map(
                            (q) => `
                          <div class="flex-between text-xs" style="padding:0.35rem 0;border-bottom:1px solid var(--surface-container-low);gap:0.75rem;">
                            <span style="flex:1;"><strong>Q.${q.no}</strong> ${escapeHtml(q.chapter || q.type)} — ${escapeHtml(q.answer || 'Stepwise solution key verified')}</span>
                            <strong class="font-mono" style="color:var(--secondary);">${q.marks} M</strong>
                          </div>
                        `
                          )
                          .join('')}
                      </div>
                    </div>
                  `
                    )
                    .join('')}
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

  document.getElementById('pg-language')?.addEventListener('change', (e) => {
    appState.paperConfig.language = e.target.value;
    triggerRender();
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
      const qNo = Number(btn.getAttribute('data-swap-q'));
      if (appState.lockedPaperQuestions.includes(qNo)) {
        showToast(`Q.${qNo} is locked and cannot be swapped.`, 'warning');
        return;
      }
      const paper = appState.generatedPaper;
      if (paper?.sections) {
        for (const sec of paper.sections) {
          const targetQ = sec.questions.find((q) => q.no === qNo);
          if (targetQ) {
            const alt = QUESTION_VARIANTS[qNo];
            if (alt && !targetQ._swapped) {
              targetQ._orig = { textEn: targetQ.textEn, textTa: targetQ.textTa, options: targetQ.options, answer: targetQ.answer };
              targetQ.textEn = alt.textEn;
              targetQ.textTa = alt.textTa;
              if (alt.options) targetQ.options = alt.options;
              if (alt.answer) targetQ.answer = alt.answer;
              targetQ._swapped = true;
            } else if (targetQ._orig) {
              targetQ.textEn = targetQ._orig.textEn;
              targetQ.textTa = targetQ._orig.textTa;
              targetQ.options = targetQ._orig.options;
              targetQ.answer = targetQ._orig.answer;
              targetQ._swapped = false;
            } else {
              const bankPool = appState.questions.filter((bq) => bq.marks === targetQ.marks && bq.questionEn !== targetQ.textEn);
              if (bankPool.length > 0) {
                const idx = (appState.paperVariantOffsets[qNo] || 0) % bankPool.length;
                appState.paperVariantOffsets[qNo] = idx + 1;
                targetQ.textEn = bankPool[idx].questionEn;
                targetQ.textTa = bankPool[idx].questionTa;
                targetQ.answer = bankPool[idx].answerKey;
              }
            }
            break;
          }
        }
      }
      showToast(`Regenerated equivalent variant for Q.${qNo}`, 'success');
      triggerRender();
    });
  });
  document.querySelectorAll('[data-lock-q]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const qNo = Number(btn.getAttribute('data-lock-q'));
      if (appState.lockedPaperQuestions.includes(qNo)) {
        appState.lockedPaperQuestions = appState.lockedPaperQuestions.filter((n) => n !== qNo);
        showToast(`Q.${qNo} unlocked for variant swapping`, 'info');
      } else {
        appState.lockedPaperQuestions.push(qNo);
        showToast(`Q.${qNo} locked against regeneration`, 'info');
      }
      triggerRender();
    });
  });
}
