import { apiClient } from '../api/client.js';
import { RESOURCE_HUB_DATA } from '../data/mockData.js';
import { appState, showToast, t, triggerRender } from '../state.js';
import { cloneTemplate, qs, setText, setVisible } from '../utils/dom.js';

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
  const root = cloneTemplate('tpl-resource-hub');

  const filtered = appState.resources.filter((r) => {
    if (rhState.stream === 'vocational' && !r.type.includes('Vocational')) return false;
    if (rhState.stream === 'academic' && r.type.includes('Vocational')) return false;
    if (rhState.medium === 'ta' && !r.title.includes('Tamil') && !r.title.includes('தமிழ்') && !r.type.includes('Vocational')) return false;
    if (rhState.medium === 'en' && !r.title.includes('English') && !r.title.includes('March 2024') && !r.type.includes('Vocational')) return false;
    return true;
  });

  setText(root, '[data-el="rh-title"]', t('Verified Resource Hub — TN State Board Repository', 'அங்கீகரிக்கப்பட்ட பாடநூல் & வினாத்தாள் களஞ்சியம்'));

  qs(root, '#rh-stream-select').value = rhState.stream;
  qs(root, '#rh-subject-select').value = rhState.subject;
  qs(root, '#rh-medium-select').value = rhState.medium;
  qs(root, '#rh-year-select').value = rhState.year;

  const cardsGrid = qs(root, '[data-el="rh-cards-grid"]');
  filtered.forEach((res) => {
    const card = cloneTemplate('tpl-rh-card');
    setText(card, '[data-el="res-type"]', res.type);
    setText(card, '[data-el="res-code"]', res.code);
    const cover = qs(card, '[data-el="res-cover"]');
    if (cover) cover.style.background = `linear-gradient(155deg,${res.badgeColor || '#3525cd'},#006b5f)`;
    setText(card, '[data-el="res-title"]', t(res.title, res.titleTamil));
    setText(card, '[data-el="res-publisher"]', res.publisher);
    setText(card, '[data-el="res-stats"]', `${res.chaptersCount} Chapters • ${res.totalPages} Pages • ${res.fileSize}`);
    setText(card, '[data-el="res-ocr-status"]', res.ocrStatus);
    setText(card, '[data-el="res-confidence"]', `${res.confidence}% Confidence`);
    qs(card, '[data-el="btn-preview"]')?.setAttribute('data-preview-res', res.code);
    qs(card, '[data-el="btn-download"]')?.setAttribute('data-download-res', res.code);
    cardsGrid.appendChild(card);
  });

  setVisible(root, '#version-drawer-backdrop', rhState.drawerOpen);
  setText(root, '[data-el="drawer-editions"]', `${RESOURCE_HUB_DATA.versionDiff.baseEdition} vs ${RESOURCE_HUB_DATA.versionDiff.currentEdition}`);
  setText(root, '[data-el="drawer-auditor"]', RESOURCE_HUB_DATA.versionDiff.auditedBy);
  setText(root, '[data-el="drawer-date"]', `Date: ${RESOURCE_HUB_DATA.versionDiff.lastAuditedDate}`);

  const diffsWrap = qs(root, '[data-el="drawer-diffs"]');
  RESOURCE_HUB_DATA.versionDiff.changes.forEach((diff) => {
    const dc = cloneTemplate('tpl-rh-diff-card');
    const dt = qs(dc, '[data-el="diff-type"]');
    if (dt) {
      dt.className = `badge ${diff.type === 'removed' ? 'badge-error' : diff.type === 'added' ? 'badge-secondary' : 'badge-tertiary'}`;
      dt.textContent = diff.type.toUpperCase();
    }
    setText(dc, '[data-el="diff-chapter"]', diff.chapter);
    setText(dc, '[data-el="diff-topic"]', diff.topic);
    setText(dc, '[data-el="diff-rationale"]', diff.rationale);
    diffsWrap.appendChild(dc);
  });

  setVisible(root, '#import-res-backdrop', rhState.importModalOpen);
  const submitBtn = qs(root, '[data-el="imp-submit-btn"]');
  if (submitBtn) submitBtn.disabled = Boolean(rhState.importing);
  setVisible(root, '[data-el="imp-spinner"]', rhState.importing);
  setText(root, '[data-el="imp-submit-label"]', rhState.importing ? 'Executing OCR & Formula Tagging...' : 'Start Ingestion');

  return root;
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
