import { SCHOOL_DATA } from '../data/mockData.js';
import {
  appState,
  setActiveTab,
  setLanguage,
  switchApiMode,
  t,
  triggerRender
} from '../state.js';
import { cloneTemplate, qs, setText, setVisible } from '../utils/dom.js';

export function renderHeader() {
  const root = cloneTemplate('tpl-header');
  const user = SCHOOL_DATA.currentUser;
  const unreadCount = appState.notifications.filter((n) => n.unread).length;

  const searchInput = qs(root, '[data-el="search-input"]');
  if (searchInput) {
    searchInput.placeholder = t(
      'Search questions, chapters, students, answer sheets...',
      'வினாக்கள், பாடங்கள், மாணவர்கள், விடைத்தாள்களைத் தேடுங்கள்...'
    );
  }

  // API Mode dropdown
  const modeBtn = qs(root, '#btn-header-mode');
  modeBtn?.setAttribute('aria-expanded', appState.headerMenuOpen === 'mode' ? 'true' : 'false');
  const modeDot = qs(root, '[data-el="mode-dot"]');
  if (modeDot) modeDot.style.background = appState.apiMode === 'live' ? 'var(--secondary)' : 'var(--primary)';
  setText(root, '[data-el="mode-label"]', appState.apiMode === 'live' ? t('Live API', 'நேரடி API') : t('Mock Data', 'மாதிரி தரவு'));

  setVisible(root, '[data-el="mode-menu"]', appState.headerMenuOpen === 'mode');
  setText(root, '[data-el="mode-menu-title"]', t('Data Source Mode', 'தரவு மூல முறை'));
  setText(root, '[data-el="opt-mock-title"]', t('Mock Data', 'மாதிரி தரவு'));
  setText(root, '[data-el="opt-live-title"]', t('Live API', 'நேரடி API'));
  qs(root, '#btn-mode-mock')?.classList.toggle('active', appState.apiMode === 'mock');
  qs(root, '#btn-mode-live')?.classList.toggle('active', appState.apiMode === 'live');
  setVisible(root, '[data-el="opt-mock-check"]', appState.apiMode === 'mock');
  setVisible(root, '[data-el="opt-live-check"]', appState.apiMode === 'live');

  // Language dropdown
  const langBtn = qs(root, '#btn-header-lang');
  langBtn?.setAttribute('aria-expanded', appState.headerMenuOpen === 'lang' ? 'true' : 'false');
  setText(root, '[data-el="lang-label"]', appState.language === 'ta' ? 'தமிழ்' : 'English');
  setVisible(root, '[data-el="lang-menu"]', appState.headerMenuOpen === 'lang');
  setText(root, '[data-el="lang-menu-title"]', t('Interface Language', 'இடைமுக மொழி'));
  qs(root, '#btn-lang-en')?.classList.toggle('active', appState.language === 'en');
  qs(root, '#btn-lang-ta')?.classList.toggle('active', appState.language === 'ta');
  setVisible(root, '[data-el="opt-en-check"]', appState.language === 'en');
  setVisible(root, '[data-el="opt-ta-check"]', appState.language === 'ta');

  // Notifications dropdown
  setVisible(root, '[data-el="notif-dot"]', unreadCount > 0);
  setVisible(root, '[data-el="notif-menu"]', appState.notificationsOpen);
  setText(root, '[data-el="notif-title"]', t('Notifications', 'அறிவிப்புகள்'));
  setText(root, '#btn-mark-all-read', t('Mark all read', 'அனைத்தும் படிக்கப்பட்டது'));

  const notifList = qs(root, '[data-el="notif-list"]');
  appState.notifications.forEach((n) => {
    const item = cloneTemplate('tpl-header-notif-item');
    setVisible(item, '[data-el="unread-dot"]', n.unread);
    setText(item, '[data-el="notif-item-title"]', n.title);
    setText(item, '[data-el="notif-item-time"]', n.time);
    setText(item, '[data-el="notif-item-desc"]', n.desc);
    notifList.appendChild(item);
  });

  // Profile dropdown
  const profileBtn = qs(root, '#btn-header-profile');
  profileBtn?.setAttribute('aria-expanded', appState.headerMenuOpen === 'profile' ? 'true' : 'false');
  setText(root, '[data-el="user-initials"]', user.initials);
  setText(root, '[data-el="user-name"]', t(user.name, user.nameTamil));
  setText(root, '[data-el="user-sub"]', `${appState.currentClass.name} • ${appState.currentSchool.district}`);

  setVisible(root, '[data-el="profile-menu"]', appState.headerMenuOpen === 'profile');
  setText(root, '[data-el="menu-user-name"]', t(user.name, user.nameTamil));
  setText(root, '[data-el="menu-user-role"]', t(user.role, 'ஆசிரியர் / நிர்வாகி'));
  setText(root, '[data-el="menu-school-name"]', appState.currentSchool.name);
  setText(root, '[data-el="menu-class-badge"]', `${appState.currentClass.name} • ${appState.currentClass.medium}`);
  setText(root, '[data-el="menu-admin-label"]', t('School & Admin Settings', 'பள்ளி & நிர்வாக அமைப்புகள்'));
  setText(root, '[data-el="menu-signout-label"]', t('Switch School / Sign Out', 'பள்ளியை மாற்று / வெளியேறு'));

  return root;
}

