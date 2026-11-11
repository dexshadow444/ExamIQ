import { STUDENTS_DATA } from '../data/mockData.js';
import { appState, setActiveTab, showToast, t, triggerRender } from '../state.js';
import { cloneTemplate, fillSelect, qs, setText, setVisible } from '../utils/dom.js';

export function renderStudentLearningDnaView() {
  const root = cloneTemplate('tpl-student-learning-dna');
  const student = STUDENTS_DATA.find((s) => s.id === appState.selectedStudentId) || STUDENTS_DATA[1];
  const initials = student.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  const masteryBars = [
    { label: 'Applications of Matrices & Determinants', val: student.learningDna.matricesMastery },
    { label: 'Complex Numbers & Roots of Unity', val: student.learningDna.complexNumbersMastery },
    { label: "Theory of Equations & Vieta's Relations", val: student.learningDna.theoryOfEquations },
    { label: 'Inverse Trigonometric Functions', val: student.learningDna.inverseTrig }
  ];

  setText(root, '[data-el="page-title"]', t('Student Learning Intelligence — Learning DNA', 'மாணவர் கற்றல் DNA நுண்ணறிவு'));
  fillSelect(
    qs(root, '#dna-student-select'),
    STUDENTS_DATA.map((s) => ({
      value: s.id,
      label: `${s.name} (Roll #${s.rollNo}) — ${s.overallPercentage}%`
    })),
    student.id
  );

  setText(root, '[data-el="initials"]', initials);
  setText(root, '[data-el="student-name"]', t(student.name, student.nameTamil));
  setText(root, '[data-el="roll-badge"]', `Roll #${student.rollNo}`);
  setText(root, '[data-el="emis-badge"]', `EMIS: ${student.emisId}`);
  setText(root, '[data-el="class-info"]', appState.currentClass.name);
  setText(root, '[data-el="attendance"]', student.attendance);
  setText(root, '[data-el="rank"]', `Cohort Rank #${student.rank}`);
  setText(root, '[data-el="overall-score"]', `${student.overallPercentage}%`);
  setText(root, '[data-el="stepwise"]', student.learningDna.stepwiseAdherence);

  const masteryList = qs(root, '[data-el="mastery-list"]');
  masteryBars.forEach((b) => {
    const barEl = cloneTemplate('tpl-dna-mastery-bar');
    setText(barEl, '[data-el="label"]', b.label);
    setText(barEl, '[data-el="pct"]', `${b.val}%`);
    const fill = qs(barEl, '[data-el="fill"]');
    if (fill) {
      fill.style.width = `${b.val}%`;
      fill.style.background = b.val < 60 ? 'var(--error)' : 'var(--secondary)';
    }
    masteryList.appendChild(barEl);
  });

  const gapsCount = student.learningDna.learningGaps.length;
  setText(root, '[data-el="gaps-badge"]', `${gapsCount} Active Gaps`);
  setVisible(root, '[data-el="gaps-empty"]', gapsCount === 0);
  const gapsList = qs(root, '[data-el="gaps-list"]');
  setVisible(root, '[data-el="gaps-list"]', gapsCount > 0);
  student.learningDna.learningGaps.forEach((gap) => {
    const gEl = cloneTemplate('tpl-dna-gap');
    setText(gEl, '[data-el="concept"]', gap.concept);
    setText(gEl, '[data-el="severity"]', `${gap.severity} Severity`);
    setText(gEl, '[data-el="evidence"]', gap.evidence);
    setText(gEl, '[data-el="frequency"]', `Frequency: ${gap.frequency}`);
    gapsList.appendChild(gEl);
  });

  setText(root, '[data-el="recommended-action"]', student.learningDna.recommendedAction);

  const strengthsList = qs(root, '[data-el="strengths-list"]');
  student.learningDna.strengths.forEach((str) => {
    const sEl = cloneTemplate('tpl-dna-strength');
    setText(sEl, '[data-el="text"]', str);
    strengthsList.appendChild(sEl);
  });

  return root;
}

export function bindStudentLearningDnaEvents() {
  document.getElementById('dna-student-select')?.addEventListener('change', (e) => {
    appState.selectedStudentId = e.target.value;
    triggerRender();
  });

  const launch = () => {
    const student = STUDENTS_DATA.find((s) => s.id === appState.selectedStudentId) || STUDENTS_DATA[1];
    showToast(`AI Remedial Practice Drill compiled for ${student.name}`, 'success');
    setActiveTab('remedial-and-homework');
  };

  document.getElementById('btn-dna-launch-remedial')?.addEventListener('click', launch);
  document.getElementById('btn-dna-remedial-card')?.addEventListener('click', launch);
}
