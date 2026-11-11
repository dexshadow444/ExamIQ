import { bindHeaderEvents, renderHeader } from './components/header.js';
import { bindSearchModalEvents, renderSearchModal } from './components/searchModal.js';
import { bindSidebarEvents, renderSidebar } from './components/sidebar.js';
import { appState, registerRenderer, renderToasts, triggerRender } from './state.js';

import { bindAdminSecurityEvents, renderAdminSecurityView } from './views/adminSecurityView.js';
import { bindAnswerEvaluationEvents, renderAnswerEvaluationView } from './views/answerEvaluationView.js';
import { bindApiExplorerEvents, renderApiExplorerView } from './views/apiExplorerView.js';
import { bindAssessmentsEvents, renderAssessmentsView } from './views/assessmentsView.js';
import { bindDashboardEvents, renderDashboardView } from './views/dashboardView.js';
import { bindLoginEvents, renderLoginView } from './views/loginView.js';
import { bindMarksManagementEvents, renderMarksManagementView } from './views/marksManagementView.js';
import { bindPaperGeneratorEvents, renderPaperGeneratorView } from './views/paperGeneratorView.js';
import { bindQuestionBankEvents, renderQuestionBankView } from './views/questionBankView.js';
import { bindRemedialLearningEvents, renderRemedialLearningView } from './views/remedialLearningView.js';
import { bindReportsAnalyticsEvents, renderReportsAnalyticsView } from './views/reportsAnalyticsView.js';
import { bindResourceHubEvents, renderResourceHubView } from './views/resourceHubView.js';
import { bindStudentLearningDnaEvents, renderStudentLearningDnaView } from './views/studentLearningDnaView.js';
import { bindTeachingProgressEvents, renderTeachingProgressView } from './views/teachingProgressView.js';
import { bindVocationalModuleEvents, renderVocationalModuleView } from './views/vocationalModuleView.js';

const VIEW_REGISTRY = {
  dashboard: { render: renderDashboardView, bind: bindDashboardEvents },
  'teaching-progress': { render: renderTeachingProgressView, bind: bindTeachingProgressEvents },
  'resource-hub': { render: renderResourceHubView, bind: bindResourceHubEvents },
  'question-bank': { render: renderQuestionBankView, bind: bindQuestionBankEvents },
  'paper-generator': { render: renderPaperGeneratorView, bind: bindPaperGeneratorEvents },
  'tests-and-assessments': { render: renderAssessmentsView, bind: bindAssessmentsEvents },
  'answer-evaluation': { render: renderAnswerEvaluationView, bind: bindAnswerEvaluationEvents },
  'marks-management': { render: renderMarksManagementView, bind: bindMarksManagementEvents },
  'student-insights': { render: renderStudentLearningDnaView, bind: bindStudentLearningDnaEvents },
  'remedial-and-homework': { render: renderRemedialLearningView, bind: bindRemedialLearningEvents },
  'vocational-module': { render: renderVocationalModuleView, bind: bindVocationalModuleEvents },
  'reports-center': { render: renderReportsAnalyticsView, bind: bindReportsAnalyticsEvents },
  'admin-and-security': { render: renderAdminSecurityView, bind: bindAdminSecurityEvents },
  'api-explorer': { render: renderApiExplorerView, bind: bindApiExplorerEvents }
};

import { clearChildren, cloneTemplate, qs } from './utils/dom.js';

function renderApp() {
  const appRoot = document.getElementById('app-root');
  const modalRoot = document.getElementById('modal-root');
  if (!appRoot || !modalRoot) return;

  document.documentElement.lang = appState.language;

  if (!appState.isLoggedIn) {
    appRoot.replaceChildren(renderLoginView());
    clearChildren(modalRoot);
    bindLoginEvents();
    renderToasts();
    return;
  }

  const activeView = VIEW_REGISTRY[appState.activeTab] || VIEW_REGISTRY.dashboard;
  const shell = cloneTemplate('tpl-app-shell');

  qs(shell, '[data-slot="sidebar"]')?.replaceWith(renderSidebar());
  qs(shell, '[data-slot="header"]')?.replaceWith(renderHeader());
  qs(shell, '[data-slot="main"]')?.replaceChildren(activeView.render());

  appRoot.replaceChildren(shell);

  const modalNode = renderSearchModal();
  if (modalNode) {
    modalRoot.replaceChildren(modalNode);
  } else {
    clearChildren(modalRoot);
  }

  bindSidebarEvents();
  bindHeaderEvents();
  activeView.bind();
  bindSearchModalEvents();
  renderToasts();
}

registerRenderer(renderApp);

window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (appState.isLoggedIn) {
      appState.searchModalOpen = !appState.searchModalOpen;
      triggerRender();
    }
  } else if (e.key === 'Escape') {
    if (appState.searchModalOpen || appState.notificationsOpen || appState.headerMenuOpen) {
      appState.searchModalOpen = false;
      appState.notificationsOpen = false;
      appState.headerMenuOpen = null;
      triggerRender();
    }
  }
});

document.addEventListener('click', (e) => {
  if ((appState.notificationsOpen || appState.headerMenuOpen) && !e.target.closest('[data-header-dropdown]')) {
    appState.notificationsOpen = false;
    appState.headerMenuOpen = null;
    triggerRender();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});
