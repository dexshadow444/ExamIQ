import { SCHOOL_DATA } from '../data/mockData.js';
import {
  appState,
  escapeHtml,
  setActiveTab,
  t,
  triggerRender
} from '../state.js';

export const NAV_ITEMS = [
  { id: 'dashboard', icon: 'dashboard', labelEn: 'Dashboard', labelTa: 'முகப்பு பலகை' },
  { id: 'teaching-progress', icon: 'fact_check', labelEn: 'Teaching Progress', labelTa: 'கற்பித்தல் முன்னேற்றம்', badgeType: 'lock' },
  { id: 'resource-hub', icon: 'menu_book', labelEn: 'Resource Hub', labelTa: 'கல்வி வளங்கள்' },
  { id: 'question-bank', icon: 'inventory_2', labelEn: 'Question Bank', labelTa: 'வினா வங்கி', badgeText: 'HOTS', badgeClass: 'badge-neutral' },
  { id: 'paper-generator', icon: 'auto_awesome', labelEn: 'Paper Generator', labelTa: 'வினாத்தாள் உருவாக்கம்', badgeText: 'AI Hero', badgeClass: 'badge-primary' },
  { id: 'tests-and-assessments', icon: 'assignment', labelEn: 'Tests & Assessments', labelTa: 'தேர்வுகள் & மதிப்பீடுகள்' },
  { id: 'answer-evaluation', icon: 'rule', labelEn: 'Answer Evaluation', labelTa: 'விடைத்தாள் மதிப்பீடு', badgeText: '12 Pending', badgeClass: 'badge-tertiary' },
  { id: 'marks-management', icon: 'grade', labelEn: 'Marks Management', labelTa: 'மதிப்பெண் மேலாண்மை' },
  { id: 'student-insights', icon: 'psychology', labelEn: 'Student Learning DNA', labelTa: 'மாணவர் கற்றல் நுண்ணறிவு' },
  { id: 'remedial-and-homework', icon: 'assignment_late', labelEn: 'Remedial & Homework', labelTa: 'கூடுதல் கற்றல்' },
  { id: 'vocational-module', icon: 'precision_manufacturing', labelEn: 'Vocational Module', labelTa: 'தொழிற்கல்வி பிரிவு' },
  { id: 'reports-center', icon: 'monitoring', labelEn: 'Reports Center', labelTa: 'அறிக்கைகள் மையம்' },
  { id: 'admin-and-security', icon: 'admin_panel_settings', labelEn: 'Admin & Security', labelTa: 'நிர்வாகம் & பாதுகாப்பு' },
  { id: 'api-explorer', icon: 'api', labelEn: 'Backend API Explorer', labelTa: 'API விவரங்கள்', badgeText: 'API Spec', badgeClass: 'badge-secondary' }
];

function renderNavBadge(item) {
  if (item.badgeType === 'lock') {
    if (appState.progressLockActive) {
      return `<span class="badge badge-error" style="font-size:0.62rem;padding:0.12rem 0.45rem;"><span class="material-symbols-outlined" style="font-size:0.75rem;">lock</span>LOCK ON</span>`;
    }
    return `<span class="badge badge-neutral" style="font-size:0.62rem;padding:0.12rem 0.45rem;">LOCK OFF</span>`;
  }
  if (item.badgeText) {
    return `<span class="badge ${item.badgeClass}" style="font-size:0.62rem;padding:0.12rem 0.45rem;">${escapeHtml(item.badgeText)}</span>`;
  }
  return '';
}

export function renderSidebar() {
  return `
    <div id="sidebar-backdrop" class="sidebar-backdrop ${appState.mobileSidebarOpen ? 'open' : ''}"></div>
    <aside class="sidebar ${appState.mobileSidebarOpen ? 'open' : ''}">
      <div>
        <div class="sidebar-brand">
          <div class="brand-logo-box">IQ</div>
          <div style="min-width:0;">
            <div class="brand-title">JM Vertex ExamIQ</div>
            <div class="brand-subtitle">TN State Board Cl. 12</div>
          </div>
        </div>

        <div class="sidebar-class-box">
          <div class="class-selector-pill">
            <div class="flex-row" style="gap:0.35rem;flex-wrap:nowrap;min-width:0;">
              <span class="material-symbols-outlined" style="color:var(--secondary);font-size:1.1rem;">school</span>
              <select id="sidebar-class-select" class="class-select" aria-label="Select active class">
                ${SCHOOL_DATA.classes
                  .map(
                    (c) => `<option value="${escapeHtml(c.id)}" ${c.id === appState.currentClass.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
                  )
                  .join('')}
              </select>
            </div>
            <span class="ay-badge">${escapeHtml(SCHOOL_DATA.academicYear)}</span>
          </div>
        </div>

        <nav class="sidebar-nav" aria-label="Main navigation">
          <div class="nav-section-label">${t('Modules & Workspace', 'பகுதிகள் மற்றும் பணியிடம்')}</div>
          ${NAV_ITEMS.map(
            (item) => `
              <button
                type="button"
                class="nav-item ${appState.activeTab === item.id ? 'active' : ''}"
                data-nav-tab="${escapeHtml(item.id)}"
              >
                <span class="nav-item-left">
                  <span class="material-symbols-outlined" style="font-size:1.1rem;">${item.icon}</span>
                  <span class="nav-item-label">${escapeHtml(t(item.labelEn, item.labelTa))}</span>
                </span>
                ${renderNavBadge(item)}
              </button>
            `
          ).join('')}
        </nav>
      </div>

      <div class="sidebar-footer">
        <div class="flex-between">
          <div class="flex-row" style="gap:0.3rem;color:var(--secondary);font-size:0.74rem;font-weight:700;">
            <span class="material-symbols-outlined" style="font-size:0.95rem;">verified</span>
            <span>${t('TN Curricular Engine', 'தமிழ்நாடு பாடத்திட்ட அமைப்பு')}</span>
          </div>
          <span class="badge badge-secondary font-mono" style="font-size:0.62rem;">${escapeHtml(appState.apiMode.toUpperCase())}</span>
        </div>
        <p class="text-xs muted" style="margin:0;line-height:1.35;">
          ${t(
            'HSC 2024–25 Rules Engine Active. Dual-medium OCR enabled.',
            'HSC 2024–25 விதிமுறை அமைப்பு இயங்குகிறது. தமிழ் மற்றும் ஆங்கில OCR செயல்பாட்டில் உள்ளது.'
          )}
        </p>
        <button id="btn-signout" type="button" class="btn-signout">
          <span class="material-symbols-outlined" style="font-size:0.95rem;">logout</span>
          <span>${t('Switch School / Sign Out', 'பள்ளியை மாற்று / வெளியேறு')}</span>
        </button>
      </div>
    </aside>
  `;
}

export function bindSidebarEvents() {
  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      appState.mobileSidebarOpen = false;
      triggerRender();
    });
  }

  const classSelect = document.getElementById('sidebar-class-select');
  if (classSelect) {
    classSelect.addEventListener('change', (e) => {
      const found = SCHOOL_DATA.classes.find((c) => c.id === e.target.value);
      if (found) {
        appState.currentClass = found;
        triggerRender();
      }
    });
  }

  document.querySelectorAll('[data-nav-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveTab(btn.getAttribute('data-nav-tab'));
    });
  });

  const signoutBtn = document.getElementById('btn-signout');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', () => {
      appState.isLoggedIn = false;
      triggerRender();
    });
  }
}
