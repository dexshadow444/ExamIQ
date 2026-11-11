import { appState, setActiveTab, showToast, t, triggerRender } from '../state.js';
import { cloneTemplate, qs, setText, setVisible } from '../utils/dom.js';

let assessModalOpen = false;

export function renderAssessmentsView() {
  const root = cloneTemplate('tpl-assessments');

  setText(root, '[data-el="page-title"]', t('Unit Tests & Continuous Assessment Management', 'அலகுத் தேர்வுகள் & தொடர் மதிப்பீடு'));

  const listEl = qs(root, '[data-el="assess-list"]');
  appState.assessments.forEach((item) => {
    const card = cloneTemplate('tpl-assessment-card');
    const badgeClass =
      item.status === 'Completed' ? 'badge-secondary' : item.status === 'Scheduled' ? 'badge-primary' : 'badge-neutral';

    setText(card, '[data-el="id"]', item.id);
    const stEl = qs(card, '[data-el="status"]');
    if (stEl) {
      stEl.className = `badge ${badgeClass}`;
      stEl.textContent = item.status;
    }
    setText(card, '[data-el="name"]', item.name);
    setText(card, '[data-el="meta"]', `${item.marks} Marks • ${item.duration} • ${item.date}`);
    setText(card, '[data-el="avg-label"]', t('Class Cohort Average:', 'வகுப்பு சராசரி:'));
    setText(card, '[data-el="avg-score"]', item.avgScore);
    qs(card, '[data-el="btn-blueprint"]')?.setAttribute('data-assess-paper', item.name);
    qs(card, '[data-el="btn-marks"]')?.setAttribute('data-assess-marks', '1');
    listEl.appendChild(card);
  });

  setVisible(root, '#assess-modal-backdrop', assessModalOpen);
  setText(root, '[data-el="modal-title"]', t('Schedule Continuous Assessment', 'தொடர் மதிப்பீட்டைத் திட்டமிடு'));
  setText(root, '[data-el="label-name"]', t('Assessment Name', 'மதிப்பீட்டின் பெயர்'));
  setText(root, '[data-el="label-marks"]', t('Total Marks', 'மொத்த மதிப்பெண்கள்'));

  return root;
}

export function bindAssessmentsEvents() {
  document.getElementById('btn-open-assess-modal')?.addEventListener('click', () => {
    assessModalOpen = true;
    triggerRender();
  });
  document.getElementById('btn-close-assess')?.addEventListener('click', () => {
    assessModalOpen = false;
    triggerRender();
  });
  document.getElementById('btn-cancel-assess')?.addEventListener('click', () => {
    assessModalOpen = false;
    triggerRender();
  });
  document.getElementById('assess-modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'assess-modal-backdrop') {
      assessModalOpen = false;
      triggerRender();
    }
  });

  document.getElementById('form-new-assessment')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('new-assess-name').value;
    const marks = Number(document.getElementById('new-assess-marks').value);
    appState.assessments.push({
      id: `UT-${appState.assessments.length + 1}`,
      name: title || `Unit Test ${appState.assessments.length + 1}`,
      marks,
      duration: `${marks === 10 ? 20 : marks === 20 ? 40 : 45} mins`,
      date: new Date().toISOString().split('T')[0],
      status: 'Scheduled',
      avgScore: '-'
    });
    assessModalOpen = false;
    showToast('New Unit Test Scheduled and Added to Syllabus Cycle!', 'success');
    triggerRender();
  });

  document.querySelectorAll('[data-assess-paper]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast(`Opening Paper Generator for ${btn.getAttribute('data-assess-paper')}`, 'info');
      setActiveTab('paper-generator');
    });
  });
  document.querySelectorAll('[data-assess-marks]').forEach((btn) => {
    btn.addEventListener('click', () => setActiveTab('marks-management'));
  });
}
