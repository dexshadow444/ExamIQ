import { apiClient } from '../api/client.js';
import { appState, escapeHtml, setLanguage, showToast, t, triggerRender } from '../state.js';

let loginState = {
  email: 'admin@gmail.com',
  password: 'admin@123',
  showPassword: false,
  rememberTerminal: true,
  loading: false
};

export function renderLoginView() {
  return `
    <main class="login-page">
      <div class="login-shell">
        <div class="login-left">
          <div style="display:flex;flex-direction:column;gap:1.1rem;position:relative;z-index:2;">
            <div class="flex-row" style="gap:0.75rem;">
              <div class="brand-logo-box" style="width:3rem;height:3rem;background:rgba(255,255,255,0.2);backdrop-filter:blur(8px);font-size:1.1rem;">IQ</div>
              <div>
                <div style="font-size:1.45rem;font-weight:800;letter-spacing:-0.02em;">JM Vertex ExamIQ</div>
                <div class="font-mono" style="font-size:0.72rem;text-transform:uppercase;color:var(--secondary-fixed);">
                  ${t('TN State Board Class 12 • Standard Suite', 'தமிழ்நாடு மாநிலப் பாடத்திட்டம் • தரம் 12')}
                </div>
              </div>
            </div>

            <div>
              <span class="badge" style="background:rgba(255,255,255,0.16);color:#fff;padding:0.35rem 0.8rem;">
                <span class="material-symbols-outlined fill" style="font-size:0.95rem;color:var(--secondary-fixed);">verified</span>
                <span>${t('Tamil Nadu State Board Class 12 • AI Examination & Learning Intelligence', 'தமிழ்நாடு மாநிலப் பாடத்திட்டம் • AI தேர்வு மற்றும் கற்றல் நுண்ணறிவு')}</span>
              </span>
            </div>

            <div style="padding-top:0.5rem;">
              <h1 style="margin:0;font-size:2.1rem;font-weight:800;line-height:1.18;letter-spacing:-0.025em;">
                ${t("Teach what you've taught.<br/>Test what matters.", 'கற்பித்ததை கற்பிப்போம்.<br/>முக்கியமானதை மதிப்பிடுவோம்.')}
              </h1>
              <p style="margin:0.6rem 0 0;font-size:0.95rem;color:var(--primary-fixed);opacity:0.95;">
                ${t('We teach what matters and assess what was taught.', 'கற்பித்ததையே சோதிப்போம். தேவையானதை மதிப்பீடு செய்வோம்.')}
              </p>
            </div>
          </div>

          <div class="grid grid-2" style="gap:0.75rem;position:relative;z-index:2;">
            <div class="login-feature-card">
              <span class="material-symbols-outlined" style="color:var(--secondary-fixed);font-size:1.2rem;">lock_clock</span>
              <div>
                <div style="font-size:0.78rem;font-weight:700;">${t('Teaching Progress Lock', 'கற்பித்தல் முன்னேற்றப் பூட்டு')}</div>
                <div style="font-size:0.7rem;color:var(--primary-fixed);">${t('No untaught syllabus on exams', 'கற்பிக்காத பாடங்கள் தேர்வில் இடம்பெறாது')}</div>
              </div>
            </div>
            <div class="login-feature-card">
              <span class="material-symbols-outlined" style="color:var(--secondary-fixed);font-size:1.2rem;">thumb_up_alt</span>
              <div>
                <div style="font-size:0.78rem;font-weight:700;">${t('Teacher Verification', 'ஆசிரியர் சரிபார்ப்பு')}</div>
                <div style="font-size:0.7rem;color:var(--primary-fixed);">${t('AI suggests, teacher approves', 'AI பரிந்துரைக்கும்; ஆசிரியர் ஒப்புதல் அளிப்பார்')}</div>
              </div>
            </div>
            <div class="login-feature-card">
              <span class="material-symbols-outlined" style="color:var(--secondary-fixed);font-size:1.2rem;">translate</span>
              <div>
                <div style="font-size:0.78rem;font-weight:700;">${t('Bilingual OCR & Rubrics', 'இருமொழி OCR மற்றும் மதிப்பீட்டு வழிகாட்டி')}</div>
                <div style="font-size:0.7rem;color:var(--primary-fixed);">${t('Stepwise Tamil & English keys', 'தமிழ் மற்றும் ஆங்கில படிப்படியான விடைகள்')}</div>
              </div>
            </div>
            <div class="login-feature-card">
              <span class="material-symbols-outlined" style="color:var(--secondary-fixed);font-size:1.2rem;">insights</span>
              <div>
                <div style="font-size:0.78rem;font-weight:700;">${t('Student Learning DNA', 'மாணவர் கற்றல் சுயவிவரம்')}</div>
                <div style="font-size:0.7rem;color:var(--primary-fixed);">${t('Direct question-level diagnostic', 'ஒவ்வொரு கேள்விக்குமான கற்றல் பகுப்பாய்வு')}</div>
              </div>
            </div>
          </div>

          <div class="flex-between" style="padding-top:0.75rem;border-top:1px solid rgba(255,255,255,0.16);font-size:0.74rem;color:var(--primary-fixed);">
            <div class="flex-row" style="gap:0.4rem;">
              <span class="material-symbols-outlined" style="font-size:0.95rem;">assured_workload</span>
              <span>${t('Authorized for Govt & Aided Higher Secondary Schools', 'அரசு மற்றும் அரசு உதவி பெறும் மேல்நிலைப் பள்ளிகளுக்கானது')}</span>
            </div>
            <span class="font-mono">AY 2024–2025</span>
          </div>
        </div>

        <div class="login-right">
          <div class="flex-between">
            <div class="flex-row" style="gap:0.45rem;">
              <span style="width:0.6rem;height:0.6rem;border-radius:50%;background:var(--secondary);"></span>
              <span style="font-size:0.72rem;font-weight:700;color:var(--secondary);text-transform:uppercase;letter-spacing:0.05em;">
                ${t('TN EMIS Verified Gateway', 'TN EMIS சரிபார்க்கப்பட்ட நுழைவாயில்')}
              </span>
            </div>

            <div class="segmented-pill">
              <button type="button" id="login-lang-en" class="segmented-btn ${appState.language === 'en' ? 'active-white' : ''}">English</button>
              <button type="button" id="login-lang-ta" class="segmented-btn ${appState.language === 'ta' ? 'active-white' : ''}">தமிழ்</button>
            </div>
          </div>

          <div style="max-width:26rem;width:100%;margin:auto;padding:1.25rem 0;display:flex;flex-direction:column;gap:1rem;">
            <div>
              <h2 style="margin:0;font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;">
                ${t('Sign in to ExamIQ', 'ExamIQ-இல் உள்நுழைக')}
              </h2>
              <p class="text-sm muted" style="margin:0.35rem 0 0;">
                ${t('Enter your administrator credentials to continue', 'நிர்வாகி உள்நுழைவு விவரங்களை உள்ளிட்டு தொடரவும்')}
              </p>
            </div>

            <div class="soft-panel flex-row" style="padding:0.55rem 0.75rem;font-size:0.76rem;color:var(--on-surface-variant);">
              <span class="material-symbols-outlined" style="color:var(--secondary);font-size:1rem;">admin_panel_settings</span>
              <span>Administrator access • Portal Demo: <strong class="font-mono">admin@gmail.com / admin@123</strong></span>
            </div>

            <form id="login-form" style="display:flex;flex-direction:column;gap:0.95rem;">
              <div>
                <label class="field-label" for="login-email">Administrator email</label>
                <div class="input-icon-wrap">
                  <span class="material-symbols-outlined leading-icon">badge</span>
                  <input id="login-email" type="email" required class="input" value="${escapeHtml(loginState.email)}" />
                </div>
              </div>

              <div>
                <div class="flex-between" style="margin-bottom:0.3rem;">
                  <label class="field-label" for="login-password" style="margin:0;">Password</label>
                  <span style="font-size:0.72rem;color:var(--primary);font-weight:600;">${t('Forgot Password?', 'கடவுச்சொல் மறந்துவிட்டதா?')}</span>
                </div>
                <div class="input-icon-wrap">
                  <span class="material-symbols-outlined leading-icon">lock</span>
                  <input
                    id="login-password"
                    type="${loginState.showPassword ? 'text' : 'password'}"
                    required
                    class="input"
                    style="padding-right:2.4rem;"
                    value="${escapeHtml(loginState.password)}"
                  />
                  <button type="button" id="btn-toggle-pw" class="trailing-btn" aria-label="Toggle password visibility">
                    <span class="material-symbols-outlined" style="font-size:1.1rem;">${loginState.showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div class="flex-between" style="font-size:0.74rem;">
                <label class="flex-row" style="gap:0.4rem;cursor:pointer;">
                  <input id="login-remember" type="checkbox" ${loginState.rememberTerminal ? 'checked' : ''} />
                  <span class="muted">${t('Remember this terminal', 'இந்த சாதனத்தை நினைவில் கொள்')}</span>
                </label>
                <span class="muted flex-row" style="gap:0.25rem;">
                  <span class="material-symbols-outlined" style="font-size:0.9rem;">support_agent</span>
                  <span>${t('EMIS Helpdesk 14417', 'EMIS உதவி மையம் 14417')}</span>
                </span>
              </div>

              <button type="submit" class="btn btn-primary" style="width:100%;padding:0.8rem 1rem;font-size:0.85rem;" ${loginState.loading ? 'disabled' : ''}>
                ${loginState.loading ? '<span class="spinner"></span>' : ''}
                <span>${t('Sign In to Portal', 'உள்நுழைக')}</span>
                <span class="material-symbols-outlined" style="font-size:1.15rem;">arrow_forward</span>
              </button>
            </form>
          </div>

          <div class="flex-between" style="padding-top:0.8rem;border-top:1px solid var(--surface-container-low);font-size:0.72rem;color:var(--outline);">
            <div class="flex-row" style="gap:0.35rem;">
              <span class="material-symbols-outlined" style="color:var(--secondary);font-size:0.95rem;">encrypted</span>
              <span>SSL 256-bit AES • State Data Center (ELCOT)</span>
            </div>
            <div class="flex-row" style="gap:0.35rem;">
              <span style="width:0.5rem;height:0.5rem;border-radius:50%;background:var(--secondary);"></span>
              <span>Gateway Active</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  `;
}

