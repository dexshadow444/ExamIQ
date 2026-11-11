import { SCHOOL_DATA } from '../data/mockData.js';
import { appState, showToast, t, triggerRender } from '../state.js';
import { cloneTemplate, qs, setText, setVisible } from '../utils/dom.js';

const AUDIT_LOGS = [
  { id: 'LOG-9821', user: 'K. Meenakshi Sundaram (PGT)', action: 'Enforced Teaching Progress Lock on Class 12-A', time: '10 Nov 2024, 18:30:12', ip: '10.24.1.84', status: 'Success' },
  { id: 'LOG-9820', user: 'K. Meenakshi Sundaram (PGT)', action: 'Approved Evaluation EVAL-2024-UT2-014 (+0.5 marks adjusted)', time: '10 Nov 2024, 17:15:45', ip: '10.24.1.84', status: 'Success' },
  { id: 'LOG-9819', user: 'System AI Engine', action: 'DGE March 2024 Answer Keys OCR ingestion completed', time: '10 Nov 2024, 14:02:11', ip: 'ELCOT-DC-TN01', status: 'Success' },
  { id: 'LOG-9818', user: 'Principal Office', action: 'Multi-School Isolation Policy Verified for AY 2024–25', time: '09 Nov 2024, 11:20:00', ip: '10.24.1.10', status: 'Success' }
];

export function renderAdminSecurityView() {
  const root = cloneTemplate('tpl-admin-security');

  setText(root, '[data-el="page-title"]', t('Platform Administration & Security', 'தள நிர்வாகம் & பாதுகாப்பு மையம்'));
  setText(root, '[data-el="dc-status"]', t('State Data Center (ELCOT) Connected', 'மாநில தரவு மையம் (ELCOT) இணைக்கப்பட்டது'));

  const schoolsGrid = qs(root, '[data-el="schools-grid"]');
  SCHOOL_DATA.schools.forEach((sch) => {
    const selected = appState.currentSchool.id === sch.id;
    const card = cloneTemplate('tpl-admin-school-card');
    card.setAttribute('data-select-school', sch.id);
    card.style.background = selected ? 'rgba(226,223,255,0.3)' : 'var(--surface-container-low)';
    card.style.borderColor = selected ? 'var(--primary)' : 'var(--surface-container)';
    setText(card, '[data-el="udise"]', `U-DISE: ${sch.id}`);
    setVisible(card, '[data-el="check-icon"]', selected);
    setText(card, '[data-el="name"]', sch.name);
    setText(card, '[data-el="meta"]', `${sch.district} District • ${sch.type}`);
    schoolsGrid.appendChild(card);
  });

  setText(root, '[data-el="sec1-title"]', t('Encryption in Transit & At Rest', 'தரவு பரிமாற்றம் மற்றும் சேமிப்பில் குறியாக்கம்'));
  setText(root, '[data-el="sec2-title"]', t('Role-Based Access Control (RBAC)', 'பங்கு அடிப்படையிலான அணுகல் கட்டுப்பாடு (RBAC)'));
  setText(root, '[data-el="sec3-title"]', t('Curricular Guardrail Enforcement', 'பாடத்திட்ட பாதுகாப்பு விதிகள்'));

  setText(root, '[data-el="audit-title"]', t('System Audit Trail & Security Event Logs', 'கணினி தணிக்கைப் பதிவு மற்றும் பாதுகாப்பு நிகழ்வுகள்'));
  setText(root, '[data-el="th-user"]', t('Authorized User', 'அங்கீகரிக்கப்பட்ட பயனர்'));
  setText(root, '[data-el="th-action"]', t('Action Summary', 'செயல் விவரம்'));
  setText(root, '[data-el="th-status"]', t('Status', 'நிலை'));

  const tbody = qs(root, '[data-el="audit-tbody"]');
  AUDIT_LOGS.forEach((log) => {
    const row = cloneTemplate('tpl-admin-audit-row');
    setText(row, '[data-el="id"]', log.id);
    setText(row, '[data-el="user"]', log.user);
    setText(row, '[data-el="action"]', log.action);
    setText(row, '[data-el="time"]', log.time);
    setText(row, '[data-el="ip"]', log.ip);
    setText(row, '[data-el="status"]', log.status);
    tbody.appendChild(row);
  });

  return root;
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
