import { appState, escapeHtml, setActiveTab, showToast, t, triggerRender } from '../state.js';

const MATRIX_TOPICS = [
  { code: '1.1', title: 'Rank of a Matrix (Row Echelon Form)', ref: 'Vol 1 • Book-back Ex 1.2', mastery: 88, status: 'Mastered', spread: 'Easy 60% • Med 40%', items: '24 Questions', badgeClass: 'badge-secondary', barColor: 'var(--secondary)' },
  { code: '1.2', title: 'Inverse by Adjoint Method & Matrix Inversion', ref: 'Vol 1 • Book-back Ex 1.1 & 1.3', mastery: 54, status: 'Needs Attention', spread: 'Med 40% • Hard 60%', items: '18 Questions', badgeClass: 'badge-error', barColor: 'var(--error)' },
  { code: '1.4', title: "Cramer's Rule for Linear Systems", ref: 'Vol 1 • Book-back Ex 1.4', mastery: 82, status: 'Mastered', spread: 'Easy 30% • Med 70%', items: '16 Questions', badgeClass: 'badge-secondary', barColor: 'var(--secondary)' },
  { code: '2.4', title: "De Moivre's Theorem & Roots of Unity", ref: 'Vol 1 • Book-back Ex 2.8', mastery: 69, status: 'Moderate', spread: 'Med 50% • Hard 50%', items: '20 Questions', badgeClass: 'badge-tertiary', barColor: 'var(--tertiary-container)' },
  { code: '3.3', title: 'Descartes Rule of Signs', ref: 'Vol 1 • Book-back Ex 3.6', mastery: 92, status: 'Mastered', spread: 'Easy 70% • Med 30%', items: '14 Questions', badgeClass: 'badge-secondary', barColor: 'var(--secondary)' }
];

