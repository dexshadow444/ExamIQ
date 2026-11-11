import { apiClient } from '../api/client.js';
import { appState, escapeHtml, showToast, t, triggerRender } from '../state.js';

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
  const lockedPct = totalSubtopics ? Math.round((lockedSubtopics / totalSubtopics) * 100) : 0;

  return `
    <div class="page-container">
      <div class="flex-between">
        <div class="flex-row text-xs muted" style="gap:0.4rem;">
          <span class="material-symbols-outlined" style="font-size:0.95rem;">menu_book</span>
          <span>Syllabus Management</span>
          <span>/</span>
          <strong style="color:var(--primary);display:inline-flex;align-items:center;gap:0.25rem;">
            <span class="material-symbols-outlined" style="font-size:0.95rem;">lock_clock</span>
            Teaching Progress Lock
          </strong>
        </div>
        <div class="flex-row">
          <div class="badge badge-neutral" style="padding:0.35rem 0.75rem;">
            <span style="width:0.5rem;height:0.5rem;border-radius:50%;background:var(--secondary);"></span>
            <span>AI Exam Engine Sync: <strong style="color:var(--secondary);">${appState.progressLockActive ? 'Strict Guard Active' : 'Unrestricted'}</strong></span>
          </div>
          <button type="button" id="btn-audit-history" class="btn btn-ghost">
            <span class="material-symbols-outlined" style="font-size:1rem;">history</span>
            <span>Audit History</span>
          </button>
        </div>
      </div>

      <header class="flex-between">
        <div>
          <div class="flex-row">
            <h1 class="page-title">${t('Teaching Progress & Assessment Lock', 'கற்பித்தல் முன்னேற்றம் & தேர்வுப் பூட்டு')}</h1>
            <span class="badge badge-error"><span class="material-symbols-outlined" style="font-size:0.85rem;">shield_lock</span>RULE 1 ENFORCED</span>
          </div>
          <p class="page-subtitle">
            Tamil Nadu State Board • <strong>Class 12 Mathematics (Volume 1 &amp; 2)</strong> • Academic Year 2024–25 • <span style="color:var(--secondary);font-weight:600;">வகுப்பு 12 கணிதம்</span>
          </p>
        </div>

        <div class="flex-row">
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
          <div class="progress-track" style="margin-top:0.75rem;"><div class="progress-fill" style="width:40%;background:var(--tertiary-container);"></div></div>
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
          <span class="text-xs muted">Click status pills below to update teaching state in real-time</span>
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
                                  <div class="segmented-pill" style="border-radius:0.55rem;">
                                    ${['not_started', 'in_progress', 'completed', 'revised']
                                      .map((st) => {
                                        const labels = { not_started: 'Not Started', in_progress: 'In Progress', completed: 'Completed', revised: 'Revised' };
                                        const active = sub.status === st;
                                        const activeStyle = active
                                          ? st === 'not_started'
                                            ? 'background:#fff;color:var(--error);font-weight:700;'
                                            : st === 'in_progress'
                                            ? 'background:var(--tertiary-fixed);color:var(--on-tertiary-fixed);font-weight:700;'
                                            : st === 'completed'
                                            ? 'background:var(--secondary-fixed);color:var(--on-secondary-fixed);font-weight:700;'
                                            : 'background:var(--primary-fixed);color:var(--on-primary-fixed);font-weight:700;'
                                          : '';
                                        return `<button type="button" class="segmented-btn" style="border-radius:0.4rem;font-size:0.69rem;padding:0.25rem 0.5rem;${activeStyle}" data-sub-chap="${chap.chapterId}" data-sub-id="${escapeHtml(sub.id)}" data-sub-status="${st}">${labels[st]}</button>`;
                                      })
                                      .join('')}
                                  </div>
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
    showToast('Displaying full syllabus audit history', 'info');
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
    link.href = URL.createObjectURL(blob);
    link.download = `tn-syllabus-progress-${appState.currentClass.id}.csv`;
    link.click();
    showToast('Curricular Syllabus Exported as CSV', 'success');
  });

  document.querySelectorAll('[data-toggle-chapter]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = Number(el.getAttribute('data-toggle-chapter'));
      appState.expandedChapter = appState.expandedChapter === id ? null : id;
      triggerRender();
    });
  });

  document.querySelectorAll('[data-sub-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const chapId = Number(btn.getAttribute('data-sub-chap'));
      const subId = btn.getAttribute('data-sub-id');
      const newStatus = btn.getAttribute('data-sub-status');
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
