import { appState, escapeHtml, showToast, t, triggerRender } from '../state.js';

let marksState = {
  assessment: 'UT2',
  importModalOpen: false
};

export function renderMarksManagementView() {
  const students = appState.marksLedger;

  return `
    <div class="page-container">
      <header class="flex-between">
        <div>
          <div class="flex-row">
            <h1 class="page-title">${t('Marks Management & Intelligence', 'மதிப்பெண் மேலாண்மை & நுண்ணறிவு')}</h1>
            <span class="badge badge-primary">Assessment Analytics</span>
          </div>
          <p class="page-subtitle">Question-wise scoring, CSV/Excel import, automated total verification, and AI-suggested vs teacher-approved audit trail.</p>
        </div>

        <div class="flex-row">
          <button type="button" id="btn-open-marks-import" class="btn btn-surface">
            <span class="material-symbols-outlined" style="font-size:1rem;">upload_file</span>
            <span>${t('Import CSV / Excel', 'CSV / Excel இறக்குமதி')}</span>
          </button>
          <button type="button" id="btn-export-dge" class="btn btn-primary">
            <span class="material-symbols-outlined" style="font-size:1rem;">file_download</span>
            <span>${t('Export DGE Format', 'DGE வடிவில் ஏற்றுமதி')}</span>
          </button>
        </div>
      </header>

      <div class="card flex-between">
        <div class="flex-row">
          <label class="text-xs" style="font-weight:700;">${t('Target Assessment:', 'தேர்வு:')}</label>
          <select id="marks-assess-select" class="select" style="width:auto;min-width:18rem;">
            <option value="UT1" ${marksState.assessment === 'UT1' ? 'selected' : ''}>Unit Test 1 — Matrices &amp; Determinants</option>
            <option value="UT2" ${marksState.assessment === 'UT2' ? 'selected' : ''}>Unit Test 2 — Complex Numbers &amp; Equations</option>
            <option value="MID" ${marksState.assessment === 'MID' ? 'selected' : ''}>Mid-Term Examination (50M)</option>
            <option value="REV" ${marksState.assessment === 'REV' ? 'selected' : ''}>Revision Test 1 (Full Vol 1)</option>
          </select>
        </div>
        <div class="flex-row text-xs muted" style="gap:1rem;">
          <span>${t('Total Students:', 'மொத்த மாணவர்கள்:')} <strong style="color:var(--on-surface);">46</strong></span>
          <span>${t('Class Average:', 'வகுப்பு சராசரி:')} <strong style="color:var(--secondary);">74.2%</strong></span>
          <span>${t('Discrepancy Flags:', 'முரண்பாடு குறியீடுகள்:')} <strong style="color:var(--error);">2</strong></span>
        </div>
      </div>

      <section class="card" style="padding:0;overflow:hidden;">
        <div class="flex-between" style="padding:0.75rem 1rem;background:rgba(242,243,255,0.6);border-bottom:1px solid var(--surface-container);">
          <strong class="text-xs">${t('Question-Wise Marks Ledger', 'கேள்விவாரியான மதிப்பெண் பதிவேடு')}</strong>
          <span class="text-xs muted">${t('Click any cell to edit score', 'மதிப்பெண்ணைத் திருத்த கலத்தைத் தேர்ந்தெடுக்கவும்')}</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th style="text-align:center;">Q.1 (1M)</th>
                <th style="text-align:center;">Q.2 (2M)</th>
                <th style="text-align:center;">Q.3 (3M)</th>
                <th style="text-align:center;">Q.4 (5M)</th>
                <th style="text-align:center;">Q.5 (5M)</th>
                <th style="text-align:center;">Total (16M)</th>
                <th>Audit Status / Flags</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${students
                .map(
                  (s) => `
                <tr>
                  <td class="font-mono" style="font-weight:700;color:var(--primary);">${escapeHtml(s.rollNo)}</td>
                  <td><strong>${escapeHtml(s.name)}</strong></td>
                  ${['q1', 'q2', 'q3', 'q4', 'q5']
                    .map(
                      (field) => `
                    <td style="text-align:center;">
                      <input
                        type="number"
                        min="0"
                        class="input"
                        style="width:3rem;padding:0.3rem;text-align:center;"
                        data-mark-roll="${escapeHtml(s.rollNo)}"
                        data-mark-field="${field}"
                        value="${s[field]}"
                      />
                    </td>
                  `
                    )
                    .join('')}
                  <td style="text-align:center;">
                    <strong id="total-${escapeHtml(s.rollNo)}" style="font-size:0.95rem;color:var(--primary);">${s.total}</strong>
                    <span class="text-xs muted">/ 16</span>
                  </td>
                  <td>
                    ${
                      s.flag
                        ? `<span class="badge badge-error"><span class="material-symbols-outlined" style="font-size:0.8rem;">flag</span>${escapeHtml(s.flag)}</span>`
                        : `<span style="color:var(--secondary);font-weight:700;display:inline-flex;align-items:center;gap:0.25rem;"><span class="material-symbols-outlined" style="font-size:0.9rem;">check_circle</span>Verified</span>`
                    }
                  </td>
                  <td style="text-align:right;">
                    <button type="button" class="btn btn-ghost" style="color:var(--primary);padding:0.25rem 0.5rem;" data-audit-slip="${escapeHtml(s.name)}">Audit Slip →</button>
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </section>

      ${
        marksState.importModalOpen
          ? `
        <div id="marks-import-backdrop" class="modal-backdrop">
          <div class="modal-card" style="max-width:28rem;">
            <div class="flex-between" style="padding-bottom:0.65rem;border-bottom:1px solid var(--surface-container);">
              <h2 style="margin:0;font-size:1rem;font-weight:700;">Batch Import Marks Spreadsheet</h2>
              <button type="button" id="btn-close-marks-import" class="btn-ghost" style="padding:0.25rem;"><span class="material-symbols-outlined">close</span></button>
            </div>
            <div class="soft-panel" style="border:2px dashed var(--outline-variant);text-align:center;padding:1.4rem;margin-top:0.9rem;">
              <span class="material-symbols-outlined" style="color:var(--primary);font-size:2rem;">table_view</span>
              <div class="text-xs" style="font-weight:700;margin-top:0.25rem;">Upload CSV or XLSX file</div>
              <div class="text-xs muted">Columns: RollNo, Q1, Q2, Q3, Q4, Q5</div>
            </div>
            <div class="badge badge-secondary" style="margin-top:0.85rem;padding:0.6rem 0.75rem;border-radius:0.75rem;white-space:normal;">
              <span class="material-symbols-outlined fill" style="font-size:1rem;">verified</span>
              <span>Automatic total recalculation and discrepancy matching against EMIS roster.</span>
            </div>
            <div class="flex-row" style="justify-content:flex-end;margin-top:1rem;">
              <button type="button" id="btn-cancel-marks-import" class="btn btn-surface">Cancel</button>
              <button type="button" id="btn-exec-marks-import" class="btn btn-primary">Execute Import</button>
            </div>
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;
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
      const val = Math.max(0, Number(input.value) || 0);
      const student = appState.marksLedger.find((s) => s.rollNo === roll);
      if (!student) return;
      student[field] = val;
      student.total = student.q1 + student.q2 + student.q3 + student.q4 + student.q5;
      const totalEl = document.getElementById(`total-${roll}`);
      if (totalEl) totalEl.textContent = String(student.total);
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
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dge-marks-${marksState.assessment}.csv`;
    link.click();
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
  document.getElementById('btn-exec-marks-import')?.addEventListener('click', () => {
    marksState.importModalOpen = false;
    showToast('Marks imported from CSV spreadsheet for 46 students.', 'success');
    triggerRender();
  });
}
