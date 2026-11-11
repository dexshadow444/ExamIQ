import { apiClient } from '../api/client.js';
import { appState, setLanguage, showToast, t, triggerRender } from '../state.js';
import { cloneTemplate, qs, setText, setVisible } from '../utils/dom.js';

let loginState = {
  email: 'admin@gmail.com',
  password: 'admin@123',
  showPassword: false,
  rememberTerminal: true,
  loading: false
};

export function renderLoginView() {
  const root = cloneTemplate('tpl-login');

  setText(root, '[data-el="login-suite"]', t('TN State Board Class 12 • Standard Suite', 'தமிழ்நாடு மாநிலப் பாடத்திட்டம் • தரம் 12'));
  setText(root, '[data-el="login-badge"]', t('Tamil Nadu State Board Class 12 • AI Examination & Learning Intelligence', 'தமிழ்நாடு மாநிலப் பாடத்திட்டம் • AI தேர்வு மற்றும் கற்றல் நுண்ணறிவு'));
  setText(root, '[data-el="login-hero-line1"]', t("Teach what you've taught.", 'கற்பித்ததை கற்பிப்போம்.'));
  setText(root, '[data-el="login-hero-line2"]', t('Test what matters.', 'முக்கியமானதை மதிப்பிடுவோம்.'));
  setText(root, '[data-el="login-hero-sub"]', t('We teach what matters and assess what was taught.', 'கற்பித்ததையே சோதிப்போம். தேவையானதை மதிப்பீடு செய்வோம்.'));

  setText(root, '[data-el="feat-1-title"]', t('Teaching Progress Lock', 'கற்பித்தல் முன்னேற்றப் பூட்டு'));
  setText(root, '[data-el="feat-1-sub"]', t('No untaught syllabus on exams', 'கற்பிக்காத பாடங்கள் தேர்வில் இடம்பெறாது'));
  setText(root, '[data-el="feat-2-title"]', t('Teacher Verification', 'ஆசிரியர் சரிபார்ப்பு'));
  setText(root, '[data-el="feat-2-sub"]', t('AI suggests, teacher approves', 'AI பரிந்துரைக்கும்; ஆசிரியர் ஒப்புதல் அளிப்பார்'));
  setText(root, '[data-el="feat-3-title"]', t('Bilingual OCR & Rubrics', 'இருமொழி OCR மற்றும் மதிப்பீட்டு வழிகாட்டி'));
  setText(root, '[data-el="feat-3-sub"]', t('Stepwise Tamil & English keys', 'தமிழ் மற்றும் ஆங்கில படிப்படியான விடைகள்'));
  setText(root, '[data-el="feat-4-title"]', t('Student Learning DNA', 'மாணவர் கற்றல் சுயவிவரம்'));
  setText(root, '[data-el="feat-4-sub"]', t('Direct question-level diagnostic', 'ஒவ்வொரு கேள்விக்குமான கற்றல் பகுப்பாய்வு'));

  setText(root, '[data-el="login-auth-schools"]', t('Authorized for Govt & Aided Higher Secondary Schools', 'அரசு மற்றும் அரசு உதவி பெறும் மேல்நிலைப் பள்ளிகளுக்கானது'));
  setText(root, '[data-el="login-gateway"]', t('TN EMIS Verified Gateway', 'TN EMIS சரிபார்க்கப்பட்ட நுழைவாயில்'));

  qs(root, '#login-lang-en')?.classList.toggle('active-white', appState.language === 'en');
  qs(root, '#login-lang-ta')?.classList.toggle('active-white', appState.language === 'ta');

  setText(root, '[data-el="login-heading"]', t('Sign in to ExamIQ', 'ExamIQ-இல் உள்நுழைக'));
  setText(root, '[data-el="login-subheading"]', t('Enter your administrator credentials to continue', 'நிர்வாகி உள்நுழைவு விவரங்களை உள்ளிட்டு தொடரவும்'));

  const emailEl = qs(root, '#login-email');
  const pwEl = qs(root, '#login-password');
  const remEl = qs(root, '#login-remember');
  if (emailEl) emailEl.value = loginState.email;
  if (pwEl) {
    pwEl.type = loginState.showPassword ? 'text' : 'password';
    pwEl.value = loginState.password;
  }
  if (remEl) remEl.checked = Boolean(loginState.rememberTerminal);

  setText(root, '[data-el="pw-eye-icon"]', loginState.showPassword ? 'visibility_off' : 'visibility');
  setText(root, '[data-el="login-forgot"]', t('Forgot Password?', 'கடவுச்சொல் மறந்துவிட்டதா?'));
  setText(root, '[data-el="login-remember-label"]', t('Remember this terminal', 'இந்த சாதனத்தை நினைவில் கொள்'));
  setText(root, '[data-el="login-helpdesk"]', t('EMIS Helpdesk 14417', 'EMIS உதவி மையம் 14417'));

  const submitBtn = qs(root, '[data-el="login-submit-btn"]');
  if (submitBtn) submitBtn.disabled = Boolean(loginState.loading);
  setVisible(root, '[data-el="login-spinner"]', loginState.loading);
  setText(root, '[data-el="login-submit-label"]', t('Sign In to Portal', 'உள்நுழைக'));

  return root;
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
