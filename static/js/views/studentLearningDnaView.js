import { STUDENTS_DATA } from '../data/mockData.js';
import { appState, escapeHtml, setActiveTab, showToast, t, triggerRender } from '../state.js';

export function renderStudentLearningDnaView() {
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

  return `
    <div class="page-container">
      <header class="flex-between">
        <div>
          <div class="flex-row">
            <h1 class="page-title">${t('Student Learning Intelligence — Learning DNA', 'மாணவர் கற்றல் DNA நுண்ணறிவு')}</h1>
            <span class="badge badge-secondary">Core Differentiator</span>
          </div>
          <p class="page-subtitle">Granular concept-level diagnostic profile tracking misconceptions, stepwise calculation accuracy, and personalized intervention paths.</p>
        </div>

        <div class="flex-row">
          <label class="text-xs" style="font-weight:700;">Select Student:</label>
          <select id="dna-student-select" class="select" style="width:auto;min-width:16rem;">
            ${STUDENTS_DATA.map(
              (s) => `<option value="${escapeHtml(s.id)}" ${s.id === student.id ? 'selected' : ''}>${escapeHtml(s.name)} (Roll #${escapeHtml(s.rollNo)}) — ${s.overallPercentage}%</option>`
            ).join('')}
          </select>
        </div>
      </header>

      <section class="card card-lg flex-between" style="gap:1.25rem;">
        <div class="flex-row" style="gap:1rem;">
          <div style="width:4rem;height:4rem;border-radius:1rem;background:var(--primary-fixed);color:var(--primary);font-weight:800;font-size:1.25rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${escapeHtml(initials)}
          </div>
          <div>
            <div class="flex-row">
              <h2 style="margin:0;font-size:1.2rem;font-weight:800;">${escapeHtml(t(student.name, student.nameTamil))}</h2>
              <span class="badge badge-neutral font-mono">Roll #${escapeHtml(student.rollNo)}</span>
              <span class="badge badge-neutral font-mono">EMIS: ${escapeHtml(student.emisId)}</span>
            </div>
            <div class="text-xs muted" style="margin-top:0.25rem;">
              ${escapeHtml(appState.currentClass.name)} • Higher Secondary Academic • Attendance: <strong>${escapeHtml(student.attendance)}</strong> • Cohort Rank #${student.rank}
            </div>
          </div>
        </div>

        <div class="flex-row">
          <div class="soft-panel" style="text-align:center;padding:0.55rem 1rem;">
            <div style="font-size:0.64rem;font-weight:700;text-transform:uppercase;color:var(--outline);">Overall Score</div>
            <div class="kpi-value" style="font-size:1.45rem;color:var(--primary);">${student.overallPercentage}%</div>
          </div>
          <div class="soft-panel" style="text-align:center;padding:0.55rem 1rem;">
            <div style="font-size:0.64rem;font-weight:700;text-transform:uppercase;color:var(--outline);">Stepwise Precision</div>
            <div class="kpi-value" style="font-size:1.45rem;color:var(--secondary);">${escapeHtml(student.learningDna.stepwiseAdherence)}</div>
          </div>
          <button type="button" id="btn-dna-launch-remedial" class="btn btn-primary" style="padding:0.75rem 1rem;">
            <span class="material-symbols-outlined" style="font-size:1rem;">psychology</span>
            <span>Launch Remedial Drill</span>
          </button>
        </div>
      </section>

      <div class="grid grid-12" style="gap:1.25rem;align-items:start;">
        <div class="col-span-8 flex-col" style="gap:1.25rem;">
          <section class="card card-lg flex-col" style="gap:1rem;">
            <div class="flex-between" style="padding-bottom:0.6rem;border-bottom:1px solid var(--surface-container);">
              <strong class="text-sm flex-row"><span class="material-symbols-outlined" style="color:var(--primary);">insights</span>Granular Concept Mastery Matrix</strong>
              <span class="font-mono text-xs muted">TN-HSC-MAT Engine</span>
            </div>

            ${masteryBars
              .map(
                (b) => `
              <div>
                <div class="flex-between text-xs" style="font-weight:600;margin-bottom:0.35rem;">
                  <span>${escapeHtml(b.label)}</span>
                  <span class="font-mono">${b.val}%</span>
                </div>
                <div class="progress-track" style="height:0.6rem;">
                  <div class="progress-fill" style="width:${b.val}%;background:${b.val < 60 ? 'var(--error)' : 'var(--secondary)'};"></div>
                </div>
              </div>
            `
              )
              .join('')}
          </section>

          <section class="card card-lg flex-col" style="gap:0.9rem;">
            <div class="flex-between" style="padding-bottom:0.6rem;border-bottom:1px solid var(--surface-container);">
              <strong class="text-sm flex-row"><span class="material-symbols-outlined" style="color:var(--error);">crisis_alert</span>Diagnosed Misconceptions &amp; Persistent Slips</strong>
              <span class="badge badge-error">${student.learningDna.learningGaps.length} Active Gaps</span>
            </div>

            ${
              student.learningDna.learningGaps.length > 0
                ? student.learningDna.learningGaps
                    .map(
                      (gap) => `
                  <div class="card" style="background:rgba(255,218,214,0.22);border-color:var(--error-container);box-shadow:none;">
                    <div class="flex-between" style="margin-bottom:0.4rem;">
                      <strong class="text-xs flex-row"><span class="material-symbols-outlined" style="color:var(--error);font-size:1rem;">warning</span>${escapeHtml(gap.concept)}</strong>
                      <span class="badge badge-error">${escapeHtml(gap.severity)} Severity</span>
                    </div>
                    <p class="text-xs muted" style="margin:0;line-height:1.5;">
                      <strong style="color:var(--on-surface);">Evidence from Answer Sheets: </strong>${escapeHtml(gap.evidence)}
                    </p>
                    <div class="text-xs" style="color:var(--outline);margin-top:0.4rem;">Frequency: ${escapeHtml(gap.frequency)}</div>
                  </div>
                `
                    )
                    .join('')
                : `
                <div style="padding:1.5rem;text-align:center;" class="text-xs muted">
                  <span class="material-symbols-outlined" style="color:var(--secondary);font-size:2rem;">task_alt</span>
                  <div style="font-weight:700;color:var(--on-surface);margin-top:0.3rem;">No critical misconceptions detected!</div>
                  <div>Student is performing within the 90th percentile across all assessed chapters.</div>
                </div>
              `
            }
          </section>
        </div>

        <div class="col-span-4 flex-col" style="gap:1.25rem;">
          <section class="card hero-gradient flex-col" style="gap:0.75rem;">
            <div class="flex-row">
              <span class="material-symbols-outlined fill" style="color:var(--secondary-fixed);">auto_awesome</span>
              <strong class="text-xs" style="text-transform:uppercase;color:var(--secondary-fixed);">AI Next-Lesson Recommendation</strong>
            </div>
            <p class="text-xs" style="margin:0;color:var(--on-primary-container);line-height:1.5;">${escapeHtml(student.learningDna.recommendedAction)}</p>
            <button type="button" id="btn-dna-remedial-card" class="btn" style="background:#fff;color:var(--primary);width:100%;font-weight:700;">
              Generate Remedial Drill Now →
            </button>
          </section>

          <section class="card flex-col" style="gap:0.75rem;">
            <strong class="text-xs" style="text-transform:uppercase;">Validated Competencies &amp; Strengths</strong>
            ${student.learningDna.strengths
              .map(
                (str) => `
              <div class="soft-panel flex-row text-xs" style="padding:0.55rem 0.7rem;">
                <span class="material-symbols-outlined" style="color:var(--secondary);font-size:1rem;">check_circle</span>
                <span>${escapeHtml(str)}</span>
              </div>
            `
              )
              .join('')}
          </section>
        </div>
      </div>
    </div>
  `;
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
