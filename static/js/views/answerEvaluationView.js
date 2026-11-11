import { apiClient } from '../api/client.js';
import { appState, escapeHtml, showToast, t, triggerRender } from '../state.js';

let evalState = {
  zoomed: false,
  teacherScore: 3.5,
  teacherNotes: 'Given partial credit for intermediate transpose matrix.',
  signedOff: false
};

export function renderAnswerEvaluationView() {
  const sample = appState.evaluations[0];

  return `
    <div class="page-container">
      <header class="flex-between">
        <div>
          <div class="flex-row">
            <h1 class="page-title">${t('AI Handwritten Answer Evaluation System', 'AI கையெழுத்து விடைத்தாள் மதிப்பீடு')}</h1>
            <span class="badge badge-tertiary">Core Differentiator</span>
          </div>
          <p class="page-subtitle">Dual-pane handwriting OCR recognition with stepwise rubric grading, mathematical verification, and teacher audit trail.</p>
        </div>

        <div class="flex-row">
          <span class="badge badge-neutral font-mono" style="padding:0.45rem 0.75rem;">Queue: 12 Scans Pending</span>
          <button type="button" id="btn-upload-scans" class="btn btn-primary">
            <span class="material-symbols-outlined" style="font-size:1rem;">upload_file</span>
            <span>${t('Upload Batch Scans', 'விடைத்தாள் படங்களைப் பதிவேற்று')}</span>
          </button>
        </div>
      </header>

      <div class="card flex-between" style="padding:0.8rem 1rem;">
        <div class="flex-row text-xs">
          <strong>${t('Active Student:', 'தற்போதைய மாணவர்:')}</strong>
          <span class="badge badge-primary">${escapeHtml(sample.studentName)} (Roll #${escapeHtml(sample.rollNo)})</span>
          <span class="muted">•</span>
          <span class="muted">${escapeHtml(sample.testName)}</span>
        </div>
        <div class="flex-row text-xs">
          <strong>${t('OCR Confidence:', 'OCR நம்பகத்தன்மை:')}</strong>
          <strong style="color:var(--secondary);">${sample.confidenceScore}%</strong>
          <span class="badge badge-secondary">${escapeHtml(sample.confidenceTier)} Confidence</span>
        </div>
      </div>

      <div class="grid grid-2" style="gap:1.25rem;align-items:stretch;">
        <section class="card flex-col" style="justify-content:space-between;gap:0.9rem;">
          <div>
            <div class="flex-between" style="padding-bottom:0.65rem;border-bottom:1px solid var(--surface-container);">
              <div class="flex-row">
                <span class="material-symbols-outlined" style="color:var(--primary);">document_scanner</span>
                <strong class="text-xs">Scanned Student Answer Script (Class 12 Board Sheet)</strong>
              </div>
              <div class="flex-row" style="gap:0.25rem;">
                <button type="button" id="btn-zoom-scan" class="btn-ghost" style="padding:0.25rem;" title="Zoom">
                  <span class="material-symbols-outlined" style="font-size:1.1rem;">zoom_in</span>
                </button>
                <button type="button" id="btn-reset-scan" class="btn-ghost" style="padding:0.25rem;" title="Reset">
                  <span class="material-symbols-outlined" style="font-size:1.1rem;">restart_alt</span>
                </button>
              </div>
            </div>

            <div class="scan-sheet ${evalState.zoomed ? 'zoomed' : ''}" style="margin-top:0.9rem;">
              <div class="flex-between font-mono" style="font-size:0.66rem;color:#64748b;padding-bottom:0.4rem;border-bottom:1px dashed #cbd5e1;">
                <span>TN HSC EXAMINATION 2024–25</span>
                <span>REGISTER NO: 33240100201214</span>
                <span>PAGE 3</span>
              </div>

              <div style="margin-top:0.75rem;display:flex;flex-direction:column;gap:0.5rem;" class="text-xs">
                <div style="font-weight:800;color:var(--primary);">Q. 17 (Compulsory 5-Mark):</div>
                <div style="background:rgba(254, 243, 199, 0.55);border:1px solid rgba(252, 211, 77, 0.7);border-radius:0.5rem;padding:0.65rem;line-height:1.55;font-style:italic;">
                  <div style="font-size:0.64rem;font-weight:800;text-transform:uppercase;color:#64748b;font-style:normal;margin-bottom:0.25rem;">Student Working:</div>
                  <div>Given matrix A = [[-8, 1, 4], [4, 4, 7], [1, -8, 4]].</div>
                  <div>Step 1: |A| = -8(16 - (-56)) - 1(16 - 7) + 4(-32 - 4) = -8(72) - 9 - 144 = -729 != 0.</div>
                  <div>Step 2: A^T = [[-8, 4, 1], [1, 4, -8], [4, 7, 4]].</div>
                  <div>Step 3: A * A^T = [[81, 0, 0], [0, 81, 0], [0, 0, 81]] = 81 I_3.</div>
                  <div>Step 4: A * (1/81 A^T) = I. So A^-1 = 1/81 A^T. (Concluded here).</div>
                </div>
              </div>

              <div class="flex-between" style="margin-top:0.8rem;padding-top:0.5rem;border-top:1px dashed #cbd5e1;font-size:0.68rem;color:#64748b;">
                <span>Handwriting recognition: Dual (English numerals &amp; Tamil annotations)</span>
                <strong style="color:var(--secondary);">100% Legibility</strong>
              </div>
            </div>
          </div>

          <div class="flex-between text-xs muted" style="padding-top:0.65rem;border-top:1px solid var(--surface-container);">
            <span>OCR Region bounding: [X: 120, Y: 340, W: 820, H: 450]</span>
            <span class="font-mono">Engine: TN-OCR-V3.8</span>
          </div>
        </section>

        <section class="card flex-col" style="justify-content:space-between;gap:1rem;">
          <div>
            <div class="flex-between" style="padding-bottom:0.65rem;border-bottom:1px solid var(--surface-container);">
              <div class="flex-row">
                <span class="material-symbols-outlined" style="color:var(--secondary);">fact_check</span>
                <strong class="text-xs">AI Rubric Breakdown &amp; Suggested Marks</strong>
              </div>
              <div class="flex-row">
                <span class="text-xs muted">${t('AI Recommendation:', 'AI பரிந்துரை:')}</span>
                <strong style="font-size:1.1rem;color:var(--primary);">${sample.aiSuggestedMarks} / ${sample.maxMarks}</strong>
              </div>
            </div>

            <div class="flex-col" style="margin-top:0.9rem;gap:0.6rem;">
              ${sample.stepwiseBreakdown
                .map(
                  (step) => `
                <div class="card" style="padding:0.75rem;box-shadow:none;background:${step.verified ? 'rgba(242,243,255,0.45)' : 'rgba(255,218,214,0.28)'};border-color:${step.verified ? 'var(--surface-container)' : 'var(--error-container)'};">
                  <div class="flex-between" style="align-items:flex-start;flex-wrap:nowrap;">
                    <div class="flex-row" style="align-items:flex-start;flex-wrap:nowrap;">
                      <span class="material-symbols-outlined" style="font-size:1.1rem;color:${step.verified ? 'var(--secondary)' : 'var(--error)'};">
                        ${step.verified ? 'check_circle' : 'cancel'}
                      </span>
                      <div>
                        <div class="text-xs" style="font-weight:700;">Step ${step.stepNo}: ${escapeHtml(step.description)}</div>
                        ${step.note ? `<div class="text-xs" style="color:var(--error);margin-top:0.2rem;">AI Diagnostic Note: ${escapeHtml(step.note)}</div>` : ''}
                      </div>
                    </div>
                    <strong class="font-mono text-xs" style="color:var(--primary);white-space:nowrap;">+${step.aiMarks} / ${step.maxMarks}</strong>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>

            <div class="soft-panel flex-col" style="margin-top:1rem;gap:0.75rem;">
              <div class="flex-between">
                <label class="text-xs" style="font-weight:700;display:flex;align-items:center;gap:0.35rem;">
                  <span class="material-symbols-outlined" style="color:var(--tertiary);font-size:1rem;">edit</span>
                  Teacher Final Adjusted Score:
                </label>
                <div class="flex-row" style="gap:0.4rem;">
                  <input id="eval-teacher-score" type="number" step="0.5" min="0" max="${sample.maxMarks}" value="${evalState.teacherScore}" class="input" style="width:4.5rem;text-align:center;font-weight:800;color:var(--primary);" />
                  <strong class="text-xs">/ ${sample.maxMarks} Marks</strong>
                </div>
              </div>
              <div>
                <label class="field-label">Teacher Evaluation Audit Notes:</label>
                <input id="eval-teacher-notes" class="input" value="${escapeHtml(evalState.teacherNotes)}" />
              </div>
            </div>
          </div>

          <div class="flex-between" style="padding-top:0.65rem;border-top:1px solid var(--surface-container);">
            <span class="font-mono text-xs muted">Status: ${evalState.signedOff ? 'APPROVED' : 'PENDING'}</span>
            <div class="flex-row">
              <button type="button" id="btn-moderation" class="btn btn-surface">Send for Moderation</button>
              <button type="button" id="btn-approve-eval" class="btn btn-secondary" ${evalState.signedOff ? 'disabled' : ''}>
                <span class="material-symbols-outlined" style="font-size:1rem;">gavel</span>
                <span>${evalState.signedOff ? t('Signed & Recorded', 'ஒப்புதல் அளித்து பதிவு செய்யப்பட்டது') : t('Approve & Save Evaluation', 'ஒப்புதல் அளித்து மதிப்பீட்டைச் சேமி')}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
}

