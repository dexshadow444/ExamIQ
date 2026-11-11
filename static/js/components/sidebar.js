import { SCHOOL_DATA } from '../data/mockData.js';
import {
  appState,
  setActiveTab,
  t,
  triggerRender
} from '../state.js';
import { cloneTemplate, fillSelect, qs, setText, setVisible } from '../utils/dom.js';

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

function createNavButton(item, nested = false) {
  const btn = cloneTemplate('tpl-sidebar-nav-item');
  const isActive = appState.activeTab === item.id;
  if (nested) btn.classList.add('nav-item-nested');
  if (isActive) btn.classList.add('active');
  btn.setAttribute('data-nav-tab', item.id);

  setText(btn, '[data-el="item-icon"]', item.icon);
  setText(btn, '[data-el="item-label"]', t(item.labelEn, item.labelTa));

  const badge = qs(btn, '[data-el="item-badge"]');
  if (item.badgeType === 'lock') {
    badge.hidden = false;
    badge.className = `badge ${appState.progressLockActive ? 'badge-error' : 'badge-neutral'}`;
    badge.textContent = appState.progressLockActive ? 'LOCK' : 'OFF';
  } else if (item.badgeType === 'pending' && appState.pendingEvalCount > 0) {
    badge.hidden = false;
    badge.className = 'badge badge-tertiary';
    badge.textContent = String(appState.pendingEvalCount);
  }
  return btn;
}

export function renderSidebar() {
  const root = cloneTemplate('tpl-sidebar');
  const backdrop = qs(root, '#sidebar-backdrop');
  const aside = qs(root, '.sidebar');

  if (appState.mobileSidebarOpen) {
    backdrop?.classList.add('open');
    aside?.classList.add('open');
  }

  fillSelect(
    qs(root, '#sidebar-class-select'),
    SCHOOL_DATA.classes.map((c) => ({ value: c.id, label: c.name })),
    appState.currentClass.id
  );
  setText(root, '[data-el="ay-badge"]', SCHOOL_DATA.academicYear);

  qs(root, '[data-el="dashboard-slot"]')?.replaceWith(createNavButton(DASHBOARD_ITEM, false));

  const groupsSlot = qs(root, '[data-el="groups-slot"]');
  NAV_GROUPS.forEach((group) => {
    const grp = cloneTemplate('tpl-sidebar-group');
    const isOpen = !!appState.sidebarOpenGroups[group.key];
    const hasActiveChild = group.items.some((it) => it.id === appState.activeTab);

    if (isOpen) grp.classList.add('open');
    const trigger = qs(grp, '.nav-group-trigger');
    trigger.setAttribute('data-toggle-group', group.key);
    trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (hasActiveChild && !isOpen) trigger.classList.add('has-active');

    setText(grp, '[data-el="group-icon"]', group.icon);
    setText(grp, '[data-el="group-label"]', t(group.labelEn, group.labelTa));
    setText(grp, '[data-el="group-chevron"]', isOpen ? 'expand_less' : 'expand_more');

    const itemsWrap = qs(grp, '[data-el="group-items"]');
    setVisible(grp, '[data-el="group-items"]', isOpen);
    if (isOpen) {
      group.items.forEach((item) => itemsWrap.appendChild(createNavButton(item, true)));
    }
    groupsSlot.appendChild(grp);
  });

  setText(root, '[data-el="engine-label"]', t('HSC 2024–25 Engine', 'HSC 2024–25 அமைப்பு'));
  setText(root, '[data-el="api-mode-badge"]', appState.apiMode.toUpperCase());
  setText(root, '[data-el="signout-label"]', t('Switch School / Sign Out', 'பள்ளியை மாற்று / வெளியேறு'));

  return root;
}

export function bindSidebarEvents() {
  document.getElementById('sidebar-backdrop')?.addEventListener('click', () => {
    appState.mobileSidebarOpen = false;
    triggerRender();
  });

  document.getElementById('sidebar-class-select')?.addEventListener('change', (e) => {
    const found = SCHOOL_DATA.classes.find((c) => c.id === e.target.value);
    if (found) {
      appState.currentClass = found;
      triggerRender();
    }
  });

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

  document.getElementById('btn-signout')?.addEventListener('click', () => {
    appState.isLoggedIn = false;
    triggerRender();
  });
}
