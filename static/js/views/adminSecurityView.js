import { SCHOOL_DATA } from '../data/mockData.js';
import { appState, escapeHtml, showToast, t, triggerRender } from '../state.js';

const AUDIT_LOGS = [
  { id: 'LOG-9821', user: 'K. Meenakshi Sundaram (PGT)', action: 'Enforced Teaching Progress Lock on Class 12-A', time: '10 Nov 2024, 18:30:12', ip: '10.24.1.84', status: 'Success' },
  { id: 'LOG-9820', user: 'K. Meenakshi Sundaram (PGT)', action: 'Approved Evaluation EVAL-2024-UT2-014 (+0.5 marks adjusted)', time: '10 Nov 2024, 17:15:45', ip: '10.24.1.84', status: 'Success' },
  { id: 'LOG-9819', user: 'System AI Engine', action: 'DGE March 2024 Answer Keys OCR ingestion completed', time: '10 Nov 2024, 14:02:11', ip: 'ELCOT-DC-TN01', status: 'Success' },
  { id: 'LOG-9818', user: 'Principal Office', action: 'Multi-School Isolation Policy Verified for AY 2024–25', time: '09 Nov 2024, 11:20:00', ip: '10.24.1.10', status: 'Success' }
];

export function renderAdminSecurityView() {
  return `
    <div class="page-container">
      <header class="flex-between">
        <div>
          <div class="flex-row">
            <h1 class="page-title">${t('Platform Administration & Security', 'தள நிர்வாகம் & பாதுகாப்பு மையம்')}</h1>
            <span class="badge badge-secondary">ELCOT Secured</span>
          </div>
          <p class="page-subtitle">Multi-school tenant isolation, role-based access control (RBAC), and immutable audit logs.</p>
        </div>

        <div class="flex-row text-xs" style="color:var(--secondary);font-weight:700;">
          <span style="width:0.6rem;height:0.6rem;border-radius:50%;background:var(--secondary);"></span>
          <span>${t('State Data Center (ELCOT) Connected', 'மாநில தரவு மையம் (ELCOT) இணைக்கப்பட்டது')}</span>
        </div>
      </header>

      <section class="card">
        <div class="text-xs" style="font-weight:700;text-transform:uppercase;margin-bottom:0.7rem;">Multi-School Tenancy &amp; School Data Isolation</div>
        <div class="grid grid-4">
          ${SCHOOL_DATA.schools
            .map((sch) => {
              const selected = appState.currentSchool.id === sch.id;
              return `
              <div
                data-select-school="${escapeHtml(sch.id)}"
                class="card"
                style="padding:0.85rem;cursor:pointer;box-shadow:none;background:${selected ? 'rgba(226,223,255,0.3)' : 'var(--surface-container-low)'};border-color:${selected ? 'var(--primary)' : 'var(--surface-container)'};"
              >
                <div class="flex-between" style="margin-bottom:0.35rem;">
                  <span class="font-mono" style="font-size:0.68rem;color:var(--outline);">U-DISE: ${escapeHtml(sch.id)}</span>
                  ${selected ? '<span class="material-symbols-outlined" style="color:var(--primary);font-size:1rem;">check_circle</span>' : ''}
                </div>
                <div class="text-xs" style="font-weight:700;line-height:1.3;">${escapeHtml(sch.name)}</div>
                <div class="muted" style="font-size:0.7rem;margin-top:0.25rem;">${escapeHtml(sch.district)} District • ${escapeHtml(sch.type)}</div>
              </div>
            `;
            })
            .join('')}
        </div>
      </section>

      <section class="grid grid-3">
        <div class="card">
          <div class="flex-row" style="color:var(--secondary);font-weight:700;font-size:0.82rem;margin-bottom:0.35rem;">
            <span class="material-symbols-outlined">enhanced_encryption</span>
            <span>${t('Encryption in Transit & At Rest', 'தரவு பரிமாற்றம் மற்றும் சேமிப்பில் குறியாக்கம்')}</span>
          </div>
          <p class="text-xs muted" style="margin:0;line-height:1.5;">256-bit AES database encryption with TLS 1.3 endpoints strictly isolated across school partitions.</p>
        </div>
        <div class="card">
          <div class="flex-row" style="color:var(--primary);font-weight:700;font-size:0.82rem;margin-bottom:0.35rem;">
            <span class="material-symbols-outlined">admin_panel_settings</span>
            <span>${t('Role-Based Access Control (RBAC)', 'பங்கு அடிப்படையிலான அணுகல் கட்டுப்பாடு (RBAC)')}</span>
          </div>
          <p class="text-xs muted" style="margin:0;line-height:1.5;">Strict separation of duties between Teaching Staff, External Evaluators, School Admins, and Students.</p>
        </div>
        <div class="card">
          <div class="flex-row" style="color:var(--tertiary);font-weight:700;font-size:0.82rem;margin-bottom:0.35rem;">
            <span class="material-symbols-outlined">policy</span>
            <span>${t('Curricular Guardrail Enforcement', 'பாடத்திட்ட பாதுகாப்பு விதிகள்')}</span>
          </div>
          <p class="text-xs muted" style="margin:0;line-height:1.5;">Automated compliance engine prevents unauthorized publication of unapproved AI-generated exam papers.</p>
        </div>
      </section>

      <section class="card" style="padding:0;overflow:hidden;">
        <div class="flex-between" style="padding:0.75rem 1rem;background:var(--surface-container-low);border-bottom:1px solid var(--surface-container);font-size:0.78rem;font-weight:700;">
          <span>${t('System Audit Trail & Security Event Logs', 'கணினி தணிக்கைப் பதிவு மற்றும் பாதுகாப்பு நிகழ்வுகள்')}</span>
          <span class="font-mono muted">Compliance: ISO 27001 / TN-DGE</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>${t('Authorized User', 'அங்கீகரிக்கப்பட்ட பயனர்')}</th>
                <th>${t('Action Summary', 'செயல் விவரம்')}</th>
                <th>Timestamp</th>
                <th>IP / Terminal</th>
                <th>${t('Status', 'நிலை')}</th>
              </tr>
            </thead>
            <tbody>
              ${AUDIT_LOGS.map(
                (log) => `
                <tr>
                  <td class="font-mono" style="font-weight:700;color:var(--primary);">${escapeHtml(log.id)}</td>
                  <td><strong>${escapeHtml(log.user)}</strong></td>
                  <td>${escapeHtml(log.action)}</td>
                  <td class="font-mono muted">${escapeHtml(log.time)}</td>
                  <td class="font-mono muted">${escapeHtml(log.ip)}</td>
                  <td><span class="badge badge-secondary">${escapeHtml(log.status)}</span></td>
                </tr>
              `
              ).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

export function bindAdminSecurityEvents() {
  document.querySelectorAll('[data-select-school]').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-select-school');
      const found = SCHOOL_DATA.schools.find((s) => s.id === id);
      if (found) {
        appState.currentSchool = found;
        showToast(`Switched active school tenant to: ${found.name}`, 'info');
        triggerRender();
      }
    });
  });
}
