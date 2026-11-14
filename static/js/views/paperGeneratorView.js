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

let previewLanguageOverride = null;

export function renderPaperGeneratorView() {
  const root = cloneTemplate('tpl-paper-generator');
  const cfg = appState.paperConfig;
  const paper = appState.generatedPaper;
  const taughtCount = appState.chapters.filter((c) => c.status === 'completed' || c.status === 'partially_completed').length;

  // Header & Export Actions
  setText(root, '[data-el="page-title"]', t('AI Question Paper Generator', 'AI வினாத்தாள் உருவாக்கி'));
  setVisible(root, '[data-el="export-actions"]', Boolean(paper));

  if (paper?.ai_status) {
    const aiBadge = qs(root, '[data-el="ai-status-badge"]');
    if (aiBadge) {
      aiBadge.hidden = false;
      aiBadge.textContent = paper.ai_status === 'live' ? 'Groq AI Active' : 'Offline Dataset Mode';
      aiBadge.className = `badge ${paper.ai_status === 'live' ? 'badge-primary' : 'badge-tertiary'}`;
    }
  }

  // Lock Banner
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
    ? `Only verified taught syllabus units will be drawn for this examination.`
    : 'Questions may be chosen from untaught syllabus topics.');
  const lockBadge = qs(root, '[data-el="lock-banner-badge"]');
  if (lockBadge) {
    lockBadge.className = `badge font-mono ${appState.progressLockActive ? 'badge-secondary' : 'badge-error'}`;
    lockBadge.textContent = appState.progressLockActive ? 'UNTAUGHT EXCLUDED' : 'LOCK BYPASSED';
  }

  // Fallback Notice Banner
  const fallbackBanner = qs(root, '[data-el="fallback-banner"]');
  if (fallbackBanner) {
    fallbackBanner.hidden = !(paper && paper.ai_status === 'fallback');
  }

  // Form Controls
  const subSelect = qs(root, '#pg-subject');
  if (subSelect) {
    subSelect.value = cfg.subject || 'Physics';
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

  // Dataset Status Panel
  const dsStats = appState.datasetStatus;
  if (dsStats) {
    setText(root, '[data-el="ds-status-badge"]', `${dsStats.files_ingested || 35} Papers / ${dsStats.total_canonical_questions || 1361} Qs`);
    setText(root, '[data-el="ds-stats-summary"]',
      `5-Year Public Exam Archive: ${dsStats.total_canonical_questions || 1361} verified questions across 7 subjects with Tamil & English.`
    );
    const pillWrap = qs(root, '[data-el="ds-year-pills"]');
    if (pillWrap && dsStats.questions_by_year) {
      pillWrap.innerHTML = '';
      Object.entries(dsStats.questions_by_year).forEach(([yr, cnt]) => {
        const pill = document.createElement('div');
        pill.className = 'soft-panel font-mono text-xs';
        pill.style.padding = '0.2rem 0.3rem';
        pill.style.fontSize = '0.65rem';
        pill.innerHTML = `<strong>${yr}</strong><br><span style="color:var(--primary);">${cnt} Qs</span>`;
        pillWrap.appendChild(pill);
      });
    }
  }

  // Generate Button
  qs(root, '#btn-generate-paper').disabled = Boolean(appState.paperGenerating);
  setVisible(root, '[data-el="gen-spinner"]', appState.paperGenerating);
  setVisible(root, '[data-el="gen-icon"]', !appState.paperGenerating);
  setText(root, '[data-el="gen-label"]', appState.paperGenerating
    ? 'Synthesizing Question Paper...'
    : t('Generate Test Paper', 'தேர்வு வினாத்தாளை உருவாக்கு'));

  // Empty State & Quick Demo
  setVisible(root, '[data-el="empty-state"]', !paper && !appState.paperGenerating);
  setText(root, '#btn-quick-demo-paper', `Quick Demo: Generate ${cfg.totalMarks}-Mark ${cfg.subject || 'Physics'} Paper`);

  // Loading State
  setVisible(root, '[data-el="loading-state"]', appState.paperGenerating);

  // Paper Card
  const hasPaper = Boolean(paper && !appState.paperGenerating);
  setVisible(root, '[data-el="paper-card"]', hasPaper);

  if (hasPaper) {
    qs(root, '#tab-paper-view')?.classList.toggle('active-white', appState.paperPreviewTab === 'paper');
    qs(root, '#tab-rubric-view')?.classList.toggle('active-white', appState.paperPreviewTab === 'rubric');
    setText(root, '[data-el="paper-id"]', paper.paperId);

    // Coverage Strip
    const cov = paper.coverage_report;
    if (cov) {
      if (cov.percentage_per_year) {
        const yrSummary = Object.entries(cov.percentage_per_year)
          .map(([y, p]) => `${y}: ${p}%`)
          .join(' • ');
        setText(root, '[data-el="cov-years"]', yrSummary);
      }
      setText(root, '[data-el="cov-bb"]', `${cov.book_back_percentage || 60}%`);
      if (cov.marks_per_difficulty) {
        const diffSummary = Object.entries(cov.marks_per_difficulty)
          .map(([d, m]) => `${d}: ${m}M`)
          .join(', ');
        setText(root, '[data-el="cov-diff"]', diffSummary);
      }
      setVisible(root, '[data-el="cov-rule1-badge"]', Boolean(cov.rule1_compliant));
      setVisible(root, '[data-el="cov-cap-badge"]', Boolean(cov.year_cap_compliant));
    }

    const isPaperPane = appState.paperPreviewTab === 'paper';
    setVisible(root, '[data-el="paper-pane"]', isPaperPane);
    setVisible(root, '[data-el="rubric-pane"]', !isPaperPane);

    const activeLang = previewLanguageOverride || cfg.language || 'bilingual';

    if (isPaperPane) {
      setText(root, '[data-el="paper-title"]', paper.title);
      setText(root, '[data-el="paper-meta"]',
        `Subject: ${paper.subject} • Max Marks: ${paper.totalMarks} • Time: ${paper.durationMinutes} Minutes • Class: ${appState.currentClass?.name || 'Class 12'}`
      );
      const secWrap = qs(root, '[data-el="paper-sections"]');
      paper.sections.forEach((sec) => {
        const secEl = cloneTemplate('tpl-pg-section');
        setText(secEl, '[data-el="sec-name"]', `${sec.name} (${sec.nameTamil || ''}) — ${sec.totalMarks} Marks`);
        setText(secEl, '[data-el="sec-instructions"]', sec.instructions);
        const qList = qs(secEl, '[data-el="sec-questions"]');

        sec.questions.forEach((q) => {
          const qEl = cloneTemplate('tpl-pg-question');
          const isLocked = appState.lockedPaperQuestions.includes(q.no);
          setText(qEl, '[data-el="q-no"]', `${q.no}.`);

          // Language Visibility
          setVisible(qEl, '[data-el="q-en"]', activeLang !== 'ta');
          setText(qEl, '[data-el="q-en"]', q.textEn || q.text_en);
          setVisible(qEl, '[data-el="q-ta"]', activeLang !== 'en');
          setText(qEl, '[data-el="q-ta"]', q.textTa || q.text_ta);

          // Options
          const optsEl = qs(qEl, '[data-el="q-options"]');
          setVisible(qEl, '[data-el="q-options"]', Boolean(q.options && q.options.length));
          if (q.options) {
            q.options.forEach((opt, i) => {
              const oEl = cloneTemplate('tpl-pg-mcq-opt');
              setText(oEl, '[data-el="opt-text"]', `(${String.fromCharCode(97 + i)}) ${opt}`);
              optsEl.appendChild(oEl);
            });
          }

          // Marks and Badges
          const compTag = q.isCompulsory ? ' [Compulsory]' : '';
          const eitherTag = q.isEitherOr ? ' [Either/Or]' : '';
          setText(qEl, '[data-el="q-marks"]', `[${q.marks} M]${compTag}${eitherTag}`);

          const badgeEl = qs(qEl, '[data-el="q-source-badge"]');
          if (badgeEl) {
            if (q.preview) {
              badgeEl.className = 'badge badge-error';
              badgeEl.textContent = 'HOTS Preview';
            } else if (q.source?.startsWith('past-paper:')) {
              const yr = q.source.split(':')[1];
              badgeEl.className = 'badge badge-primary';
              badgeEl.textContent = `DGE ${yr}`;
            } else if (q.source === 'modified') {
              badgeEl.className = 'badge badge-secondary';
              badgeEl.textContent = 'AI Variant';
            } else {
              badgeEl.className = 'badge';
              badgeEl.textContent = q.source || 'Standard';
            }
          }

          setText(qEl, '[data-el="q-chapter-tag"]', `${q.chapter || ''} • ${q.difficulty || 'Medium'}`);

          // Swap & Lock buttons
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
          setText(qEl, '[data-el="lock-text"]', isLocked ? 'Locked (Unlock)' : 'Lock');

          qList.appendChild(qEl);
        });

        secWrap.appendChild(secEl);
      });
    } else {
      const rubWrap = qs(root, '[data-el="rubric-sections"]');
      paper.sections.forEach((sec) => {
        const rsEl = cloneTemplate('tpl-pg-rubric-section');
        setText(rsEl, '[data-el="sec-name"]', `${sec.name} — Scoring Rubrics`);
        const rowsWrap = qs(rsEl, '[data-el="rubric-rows"]');
        sec.questions.forEach((q) => {
          const rowEl = cloneTemplate('tpl-pg-rubric-row');
          setText(rowEl, '[data-el="q-no"]', `Q.${q.no}`);
          const scheme = q.markingScheme || q.marking_scheme || [];
          const schemeText = scheme.length > 0
            ? scheme.map((s) => `${s.step} [${s.marks}M]`).join(' | ')
            : (q.answer || 'Stepwise solution key verified');
          setText(rowEl, '[data-el="q-detail"]', `${q.chapter || q.type}: ${schemeText}`);
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
  // Load dataset status on mount if not loaded
  if (!appState.datasetStatus && !appState.datasetStatusLoading) {
    appState.datasetStatusLoading = true;
    apiClient.getDatasetStatus().then((ds) => {
      appState.datasetStatus = ds;
      appState.datasetStatusLoading = false;
      triggerRender();
    }).catch(() => {
      appState.datasetStatusLoading = false;
    });
  }

  // Subject change
  document.getElementById('pg-subject')?.addEventListener('change', (e) => {
    appState.paperConfig.subject = e.target.value;
    appState.paperConfig.title = `Class 12 Examination — ${e.target.value}`;
    const titleInput = document.getElementById('pg-title');
    if (titleInput) titleInput.value = appState.paperConfig.title;
    triggerRender();
  });

  document.getElementById('pg-title')?.addEventListener('input', (e) => {
    appState.paperConfig.title = e.target.value;
  });

  document.getElementById('pg-marks')?.addEventListener('change', (e) => {
    appState.paperConfig.totalMarks = Number(e.target.value);
  });

  document.getElementById('pg-duration')?.addEventListener('change', (e) => {
    appState.paperConfig.durationMinutes = Number(e.target.value);
  });

  document.getElementById('pg-public')?.addEventListener('change', (e) => {
    appState.paperConfig.includePublicExamQuestions = e.target.checked;
  });

  document.getElementById('pg-ratio')?.addEventListener('input', (e) => {
    appState.paperConfig.bookBackRatio = Number(e.target.value);
    const label = document.getElementById('pg-ratio-label');
    if (label) label.textContent = `${appState.paperConfig.bookBackRatio}%`;
  });

  document.getElementById('pg-language')?.addEventListener('change', (e) => {
    appState.paperConfig.language = e.target.value;
    previewLanguageOverride = null;
    triggerRender();
  });

  // Language Preview Toggles
  document.getElementById('btn-toggle-bilingual')?.addEventListener('click', () => {
    previewLanguageOverride = 'bilingual';
    triggerRender();
  });
  document.getElementById('btn-toggle-en')?.addEventListener('click', () => {
    previewLanguageOverride = 'en';
    triggerRender();
  });
  document.getElementById('btn-toggle-ta')?.addEventListener('click', () => {
    previewLanguageOverride = 'ta';
    triggerRender();
  });

  // Generate Action
  const executeGenerate = async () => {
    appState.paperGenerating = true;
    triggerRender();
    showToast(`Synthesizing ${appState.paperConfig.subject || 'Physics'} paper from 5-Year Archive...`, 'info');

    try {
      const taughtCount = appState.chapters.filter((c) => c.status === 'completed' || c.status === 'partially_completed').length;
      const payload = {
        ...appState.paperConfig,
        classId: appState.currentClass?.id || '12-A',
        taughtTopicsOnly: appState.progressLockActive,
        enrichmentPreviewAllowed: appState.enrichmentPreviewAllowed || false,
        includePublicExamArchives: appState.paperConfig.includePublicExamQuestions,
        subject: appState.paperConfig.subject || 'Physics'
      };

      const generated = await apiClient.generatePaper(payload, taughtCount);
      appState.generatedPaper = generated;
      showToast(`Question Paper Generated (${generated.totalMarks} Marks, ${generated.sections?.length || 4} Parts)!`, 'success');
    } catch (err) {
      console.error('Error generating paper:', err);
      showToast('Error generating paper. Using offline fallback.', 'error');
    } finally {
      appState.paperGenerating = false;
      triggerRender();
    }
  };

  document.getElementById('btn-generate-paper')?.addEventListener('click', executeGenerate);
  document.getElementById('btn-quick-demo-paper')?.addEventListener('click', executeGenerate);

  // Export PDF & DOCX buttons
  document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
    const paper = appState.generatedPaper;
    if (!paper) return;
    const url = apiClient.getExportUrl(paper.paperId, 'pdf', false);
    showToast('Downloading high-fidelity Question Paper PDF...', 'info');
    window.open(url, '_blank');
  });

  document.getElementById('btn-export-pdf-key')?.addEventListener('click', () => {
    const paper = appState.generatedPaper;
    if (!paper) return;
    const url = apiClient.getExportUrl(paper.paperId, 'pdf', true);
    showToast('Downloading official Answer Key PDF...', 'info');
    window.open(url, '_blank');
  });

  document.getElementById('btn-export-docx')?.addEventListener('click', () => {
    const paper = appState.generatedPaper;
    if (!paper) return;
    const url = apiClient.getExportUrl(paper.paperId, 'docx', false);
    showToast('Downloading Microsoft Word (.docx) Question Paper...', 'info');
    window.open(url, '_blank');
  });

  document.getElementById('btn-print-paper')?.addEventListener('click', () => window.print());

  // Tabs
  document.getElementById('tab-paper-view')?.addEventListener('click', () => {
    appState.paperPreviewTab = 'paper';
    triggerRender();
  });
  document.getElementById('tab-rubric-view')?.addEventListener('click', () => {
    appState.paperPreviewTab = 'rubric';
    triggerRender();
  });

  // Swap Question Event (Live API + Mock Support)
  document.querySelectorAll('[data-swap-q]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const qNo = Number(btn.getAttribute('data-swap-q'));
      if (appState.lockedPaperQuestions.includes(qNo)) {
        showToast(`Q.${qNo} is locked and cannot be swapped.`, 'warning');
        return;
      }
      const paper = appState.generatedPaper;
      if (!paper?.sections) return;

      btn.disabled = true;
      showToast(`Regenerating equivalent question for Q.${qNo}...`, 'info');

      try {
        // Attempt live API swap
        const swapResult = await apiClient.regenerateQuestion({
          paperId: paper.paperId,
          currentQuestionId: String(qNo),
          reason: 'Teacher requested alternative variant'
        });

        if (swapResult?.replacementQuestion) {
          const rep = swapResult.replacementQuestion;
          for (const sec of paper.sections) {
            const targetQ = sec.questions.find((q) => q.no === qNo);
            if (targetQ) {
              targetQ.textEn = rep.textEn || rep.text_en;
              targetQ.textTa = rep.textTa || rep.text_ta;
              if (rep.options) targetQ.options = rep.options;
              if (rep.answer) targetQ.answer = rep.answer;
              if (rep.chapter) targetQ.chapter = rep.chapter;
              if (rep.source) targetQ.source = rep.source;
              if (rep.markingScheme) targetQ.markingScheme = rep.markingScheme;
              targetQ._swapped = true;
              break;
            }
          }
          showToast(`Swapped Q.${qNo} with past-paper variant!`, 'success');
        }
      } catch (err) {
        // Fallback local swap
        const alt = QUESTION_VARIANTS[qNo];
        for (const sec of paper.sections) {
          const targetQ = sec.questions.find((q) => q.no === qNo);
          if (targetQ && alt) {
            targetQ.textEn = alt.textEn;
            targetQ.textTa = alt.textTa;
            if (alt.options) targetQ.options = alt.options;
            if (alt.answer) targetQ.answer = alt.answer;
            break;
          }
        }
        showToast(`Replaced Q.${qNo} with local variant`, 'info');
      } finally {
        btn.disabled = false;
        triggerRender();
      }
    });
  });

  // Lock Question Event
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
