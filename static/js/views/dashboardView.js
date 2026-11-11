import { appState, setActiveTab, showToast, t, triggerRender } from '../state.js';
import { cloneTemplate, qs, setText, setVisible } from '../utils/dom.js';

const MATRIX_TOPICS = [
  { code: '1.1', title: 'Rank of a Matrix (Row Echelon Form)', ref: 'Vol 1 • Book-back Ex 1.2', mastery: 88, status: 'Mastered', spread: 'Easy 60% • Med 40%', items: '24 Questions', badgeClass: 'badge-secondary', barColor: 'var(--secondary)' },
  { code: '1.2', title: 'Inverse by Adjoint Method & Matrix Inversion', ref: 'Vol 1 • Book-back Ex 1.1 & 1.3', mastery: 54, status: 'Needs Attention', spread: 'Med 40% • Hard 60%', items: '18 Questions', badgeClass: 'badge-error', barColor: 'var(--error)' },
  { code: '1.4', title: "Cramer's Rule for Linear Systems", ref: 'Vol 1 • Book-back Ex 1.4', mastery: 82, status: 'Mastered', spread: 'Easy 30% • Med 70%', items: '16 Questions', badgeClass: 'badge-secondary', barColor: 'var(--secondary)' },
  { code: '2.4', title: "De Moivre's Theorem & Roots of Unity", ref: 'Vol 1 • Book-back Ex 2.8', mastery: 69, status: 'Moderate', spread: 'Med 50% • Hard 50%', items: '20 Questions', badgeClass: 'badge-tertiary', barColor: 'var(--tertiary-container)' },
  { code: '3.3', title: 'Descartes Rule of Signs', ref: 'Vol 1 • Book-back Ex 3.6', mastery: 92, status: 'Mastered', spread: 'Easy 70% • Med 30%', items: '14 Questions', badgeClass: 'badge-secondary', barColor: 'var(--secondary)' }
];

