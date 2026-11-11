import { apiClient } from '../api/client.js';
import { appState, showToast, t, triggerRender } from '../state.js';
import { cloneTemplate, fillSelect, qs, setText, setVisible } from '../utils/dom.js';

const CONCEPTS = [
  'Cofactor Matrix Sign Transposition (18 students)',
  'Rank by Row Echelon Reduction (4 students)',
  'Euler Form to Cartesian Coordinates (7 students)',
  "Vieta's Polynomial Degree n Formulas (3 students)"
];

export function renderRemedialLearningView() {
  const root = cloneTemplate('tpl-remedial-learning');
  const drill = appState.generatedDrill;
  const matchCount = appState.remedialConcept.match(/\((\d+)\s+students?\)/i);
  const flaggedCount = matchCount ? matchCount[1] : '18';

  setText(root, '[data-el="page-title"]', t('AI Personalized Remedial Learning & Homework', 'பரிகாரக் கற்றல் & வீட்டுப்பாட மேலாண்மை'));

  const genBtn = qs(root, '#btn-gen-remedial');
  if (genBtn) genBtn.disabled = Boolean(appState.remedialGenerating);
  setVisible(root, '[data-el="gen-spinner"]', appState.remedialGenerating);
  setVisible(root, '[data-el="gen-icon"]', !appState.remedialGenerating);
  setText(root, '[data-el="gen-label"]', appState.remedialGenerating
    ? t('Compiling Drill...', 'பயிற்சி உருவாகிறது...')
    : t('+ Generate 15-Min Micro Drill', '+ 15 நிமிட விரைவு பயிற்சியை உருவாக்கு'));

  setText(root, '[data-el="concept-label"]', t('Diagnosed Target Concept for Intervention:', 'மேம்படுத்த வேண்டிய கண்டறியப்பட்ட கருத்து:'));
  fillSelect(
    qs(root, '#remedial-concept-select'),
    CONCEPTS.map((c) => ({ value: c, label: c })),
    appState.remedialConcept
  );
  setText(root, '[data-el="flagged-badge"]', `Cohort: ${flaggedCount} Students Flagged`);

  setVisible(root, '[data-el="drill-card"]', Boolean(drill));
  setVisible(root, '[data-el="empty-card"]', !drill);

  if (drill) {
    setText(root, '[data-el="drill-id"]', `${drill.drillId} • Micro Remedial`);
    setText(root, '[data-el="drill-title"]', `Targeted Remedial Drill: ${drill.concept}`);
    setText(root, '[data-el="drill-time"]', `Target Time: ${drill.targetTime}`);
    setText(root, '[data-el="drill-target"]', `Target: ${drill.studentTarget}`);
    setText(root, '[data-el="worked-title"]', drill.workedExample.title);
    setText(root, '[data-el="worked-formula"]', `Formula: ${drill.workedExample.formula}`);
    setText(root, '[data-el="worked-en"]', drill.workedExample.explanationEn);
    setText(root, '[data-el="worked-ta"]', drill.workedExample.explanationTa);

    const practiceList = qs(root, '[data-el="practice-list"]');
    drill.practiceQuestions.forEach((q, idx) => {
      const card = cloneTemplate('tpl-remedial-question');
      setText(card, '[data-el="ex-no"]', `Exercise ${idx + 1}`);
      setText(card, '[data-el="ex-marks"]', `${q.marks} Mark`);
      setText(card, '[data-el="ex-en"]', q.textEn);
      setText(card, '[data-el="ex-ta"]', q.textTa);
      setText(card, '[data-el="ex-answer"]', `Solution: ${q.answer}`);
      practiceList.appendChild(card);
    });

    setText(root, '[data-el="print-label"]', t('Print Worksheet Slips for Class', 'வகுப்பிற்கான பயிற்சித் தாள்களை அச்சிடு'));
  } else {
    setText(root, '[data-el="empty-title"]', t('No Active Remedial Sheet Loaded', 'செயலில் உள்ள கூடுதல் பயிற்சித் தாள் இல்லை'));
  }

  return root;
}

export function bindRemedialLearningEvents() {
  document.getElementById('remedial-concept-select')?.addEventListener('change', (e) => {
    appState.remedialConcept = e.target.value;
    triggerRender();
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
