import { VOCATIONAL_MODULES_DATA } from '../data/mockData.js';
import { appState, showToast, t, triggerRender } from '../state.js';
import { cloneTemplate, fillSelect, qs, setText } from '../utils/dom.js';

export function renderVocationalModuleView() {
  const root = cloneTemplate('tpl-vocational-module');
  const trade =
    VOCATIONAL_MODULES_DATA.find((tr) => tr.tradeCode === appState.selectedTradeCode) ||
    VOCATIONAL_MODULES_DATA[0];

  setText(root, '[data-el="page-title"]', t('Vocational Education Intelligence', 'தொழிற்கல்வி நுண்ணறிவுப் பிரிவு'));
  setText(root, '[data-el="trade-label"]', t('Select Trade:', 'தொழிற்பிரிவைத் தேர்ந்தெடுக்கவும்:'));

  fillSelect(
    qs(root, '#voc-trade-select'),
    VOCATIONAL_MODULES_DATA.map((tr) => ({
      value: tr.tradeCode,
      label: `Trade ${tr.tradeCode}: ${tr.name}`
    })),
    trade.tradeCode
  );

  setText(root, '[data-el="trade-code-badge"]', `Trade Code #${trade.tradeCode}`);
  setText(root, '[data-el="enrolled-text"]', `${trade.enrolledStudents} Enrolled Candidates`);
  setText(root, '[data-el="trade-name"]', t(trade.name, trade.nameTamil));
  setText(root, '[data-el="sheet-btn-label"]', t('Generate Workshop Practical Sheet', 'பட்டறை செய்முறைத் தாளை உருவாக்கு'));

  const modList = qs(root, '[data-el="modules-list"]');
  trade.modules.forEach((mod) => {
    const card = cloneTemplate('tpl-voc-module-card');
    setText(card, '[data-el="mod-id"]', mod.id);
    const st = qs(card, '[data-el="mod-status"]');
    if (st) {
      st.className = `badge ${mod.status === 'Completed' ? 'badge-secondary' : 'badge-neutral'}`;
      st.textContent = mod.status;
    }
    setText(card, '[data-el="mod-title"]', mod.title);
    setText(card, '[data-el="mod-hours"]', `${mod.practicalHours} Practical Workshop Hours • ${mod.theoryHours} Theory Hours`);
    modList.appendChild(card);
  });

  const rubList = qs(root, '[data-el="rubrics-list"]');
  trade.practicalRubrics.forEach((rubric) => {
    const card = cloneTemplate('tpl-voc-rubric-card');
    const pct = Math.round((rubric.completedStudents / trade.enrolledStudents) * 100);
    setText(card, '[data-el="rubric-skill"]', rubric.skill);
    setText(card, '[data-el="rubric-marks"]', `${rubric.maxMarks} Marks`);
    setText(card, '[data-el="rubric-completed"]', `Completed: ${rubric.completedStudents} / ${trade.enrolledStudents} Students`);
    setText(card, '[data-el="rubric-pct"]', `${pct}% Verified`);
    const fill = qs(card, '[data-el="rubric-fill"]');
    if (fill) fill.style.width = `${pct}%`;
    rubList.appendChild(card);
  });

  return root;
}

export function bindVocationalModuleEvents() {
  document.getElementById('voc-trade-select')?.addEventListener('change', (e) => {
    appState.selectedTradeCode = e.target.value;
    triggerRender();
  });

  document.getElementById('btn-gen-workshop-sheet')?.addEventListener('click', () => {
    const trade = VOCATIONAL_MODULES_DATA.find((tr) => tr.tradeCode === appState.selectedTradeCode) || VOCATIONAL_MODULES_DATA[0];
    showToast(`Generated practical workshop assessment for ${trade.name}`, 'success');
  });
}
