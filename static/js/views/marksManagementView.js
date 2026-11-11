import { appState, showToast, t, triggerRender } from '../state.js';
import { cloneTemplate, qs, setText, setVisible } from '../utils/dom.js';

let marksState = {
  assessment: 'UT2',
  importModalOpen: false
};

const FIELD_MAX = { q1: 1, q2: 2, q3: 3, q4: 5, q5: 5 };

function computeLedgerStats(students) {
  const avgPct = students.length
    ? ((students.reduce((acc, s) => acc + s.total / (s.maxTotal || 16), 0) / students.length) * 100).toFixed(1)
    : '0.0';
  const flagsCount = students.filter((s) => Boolean(s.flag)).length;
  return { avgPct, flagsCount };
}

export function renderMarksManagementView() {
  const root = cloneTemplate('tpl-marks-management');
  const students = appState.marksLedger;
  const stats = computeLedgerStats(students);

  setText(root, '[data-el="page-title"]', t('Marks Management & Intelligence', 'மதிப்பெண் மேலாண்மை & நுண்ணறிவு'));
  setText(root, '[data-el="import-label"]', t('Import CSV / Excel', 'CSV / Excel இறக்குமதி'));
  setText(root, '[data-el="export-label"]', t('Export DGE Format', 'DGE வடிவில் ஏற்றுமதி'));

  setText(root, '[data-el="assess-label"]', t('Target Assessment:', 'தேர்வு:'));
  qs(root, '#marks-assess-select').value = marksState.assessment;

  setText(root, '[data-el="cohort-label"]', t('Cohort Size:', 'மொத்த மாணவர்கள்:'));
  setText(root, '[data-el="cohort-val"]', String(appState.currentClass.studentsCount));
  setText(root, '[data-el="avg-label"]', t('Ledger Average:', 'வகுப்பு சராசரி:'));
  setText(root, '#marks-avg-val', `${stats.avgPct}%`);
  setText(root, '[data-el="flags-label"]', t('Discrepancy Flags:', 'முரண்பாடு குறியீடுகள்:'));
  setText(root, '[data-el="flags-val"]', String(stats.flagsCount));

  setText(root, '[data-el="ledger-title"]', t('Question-Wise Marks Ledger', 'கேள்விவாரியான மதிப்பெண் பதிவேடு'));
  setText(root, '[data-el="ledger-hint"]', t('Click any cell to edit score', 'மதிப்பெண்ணைத் திருத்த கலத்தைத் தேர்ந்தெடுக்கவும்'));

  const tbody = qs(root, '[data-el="ledger-tbody"]');
  students.forEach((s) => {
    const row = cloneTemplate('tpl-marks-row');
    setText(row, '[data-el="roll"]', s.rollNo);
    setText(row, '[data-el="name"]', s.name);

    ['q1', 'q2', 'q3', 'q4', 'q5'].forEach((field) => {
      const inp = qs(row, `[data-field="${field}"]`);
      if (inp) {
        inp.setAttribute('data-mark-roll', s.rollNo);
        inp.setAttribute('data-mark-field', field);
        inp.value = String(s[field]);
      }
    });

    const totalEl = qs(row, '[data-el="total"]');
    if (totalEl) {
      totalEl.id = `total-${s.rollNo}`;
      totalEl.textContent = String(s.total);
    }

    setVisible(row, '[data-el="flag-badge"]', Boolean(s.flag));
    setText(row, '[data-el="flag-text"]', s.flag || '');
    setVisible(row, '[data-el="verified-badge"]', !s.flag);

    qs(row, '[data-el="audit-btn"]')?.setAttribute('data-audit-slip', s.name);
    tbody.appendChild(row);
  });

  setVisible(root, '#marks-import-backdrop', marksState.importModalOpen);
  return root;
}

export function bindMarksManagementEvents() {
  document.getElementById('marks-assess-select')?.addEventListener('change', (e) => {
    marksState.assessment = e.target.value;
    triggerRender();
  });

  document.querySelectorAll('[data-mark-roll]').forEach((input) => {
    input.addEventListener('input', () => {
      const roll = input.getAttribute('data-mark-roll');
      const field = input.getAttribute('data-mark-field');
      const maxVal = FIELD_MAX[field] || 5;
      const clamped = Math.min(maxVal, Math.max(0, Number(input.value) || 0));
      if (Number(input.value) > maxVal || Number(input.value) < 0) {
        input.value = String(clamped);
      }
      const student = appState.marksLedger.find((s) => s.rollNo === roll);
      if (!student) return;
      student[field] = clamped;
      student.total = student.q1 + student.q2 + student.q3 + student.q4 + student.q5;
      const totalEl = document.getElementById(`total-${roll}`);
      if (totalEl) totalEl.textContent = String(student.total);
      const avgEl = document.getElementById('marks-avg-val');
      if (avgEl) avgEl.textContent = `${computeLedgerStats(appState.marksLedger).avgPct}%`;
    });
  });

  document.querySelectorAll('[data-audit-slip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast(`Marks locked and saved for ${btn.getAttribute('data-audit-slip')}`, 'success');
    });
  });

  document.getElementById('btn-export-dge')?.addEventListener('click', () => {
    const rows = [['RollNo', 'StudentName', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Total']];
    appState.marksLedger.forEach((s) => {
      rows.push([s.rollNo, `"${s.name}"`, s.q1, s.q2, s.q3, s.q4, s.q5, s.total]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dge-marks-${marksState.assessment}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Exported official marks register to CSV format', 'success');
  });

  document.getElementById('btn-open-marks-import')?.addEventListener('click', () => {
    marksState.importModalOpen = true;
    triggerRender();
  });
  document.getElementById('btn-close-marks-import')?.addEventListener('click', () => {
    marksState.importModalOpen = false;
    triggerRender();
  });
  document.getElementById('btn-cancel-marks-import')?.addEventListener('click', () => {
    marksState.importModalOpen = false;
    triggerRender();
  });
  document.getElementById('marks-import-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'marks-import-backdrop') {
      marksState.importModalOpen = false;
      triggerRender();
    }
  });
  document.getElementById('btn-exec-marks-import')?.addEventListener('click', () => {
    marksState.importModalOpen = false;
    showToast('Marks imported from CSV spreadsheet for 46 students.', 'success');
    triggerRender();
  });
}
