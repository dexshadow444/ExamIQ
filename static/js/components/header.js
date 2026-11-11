import { SCHOOL_DATA } from '../data/mockData.js';
import {
  appState,
  escapeHtml,
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
        <div class="badge badge-neutral hide-sm" style="padding:0.35rem 0.7rem;">
          <span style="width:0.5rem;height:0.5rem;border-radius:50%;background:var(--secondary);display:inline-block;"></span>
          <span>${escapeHtml(appState.currentClass.name)} • ${escapeHtml(appState.currentClass.medium)}</span>
        </div>

        <div class="segmented-pill hide-sm">
          <button
            type="button"
            id="btn-mode-mock"
            class="segmented-btn ${appState.apiMode === 'mock' ? 'active-primary' : ''}"
            title="Uses in-browser high fidelity mock simulation"
          >
            ${t('Mock Data', 'மாதிரி தரவு')}
          </button>
          <button
            type="button"
            id="btn-mode-live"
            class="segmented-btn ${appState.apiMode === 'live' ? 'active-secondary' : ''}"
            title="Connects to live backend API"
          >
            ${t('Live API', 'நேரடி API')}
          </button>
        </div>

        <div class="segmented-pill">
          <button
            type="button"
            id="btn-lang-ta"
            class="segmented-btn ${appState.language === 'ta' ? 'active-white' : ''}"
          >
            தமிழ்
          </button>
          <button
            type="button"
            id="btn-lang-en"
            class="segmented-btn ${appState.language === 'en' ? 'active-white' : ''}"
          >
            English
          </button>
        </div>

        <div style="position:relative;">
          <button
            id="btn-notifications"
            type="button"
            class="icon-circle-btn"
            aria-label="${t('Notifications', 'அறிவிப்புகள்')}"
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

        <div class="profile-chip">
          <div class="avatar-circle">${escapeHtml(user.initials)}</div>
          <div class="hide-sm" style="flex-direction:column;line-height:1.25;">
            <span style="font-size:0.76rem;font-weight:700;">${escapeHtml(t(user.name, user.nameTamil))}</span>
            <span style="font-size:0.68rem;color:var(--on-surface-variant);">
              ${escapeHtml(t(user.role, 'நிர்வாகி'))} • ${escapeHtml(appState.currentSchool.district)}
            </span>
          </div>
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
      triggerRender();
    });
  }

  document.getElementById('btn-mode-mock')?.addEventListener('click', () => switchApiMode('mock'));
  document.getElementById('btn-mode-live')?.addEventListener('click', () => switchApiMode('live'));
  document.getElementById('btn-lang-ta')?.addEventListener('click', () => setLanguage('ta'));
  document.getElementById('btn-lang-en')?.addEventListener('click', () => setLanguage('en'));

  document.getElementById('btn-notifications')?.addEventListener('click', (e) => {
    e.stopPropagation();
    appState.notificationsOpen = !appState.notificationsOpen;
    triggerRender();
  });

  document.getElementById('btn-mark-all-read')?.addEventListener('click', () => {
    appState.notifications = appState.notifications.map((n) => ({ ...n, unread: false }));
    appState.notificationsOpen = false;
    triggerRender();
  });
}
