import { apiClient } from '../api/client.js';
import { appState, escapeHtml, showToast, t, triggerRender } from '../state.js';

let tpAuditModalOpen = false;

export function renderTeachingProgressView() {
  const chapters = appState.chapters;
  const totalSubtopics = chapters.reduce((acc, c) => acc + c.subtopics.length, 0);
  const taughtSubtopics = chapters.reduce(
    (acc, c) => acc + c.subtopics.filter((s) => s.status === 'completed' || s.status === 'revised').length,
    0
  );
  const inProgressSubtopics = chapters.reduce(
    (acc, c) => acc + c.subtopics.filter((s) => s.status === 'in_progress').length,
    0
  );
  const lockedSubtopics = totalSubtopics - taughtSubtopics;
  const taughtPct = totalSubtopics ? Math.round((taughtSubtopics / totalSubtopics) * 100) : 0;
  const inProgressPct = totalSubtopics ? Math.round((inProgressSubtopics / totalSubtopics) * 100) : 0;
  const lockedPct = totalSubtopics ? Math.round((lockedSubtopics / totalSubtopics) * 100) : 0;

  return `
    <div class="page-container">
      <header class="flex-between" style="align-items:flex-start;">
        <div>
          <div class="flex-row">
            <h1 class="page-title">${t('Teaching Progress & Assessment Lock', 'கற்பித்தல் முன்னேற்றம் & தேர்வுப் பூட்டு')}</h1>
            <span class="badge ${appState.progressLockActive ? 'badge-error' : 'badge-neutral'}">
              <span class="material-symbols-outlined" style="font-size:0.85rem;">${appState.progressLockActive ? 'shield_lock' : 'lock_open'}</span>
              ${appState.progressLockActive ? 'RULE 1 ENFORCED' : 'LOCK PAUSED'}
            </span>
          </div>
          <p class="page-subtitle">
            Tamil Nadu State Board • <strong>${escapeHtml(appState.currentClass.name)} Mathematics (Volume 1 &amp; 2)</strong> • Academic Year 2024–25 • <span style="color:var(--secondary);font-weight:600;">வகுப்பு 12 கணிதம்</span>
          </p>
        </div>

        <div class="flex-row" style="justify-content:flex-end;">
          <button type="button" id="btn-audit-history" class="btn btn-ghost">
            <span class="material-symbols-outlined" style="font-size:1rem;">history</span>
            <span>Audit History</span>
          </button>
          <button type="button" id="btn-batch-complete" class="btn btn-outline">
            <span class="material-symbols-outlined" style="font-size:1rem;">tune</span>
            <span>Mark Expanded Unit Taught</span>
          </button>
          <button type="button" id="btn-export-syllabus" class="btn btn-outline">
            <span class="material-symbols-outlined" style="font-size:1rem;">file_download</span>
            <span>Curricular Export (CSV)</span>
          </button>
        </div>
      </header>

      <section class="card card-lg hero-gradient">
        <div class="flex-between" style="gap:1.25rem;">
          <div class="flex-row" style="align-items:flex-start;gap:1rem;max-width:44rem;flex-wrap:nowrap;">
            <div style="width:3rem;height:3rem;border-radius:0.85rem;background:rgba(255,255,255,0.16);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <span class="material-symbols-outlined" style="font-size:1.75rem;color:var(--secondary-fixed);">
                ${appState.progressLockActive ? 'lock' : 'lock_open'}
              </span>
            </div>
            <div>
              <div class="flex-row">
                <strong style="font-size:1.05rem;">
                  ${appState.progressLockActive ? 'TEACHING PROGRESS LOCK IS CURRENTLY ACTIVE' : 'TEACHING PROGRESS LOCK IS PAUSED'}
                </strong>
                <span class="badge badge-secondary">GOLDEN RULE</span>
              </div>
              <p class="text-xs" style="margin:0.4rem 0 0;color:var(--on-primary-container);line-height:1.5;">
                "Teach what you have taught." Any test generated in <strong style="color:#fff;">Paper Generator</strong> will automatically filter out unchecked topics to prevent testing untaught syllabus.
              </p>
              <div class="flex-row text-xs" style="margin-top:0.65rem;color:var(--on-primary-container);">
                <span>Syllabus Version: <strong style="color:#fff;">TN-SCERT-2024-V2.1</strong></span>
                <span>|</span>
                <span>Last verified by HOD: 24 Oct 2024</span>
              </div>
            </div>
          </div>

          <div style="min-width:17.5rem;background:rgba(255,255,255,0.14);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.22);border-radius:1rem;padding:0.9rem;">
            <div class="flex-between" style="padding-bottom:0.6rem;border-bottom:1px solid rgba(255,255,255,0.14);">
              <div>
                <div style="font-size:0.78rem;font-weight:700;">Master Lock</div>
                <div style="font-size:0.68rem;color:var(--on-primary-container);">Enforce untaught exclusion</div>
              </div>
              <button type="button" id="btn-toggle-master-lock" class="badge" style="border:none;padding:0.35rem 0.75rem;${appState.progressLockActive ? 'background:var(--secondary-fixed);color:var(--on-secondary-fixed);' : 'background:rgba(255,255,255,0.25);color:#fff;'}">
                ${appState.progressLockActive ? 'LOCKED ON' : 'DISABLED'}
              </button>
            </div>
            <div class="flex-between" style="padding-top:0.6rem;">
              <div>
                <div style="font-size:0.78rem;font-weight:700;">Enrichment Preview</div>
                <div style="font-size:0.68rem;color:var(--on-primary-container);">Teacher Override for HOTS</div>
              </div>
              <button type="button" id="btn-toggle-enrichment" class="badge" style="border:none;padding:0.35rem 0.75rem;${appState.enrichmentPreview ? 'background:var(--tertiary-fixed);color:var(--on-tertiary-fixed);' : 'background:rgba(255,255,255,0.25);color:#fff;'}">
                ${appState.enrichmentPreview ? 'ALLOW HOTS' : 'BLOCKED'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="grid grid-5">
        <div class="card">
          <div class="flex-between text-xs muted"><strong>TOTAL CHAPTERS</strong><span class="material-symbols-outlined" style="color:var(--primary);">auto_stories</span></div>
          <div class="flex-row" style="align-items:baseline;margin-top:0.6rem;"><span class="kpi-value">${chapters.length}</span><span class="text-xs muted">SCERT Vols 1 &amp; 2</span></div>
          <div class="progress-track" style="margin-top:0.75rem;"><div class="progress-fill" style="width:100%;background:var(--primary);"></div></div>
        </div>
        <div class="card">
          <div class="flex-between text-xs muted"><strong>TAUGHT &amp; VERIFIED</strong><span class="material-symbols-outlined" style="color:var(--secondary);">task_alt</span></div>
          <div class="flex-row" style="align-items:baseline;margin-top:0.6rem;"><span class="kpi-value" style="color:var(--secondary);">${taughtSubtopics}</span><span class="text-xs muted">of ${totalSubtopics} Topics</span></div>
          <div class="progress-track" style="margin-top:0.75rem;"><div class="progress-fill" style="width:${taughtPct}%;background:var(--secondary);"></div></div>
        </div>
        <div class="card">
          <div class="flex-between text-xs muted"><strong>CURRENTLY TEACHING</strong><span class="material-symbols-outlined" style="color:var(--tertiary);">pending</span></div>
          <div class="flex-row" style="align-items:baseline;margin-top:0.6rem;"><span class="kpi-value" style="color:var(--tertiary);">${inProgressSubtopics}</span><span class="text-xs muted">Topics in progress</span></div>
          <div class="progress-track" style="margin-top:0.75rem;"><div class="progress-fill" style="width:${inProgressPct}%;background:var(--tertiary-container);"></div></div>
        </div>
        <div class="card">
          <div class="flex-between text-xs muted"><strong>EXAM-LOCKED TOPICS</strong><span class="material-symbols-outlined" style="color:var(--error);">lock</span></div>
          <div class="flex-row" style="align-items:baseline;margin-top:0.6rem;"><span class="kpi-value" style="color:var(--error);">${lockedSubtopics}</span><span class="text-xs muted">Untaught / Blocked</span></div>
          <div class="progress-track" style="margin-top:0.75rem;"><div class="progress-fill" style="width:${lockedPct}%;background:var(--error);"></div></div>
        </div>
        <div class="card">
          <div class="flex-between text-xs muted"><strong>BOARD PACE</strong><span class="material-symbols-outlined" style="color:var(--secondary);">speed</span></div>
          <div class="flex-row" style="align-items:baseline;margin-top:0.6rem;"><span class="kpi-value">94.8%</span><span class="text-xs" style="color:var(--secondary);font-weight:700;">On Target</span></div>
          <div class="progress-track" style="margin-top:0.75rem;"><div class="progress-fill" style="width:95%;background:var(--secondary);"></div></div>
        </div>
      </section>

      <section class="flex-col" style="gap:0.85rem;">
        <div class="flex-between">
          <h2 class="section-title">Class 12 Mathematics Units &amp; Granular Subtopics</h2>
          <span class="text-xs muted">Use the status dropdowns below to update teaching state in real-time</span>
        </div>

        ${chapters
          .map((chap) => {
            const isExpanded = appState.expandedChapter === chap.chapterId;
            const isTaught = chap.status === 'completed';
            const isPartial = chap.status === 'partially_completed';
            const badgeClass = isTaught ? 'badge-secondary' : isPartial ? 'badge-tertiary' : 'badge-error';
            const badgeIcon = isTaught ? 'check_circle' : isPartial ? 'pending' : 'lock';
            const badgeText = isTaught ? 'Fully Taught (Unlocked)' : isPartial ? 'In Progress (Partial Lock)' : 'Untaught (Locked from Tests)';

            return `
              <div class="card" style="padding:0;overflow:hidden;">
                <div data-toggle-chapter="${chap.chapterId}" class="flex-between" style="padding:1rem 1.25rem;cursor:pointer;">
                  <div class="flex-row" style="gap:0.75rem;">
                    <span class="material-symbols-outlined" style="color:var(--outline);">${isExpanded ? 'expand_less' : 'expand_more'}</span>
                    <div class="badge badge-primary font-mono" style="padding:0.35rem 0.6rem;">Ch ${chap.chapterId}</div>
                    <div>
                      <div class="flex-row" style="gap:0.5rem;">
                        <strong style="font-size:0.88rem;">${escapeHtml(t(chap.title, chap.titleTamil))}</strong>
                        <span class="font-mono text-xs muted">${escapeHtml(chap.code)} • ${escapeHtml(chap.volume)}</span>
                      </div>
                      <div class="text-xs muted">${chap.completedTopics} of ${chap.totalTopics} subtopics taught • ${chap.teachingHours} lecture hours</div>
                    </div>
                  </div>
                  <span class="badge ${badgeClass}">
                    <span class="material-symbols-outlined" style="font-size:0.85rem;">${badgeIcon}</span>
                    <span>${badgeText}</span>
                  </span>
                </div>

                ${
                  isExpanded
                    ? `
                  <div style="border-top:1px solid var(--surface-container-low);padding:1rem 1.25rem;background:rgba(242,243,255,0.28);">
                    <div class="table-wrap">
                      <table class="data-table">
                        <thead>
                          <tr>
                            <th>Subtopic Code</th>
                            <th>Curricular Concept &amp; Description</th>
                            <th>Exam Weightage</th>
                            <th>Teaching Status</th>
                            <th>Exam Eligibility</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${chap.subtopics
                            .map((sub) => {
                              const eligible = sub.status === 'completed' || sub.status === 'revised';
                              return `
                              <tr>
                                <td class="font-mono" style="font-weight:700;color:var(--primary);">${escapeHtml(sub.id)}</td>
                                <td>
                                  <div style="font-weight:600;">${escapeHtml(t(sub.title, sub.titleTamil))}</div>
                                  <div class="text-xs muted">${sub.taughtDate ? `Taught on: ${escapeHtml(sub.taughtDate)}` : 'Not yet covered in class'} • ${sub.bookBackCount} Book-back Exercises</div>
                                </td>
                                <td><strong>${escapeHtml(sub.weightage)}</strong></td>
                                <td>
                                  <select
                                    class="select status-select status-${escapeHtml(sub.status)}"
                                    data-sub-chap="${chap.chapterId}"
                                    data-sub-id="${escapeHtml(sub.id)}"
                                    aria-label="Teaching status for ${escapeHtml(sub.id)}"
                                  >
                                    <option value="not_started" ${sub.status === 'not_started' ? 'selected' : ''}>Not Started</option>
                                    <option value="in_progress" ${sub.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                    <option value="completed" ${sub.status === 'completed' ? 'selected' : ''}>Completed</option>
                                    <option value="revised" ${sub.status === 'revised' ? 'selected' : ''}>Revised</option>
                                  </select>
                                </td>
                                <td>
                                  ${
                                    eligible
                                      ? `<span style="color:var(--secondary);font-weight:700;display:inline-flex;align-items:center;gap:0.25rem;"><span class="material-symbols-outlined" style="font-size:0.95rem;">check_circle</span>Included in Tests</span>`
                                      : `<span style="color:var(--error);font-weight:700;display:inline-flex;align-items:center;gap:0.25rem;"><span class="material-symbols-outlined" style="font-size:0.95rem;">lock</span>Progress-Locked</span>`
                                  }
                                </td>
                              </tr>
                            `;
                            })
                            .join('')}
                        </tbody>
                      </table>
                    </div>
                  </div>
                `
                    : ''
                }
              </div>
            `;
          })
          .join('')}
      </section>

      ${
        tpAuditModalOpen
          ? `
        <div id="tp-audit-backdrop" class="modal-backdrop">
          <div class="modal-card">
            <div class="flex-between" style="padding-bottom:0.65rem;border-bottom:1px solid var(--surface-container);">
              <div class="flex-row">
                <span class="material-symbols-outlined" style="color:var(--primary);">history</span>
                <h2 style="margin:0;font-size:1rem;font-weight:700;">Syllabus Lock &amp; Verification Audit Trail</h2>
              </div>
              <button type="button" id="btn-close-tp-audit" class="btn-ghost" style="padding:0.25rem;"><span class="material-symbols-outlined">close</span></button>
            </div>
            <div class="flex-col" style="margin-top:0.85rem;gap:0.6rem;">
              <div class="soft-panel flex-between text-xs">
                <div><strong>Master Lock Status</strong><div class="muted">Enforced for ${escapeHtml(appState.currentClass.name)}</div></div>
                <span class="badge ${appState.progressLockActive ? 'badge-secondary' : 'badge-error'}">${appState.progressLockActive ? 'ACTIVE' : 'PAUSED'}</span>
              </div>
              <div class="soft-panel text-xs">
                <strong>24 Oct 2024 • HOD Mathematics</strong>
                <div class="muted" style="margin-top:0.2rem;">Verified Chapters 1–3 &amp; 4.1–4.2 under TN-SCERT-2024-V2.1 baseline.</div>
              </div>
              <div class="soft-panel text-xs">
                <strong>18 Oct 2024 • K. Meenakshi Sundaram</strong>
                <div class="muted" style="margin-top:0.2rem;">Marked Subtopic 3.3 (Descartes Rule of Signs) as Completed.</div>
              </div>
            </div>
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;
}

function updateChapterRollup(chap) {
  const completedCount = chap.subtopics.filter((s) => s.status === 'completed' || s.status === 'revised').length;
  chap.completedTopics = completedCount;
  if (completedCount === chap.subtopics.length) chap.status = 'completed';
  else if (completedCount > 0) chap.status = 'partially_completed';
  else chap.status = 'not_started';
}

export function bindTeachingProgressEvents() {
  document.getElementById('btn-audit-history')?.addEventListener('click', () => {
    tpAuditModalOpen = true;
    triggerRender();
  });
  document.getElementById('btn-close-tp-audit')?.addEventListener('click', () => {
    tpAuditModalOpen = false;
    triggerRender();
  });
  document.getElementById('tp-audit-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'tp-audit-backdrop') {
      tpAuditModalOpen = false;
      triggerRender();
    }
  });

  document.getElementById('btn-toggle-master-lock')?.addEventListener('click', async () => {
    appState.progressLockActive = !appState.progressLockActive;
    await apiClient.toggleProgressLock({
      classId: appState.currentClass.id,
      lockActive: appState.progressLockActive,
      enrichmentPreviewAllowed: appState.enrichmentPreview
    });
    showToast(
      appState.progressLockActive
        ? 'Teaching Progress Lock ENFORCED. Untaught topics locked from AI test papers.'
        : 'Warning: Progress Lock disabled. Untaught topics may be included in tests.',
      appState.progressLockActive ? 'success' : 'warning'
    );
    triggerRender();
  });

  document.getElementById('btn-toggle-enrichment')?.addEventListener('click', async () => {
    appState.enrichmentPreview = !appState.enrichmentPreview;
    await apiClient.toggleProgressLock({
      classId: appState.currentClass.id,
      lockActive: appState.progressLockActive,
      enrichmentPreviewAllowed: appState.enrichmentPreview
    });
    showToast(
      appState.enrichmentPreview
        ? 'Enrichment Preview enabled with warning hazard badge'
        : 'Enrichment Preview disabled',
      'info'
    );
    triggerRender();
  });

  document.getElementById('btn-batch-complete')?.addEventListener('click', () => {
    const chap = appState.chapters.find((c) => c.chapterId === appState.expandedChapter);
    if (!chap) {
      showToast('Expand a chapter first to batch-mark its subtopics', 'info');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    chap.subtopics.forEach((s) => {
      s.status = 'completed';
      s.taughtDate = s.taughtDate || today;
    });
    updateChapterRollup(chap);
    showToast(`All subtopics in Chapter ${chap.chapterId} marked Completed`, 'success');
    triggerRender();
  });

  document.getElementById('btn-export-syllabus')?.addEventListener('click', () => {
    const rows = [['ChapterCode', 'ChapterTitle', 'SubtopicId', 'SubtopicTitle', 'Status', 'TaughtDate']];
    appState.chapters.forEach((c) => {
      c.subtopics.forEach((s) => {
        rows.push([c.code, `"${c.title}"`, s.id, `"${s.title}"`, s.status, s.taughtDate || '']);
      });
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `tn-syllabus-progress-${appState.currentClass.id}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Curricular Syllabus Exported as CSV', 'success');
  });

  document.querySelectorAll('[data-toggle-chapter]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = Number(el.getAttribute('data-toggle-chapter'));
      appState.expandedChapter = appState.expandedChapter === id ? null : id;
      triggerRender();
    });
  });

  document.querySelectorAll('[data-sub-id]').forEach((selectEl) => {
    selectEl.addEventListener('change', async (e) => {
      const chapId = Number(selectEl.getAttribute('data-sub-chap'));
      const subId = selectEl.getAttribute('data-sub-id');
      const newStatus = e.target.value;
      const chap = appState.chapters.find((c) => c.chapterId === chapId);
      const sub = chap?.subtopics.find((s) => s.id === subId);
      if (!sub) return;
      sub.status = newStatus;
      sub.taughtDate = newStatus === 'not_started' ? null : (sub.taughtDate || new Date().toISOString().split('T')[0]);
      updateChapterRollup(chap);
      await apiClient.updateSubtopicStatus({ classId: appState.currentClass.id, subtopicId: subId, newStatus });
      showToast(`Topic ${subId} status updated to: ${newStatus.replace('_', ' ').toUpperCase()}`, 'info');
      triggerRender();
    });
  });
}
