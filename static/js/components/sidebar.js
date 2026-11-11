import { SCHOOL_DATA } from '../data/mockData.js';
import {
  appState,
  escapeHtml,
  setActiveTab,
  t,
  triggerRender
} from '../state.js';

export const DASHBOARD_ITEM = {
  id: 'dashboard',
  icon: 'dashboard',
  labelEn: 'Dashboard',
  labelTa: 'முகப்பு பலகை'
};

export const NAV_GROUPS = [
  {
    key: 'curriculum',
    icon: 'menu_book',
    labelEn: 'Curriculum & Content',
    labelTa: 'பாடத்திட்டம் & வளங்கள்',
    items: [
      { id: 'teaching-progress', icon: 'fact_check', labelEn: 'Teaching Progress', labelTa: 'கற்பித்தல் முன்னேற்றம்', badgeType: 'lock' },
      { id: 'resource-hub', icon: 'library_books', labelEn: 'Resource Hub', labelTa: 'கல்வி வளங்கள்' },
      { id: 'question-bank', icon: 'inventory_2', labelEn: 'Question Bank', labelTa: 'வினா வங்கி' }
    ]
  },
  {
    key: 'exams',
    icon: 'assignment',
    labelEn: 'Exams & Grading',
    labelTa: 'தேர்வுகள் & மதிப்பீடு',
    items: [
      { id: 'paper-generator', icon: 'auto_awesome', labelEn: 'Paper Generator', labelTa: 'வினாத்தாள் உருவாக்கம்' },
      { id: 'tests-and-assessments', icon: 'quiz', labelEn: 'Tests & Assessments', labelTa: 'தேர்வுகள் & மதிப்பீடுகள்' },
      { id: 'answer-evaluation', icon: 'rule', labelEn: 'Answer Evaluation', labelTa: 'விடைத்தாள் மதிப்பீடு', badgeType: 'pending' },
      { id: 'marks-management', icon: 'grade', labelEn: 'Marks Management', labelTa: 'மதிப்பெண் மேலாண்மை' }
    ]
  },
  {
    key: 'intelligence',
    icon: 'psychology',
    labelEn: 'Student Intelligence',
    labelTa: 'மாணவர் நுண்ணறிவு',
    items: [
      { id: 'student-insights', icon: 'insights', labelEn: 'Student Learning DNA', labelTa: 'மாணவர் கற்றல் நுண்ணறிவு' },
      { id: 'remedial-and-homework', icon: 'assignment_late', labelEn: 'Remedial & Homework', labelTa: 'கூடுதல் கற்றல்' },
      { id: 'vocational-module', icon: 'precision_manufacturing', labelEn: 'Vocational Module', labelTa: 'தொழிற்கல்வி பிரிவு' }
    ]
  },
  {
    key: 'system',
    icon: 'settings',
    labelEn: 'Reports & System',
    labelTa: 'அறிக்கைகள் & அமைப்புகள்',
    items: [
      { id: 'reports-center', icon: 'monitoring', labelEn: 'Reports Center', labelTa: 'அறிக்கைகள் மையம்' },
      { id: 'admin-and-security', icon: 'admin_panel_settings', labelEn: 'Admin & Security', labelTa: 'நிர்வாகம் & பாதுகாப்பு' },
      { id: 'api-explorer', icon: 'api', labelEn: 'Backend API Explorer', labelTa: 'API விவரங்கள்' }
    ]
  }
];

export const NAV_ITEMS = [DASHBOARD_ITEM, ...NAV_GROUPS.flatMap((g) => g.items)];

function renderNavBadge(item) {
  if (item.badgeType === 'lock') {
    return appState.progressLockActive
      ? `<span class="badge badge-error" style="font-size:0.6rem;padding:0.12rem 0.4rem;">LOCK</span>`
      : `<span class="badge badge-neutral" style="font-size:0.6rem;padding:0.12rem 0.4rem;">OFF</span>`;
  }
  if (item.badgeType === 'pending' && appState.pendingEvalCount > 0) {
    return `<span class="badge badge-tertiary" style="font-size:0.6rem;padding:0.12rem 0.42rem;">${appState.pendingEvalCount}</span>`;
  }
  return '';
}