export function bindHeaderEvents() {
  document.getElementById('btn-mobile-menu')?.addEventListener('click', () => {
    appState.mobileSidebarOpen = !appState.mobileSidebarOpen;
    triggerRender();
  });

  document.getElementById('header-search-trigger')?.addEventListener('click', () => {
    appState.searchModalOpen = true;
    appState.headerMenuOpen = null;
    appState.notificationsOpen = false;
    triggerRender();
  });

  document.getElementById('btn-header-mode')?.addEventListener('click', (e) => {
    e.stopPropagation();
    appState.notificationsOpen = false;
    appState.headerMenuOpen = appState.headerMenuOpen === 'mode' ? null : 'mode';
    triggerRender();
  });

  document.getElementById('btn-header-lang')?.addEventListener('click', (e) => {
    e.stopPropagation();
    appState.notificationsOpen = false;
    appState.headerMenuOpen = appState.headerMenuOpen === 'lang' ? null : 'lang';
    triggerRender();
  });

  document.getElementById('btn-header-profile')?.addEventListener('click', (e) => {
    e.stopPropagation();
    appState.notificationsOpen = false;
    appState.headerMenuOpen = appState.headerMenuOpen === 'profile' ? null : 'profile';
    triggerRender();
  });

  document.getElementById('btn-mode-mock')?.addEventListener('click', () => switchApiMode('mock'));
  document.getElementById('btn-mode-live')?.addEventListener('click', () => switchApiMode('live'));
  document.getElementById('btn-lang-ta')?.addEventListener('click', () => setLanguage('ta'));
  document.getElementById('btn-lang-en')?.addEventListener('click', () => setLanguage('en'));

  document.getElementById('btn-profile-admin')?.addEventListener('click', () => {
    setActiveTab('admin-and-security');
  });

  document.getElementById('btn-header-signout')?.addEventListener('click', () => {
    appState.headerMenuOpen = null;
    appState.isLoggedIn = false;
    triggerRender();
  });

  document.getElementById('btn-notifications')?.addEventListener('click', (e) => {
    e.stopPropagation();
    appState.headerMenuOpen = null;
    appState.notificationsOpen = !appState.notificationsOpen;
    triggerRender();
  });

  document.getElementById('btn-mark-all-read')?.addEventListener('click', () => {
    appState.notifications = appState.notifications.map((n) => ({ ...n, unread: false }));
    appState.notificationsOpen = false;
    triggerRender();
  });
}
