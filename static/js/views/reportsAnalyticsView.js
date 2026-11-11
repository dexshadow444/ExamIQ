import { STUDENTS_DATA } from '../data/mockData.js';
import { appState, escapeHtml, showToast, t, triggerRender } from '../state.js';

export function renderReportsAnalyticsView() {
  const selectedStudent = STUDENTS_DATA.find((s) => s.id === appState.selectedStudentId) || STUDENTS_DATA[0];
  const gradeLabel = selectedStudent.overallPercentage >= 90 ? 'Grade A+' : selectedStudent.overallPercentage >= 75 ? 'Grade A' : 'Grade B';

  return `
    <div class="page-container">
      <header class="flex-between" style="align-items:flex-start;">
        <div>
          <div class="flex-row">
            <h1 class="page-title">${t('Reports & Analytics Center', 'அறிக்கைகள் & பகுப்பாய்வு மையம்')}</h1>
            <span class="badge badge-primary">HSC 2024–25 Performance</span>
          </div>
          <p class="page-subtitle">Student performance transcripts, school-approved parent progress cards, and departmental analytics.</p>
        </div>

        <div class="flex-row no-print" style="justify-content:flex-end;">
          <button type="button" id="btn-print-report" class="btn btn-surface">
            <span class="material-symbols-outlined" style="font-size:1rem;">print</span>
            <span>${t('Print Current Report', 'தற்போதைய அறிக்கையை அச்சிடு')}</span>
          </button>
          <button type="button" id="btn-export-parent-slips" class="btn btn-primary">
            <span class="material-symbols-outlined" style="font-size:1rem;">picture_as_pdf</span>
            <span>${t('Export Parent Slips (PDF)', 'பெற்றோர் அறிக்கைகளை PDF ஆக ஏற்றுமதி செய்')}</span>
          </button>
        </div>
      </header>

      <div class="flex-between no-print">
        <div class="segmented-pill" style="width:fit-content;">
          <button type="button" id="rep-tab-summary" class="segmented-btn ${appState.reportType === 'class-summary' ? 'active-white' : ''}">Class Curricular Audit</button>
          <button type="button" id="rep-tab-parent" class="segmented-btn ${appState.reportType === 'parent-slips' ? 'active-white' : ''}">School-Approved Parent Progress Card</button>
        </div>

        ${
          appState.reportType === 'parent-slips'
            ? `
            <div class="flex-row">
              <label for="rep-student-select" class="text-xs muted" style="font-weight:700;">${t('Student:', 'மாணவர்:')}</label>
              <select id="rep-student-select" class="select" style="width:auto;min-width:15rem;">
                ${STUDENTS_DATA.map(
                  (s) => `<option value="${escapeHtml(s.id)}" ${s.id === selectedStudent.id ? 'selected' : ''}>${escapeHtml(s.name)} (Roll #${escapeHtml(s.rollNo)})</option>`
                ).join('')}
              </select>
            </div>
          `
            : ''
        }
      </div>

      ${
        appState.reportType === 'class-summary'
          ? `
        <section class="grid grid-3">
          <div class="card">
            <div class="text-xs muted" style="font-weight:700;text-transform:uppercase;">${t('Cohort Average', 'வகுப்பு சராசரி')}</div>
            <div class="kpi-value" style="color:var(--primary);margin-top:0.4rem;">74.2%</div>
            <div class="text-xs" style="color:var(--secondary);font-weight:700;margin-top:0.35rem;">↑ 5.8% improvement from baseline</div>
          </div>
          <div class="card">
            <div class="text-xs muted" style="font-weight:700;text-transform:uppercase;">${t('Board Exam Readiness', 'பொதுத்தேர்வு தயார்நிலை')}</div>
            <div class="kpi-value" style="color:var(--secondary);margin-top:0.4rem;">82.6%</div>
            <div class="text-xs muted" style="margin-top:0.35rem;">37 of 46 students on distinction path</div>
          </div>
          <div class="card">
            <div class="text-xs muted" style="font-weight:700;text-transform:uppercase;">${t('Remedial Resolution', 'கூடுதல் கற்றல் முன்னேற்றம்')}</div>
            <div class="kpi-value" style="color:var(--tertiary);margin-top:0.4rem;">88.9%</div>
            <div class="text-xs muted" style="margin-top:0.35rem;">16 of 18 students cleared cofactor slip</div>
          </div>
        </section>
      `
          : `
        <section class="card card-lg" style="max-width:44rem;margin:0 auto;width:100%;display:flex;flex-direction:column;gap:1rem;">
          <div style="text-align:center;padding-bottom:1rem;border-bottom:2px solid var(--primary);">
            <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--outline);">
              ${escapeHtml(appState.currentSchool.name.toUpperCase())}
            </div>
            <h2 style="margin:0.3rem 0;font-size:1.1rem;font-weight:800;">Class 12 Mid-Term Curricular Progress Card (2024–25)</h2>
            <div class="font-mono text-xs muted">Student: ${escapeHtml(selectedStudent.name)} • Roll #${escapeHtml(selectedStudent.rollNo)} • ${escapeHtml(appState.currentClass.name)}</div>
          </div>

          <div class="soft-panel grid grid-2 text-xs" style="gap:0.65rem;">
            <div><strong>Overall Marks:</strong> ${selectedStudent.overallPercentage}% (${gradeLabel})</div>
            <div><strong>Cohort Rank:</strong> ${selectedStudent.rank} of ${appState.currentClass.studentsCount}</div>
            <div><strong>Class Attendance:</strong> ${escapeHtml(selectedStudent.attendance)}</div>
            <div><strong>Progress Lock Topics Tested:</strong> 14 of 14</div>
          </div>

          <div class="text-xs">
            <strong>Teacher Observations:</strong>
            <p class="muted" style="margin:0.3rem 0 0;line-height:1.55;">
              ${escapeHtml(selectedStudent.name)} demonstrates strong consistency in ${escapeHtml(selectedStudent.learningDna.strengths.join(', '))}. ${escapeHtml(selectedStudent.learningDna.recommendedAction)}
            </p>
          </div>

          <div class="flex-between" style="padding-top:1.25rem;border-top:1px solid var(--surface-container);font-size:0.76rem;text-align:center;">
            <div>
              <strong style="color:var(--primary);">K. Meenakshi Sundaram</strong>
              <div class="muted" style="font-size:0.68rem;">PGT Mathematics Teacher</div>
            </div>
            <div>
              <strong style="color:var(--secondary);">Dr. S. Ramanathan</strong>
              <div class="muted" style="font-size:0.68rem;">Headmaster / Principal (${escapeHtml(appState.currentSchool.district)})</div>
            </div>
          </div>
        </section>
      `
      }
    </div>
  `;
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
