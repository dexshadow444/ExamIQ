import { SCHOOL_DATA } from '../data/mockData.js';
import {
  appState,
  escapeHtml,
  setActiveTab,
  setLanguage,
  switchApiMode,
  t,
  triggerRender
} from '../state.js';

export function renderHeader() {
  const user = SCHOOL_DATA.currentUser;
  const unreadCount = appState.notifications.filter((n) => n.unread).length;

  return `
    <header class="top-header">
      <div class="flex-row" style="flex:1;min-width:0;gap:0.75rem;flex-wrap:nowrap;">
        <button id="btn-mobile-menu" type="button" class="mobile-menu-btn" aria-label="Toggle navigation">
          <span class="material-symbols-outlined">menu</span>
        </button>

        <div id="header-search-trigger" class="header-search-wrap">
          <span class="material-symbols-outlined header-search-icon">search</span>
          <input
            readonly
            type="text"
            class="header-search-input"
            placeholder="${escapeHtml(
              t(
                'Search questions, chapters, students, answer sheets...',
                'வினாக்கள், பாடங்கள், மாணவர்கள், விடைத்தாள்களைத் தேடுங்கள்...'
              )
            )}"
          />
          <kbd class="kbd-shortcut">Ctrl+K</kbd>
        </div>
      </div>

      <div class="header-actions">
        <div class="header-dropdown-wrap hide-sm" data-header-dropdown>
          <button
            type="button"
            id="btn-header-mode"
            class="header-dropdown-btn"
            aria-expanded="${appState.headerMenuOpen === 'mode' ? 'true' : 'false'}"
          >
            <span class="status-dot" style="background:${appState.apiMode === 'live' ? 'var(--secondary)' : 'var(--primary)'};"></span>
            <span>${appState.apiMode === 'live' ? t('Live API', 'நேரடி API') : t('Mock Data', 'மாதிரி தரவு')}</span>
            <span class="material-symbols-outlined" style="font-size:1rem;">expand_more</span>
          </button>

          ${
            appState.headerMenuOpen === 'mode'
              ? `
              <div class="popover-menu header-menu-sm">
                <div class="menu-section-title">${t('Data Source Mode', 'தரவு மூல முறை')}</div>
                <button type="button" id="btn-mode-mock" class="menu-option ${appState.apiMode === 'mock' ? 'active' : ''}">
                  <span class="status-dot" style="background:var(--primary);"></span>
                  <div style="flex:1;">
                    <div style="font-weight:700;">${t('Mock Data', 'மாதிரி தரவு')}</div>
                    <div class="text-xs muted">In-browser simulation</div>
                  </div>
                  ${appState.apiMode === 'mock' ? '<span class="material-symbols-outlined" style="font-size:1rem;color:var(--primary);">check</span>' : ''}
                </button>
                <button type="button" id="btn-mode-live" class="menu-option ${appState.apiMode === 'live' ? 'active' : ''}">
                  <span class="status-dot" style="background:var(--secondary);"></span>
                  <div style="flex:1;">
                    <div style="font-weight:700;">${t('Live API', 'நேரடி API')}</div>
                    <div class="text-xs muted">Connect to backend server</div>
                  </div>
                  ${appState.apiMode === 'live' ? '<span class="material-symbols-outlined" style="font-size:1rem;color:var(--secondary);">check</span>' : ''}
                </button>
              </div>
            `
              : ''
          }
        </div>

        <div class="header-dropdown-wrap" data-header-dropdown>
          <button
            type="button"
            id="btn-header-lang"
            class="header-dropdown-btn"
            aria-expanded="${appState.headerMenuOpen === 'lang' ? 'true' : 'false'}"
          >
            <span class="material-symbols-outlined" style="font-size:1rem;color:var(--primary);">translate</span>
            <span>${appState.language === 'ta' ? 'தமிழ்' : 'English'}</span>
            <span class="material-symbols-outlined" style="font-size:1rem;">expand_more</span>
          </button>

          ${
            appState.headerMenuOpen === 'lang'
              ? `
              <div class="popover-menu header-menu-xs">
                <div class="menu-section-title">${t('Interface Language', 'இடைமுக மொழி')}</div>
                <button type="button" id="btn-lang-en" class="menu-option ${appState.language === 'en' ? 'active' : ''}">
                  <span style="flex:1;font-weight:600;">English</span>
                  ${appState.language === 'en' ? '<span class="material-symbols-outlined" style="font-size:1rem;color:var(--primary);">check</span>' : ''}
                </button>
                <button type="button" id="btn-lang-ta" class="menu-option ${appState.language === 'ta' ? 'active' : ''}">
                  <span style="flex:1;font-weight:600;">தமிழ் (Tamil)</span>
                  ${appState.language === 'ta' ? '<span class="material-symbols-outlined" style="font-size:1rem;color:var(--primary);">check</span>' : ''}
                </button>
              </div>
            `
              : ''
          }
        </div>

        <div class="header-dropdown-wrap" data-header-dropdown>
          <button
            id="btn-notifications"
            type="button"
            class="icon-circle-btn"
            aria-label="${t('Notifications', 'அறிவிப்புகள்')}"
            aria-expanded="${appState.notificationsOpen ? 'true' : 'false'}"
          >
            <span class="material-symbols-outlined">notifications</span>
            ${unreadCount > 0 ? '<span class="notif-dot"></span>' : ''}
          </button>

          ${
            appState.notificationsOpen
              ? `
              <div class="popover-menu">
                <div class="flex-between" style="padding-bottom:0.5rem;border-bottom:1px solid var(--surface-container);">
                  <strong style="font-size:0.84rem;">${t('Notifications', 'அறிவிப்புகள்')}</strong>
                  <button id="btn-mark-all-read" type="button" class="btn-ghost" style="border:none;font-size:0.72rem;color:var(--primary);font-weight:700;padding:0.15rem 0.35rem;">
                    ${t('Mark all read', 'அனைத்தையும் படித்ததாகக் குறி')}
                  </button>
                </div>
                <div style="max-height:17rem;overflow-y:auto;">
                  ${appState.notifications
                    .map(
                      (n) => `
                    <div style="padding:0.6rem 0;border-bottom:1px solid var(--surface-container-low);">
                      <div class="flex-between" style="gap:0.4rem;">
                        <span style="font-size:0.76rem;font-weight:700;display:flex;align-items:center;gap:0.35rem;">
                          ${n.unread ? '<span style="width:0.4rem;height:0.4rem;border-radius:50%;background:var(--primary);display:inline-block;"></span>' : ''}
                          ${escapeHtml(n.title)}
                        </span>
                        <span style="font-size:0.66rem;color:var(--outline);">${escapeHtml(n.time)}</span>
                      </div>
                      <p class="text-xs muted" style="margin:0.2rem 0 0;line-height:1.4;">${escapeHtml(n.desc)}</p>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>
            `
              : ''
          }
        </div>

        <div class="header-dropdown-wrap" data-header-dropdown>
          <button
            type="button"
            id="btn-header-profile"
            class="profile-chip-btn"
            aria-expanded="${appState.headerMenuOpen === 'profile' ? 'true' : 'false'}"
          >
            <div class="avatar-circle">${escapeHtml(user.initials)}</div>
            <div class="hide-sm" style="flex-direction:column;align-items:flex-start;line-height:1.25;text-align:left;">
              <span style="font-size:0.76rem;font-weight:700;color:var(--on-surface);">${escapeHtml(t(user.name, user.nameTamil))}</span>
              <span style="font-size:0.66rem;color:var(--on-surface-variant);">
                ${escapeHtml(appState.currentClass.name)} • ${escapeHtml(appState.currentSchool.district)}
              </span>
            </div>
            <span class="material-symbols-outlined hide-sm" style="font-size:1rem;color:var(--on-surface-variant);">expand_more</span>
          </button>

          ${
            appState.headerMenuOpen === 'profile'
              ? `
              <div class="popover-menu header-menu-md">
                <div style="padding-bottom:0.6rem;border-bottom:1px solid var(--surface-container);">
                  <div style="font-size:0.8rem;font-weight:700;">${escapeHtml(t(user.name, user.nameTamil))}</div>
                  <div class="text-xs muted">${escapeHtml(t(user.role, 'ஆசிரியர் / நிர்வாகி'))}</div>
                  <div class="text-xs muted" style="margin-top:0.25rem;">${escapeHtml(appState.currentSchool.name)}</div>
                  <div class="badge badge-neutral" style="margin-top:0.4rem;">${escapeHtml(appState.currentClass.name)} • ${escapeHtml(appState.currentClass.medium)}</div>
                </div>
                <div style="display:flex;flex-direction:column;gap:0.2rem;padding-top:0.45rem;">
                  <button type="button" id="btn-profile-admin" class="menu-option">
                    <span class="material-symbols-outlined" style="font-size:1rem;color:var(--primary);">admin_panel_settings</span>
                    <span>${t('School & Admin Settings', 'பள்ளி & நிர்வாக அமைப்புகள்')}</span>
                  </button>
                  <button type="button" id="btn-header-signout" class="menu-option" style="color:var(--error);">
                    <span class="material-symbols-outlined" style="font-size:1rem;">logout</span>
                    <span>${t('Switch School / Sign Out', 'பள்ளியை மாற்று / வெளியேறு')}</span>
                  </button>
                </div>
              </div>
            `
              : ''
          }
        </div>
      </div>
    </header>
  `;
}

export function bindHeaderEvents() {
  const mobileBtn = document.getElementById('btn-mobile-menu');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      appState.mobileSidebarOpen = !appState.mobileSidebarOpen;
      triggerRender();
    });
  }

  const searchTrigger = document.getElementById('header-search-trigger');
  if (searchTrigger) {
    searchTrigger.addEventListener('click', () => {
      appState.searchModalOpen = true;
      appState.headerMenuOpen = null;
      appState.notificationsOpen = false;
      triggerRender();
    });
  }

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
