import { STUDENTS_DATA } from '../data/mockData.js';
import { appState, showToast, t, triggerRender } from '../state.js';
import { cloneTemplate, fillSelect, qs, setText, setVisible } from '../utils/dom.js';

export function renderReportsAnalyticsView() {
  const root = cloneTemplate('tpl-reports-analytics');
  const selectedStudent = STUDENTS_DATA.find((s) => s.id === appState.selectedStudentId) || STUDENTS_DATA[0];
  const gradeLabel = selectedStudent.overallPercentage >= 90 ? 'Grade A+' : selectedStudent.overallPercentage >= 75 ? 'Grade A' : 'Grade B';
  const isSummary = appState.reportType === 'class-summary';

  setText(root, '[data-el="page-title"]', t('Reports & Analytics Center', 'அறிக்கைகள் & பகுப்பாய்வு மையம்'));
  setText(root, '[data-el="print-label"]', t('Print Current Report', 'தற்போதைய அறிக்கையை அச்சிடு'));
  setText(root, '[data-el="export-label"]', t('Export Parent Slips (PDF)', 'பெற்றோர் அறிக்கைகளை PDF ஆக ஏற்றுமதி செய்'));

  qs(root, '#rep-tab-summary')?.classList.toggle('active-white', isSummary);
  qs(root, '#rep-tab-parent')?.classList.toggle('active-white', !isSummary);

  setVisible(root, '[data-el="student-picker-wrap"]', !isSummary);
  setText(root, '[data-el="student-label"]', t('Student:', 'மாணவர்:'));
  fillSelect(
    qs(root, '#rep-student-select'),
    STUDENTS_DATA.map((s) => ({
      value: s.id,
      label: `${s.name} (Roll #${s.rollNo})`
    })),
    selectedStudent.id
  );

  setVisible(root, '[data-el="summary-pane"]', isSummary);
  setVisible(root, '[data-el="parent-pane"]', !isSummary);

  setText(root, '[data-el="kpi1-label"]', t('Cohort Average', 'வகுப்பு சராசரி'));
  setText(root, '[data-el="kpi2-label"]', t('Board Exam Readiness', 'பொதுத்தேர்வு தயார்நிலை'));
  setText(root, '[data-el="kpi3-label"]', t('Remedial Resolution', 'கூடுதல் கற்றல் முன்னேற்றம்'));

  setText(root, '[data-el="card-school"]', appState.currentSchool.name.toUpperCase());
  setText(root, '[data-el="card-student-meta"]', `Student: ${selectedStudent.name} • Roll #${selectedStudent.rollNo} • ${appState.currentClass.name}`);
  setText(root, '[data-el="card-marks"]', `${selectedStudent.overallPercentage}% (${gradeLabel})`);
  setText(root, '[data-el="card-rank"]', `${selectedStudent.rank} of ${appState.currentClass.studentsCount}`);
  setText(root, '[data-el="card-attendance"]', selectedStudent.attendance);
  setText(
    root,
    '[data-el="card-observations"]',
    `${selectedStudent.name} demonstrates strong consistency in ${selectedStudent.learningDna.strengths.join(', ')}. ${selectedStudent.learningDna.recommendedAction}`
  );
  setText(root, '[data-el="card-principal-sub"]', `Headmaster / Principal (${appState.currentSchool.district})`);

  return root;
}

export function bindReportsAnalyticsEvents() {
  document.getElementById('rep-tab-summary')?.addEventListener('click', () => {
    appState.reportType = 'class-summary';
    triggerRender();
  });
  document.getElementById('rep-tab-parent')?.addEventListener('click', () => {
    appState.reportType = 'parent-slips';
    triggerRender();
  });
  document.getElementById('rep-student-select')?.addEventListener('change', (e) => {
    appState.selectedStudentId = e.target.value;
    triggerRender();
  });
  document.getElementById('btn-print-report')?.addEventListener('click', () => window.print());
  document.getElementById('btn-export-parent-slips')?.addEventListener('click', () => {
    showToast('Batch PDF progress reports generated with official school stamp', 'success');
  });
}