export function renderDashboardView() {
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

  return `
    <div class="page-container">
      <section class="card card-lg" style="position:relative;overflow:hidden;">
        <div class="flex-between" style="gap:1.25rem;align-items:flex-start;">
          <div style="max-width:42rem;">
            <div class="flex-row" style="margin-bottom:0.55rem;">
              <span class="badge badge-primary">Live Section ${escapeHtml(appState.currentClass.id)}</span>
              <span class="badge badge-neutral font-mono">${escapeHtml(appState.currentClass.medium)}</span>
              <span class="badge badge-secondary">${t('Term 2 Active • TN-SCERT', 'பருவம் 2 • TN-SCERT')}</span>
            </div>
            <h1 class="page-title">
              ${t(`Teacher Command Center — ${appState.currentClass.name} Mathematics`, `ஆசிரியர் கட்டளை மையம் — ${appState.currentClass.name} கணிதம்`)}
            </h1>
            <p class="page-subtitle">
              Term 2 Assessment Cycle • ${appState.currentClass.studentsCount} Enrolled Students • ${escapeHtml(appState.currentSchool.name)}
            </p>
          </div>

          <div class="flex-row" style="justify-content:flex-end;">
            <button type="button" class="btn btn-primary" data-dash-go="paper-generator">
              <span class="material-symbols-outlined" style="font-size:1.05rem;">auto_awesome</span>
              <span>+ Quick Generate Test</span>
            </button>
            <button type="button" class="btn btn-outline" data-dash-go="answer-evaluation">
              <span class="material-symbols-outlined" style="font-size:1.05rem;color:var(--secondary);">document_scanner</span>
              <span>${t('Upload Answer Sheets', 'விடைத்தாள்களைப் பதிவேற்று')}</span>
            </button>
            <button type="button" class="btn btn-surface" data-dash-go="teaching-progress">
              <span class="material-symbols-outlined" style="font-size:1.05rem;">lock_clock</span>
              <span>${t('Update Syllabus Lock', 'பாடத்திட்ட பூட்டை மாற்று')}</span>
            </button>
          </div>
        </div>
      </section>

      <section class="grid grid-4">
        <div class="card card-hover flex-col" style="justify-content:space-between;">
          <div class="flex-between" style="align-items:flex-start;">
            <div>
              <div class="text-xs muted" style="font-weight:600;">${t('Syllabus Coverage', 'பாடத்திட்ட நிறைவு')}</div>
              <div class="flex-row" style="align-items:baseline;margin-top:0.35rem;">
                <span class="kpi-value">${coveragePct}%</span>
                <span class="text-xs" style="color:var(--secondary);font-weight:700;">${completedTopics}/${totalTopics} Topics</span>
              </div>
            </div>
            <div style="position:relative;width:3.4rem;height:3.4rem;display:flex;align-items:center;justify-content:center;">
              <svg width="52" height="52" viewBox="0 0 48 48" style="transform:rotate(-90deg);">
                <circle cx="24" cy="24" r="19" fill="none" stroke="var(--surface-container-high)" stroke-width="4.5"></circle>
                <circle cx="24" cy="24" r="19" fill="none" stroke="var(--secondary)" stroke-width="4.5" stroke-dasharray="${ringCircumference}" stroke-dashoffset="${ringOffset}" stroke-linecap="round"></circle>
              </svg>
              <span class="material-symbols-outlined fill" style="position:absolute;color:var(--secondary);font-size:1rem;">verified</span>
            </div>
          </div>
          <div class="soft-panel" style="padding:0.6rem 0.75rem;margin-top:0.5rem;">
            <div class="flex-between text-xs muted">
              <span>${completedTopics} Taught • ${revisedTopics} Revised</span>
              <span class="font-mono" style="color:var(--secondary);font-weight:700;">Vol 1 &amp; 2</span>
            </div>
            <div class="badge ${appState.progressLockActive ? 'badge-error' : 'badge-neutral'}" style="margin-top:0.4rem;">
              <span class="material-symbols-outlined" style="font-size:0.85rem;">${appState.progressLockActive ? 'lock' : 'lock_open'}</span>
              <span>${appState.progressLockActive ? 'Teaching Progress Lock ACTIVE' : 'Progress Lock Inactive'}</span>
            </div>
          </div>
        </div>

        <div class="card card-hover flex-col" style="justify-content:space-between;">
          <div class="flex-between" style="align-items:flex-start;">
            <div>
              <div class="text-xs muted" style="font-weight:600;">${t('Class Performance Average', 'வகுப்பு செயல்திறன் சராசரி')}</div>
              <div class="flex-row" style="align-items:baseline;margin-top:0.35rem;">
                <span class="kpi-value">74.2%</span>
                <span class="badge badge-secondary"><span class="material-symbols-outlined" style="font-size:0.75rem;">arrow_upward</span>5.8%</span>
              </div>
            </div>
            <svg width="64" height="32" viewBox="0 0 64 32" style="color:var(--primary);">
              <path d="M 0,26 L 14,24 L 28,18 L 42,14 L 54,8 L 64,4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
              <circle cx="64" cy="4" r="3" fill="currentColor"></circle>
            </svg>
          </div>
          <div class="soft-panel" style="padding:0.6rem 0.75rem;margin-top:0.5rem;">
            <div class="flex-between text-xs muted">
              <span>Unit Test 1 baseline: 68.4%</span>
              <strong style="color:var(--primary);">Mid-Term Cycle</strong>
            </div>
            <div class="flex-row text-xs" style="margin-top:0.35rem;gap:0.35rem;">
              <span class="material-symbols-outlined" style="color:var(--tertiary);font-size:0.95rem;">emoji_events</span>
              <span>Top score: <strong>98/100</strong> (Ananya S.)</span>
            </div>
          </div>
        </div>

        <div class="card card-hover flex-col" style="justify-content:space-between;">
          <div class="flex-between" style="align-items:flex-start;">
            <div>
              <div class="text-xs muted" style="font-weight:600;">${t('Students Needing Priority Support', 'கூடுதல் உதவி தேவைப்படும் மாணவர்கள்')}</div>
              <div class="flex-row" style="align-items:baseline;margin-top:0.35rem;">
                <span class="kpi-value" style="color:var(--tertiary);">9</span>
                <span class="badge badge-tertiary">19.5% cohort</span>
              </div>
            </div>
            <div style="width:2.75rem;height:2.75rem;border-radius:0.75rem;background:var(--tertiary-fixed);color:var(--on-tertiary-fixed);display:flex;align-items:center;justify-content:center;">
              <span class="material-symbols-outlined">priority_high</span>
            </div>
          </div>
          <div class="soft-panel" style="padding:0.6rem 0.75rem;margin-top:0.5rem;">
            <div class="text-xs" style="font-weight:700;">Specific Bottlenecks:</div>
            <div class="text-xs muted" style="margin-top:0.2rem;">5 Matrix Inverses • 4 Vector Triple Prod</div>
          </div>
        </div>

        <div class="card card-hover flex-col" style="justify-content:space-between;">
          <div class="flex-between" style="align-items:flex-start;">
            <div>
              <div class="text-xs muted" style="font-weight:600;">${t('Pending AI Evaluations', 'நிலுவையில் உள்ள AI மதிப்பீடுகள்')}</div>
              <div class="flex-row" style="align-items:baseline;margin-top:0.35rem;">
                <span class="kpi-value" style="color:var(--primary);">${appState.pendingEvalCount}</span>
                <span class="badge badge-primary">Review Queue</span>
              </div>
            </div>
            <div style="width:2.75rem;height:2.75rem;border-radius:0.75rem;background:var(--primary-fixed);color:var(--primary);display:flex;align-items:center;justify-content:center;">
              <span class="material-symbols-outlined">draw</span>
            </div>
          </div>
          <div class="soft-panel" style="padding:0.6rem 0.75rem;margin-top:0.5rem;">
            <div class="flex-between text-xs muted">
              <span>Avg model confidence:</span>
              <strong style="color:var(--secondary);">94.2%</strong>
            </div>
            <div class="progress-track" style="margin-top:0.4rem;">
              <div class="progress-fill" style="width:94%;background:var(--secondary);"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="flex-col" style="gap:0.9rem;">
        <div class="flex-between">
          <div class="flex-row" style="gap:0.65rem;">
            <div style="width:2.1rem;height:2.1rem;border-radius:0.55rem;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;">
              <span class="material-symbols-outlined" style="font-size:1.15rem;">auto_awesome</span>
            </div>
            <div>
              <h2 class="section-title">AI Pedagogical Insights &amp; Recommendations</h2>
              <div class="text-xs muted">Teacher Approval Required • Verified strictly against Tamil Nadu HSC Blueprint</div>
            </div>
          </div>
          ${
            appState.dashboardRecs.length > 0
              ? `<span class="badge badge-primary font-mono">${appState.dashboardRecs.length} High-Impact Interventions Available</span>`
              : ''
          }
        </div>

        <div class="grid grid-2">
          ${
            appState.dashboardRecs.length > 0
              ? appState.dashboardRecs
                  .map(
                    (rec) => `
                  <article class="card card-lg flex-col" style="justify-content:space-between;gap:0.85rem;">
                    <div class="flex-col" style="gap:0.65rem;">
                      <div class="flex-between">
                        <span class="badge ${rec.type === 'critical' ? 'badge-error' : 'badge-tertiary'}">
                          <span class="material-symbols-outlined" style="font-size:0.85rem;">${rec.type === 'critical' ? 'warning' : 'schedule'}</span>
                          ${escapeHtml(rec.badge)}
                        </span>
                        <span class="badge badge-neutral font-mono">${escapeHtml(rec.chapter)}</span>
                      </div>
                      <h3 style="margin:0;font-size:0.95rem;font-weight:700;">${escapeHtml(rec.title)}</h3>
                      <div class="soft-panel flex-row" style="align-items:flex-start;flex-wrap:nowrap;">
                        <span class="material-symbols-outlined" style="color:var(--tertiary);font-size:1.1rem;margin-top:0.1rem;">analytics</span>
                        <div class="text-xs muted"><strong>Evidence: </strong>${escapeHtml(rec.evidence)}</div>
                      </div>
                      <div class="text-xs">
                        <strong style="color:var(--secondary);">Recommended Remedial: </strong>${escapeHtml(rec.plan)}
                      </div>
                    </div>

                    <div class="soft-panel flex-between" style="padding:0.55rem 0.7rem;">
                      <div class="flex-row">
                        <button type="button" class="btn btn-secondary" data-accept-rec="${rec.id}">
                          <span class="material-symbols-outlined" style="font-size:1rem;">check_circle</span>
                          <span>${t('Accept & Generate Reassessment', 'ஏற்று மறுமதிப்பீட்டை உருவாக்கு')}</span>
                        </button>
                        <button type="button" class="btn btn-outline" data-dash-go="remedial-and-homework">Edit Parameters</button>
                      </div>
                      <button type="button" class="btn btn-ghost" data-dismiss-rec="${rec.id}">Dismiss</button>
                    </div>
                  </article>
                `
                  )
                  .join('')
              : `
                <div class="card col-span-2" style="text-align:center;padding:2.5rem;">
                  <span class="material-symbols-outlined" style="font-size:2.4rem;color:var(--secondary);">task_alt</span>
                  <h3 style="margin:0.4rem 0 0.25rem;font-size:0.95rem;">All pedagogical interventions addressed!</h3>
                  <p class="text-xs muted" style="margin:0;">Your students are currently tracking on schedule with the HSC 2024–25 baseline.</p>
                </div>
              `
          }
        </div>
      </section>

      <section class="card card-lg flex-col" style="gap:1rem;">
        <div class="flex-between">
          <div>
            <h2 class="section-title">Curricular Mastery &amp; Weakness Matrix</h2>
            <p class="text-xs muted" style="margin:0.2rem 0 0;">Live aggregate score metrics derived from Unit Tests 1 &amp; 2, Slip Tests, and Daily Problem Drills.</p>
          </div>
          <div class="flex-row" style="gap:0.5rem;">
            <label for="dash-topic-filter" class="text-xs muted" style="font-weight:600;">${t('Filter:', 'வடிகட்டி:')}</label>
            <select id="dash-topic-filter" class="select" style="width:auto;min-width:12rem;">
              <option value="all" ${appState.dashboardTopicFilter === 'all' ? 'selected' : ''}>All Topics</option>
              <option value="vol1" ${appState.dashboardTopicFilter === 'vol1' ? 'selected' : ''}>Volume 1 Chapters</option>
              <option value="vol2" ${appState.dashboardTopicFilter === 'vol2' ? 'selected' : ''}>Volume 2 Chapters</option>
              <option value="attention" ${appState.dashboardTopicFilter === 'attention' ? 'selected' : ''}>Needing Attention</option>
            </select>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Syllabus Section</th>
                <th>Subject Subtopic</th>
                <th>Mastery Rate</th>
                <th>Difficulty Spread</th>
                <th>Assessed Items</th>
                <th style="text-align:right;">Pedagogical Action</th>
              </tr>
            </thead>
            <tbody>
              ${
                filteredTopics.length > 0
                  ? filteredTopics
                      .map(
                        (row) => `
                      <tr>
                        <td class="font-mono" style="font-weight:700;color:var(--primary);">${escapeHtml(row.code)}</td>
                        <td>
                          <div style="font-weight:600;">${escapeHtml(row.title)}</div>
                          <div class="text-xs muted">${escapeHtml(row.ref)}</div>
                        </td>
                        <td>
                          <div class="flex-row" style="gap:0.65rem;flex-wrap:nowrap;">
                            <strong style="width:2.3rem;">${row.mastery}%</strong>
                            <div class="progress-track" style="width:6rem;">
                              <div class="progress-fill" style="width:${row.mastery}%;background:${row.barColor};"></div>
                            </div>
                            <span class="badge ${row.badgeClass}">${escapeHtml(row.status)}</span>
                          </div>
                        </td>
                        <td class="muted">${escapeHtml(row.spread)}</td>
                        <td class="font-mono muted">${escapeHtml(row.items)}</td>
                        <td style="text-align:right;">
                          <button type="button" class="btn btn-ghost" style="color:var(--primary);padding:0.25rem 0.5rem;" data-matrix-action="${escapeHtml(row.title)}">
                            ${row.status === 'Needs Attention' ? 'Assign Remedial →' : 'View Question Breakdown →'}
                          </button>
                        </td>
                      </tr>
                    `
                      )
                      .join('')
                  : `<tr><td colspan="6" style="text-align:center;" class="muted">No topics match this filter.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
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