export function bindAnswerEvaluationEvents() {
  document.getElementById('btn-upload-scans')?.addEventListener('click', () => {
    showToast('Answer sheets uploaded from optical high-speed scanner', 'success');
  });
  document.getElementById('btn-zoom-scan')?.addEventListener('click', () => {
    evalState.zoomed = true;
    showToast('Zooming into handwriting region', 'info');
    triggerRender();
  });
  document.getElementById('btn-reset-scan')?.addEventListener('click', () => {
    evalState.zoomed = false;
    showToast('Reset zoom', 'info');
    triggerRender();
  });
  document.getElementById('eval-teacher-score')?.addEventListener('input', (e) => {
    evalState.teacherScore = Number(e.target.value);
  });
  document.getElementById('eval-teacher-notes')?.addEventListener('input', (e) => {
    evalState.teacherNotes = e.target.value;
  });
  document.getElementById('btn-moderation')?.addEventListener('click', () => {
    showToast('Evaluation sent for second-reader moderation', 'info');
  });
  document.getElementById('btn-approve-eval')?.addEventListener('click', async () => {
    const sample = appState.evaluations[0];
    await apiClient.approveEvaluation(sample.evaluationId, {
      finalApprovedMarks: evalState.teacherScore,
      teacherAdjustmentNotes: evalState.teacherNotes,
      teacherId: 'T-TN-48291'
    });
    evalState.signedOff = true;
    showToast(`Evaluation for ${sample.studentName} approved with ${evalState.teacherScore} / ${sample.maxMarks} Marks!`, 'success');
    triggerRender();
  });
}