export function bindLoginEvents() {
  document.getElementById('login-lang-en')?.addEventListener('click', () => setLanguage('en'));
  document.getElementById('login-lang-ta')?.addEventListener('click', () => setLanguage('ta'));

  const emailEl = document.getElementById('login-email');
  const pwEl = document.getElementById('login-password');
  const remEl = document.getElementById('login-remember');

  emailEl?.addEventListener('input', (e) => { loginState.email = e.target.value; });
  pwEl?.addEventListener('input', (e) => { loginState.password = e.target.value; });
  remEl?.addEventListener('change', (e) => { loginState.rememberTerminal = e.target.checked; });

  document.getElementById('btn-toggle-pw')?.addEventListener('click', () => {
    loginState.showPassword = !loginState.showPassword;
    triggerRender();
  });

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (loginState.email || '').trim().toLowerCase();
    const password = loginState.password || '';

    if (appState.apiMode === 'mock' && (email !== 'admin@gmail.com' || password !== 'admin@123')) {
      showToast('Invalid email or password. Use admin@gmail.com / admin@123', 'error');
      return;
    }

    loginState.loading = true;
    triggerRender();
    try {
      await apiClient.login({
        schoolCode: appState.currentSchool.id,
        userIdentity: email,
        password,
        role: 'admin'
      });
      appState.currentRole = 'admin';
      appState.isLoggedIn = true;
      showToast('Signed in successfully as ADMIN', 'success');
    } catch (err) {
      showToast('Authentication failed', 'error');
    } finally {
      loginState.loading = false;
      triggerRender();
    }
  });
}