export function renderDashboardView() {
  const root = cloneTemplate('tpl-dashboard');

  const filteredTopics = MATRIX_TOPICS.filter((row) => {
    if (appState.dashboardTopicFilter === 'attention') return row.status === 'Needs Attention';
    if (appState.dashboardTopicFilter === 'vol1') return row.code.startsWith('1') || row.code.startsWith('2') || row.code.startsWith('3');
    if (appState.dashboardTopicFilter === 'vol2') return row.code.startsWith('7');
    return true;
  });

  const totalTopics = appState.chapters.reduce((acc, c) => acc + c.subtopics.length, 0);
  const completedTopics = appState.chapters.reduce(
    (acc, c) => acc + c.subtopics.filter((s) => s.status === 'completed' || s.status === 'revised').length,
    0
  );
  const revisedTopics = appState.chapters.reduce(
    (acc, c) => acc + c.subtopics.filter((s) => s.status === 'revised').length,
    0
  );
  const coveragePct = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const ringCircumference = 119.38;
  const ringOffset = (ringCircumference * (1 - coveragePct / 100)).toFixed(1);

  setText(root, '[data-el="hero-section-badge"]', `Live Section ${appState.currentClass.id}`);
  setText(root, '[data-el="hero-medium-badge"]', appState.currentClass.medium);
  setText(root, '[data-el="hero-term-badge"]', t('Term 2 Active • TN-SCERT', 'பருவம் 2 • TN-SCERT'));
  setText(root, '[data-el="hero-title"]', t(`Teacher Command Center — ${appState.currentClass.name} Mathematics`, `ஆசிரியர் கட்டளை மையம் — ${appState.currentClass.name} கணிதம்`));
  setText(root, '[data-el="hero-subtitle"]', `Term 2 Assessment Cycle • ${appState.currentClass.studentsCount} Enrolled Students • ${appState.currentSchool.name}`);
  setText(root, '[data-el="btn-upload-sheets-label"]', t('Upload Answer Sheets', 'விடைத்தாள்களைப் பதிவேற்று'));
  setText(root, '[data-el="btn-update-lock-label"]', t('Update Syllabus Lock', 'பாடத்திட்ட பூட்டை மாற்று'));

  setText(root, '[data-el="kpi-cov-label"]', t('Syllabus Coverage', 'பாடத்திட்ட நிறைவு'));
  setText(root, '[data-el="kpi-cov-pct"]', `${coveragePct}%`);
  setText(root, '[data-el="kpi-cov-topics"]', `${completedTopics}/${totalTopics} Topics`);
  const ringEl = qs(root, '[data-el="kpi-cov-ring"]');
  if (ringEl) ringEl.setAttribute('stroke-dashoffset', ringOffset);
  setText(root, '[data-el="kpi-cov-breakdown"]', `${completedTopics} Taught • ${revisedTopics} Revised`);

  const lockBadge = qs(root, '[data-el="kpi-lock-badge"]');
  if (lockBadge) lockBadge.className = `badge ${appState.progressLockActive ? 'badge-error' : 'badge-neutral'}`;
  setText(root, '[data-el="kpi-lock-icon"]', appState.progressLockActive ? 'lock' : 'lock_open');
  setText(root, '[data-el="kpi-lock-text"]', appState.progressLockActive ? 'Progress Lock Enforced' : 'Lock Disabled');

  setText(root, '[data-el="kpi-perf-label"]', t('Class Performance', 'வகுப்பு செயல்திறன்'));
  setText(root, '[data-el="kpi-prio-label"]', t('Priority Attention', 'கவனம் தேவை'));
  setText(root, '[data-el="kpi-eval-label"]', t('Answer Evaluations', 'விடைத்தாள் மதிப்பீடு'));
  setText(root, '[data-el="kpi-eval-count"]', `${appState.pendingEvalCount} Pending`);

  setVisible(root, '[data-el="recs-count-badge"]', appState.dashboardRecs.length > 0);
  if (appState.dashboardRecs.length > 0) {
    setText(root, '[data-el="recs-count-badge"]', `${appState.dashboardRecs.length} High-Impact Interventions Available`);
  }

  const recsGrid = qs(root, '[data-el="recs-grid"]');
  if (appState.dashboardRecs.length > 0) {
    appState.dashboardRecs.forEach((rec) => {
      const card = cloneTemplate('tpl-dashboard-rec');
      const badge = qs(card, '[data-el="rec-badge"]');
      if (badge) badge.className = `badge ${rec.type === 'critical' ? 'badge-error' : 'badge-tertiary'}`;
      setText(card, '[data-el="rec-icon"]', rec.type === 'critical' ? 'warning' : 'schedule');
      setText(card, '[data-el="rec-badge-text"]', rec.badge);
      setText(card, '[data-el="rec-chapter"]', rec.chapter);
      setText(card, '[data-el="rec-title"]', rec.title);
      setText(card, '[data-el="rec-evidence"]', rec.evidence);
      setText(card, '[data-el="rec-plan"]', rec.plan);

      const acceptBtn = qs(card, '[data-el="btn-accept-rec"]');
      acceptBtn?.setAttribute('data-accept-rec', String(rec.id));
      setText(card, '[data-el="btn-accept-rec-label"]', t('Accept & Generate Reassessment', 'ஏற்று மறுமதிப்பீட்டை உருவாக்கு'));

      qs(card, '[data-el="btn-dismiss-rec"]')?.setAttribute('data-dismiss-rec', String(rec.id));
      recsGrid.appendChild(card);
    });
  } else {
    recsGrid.appendChild(cloneTemplate('tpl-dashboard-recs-empty'));
  }

  setText(root, '[data-el="filter-label"]', t('Filter:', 'வடிகட்டி:'));
  const topicFilterEl = qs(root, '#dash-topic-filter');
  if (topicFilterEl) topicFilterEl.value = appState.dashboardTopicFilter;

  const tbody = qs(root, '[data-el="matrix-tbody"]');
  if (filteredTopics.length > 0) {
    filteredTopics.forEach((row) => {
      const tr = cloneTemplate('tpl-dashboard-matrix-row');
      setText(tr, '[data-el="row-code"]', row.code);
      setText(tr, '[data-el="row-title"]', row.title);
      setText(tr, '[data-el="row-ref"]', row.ref);
      setText(tr, '[data-el="row-mastery"]', `${row.mastery}%`);
      const bar = qs(tr, '[data-el="row-bar"]');
      if (bar) {
        bar.style.width = `${row.mastery}%`;
        bar.style.background = row.barColor;
      }
      const stBadge = qs(tr, '[data-el="row-status-badge"]');
      if (stBadge) {
        stBadge.className = `badge ${row.badgeClass}`;
        stBadge.textContent = row.status;
      }
      setText(tr, '[data-el="row-spread"]', row.spread);
      setText(tr, '[data-el="row-items"]', row.items);
      const actBtn = qs(tr, '[data-el="row-action-btn"]');
      if (actBtn) {
        actBtn.setAttribute('data-matrix-action', row.title);
        actBtn.textContent = row.status === 'Needs Attention' ? 'Assign Remedial →' : 'View Question Breakdown →';
      }
      tbody.appendChild(tr);
    });
  } else {
    const emptyTr = document.createElement('tr');
    const emptyTd = document.createElement('td');
    emptyTd.colSpan = 6;
    emptyTd.className = 'muted';
    emptyTd.style.textAlign = 'center';
    emptyTd.textContent = 'No topics match this filter.';
    emptyTr.appendChild(emptyTd);
    tbody.appendChild(emptyTr);
  }

  return root;
}

export function bindDashboardEvents() {
  document.querySelectorAll('[data-dash-go]').forEach((btn) => {
    btn.addEventListener('click', () => setActiveTab(btn.getAttribute('data-dash-go')));
  });

  document.querySelectorAll('[data-accept-rec]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast(`Targeted Reassessment Generated & Queued for ${appState.currentClass.name}!`, 'success');
      setActiveTab('remedial-and-homework');
    });
  });

  document.querySelectorAll('[data-dismiss-rec]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-dismiss-rec'));
      appState.dashboardRecs = appState.dashboardRecs.filter((r) => r.id !== id);
      showToast('Recommendation dismissed from queue', 'info');
      triggerRender();
    });
  });

  document.getElementById('dash-topic-filter')?.addEventListener('change', (e) => {
    appState.dashboardTopicFilter = e.target.value;
    triggerRender();
  });

  document.querySelectorAll('[data-matrix-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const title = btn.getAttribute('data-matrix-action');
      showToast(`Action initiated for ${title}`, 'info');
      setActiveTab('remedial-and-homework');
    });
  });
}