function renderNavButton(item, nested = false) {
  const isActive = appState.activeTab === item.id;
  return `
    <button
      type="button"
      class="nav-item ${nested ? 'nav-item-nested' : ''} ${isActive ? 'active' : ''}"
      data-nav-tab="${escapeHtml(item.id)}"
    >
      <span class="nav-item-left">
        <span class="material-symbols-outlined" style="font-size:1.05rem;">${item.icon}</span>
        <span class="nav-item-label">${escapeHtml(t(item.labelEn, item.labelTa))}</span>
      </span>
      ${renderNavBadge(item)}
    </button>
  `;
}

export function renderSidebar() {
  return `
    <div id="sidebar-backdrop" class="sidebar-backdrop ${appState.mobileSidebarOpen ? 'open' : ''}"></div>
    <aside class="sidebar ${appState.mobileSidebarOpen ? 'open' : ''}">
      <div class="sidebar-top">
        <div class="sidebar-brand">
          <div class="brand-logo-box">IQ</div>
          <div style="min-width:0;">
            <div class="brand-title">JM Vertex ExamIQ</div>
            <div class="brand-subtitle">TN State Board Cl. 12</div>
          </div>
        </div>

        <div class="sidebar-class-box">
          <div class="class-selector-pill">
            <div class="flex-row" style="gap:0.35rem;flex-wrap:nowrap;min-width:0;flex:1;">
              <span class="material-symbols-outlined" style="color:var(--secondary);font-size:1.05rem;flex-shrink:0;">school</span>
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
      </div>

      <nav class="sidebar-nav" aria-label="Main navigation">
        ${renderNavButton(DASHBOARD_ITEM, false)}

        <div class="nav-groups-wrap">
          ${NAV_GROUPS.map((group) => {
            const isOpen = !!appState.sidebarOpenGroups[group.key];
            const hasActiveChild = group.items.some((it) => it.id === appState.activeTab);
            return `
              <div class="nav-group ${isOpen ? 'open' : ''}">
                <button
                  type="button"
                  class="nav-group-trigger ${hasActiveChild && !isOpen ? 'has-active' : ''}"
                  data-toggle-group="${escapeHtml(group.key)}"
                  aria-expanded="${isOpen ? 'true' : 'false'}"
                >
                  <span class="nav-item-left">
                    <span class="material-symbols-outlined" style="font-size:1.05rem;">${group.icon}</span>
                    <span class="nav-item-label">${escapeHtml(t(group.labelEn, group.labelTa))}</span>
                  </span>
                  <span class="material-symbols-outlined nav-group-chevron">
                    ${isOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                ${
                  isOpen
                    ? `<div class="nav-group-items">
                        ${group.items.map((item) => renderNavButton(item, true)).join('')}
                      </div>`
                    : ''
                }
              </div>
            `;
          }).join('')}
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="flex-between" style="gap:0.4rem;">
          <div class="flex-row" style="gap:0.35rem;color:var(--secondary);font-size:0.72rem;font-weight:700;">
            <span class="material-symbols-outlined" style="font-size:0.95rem;">verified</span>
            <span>${t('HSC 2024–25 Engine', 'HSC 2024–25 அமைப்பு')}</span>
          </div>
          <span class="badge badge-secondary font-mono" style="font-size:0.6rem;">${escapeHtml(appState.apiMode.toUpperCase())}</span>
        </div>
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

  document.querySelectorAll('[data-toggle-group]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-toggle-group');
      appState.sidebarOpenGroups[key] = !appState.sidebarOpenGroups[key];
      triggerRender();
    });
  });

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
