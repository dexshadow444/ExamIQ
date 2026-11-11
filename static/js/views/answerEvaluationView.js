import { apiClient } from '../api/client.js';
import { appState, showToast, t, triggerRender } from '../state.js';
import { cloneTemplate, qs, setText, setVisible } from '../utils/dom.js';

let evalState = {
  zoomed: false,
  teacherScore: 3.5,
  teacherNotes: 'Given partial credit for intermediate transpose matrix.',
  signedOff: false
};

export function renderAnswerEvaluationView() {
  const root = cloneTemplate('tpl-answer-evaluation');
  const sample = appState.evaluations[0];

  setText(root, '[data-el="page-title"]', t('AI Handwritten Answer Evaluation System', 'AI கையெழுத்து விடைத்தாள் மதிப்பீடு'));
  setText(root, '[data-el="queue-badge"]', `Queue: ${appState.pendingEvalCount} Scans Pending`);
  setText(root, '[data-el="upload-label"]', t('Upload Batch Scans', 'விடைத்தாள் படங்களைப் பதிவேற்று'));

  setText(root, '[data-el="student-label"]', t('Active Student:', 'தற்போதைய மாணவர்:'));
  setText(root, '[data-el="student-badge"]', `${sample.studentName} (Roll #${sample.rollNo})`);
  setText(root, '[data-el="test-name"]', sample.testName);

  setText(root, '[data-el="confidence-label"]', t('OCR Confidence:', 'OCR நம்பகத்தன்மை:'));
  setText(root, '[data-el="confidence-score"]', `${sample.confidenceScore}%`);
  setText(root, '[data-el="confidence-tier"]', `${sample.confidenceTier} Confidence`);

  qs(root, '[data-el="scan-sheet"]')?.classList.toggle('zoomed', Boolean(evalState.zoomed));

  setText(root, '[data-el="ai-rec-label"]', t('AI Recommendation:', 'AI பரிந்துரை:'));
  setText(root, '[data-el="ai-rec-val"]', `${sample.aiSuggestedMarks} / ${sample.maxMarks}`);

  const stepsList = qs(root, '[data-el="steps-list"]');
  sample.stepwiseBreakdown.forEach((step) => {
    const el = cloneTemplate('tpl-eval-step');
    const card = qs(el, '[data-el="step-card"]') || el;
    card.style.background = step.verified ? 'rgba(242,243,255,0.45)' : 'rgba(255,218,214,0.28)';
    card.style.borderColor = step.verified ? 'var(--surface-container)' : 'var(--error-container)';

    const icon = qs(el, '[data-el="step-icon"]');
    if (icon) {
      icon.textContent = step.verified ? 'check_circle' : 'cancel';
      icon.style.color = step.verified ? 'var(--secondary)' : 'var(--error)';
    }
    setText(el, '[data-el="step-desc"]', `Step ${step.stepNo}: ${step.description}`);
    setVisible(el, '[data-el="step-note"]', Boolean(step.note));
    if (step.note) setText(el, '[data-el="step-note"]', `AI Diagnostic Note: ${step.note}`);
    setText(el, '[data-el="step-marks"]', `+${step.aiMarks} / ${step.maxMarks}`);
    stepsList.appendChild(el);
  });

  const scoreEl = qs(root, '#eval-teacher-score');
  if (scoreEl) {
    scoreEl.max = String(sample.maxMarks);
    scoreEl.value = String(evalState.teacherScore);
  }
  setText(root, '[data-el="max-marks-label"]', `/ ${sample.maxMarks} Marks`);
  const notesEl = qs(root, '#eval-teacher-notes');
  if (notesEl) notesEl.value = evalState.teacherNotes;

  setText(root, '[data-el="eval-status"]', `Status: ${evalState.signedOff ? 'APPROVED' : 'PENDING'}`);
  const approveBtn = qs(root, '#btn-approve-eval');
  if (approveBtn) approveBtn.disabled = Boolean(evalState.signedOff);
  setText(root, '[data-el="approve-label"]', evalState.signedOff
    ? t('Signed & Recorded', 'ஒப்புதல் அளித்து பதிவு செய்யப்பட்டது')
    : t('Approve & Save Evaluation', 'ஒப்புதல் அளித்து மதிப்பீட்டைச் சேமி'));

  return root;
}

export function bindAnswerEvaluationEvents() {
  document.getElementById('btn-upload-scans')?.addEventListener('click', () => {
    showToast('Answer sheets uploaded from optical high-speed scanner', 'success');
  });
  document.getElementById('btn-zoom-scan')?.addEventListener('click', () => {
    evalState.zoomed = !evalState.zoomed;
    showToast(evalState.zoomed ? 'Zoomed into handwriting region' : 'Zoom reset', 'info');
    triggerRender();
  });
  document.getElementById('btn-reset-scan')?.addEventListener('click', () => {
    evalState.zoomed = false;
    showToast('Reset zoom', 'info');
    triggerRender();
  });
  document.getElementById('eval-teacher-score')?.addEventListener('input', (e) => {
    const sample = appState.evaluations[0];
    const max = sample?.maxMarks || 5;
    const raw = Number(e.target.value);
    evalState.teacherScore = Number.isNaN(raw) ? 0 : Math.min(max, Math.max(0, raw));
  });
  document.getElementById('eval-teacher-notes')?.addEventListener('input', (e) => {
    evalState.teacherNotes = e.target.value;
  });
  document.getElementById('btn-moderation')?.addEventListener('click', () => {
    showToast('Evaluation sent for second-reader moderation', 'info');
  });
  document.getElementById('btn-approve-eval')?.addEventListener('click', async () => {
    const sample = appState.evaluations[0];
    const score = Math.min(sample.maxMarks, Math.max(0, Number(evalState.teacherScore) || 0));
    evalState.teacherScore = score;
    await apiClient.approveEvaluation(sample.evaluationId, {
      finalApprovedMarks: score,
      teacherAdjustmentNotes: evalState.teacherNotes,
      teacherId: 'T-TN-48291'
    });
    if (!evalState.signedOff && appState.pendingEvalCount > 0) {
      appState.pendingEvalCount -= 1;
    }
    sample.status = 'Approved';
    sample.teacherApprovedMarks = score;
    evalState.signedOff = true;
    showToast(`Evaluation for ${sample.studentName} approved with ${score} / ${sample.maxMarks} Marks!`, 'success');
    triggerRender();
  });
}
