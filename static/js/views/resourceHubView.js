import { apiClient } from '../api/client.js';
import { RESOURCE_HUB_DATA } from '../data/mockData.js';
import { appState, escapeHtml, showToast, t, triggerRender } from '../state.js';

let rhState = {
  stream: 'academic',
  subject: 'all',
  medium: 'all',
  year: '2024-2025',
  drawerOpen: false,
  importModalOpen: false,
  importing: false
};

export function renderResourceHubView() {
  const filtered = appState.resources.filter((r) => {
    if (rhState.stream === 'vocational' && !r.type.includes('Vocational')) return false;
    if (rhState.stream === 'academic' && r.type.includes('Vocational')) return false;
    if (rhState.medium === 'ta' && !r.title.includes('Tamil') && !r.title.includes('தமிழ்') && !r.type.includes('Vocational')) return false;
    if (rhState.medium === 'en' && !r.title.includes('English') && !r.title.includes('March 2024') && !r.type.includes('Vocational')) return false;
    return true;
  });

  return `
    <div class="page-container">
      <header class="flex-between" style="align-items:flex-start;">
        <div style="max-width:44rem;">
          <div class="flex-row" style="margin-bottom:0.35rem;">
            <span class="badge badge-secondary"><span class="material-symbols-outlined fill" style="font-size:0.85rem;">verified</span>State Curricular Baseline</span>
            <span class="font-mono text-xs muted">DGE-TN-REG: 2024-HSC-REV</span>
          </div>
          <h1 class="page-title">${t('Verified Resource Hub — TN State Board Repository', 'அங்கீகரிக்கப்பட்ட பாடநூல் & வினாத்தாள் களஞ்சியம்')}</h1>
          <p class="page-subtitle">Official SCERT Textbooks, Question Banks, 5-Year Public Exam Archives &amp; Vocational Curriculum Manuals with differential version audit logs.</p>
        </div>

        <div class="flex-row" style="justify-content:flex-end;">
          <button type="button" id="btn-open-version-drawer" class="btn btn-surface">
            <span class="material-symbols-outlined" style="color:var(--primary);font-size:1.05rem;">difference</span>
            <span>Version Comparison</span>
          </button>
          <button type="button" id="btn-open-import-resource" class="btn btn-primary">
            <span class="material-symbols-outlined" style="font-size:1.05rem;">cloud_upload</span>
            <span>+ Import Document</span>
          </button>
        </div>
      </header>

      <aside class="soft-panel flex-between">
        <div class="flex-row" style="gap:0.75rem;flex-wrap:nowrap;">
          <div style="width:2.5rem;height:2.5rem;border-radius:0.75rem;background:var(--primary-fixed);color:var(--primary);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <span class="material-symbols-outlined fill">auto_awesome</span>
          </div>
          <div>
            <div class="flex-row" style="gap:0.4rem;">
              <strong style="font-size:0.72rem;color:var(--primary);text-transform:uppercase;">New Resource Detected</strong>
              <span class="font-mono text-xs muted">• Published 48h ago</span>
            </div>
            <div class="text-xs" style="margin-top:0.15rem;">
              Directorate of Government Examinations (DGE) <strong style="color:var(--primary);">March 2024 Public Examination Official Answer Keys &amp; Rubrics</strong> are now indexed and available for Paper Generator cross-referencing.
            </div>
          </div>
        </div>
        <button type="button" id="btn-banner-review" class="btn btn-primary">
          <span>Review &amp; Verify</span>
          <span class="material-symbols-outlined" style="font-size:1rem;">arrow_forward</span>
        </button>
      </aside>

      <section class="grid grid-4">
        <div class="card">
          <div class="flex-between text-xs muted"><strong>INDEXED QUESTION ASSETS</strong><span class="material-symbols-outlined" style="color:var(--primary);">format_list_numbered</span></div>
          <div class="flex-row" style="align-items:baseline;margin-top:0.5rem;"><span class="kpi-value">14,820</span><span class="text-xs" style="color:var(--secondary);font-weight:700;">+680 this term</span></div>
          <div class="progress-track" style="margin-top:0.75rem;"><div class="progress-fill" style="width:86%;background:var(--primary);"></div></div>
        </div>
        <div class="card">
          <div class="flex-between text-xs muted"><strong>OCR &amp; FORMULA FIDELITY</strong><span class="material-symbols-outlined" style="color:var(--secondary);">fact_check</span></div>
          <div class="flex-row" style="align-items:baseline;margin-top:0.5rem;"><span class="kpi-value">99.4%</span><span class="text-xs" style="color:var(--secondary);font-weight:700;">LaTeX Verified</span></div>
          <div class="progress-track" style="margin-top:0.75rem;"><div class="progress-fill" style="width:99.4%;background:var(--secondary);"></div></div>
        </div>
        <div class="card">
          <div class="flex-between text-xs muted"><strong>PUBLIC EXAM ARCHIVES</strong><span class="material-symbols-outlined" style="color:var(--tertiary);">history_edu</span></div>
          <div class="flex-row" style="align-items:baseline;margin-top:0.5rem;"><span class="kpi-value">5 Years</span><span class="text-xs muted">2019 — 2024 Series</span></div>
          <div class="progress-track" style="margin-top:0.75rem;"><div class="progress-fill" style="width:100%;background:var(--tertiary-container);"></div></div>
        </div>
        <div class="card">
          <div class="flex-between text-xs muted"><strong>AI GENERATION STATUS</strong><span class="material-symbols-outlined" style="color:var(--secondary);">verified_user</span></div>
          <div class="flex-row" style="align-items:baseline;margin-top:0.5rem;"><span class="kpi-value">100%</span><span class="text-xs" style="color:var(--secondary);font-weight:700;">TN Syllabus Aligned</span></div>
          <div class="progress-track" style="margin-top:0.75rem;"><div class="progress-fill" style="width:100%;background:var(--secondary);"></div></div>
        </div>
      </section>

      <section class="card grid grid-4">
        <div>
          <label class="field-label" for="rh-stream-select">Curricular Stream</label>
          <select id="rh-stream-select" class="select">
            <option value="all" ${rhState.stream === 'all' ? 'selected' : ''}>All Streams</option>
            <option value="academic" ${rhState.stream === 'academic' ? 'selected' : ''}>Academic (Sci / Com)</option>
            <option value="vocational" ${rhState.stream === 'vocational' ? 'selected' : ''}>Vocational Trades</option>
          </select>
        </div>
        <div>
          <label class="field-label" for="rh-subject-select">Class &amp; Subject</label>
          <select id="rh-subject-select" class="select">
            <option value="all" ${rhState.subject === 'all' ? 'selected' : ''}>Class 12 • All Subjects</option>
            <option value="maths" ${rhState.subject === 'maths' ? 'selected' : ''}>Class 12 • Mathematics (Vol 1 &amp; 2)</option>
            <option value="physics" ${rhState.subject === 'physics' ? 'selected' : ''}>Class 12 • Physics</option>
            <option value="chemistry" ${rhState.subject === 'chemistry' ? 'selected' : ''}>Class 12 • Chemistry</option>
            <option value="cs" ${rhState.subject === 'cs' ? 'selected' : ''}>Class 12 • Computer Science</option>
            <option value="ema" ${rhState.subject === 'ema' ? 'selected' : ''}>Class 12 • Electrical Machines</option>
          </select>
        </div>
        <div>
          <label class="field-label" for="rh-medium-select">Instruction Medium</label>
          <select id="rh-medium-select" class="select">
            <option value="all" ${rhState.medium === 'all' ? 'selected' : ''}>Bilingual (All)</option>
            <option value="ta" ${rhState.medium === 'ta' ? 'selected' : ''}>தமிழ் (Tamil)</option>
            <option value="en" ${rhState.medium === 'en' ? 'selected' : ''}>English</option>
          </select>
        </div>
        <div>
          <label class="field-label" for="rh-year-select">Baseline Year</label>
          <select id="rh-year-select" class="select">
            <option value="2024-2025" ${rhState.year === '2024-2025' ? 'selected' : ''}>2024–2025 Edition (Current HSC)</option>
            <option value="2023-2024" ${rhState.year === '2023-2024' ? 'selected' : ''}>2023–2024 Edition (Previous)</option>
            <option value="2022-2023" ${rhState.year === '2022-2023' ? 'selected' : ''}>2022–2023 Edition (Pre-Rationalization)</option>
          </select>
        </div>
      </section>

      <section class="grid grid-2">
        ${filtered
          .map(
            (res) => `
          <article class="card card-lg card-hover flex-col" style="gap:0.9rem;">
            <div class="flex-between">
              <div class="flex-row">
                <span class="badge badge-primary">${escapeHtml(res.type)}</span>
                <span class="font-mono text-xs muted">${escapeHtml(res.code)}</span>
              </div>
              <span class="badge badge-secondary">Allowed for AI Extraction</span>
            </div>

            <div class="flex-row" style="align-items:stretch;gap:0.9rem;flex-wrap:nowrap;">
              <div style="width:4.75rem;height:6.5rem;border-radius:0.75rem;background:linear-gradient(155deg,${res.badgeColor || '#3525cd'},#006b5f);color:#fff;padding:0.5rem;display:flex;flex-direction:column;justify-content:space-between;flex-shrink:0;">
                <span class="material-symbols-outlined" style="font-size:1.35rem;opacity:0.9;">menu_book</span>
                <span class="font-mono" style="font-size:0.65rem;font-weight:700;">SCERT</span>
              </div>
              <div class="flex-col" style="justify-content:space-between;flex:1;">
                <div>
                  <h3 style="margin:0;font-size:0.92rem;font-weight:700;line-height:1.35;">${escapeHtml(t(res.title, res.titleTamil))}</h3>
                  <div class="text-xs muted" style="margin-top:0.25rem;">${escapeHtml(res.publisher)}</div>
                </div>
                <div class="font-mono text-xs muted">${res.chaptersCount} Chapters • ${res.totalPages} Pages • ${escapeHtml(res.fileSize)}</div>
              </div>
            </div>

            <div class="soft-panel flex-between text-xs" style="padding:0.55rem 0.75rem;">
              <span style="color:var(--secondary);font-weight:700;display:inline-flex;align-items:center;gap:0.35rem;">
                <span class="material-symbols-outlined" style="font-size:1rem;">fact_check</span>
                ${escapeHtml(res.ocrStatus)}
              </span>
              <span class="font-mono muted">${res.confidence}% Confidence</span>
            </div>

            <div class="flex-between" style="padding-top:0.5rem;border-top:1px solid var(--surface-container);">
              <button type="button" class="btn btn-ghost" style="color:var(--primary);padding-left:0;" data-preview-res="${escapeHtml(res.code)}">
                <span class="material-symbols-outlined" style="font-size:1rem;">visibility</span>
                <span>Preview Document &amp; OCR</span>
              </button>
              <button type="button" class="btn btn-surface" data-download-res="${escapeHtml(res.code)}">
                <span class="material-symbols-outlined" style="font-size:1rem;">download</span>
                <span>Download PDF</span>
              </button>
            </div>
          </article>
        `
          )
          .join('')}
      </section>

      ${
        rhState.drawerOpen
          ? `
        <div id="version-drawer-backdrop" class="drawer-backdrop">
          <div class="drawer-panel">
            <div>
              <div class="flex-between" style="padding-bottom:0.85rem;border-bottom:1px solid var(--surface-container);">
                <div class="flex-row">
                  <span class="material-symbols-outlined" style="color:var(--primary);font-size:1.45rem;">difference</span>
                  <div>
                    <h2 style="margin:0;font-size:1rem;font-weight:700;">Curricular Version Comparison</h2>
                    <div class="font-mono text-xs muted">${escapeHtml(RESOURCE_HUB_DATA.versionDiff.baseEdition)} vs ${escapeHtml(RESOURCE_HUB_DATA.versionDiff.currentEdition)}</div>
                  </div>
                </div>
                <button type="button" id="btn-close-drawer" class="btn-ghost" style="padding:0.35rem;border-radius:0.5rem;">
                  <span class="material-symbols-outlined">close</span>
                </button>
              </div>

              <div class="soft-panel flex-between text-xs" style="margin-top:0.9rem;">
                <span>Audited By: <strong>${escapeHtml(RESOURCE_HUB_DATA.versionDiff.auditedBy)}</strong></span>
                <span>Date: ${escapeHtml(RESOURCE_HUB_DATA.versionDiff.lastAuditedDate)}</span>
              </div>

              <div class="flex-col" style="margin-top:1.1rem;gap:0.75rem;">
                <div class="nav-section-label">Identified Curricular Topic Differentials</div>
                ${RESOURCE_HUB_DATA.versionDiff.changes
                  .map(
                    (diff) => `
                  <div class="card" style="padding:0.9rem;">
                    <div class="flex-between" style="margin-bottom:0.35rem;">
                      <span class="badge ${diff.type === 'removed' ? 'badge-error' : diff.type === 'added' ? 'badge-secondary' : 'badge-tertiary'}">${diff.type.toUpperCase()}</span>
                      <span class="font-mono text-xs muted">${escapeHtml(diff.chapter)}</span>
                    </div>
                    <div class="text-xs" style="font-weight:700;">${escapeHtml(diff.topic)}</div>
                    <div class="text-xs muted" style="margin-top:0.35rem;line-height:1.45;">
                      <strong style="color:var(--secondary);">Pedagogical Rationale: </strong>${escapeHtml(diff.rationale)}
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>

            <div style="padding-top:1rem;border-top:1px solid var(--surface-container);text-align:right;">
              <button type="button" id="btn-close-drawer-footer" class="btn btn-primary">Close Inspector</button>
            </div>
          </div>
        </div>
      `
          : ''
      }

      ${
        rhState.importModalOpen
          ? `
        <div id="import-res-backdrop" class="modal-backdrop">
          <div class="modal-card">
            <div class="flex-between" style="padding-bottom:0.65rem;border-bottom:1px solid var(--surface-container);">
              <div class="flex-row">
                <span class="material-symbols-outlined" style="color:var(--primary);">cloud_upload</span>
                <h2 style="margin:0;font-size:1rem;font-weight:700;">Import Curricular Document / Exam Paper</h2>
              </div>
              <button type="button" id="btn-close-import-res" class="btn-ghost" style="padding:0.25rem;">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form id="form-import-resource" class="flex-col" style="margin-top:0.9rem;gap:0.85rem;">
              <div>
                <label class="field-label">Document Title</label>
                <input id="imp-res-title" required class="input" value="DGE Model Examination Question Paper March 2024" />
              </div>
              <div class="grid grid-2" style="gap:0.75rem;">
                <div>
                  <label class="field-label">Document Type</label>
                  <select id="imp-res-type" class="select">
                    <option>Public Examination Paper</option>
                    <option>SCERT Model Paper</option>
                    <option>Official Answer Key &amp; Rubrics</option>
                    <option>Vocational Trade Manual</option>
                  </select>
                </div>
                <div>
                  <label class="field-label">Medium</label>
                  <select id="imp-res-medium" class="select">
                    <option>Bilingual (Tamil &amp; English)</option>
                    <option>Tamil Medium</option>
                    <option>English Medium</option>
                  </select>
                </div>
              </div>
              <div class="soft-panel" style="border:2px dashed var(--outline-variant);text-align:center;padding:1.25rem;">
                <span class="material-symbols-outlined" style="color:var(--primary);font-size:2rem;">picture_as_pdf</span>
                <div class="text-xs" style="font-weight:700;margin-top:0.25rem;">Select PDF or Scanned Images</div>
                <div class="text-xs muted">Supports PDF up to 100MB with bilingual OCR engine</div>
              </div>
              <div class="badge badge-secondary" style="padding:0.6rem 0.75rem;border-radius:0.75rem;white-space:normal;">
                <span class="material-symbols-outlined fill" style="font-size:1rem;">verified</span>
                <span>Automatic formula extraction and stepwise question detection will execute immediately.</span>
              </div>
              <div class="flex-row" style="justify-content:flex-end;">
                <button type="button" id="btn-cancel-import-res" class="btn btn-surface">Cancel</button>
                <button type="submit" class="btn btn-primary" ${rhState.importing ? 'disabled' : ''}>
                  ${rhState.importing ? '<span class="spinner"></span>' : ''}
                  <span>${rhState.importing ? 'Processing OCR...' : 'Start Ingestion'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;
}

export function bindResourceHubEvents() {
  document.getElementById('rh-stream-select')?.addEventListener('change', (e) => {
    rhState.stream = e.target.value;
    triggerRender();
  });
  document.getElementById('rh-subject-select')?.addEventListener('change', (e) => {
    rhState.subject = e.target.value;
    triggerRender();
  });
  document.getElementById('rh-medium-select')?.addEventListener('change', (e) => {
    rhState.medium = e.target.value;
    triggerRender();
  });
  document.getElementById('rh-year-select')?.addEventListener('change', (e) => {
    rhState.year = e.target.value;
    triggerRender();
  });

  document.getElementById('btn-open-version-drawer')?.addEventListener('click', () => {
    rhState.drawerOpen = true;
    triggerRender();
  });
  document.getElementById('btn-banner-review')?.addEventListener('click', () => {
    rhState.drawerOpen = true;
    triggerRender();
  });
  document.getElementById('btn-close-drawer')?.addEventListener('click', () => {
    rhState.drawerOpen = false;
    triggerRender();
  });
  document.getElementById('btn-close-drawer-footer')?.addEventListener('click', () => {
    rhState.drawerOpen = false;
    triggerRender();
  });
  document.getElementById('version-drawer-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'version-drawer-backdrop') {
      rhState.drawerOpen = false;
      triggerRender();
    }
  });

  document.getElementById('btn-open-import-resource')?.addEventListener('click', () => {
    rhState.importModalOpen = true;
    triggerRender();
  });
  document.getElementById('btn-close-import-res')?.addEventListener('click', () => {
    rhState.importModalOpen = false;
    triggerRender();
  });
  document.getElementById('btn-cancel-import-res')?.addEventListener('click', () => {
    rhState.importModalOpen = false;
    triggerRender();
  });
  document.getElementById('import-res-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'import-res-backdrop') {
      rhState.importModalOpen = false;
      triggerRender();
    }
  });

  document.getElementById('form-import-resource')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('imp-res-title')?.value?.trim() || 'Imported Document';
    const type = document.getElementById('imp-res-type')?.value || 'SCERT Model Paper';
    const medium = document.getElementById('imp-res-medium')?.value || 'Bilingual (Tamil & English)';
    rhState.importing = true;
    triggerRender();
    showToast('Uploading document to OCR engine...', 'info');
    await apiClient.importResource({ title, type, medium });
    setTimeout(() => {
      appState.resources.unshift({
        id: `res-imp-${Date.now().toString().slice(-4)}`,
        title,
        titleTamil: title,
        type,
        code: `TN-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
        edition: '2024–25 Imported',
        publisher: 'School Curricular Upload (OCR Verified)',
        chaptersCount: 5,
        totalPages: 24,
        fileSize: '4.8 MB',
        ocrStatus: 'OCR Completed (99.1%)',
        confidence: 99.1,
        allowedForAI: true,
        badgeColor: '#3525cd'
      });
      rhState.importing = false;
      rhState.importModalOpen = false;
      showToast('Document OCR Complete! 34 new questions indexed into Question Bank.', 'success');
      triggerRender();
    }, 700);
  });

  document.querySelectorAll('[data-preview-res]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast(`Opening interactive reader for ${btn.getAttribute('data-preview-res')}`, 'info');
    });
  });

  document.querySelectorAll('[data-download-res]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast('Downloading verified source from TN SCERT repository', 'success');
    });
  });
}
