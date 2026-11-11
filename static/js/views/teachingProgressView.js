import { apiClient } from '../api/client.js';
import { appState, showToast, t, triggerRender } from '../state.js';
import { cloneTemplate, qs, setText, setVisible } from '../utils/dom.js';

let tpAuditModalOpen = false;

export function renderTeachingProgressView() {
  const root = cloneTemplate('tpl-teaching-progress');
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

  setText(root, '[data-el="tp-title"]', t('Teaching Progress & Assessment Lock', 'கற்பித்தல் முன்னேற்றம் & தேர்வுப் பூட்டு'));
  const ruleBadge = qs(root, '[data-el="tp-rule-badge"]');
  if (ruleBadge) ruleBadge.className = `badge ${appState.progressLockActive ? 'badge-error' : 'badge-neutral'}`;
  setText(root, '[data-el="tp-rule-icon"]', appState.progressLockActive ? 'shield_lock' : 'lock_open');
  setText(root, '[data-el="tp-rule-text"]', appState.progressLockActive ? 'RULE 1 ENFORCED' : 'LOCK PAUSED');
  setText(root, '[data-el="tp-class-label"]', `${appState.currentClass.name} Mathematics (Volume 1 & 2)`);

  setText(root, '[data-el="hero-lock-icon"]', appState.progressLockActive ? 'lock' : 'lock_open');
  setText(root, '[data-el="hero-lock-heading"]', appState.progressLockActive ? 'TEACHING PROGRESS LOCK IS CURRENTLY ACTIVE' : 'TEACHING PROGRESS LOCK IS PAUSED');

  const masterBtn = qs(root, '#btn-toggle-master-lock');
  if (masterBtn) {
    masterBtn.textContent = appState.progressLockActive ? 'LOCKED ON' : 'DISABLED';
    masterBtn.style.background = appState.progressLockActive ? 'var(--secondary-fixed)' : 'rgba(255,255,255,0.25)';
    masterBtn.style.color = appState.progressLockActive ? 'var(--on-secondary-fixed)' : '#fff';
  }

  const enrichBtn = qs(root, '#btn-toggle-enrichment');
  if (enrichBtn) {
    enrichBtn.textContent = appState.enrichmentPreview ? 'ALLOW HOTS' : 'BLOCKED';
    enrichBtn.style.background = appState.enrichmentPreview ? 'var(--tertiary-fixed)' : 'rgba(255,255,255,0.25)';
    enrichBtn.style.color = appState.enrichmentPreview ? 'var(--on-tertiary-fixed)' : '#fff';
  }

  setText(root, '[data-el="kpi-chapters"]', String(chapters.length));
  setText(root, '[data-el="kpi-taught"]', String(taughtSubtopics));
  setText(root, '[data-el="kpi-taught-sub"]', `of ${totalSubtopics} Topics`);
  const taughtBar = qs(root, '[data-el="kpi-taught-bar"]');
  if (taughtBar) taughtBar.style.width = `${taughtPct}%`;

  setText(root, '[data-el="kpi-progress"]', String(inProgressSubtopics));
  const progBar = qs(root, '[data-el="kpi-progress-bar"]');
  if (progBar) progBar.style.width = `${inProgressPct}%`;

  setText(root, '[data-el="kpi-locked"]', String(lockedSubtopics));
  const lockBar = qs(root, '[data-el="kpi-locked-bar"]');
  if (lockBar) lockBar.style.width = `${lockedPct}%`;

  const chapList = qs(root, '[data-el="chapters-list"]');
  chapters.forEach((chap) => {
    const chapCard = cloneTemplate('tpl-tp-chapter');
    const isExpanded = appState.expandedChapter === chap.chapterId;
    const isTaught = chap.status === 'completed';
    const isPartial = chap.status === 'partially_completed';

    qs(chapCard, '[data-el="chap-header"]')?.setAttribute('data-toggle-chapter', String(chap.chapterId));
    setText(chapCard, '[data-el="chap-chevron"]', isExpanded ? 'expand_less' : 'expand_more');
    setText(chapCard, '[data-el="chap-num"]', `Ch ${chap.chapterId}`);
    setText(chapCard, '[data-el="chap-title"]', t(chap.title, chap.titleTamil));
    setText(chapCard, '[data-el="chap-meta"]', `${chap.code} • ${chap.volume}`);
    setText(chapCard, '[data-el="chap-sub"]', `${chap.completedTopics} of ${chap.totalTopics} subtopics taught • ${chap.teachingHours} lecture hours`);

    const badge = qs(chapCard, '[data-el="chap-badge"]');
    if (badge) badge.className = `badge ${isTaught ? 'badge-secondary' : isPartial ? 'badge-tertiary' : 'badge-error'}`;
    setText(chapCard, '[data-el="chap-badge-icon"]', isTaught ? 'check_circle' : isPartial ? 'pending' : 'lock');
    setText(chapCard, '[data-el="chap-badge-text"]', isTaught ? 'Fully Taught (Unlocked)' : isPartial ? 'In Progress (Partial Lock)' : 'Untaught (Locked from Tests)');

    setVisible(chapCard, '[data-el="chap-body"]', isExpanded);
    if (isExpanded) {
      const tbody = qs(chapCard, '[data-el="subtopics-tbody"]');
      chap.subtopics.forEach((sub) => {
        const row = cloneTemplate('tpl-tp-subtopic-row');
        const eligible = sub.status === 'completed' || sub.status === 'revised';
        setText(row, '[data-el="sub-id"]', sub.id);
        setText(row, '[data-el="sub-title"]', t(sub.title, sub.titleTamil));
        setText(row, '[data-el="sub-meta"]', `${sub.taughtDate ? `Taught on: ${sub.taughtDate}` : 'Not yet covered in class'} • ${sub.bookBackCount} Book-back Exercises`);
        setText(row, '[data-el="sub-weightage"]', sub.weightage);

        const selectEl = qs(row, '[data-el="sub-status-select"]');
        if (selectEl) {
          selectEl.className = `select status-select status-${sub.status}`;
          selectEl.setAttribute('data-sub-chap', String(chap.chapterId));
          selectEl.setAttribute('data-sub-id', sub.id);
          selectEl.setAttribute('aria-label', `Teaching status for ${sub.id}`);
          selectEl.value = sub.status;
        }

        const eligEl = qs(row, '[data-el="sub-elig"]');
        if (eligEl) eligEl.style.color = eligible ? 'var(--secondary)' : 'var(--error)';
        setText(row, '[data-el="sub-elig-icon"]', eligible ? 'check_circle' : 'lock');
        setText(row, '[data-el="sub-elig-text"]', eligible ? 'Included in Tests' : 'Progress-Locked');

        tbody.appendChild(row);
      });
    }
    chapList.appendChild(chapCard);
  });

  setVisible(root, '#tp-audit-backdrop', tpAuditModalOpen);
  setText(root, '[data-el="audit-class-line"]', `Enforced for ${appState.currentClass.name}`);
  const auditBadge = qs(root, '[data-el="audit-lock-badge"]');
  if (auditBadge) {
    auditBadge.className = `badge ${appState.progressLockActive ? 'badge-secondary' : 'badge-error'}`;
    auditBadge.textContent = appState.progressLockActive ? 'ACTIVE' : 'PAUSED';
  }

  return root;
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
