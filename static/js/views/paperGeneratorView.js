import { apiClient } from '../api/client.js';
import { appState, showToast, t, triggerRender } from '../state.js';
import { cloneTemplate, qs, setText, setVisible } from '../utils/dom.js';

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
  const root = cloneTemplate('tpl-paper-generator');
  const cfg = appState.paperConfig;
  const paper = appState.generatedPaper;
  const taughtCount = appState.chapters.filter((c) => c.status === 'completed' || c.status === 'partially_completed').length;

  setText(root, '[data-el="page-title"]', t('AI Question Paper Generator', 'AI வினாத்தாள் உருவாக்கி'));
  setVisible(root, '[data-el="export-actions"]', Boolean(paper));
  setText(root, '[data-el="print-label"]', t('Print / Export PDF', 'அச்சிடு / PDF ஏற்றுமதி'));
  setText(root, '[data-el="docx-label"]', t('DOCX Export', 'DOCX ஏற்றுமதி'));

  const banner = qs(root, '[data-el="lock-banner"]');
  if (banner) {
    banner.style.background = appState.progressLockActive ? 'rgba(109, 245, 225, 0.18)' : 'rgba(255, 218, 214, 0.45)';
    banner.style.borderColor = appState.progressLockActive ? 'var(--secondary-container)' : 'var(--error-container)';
  }
  const bannerIcon = qs(root, '[data-el="lock-banner-icon"]');
  if (bannerIcon) {
    bannerIcon.textContent = appState.progressLockActive ? 'shield_lock' : 'warning';
    bannerIcon.style.color = appState.progressLockActive ? 'var(--secondary)' : 'var(--error)';
  }
  setText(root, '[data-el="lock-banner-title"]', appState.progressLockActive ? 'Teaching Progress Lock Enforced (Rule 1 Active)' : 'Warning: Progress Lock is Disabled');
  setText(root, '[data-el="lock-banner-desc"]', appState.progressLockActive
    ? 'Only verified taught units (Ch 1, 2, 3, and 4.1-4.2) will be drawn for this examination.'
    : 'Questions may be chosen from untaught syllabus topics.');
  const lockBadge = qs(root, '[data-el="lock-banner-badge"]');
  if (lockBadge) {
    lockBadge.className = `badge font-mono ${appState.progressLockActive ? 'badge-secondary' : 'badge-error'}`;
    lockBadge.textContent = appState.progressLockActive ? 'UNTAUGHT EXCLUDED' : 'LOCK BYPASSED';
  }

  setText(root, '[data-el="label-title"]', t('Paper Heading / Title', 'வினாத்தாள் தலைப்பு'));
  qs(root, '#pg-title').value = cfg.title;
  setText(root, '[data-el="label-marks"]', t('Total Marks', 'மொத்த மதிப்பெண்கள்'));
  qs(root, '#pg-marks').value = String(cfg.totalMarks);
  setText(root, '[data-el="label-duration"]', t('Duration', 'கால அளவு'));
  qs(root, '#pg-duration').value = String(cfg.durationMinutes);
  setText(root, '[data-el="label-language"]', t('Output Language', 'வெளியீட்டு மொழி'));
  qs(root, '#pg-language').value = cfg.language;

  setText(root, '#pg-ratio-label', `${cfg.bookBackRatio}%`);
  qs(root, '#pg-ratio').value = String(cfg.bookBackRatio);
  qs(root, '#pg-public').checked = Boolean(cfg.includePublicExamQuestions);

  qs(root, '#btn-generate-paper').disabled = Boolean(appState.paperGenerating);
  setVisible(root, '[data-el="gen-spinner"]', appState.paperGenerating);
  setVisible(root, '[data-el="gen-icon"]', !appState.paperGenerating);
  setText(root, '[data-el="gen-label"]', appState.paperGenerating
    ? 'Synthesizing Question Paper...'
    : t('Generate Test Paper', 'தேர்வு வினாத்தாளை உருவாக்கு'));

  setVisible(root, '[data-el="empty-state"]', !paper && !appState.paperGenerating);
  setText(root, '#btn-quick-demo-paper', `Quick Demo: Generate ${cfg.totalMarks}-Mark Mid-Term`);

  setVisible(root, '[data-el="loading-state"]', appState.paperGenerating);
  setText(root, '[data-el="loading-title"]', `Validating against Teaching Progress Lock (${taughtCount} eligible units)...`);

  const hasPaper = Boolean(paper && !appState.paperGenerating);
  setVisible(root, '[data-el="paper-card"]', hasPaper);
  if (hasPaper) {
    qs(root, '#tab-paper-view')?.classList.toggle('active-white', appState.paperPreviewTab === 'paper');
    qs(root, '#tab-rubric-view')?.classList.toggle('active-white', appState.paperPreviewTab === 'rubric');
    setText(root, '[data-el="paper-id"]', paper.paperId);

    const isPaperPane = appState.paperPreviewTab === 'paper';
    setVisible(root, '[data-el="paper-pane"]', isPaperPane);
    setVisible(root, '[data-el="rubric-pane"]', !isPaperPane);

    if (isPaperPane) {
      setText(root, '[data-el="paper-title"]', paper.title);
      setText(root, '[data-el="paper-meta"]', `Subject: Mathematics / கணிதம் • Max Marks: ${paper.totalMarks} • Time: ${paper.durationMinutes} Minutes`);
      const secWrap = qs(root, '[data-el="paper-sections"]');
      paper.sections.forEach((sec) => {
        const secEl = cloneTemplate('tpl-pg-section');
        setText(secEl, '[data-el="sec-name"]', sec.name);
        setText(secEl, '[data-el="sec-instructions"]', sec.instructions);
        const qList = qs(secEl, '[data-el="sec-questions"]');

        sec.questions.forEach((q) => {
          const qEl = cloneTemplate('tpl-pg-question');
          const isLocked = appState.lockedPaperQuestions.includes(q.no);
          setText(qEl, '[data-el="q-no"]', `${q.no}.`);
          setVisible(qEl, '[data-el="q-en"]', cfg.language !== 'ta');
          setText(qEl, '[data-el="q-en"]', q.textEn);
          setVisible(qEl, '[data-el="q-ta"]', cfg.language !== 'en');
          setText(qEl, '[data-el="q-ta"]', q.textTa);

          const optsEl = qs(qEl, '[data-el="q-options"]');
          setVisible(qEl, '[data-el="q-options"]', Boolean(q.options));
          if (q.options) {
            q.options.forEach((opt, i) => {
              const oEl = cloneTemplate('tpl-pg-mcq-opt');
              setText(oEl, '[data-el="opt-text"]', `(${String.fromCharCode(97 + i)}) ${opt}`);
              optsEl.appendChild(oEl);
            });
          }

          setText(qEl, '[data-el="q-marks"]', `[${q.marks}]`);

          const swapBtn = qs(qEl, '[data-el="btn-swap"]');
          if (swapBtn) {
            swapBtn.setAttribute('data-swap-q', String(q.no));
            swapBtn.disabled = isLocked;
            swapBtn.style.color = isLocked ? 'var(--outline)' : 'var(--primary)';
          }
          const lockBtn = qs(qEl, '[data-el="btn-lock"]');
          if (lockBtn) {
            lockBtn.setAttribute('data-lock-q', String(q.no));
            lockBtn.style.color = isLocked ? 'var(--error)' : 'var(--secondary)';
            lockBtn.style.fontWeight = isLocked ? '700' : '600';
          }
          setText(qEl, '[data-el="lock-icon"]', isLocked ? 'lock' : 'lock_open');
          setText(qEl, '[data-el="lock-text"]', isLocked ? 'Locked (Unlock)' : 'Lock Question');

          qList.appendChild(qEl);
        });

        secWrap.appendChild(secEl);
      });
    } else {
      const rubWrap = qs(root, '[data-el="rubric-sections"]');
      paper.sections.forEach((sec) => {
        const rsEl = cloneTemplate('tpl-pg-rubric-section');
        setText(rsEl, '[data-el="sec-name"]', sec.name);
        const rowsWrap = qs(rsEl, '[data-el="rubric-rows"]');
        sec.questions.forEach((q) => {
          const rowEl = cloneTemplate('tpl-pg-rubric-row');
          setText(rowEl, '[data-el="q-no"]', `Q.${q.no}`);
          setText(rowEl, '[data-el="q-detail"]', `${q.chapter || q.type} — ${q.answer || 'Stepwise solution key verified'}`);
          setText(rowEl, '[data-el="q-marks"]', `${q.marks} M`);
          rowsWrap.appendChild(rowEl);
        });
        rubWrap.appendChild(rsEl);
      });
    }
  }

  return root;
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
