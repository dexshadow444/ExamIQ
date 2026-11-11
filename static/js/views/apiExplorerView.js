import { apiClient } from '../api/client.js';
import { API_BASE_URL, API_ENDPOINTS } from '../api/endpoints.js';
import { appState, getSelectedEndpoint, showToast, switchApiMode, t, triggerRender } from '../state.js';
import { cloneTemplate, fillSelect, qs, setText, setVisible } from '../utils/dom.js';

function getCurlSnippet(ep) {
  const url = `${API_BASE_URL}${ep.path}`;
  if (ep.method === 'GET') {
    return `curl -X GET "${url}" \\\n  -H "Authorization: Bearer <TOKEN>" \\\n  -H "Accept: application/json"`;
  }
  return `curl -X ${ep.method} "${url}" \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer <TOKEN>" \\\n  -d '${JSON.stringify(ep.requestBody || {}, null, 2)}'`;
}

function getFetchSnippet(ep) {
  const url = `${API_BASE_URL}${ep.path}`;
  return `const response = await fetch("${url}", {\n  method: "${ep.method}",\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer <TOKEN>"\n  }${ep.requestBody ? `,\n  body: JSON.stringify(${JSON.stringify(ep.requestBody, null, 4)})` : ''}\n});\nconst data = await response.json();\nconsole.log(data);`;
}

function getPythonSnippet(ep) {
  const url = `${API_BASE_URL}${ep.path}`;
  return `import requests\n\nurl = "${url}"\nheaders = {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer <TOKEN>"\n}\n${
    ep.requestBody
      ? `payload = ${JSON.stringify(ep.requestBody, null, 4)}\nresponse = requests.${ep.method.toLowerCase()}(url, json=payload, headers=headers)`
      : `response = requests.${ep.method.toLowerCase()}(url, headers=headers)`
  }\n\nprint(response.status_code)\nprint(response.json())`;
}

function activeSnippetText(ep) {
  if (appState.apiSnippetTab === 'fetch') return getFetchSnippet(ep);
  if (appState.apiSnippetTab === 'python') return getPythonSnippet(ep);
  return getCurlSnippet(ep);
}

function methodBadgeClass(m) {
  return m === 'GET' ? 'badge-secondary' : m === 'POST' ? 'badge-primary' : m === 'PUT' ? 'badge-tertiary' : 'badge-error';
}

export function renderApiExplorerView() {
  const root = cloneTemplate('tpl-api-explorer');
  const categories = ['All', ...new Set(API_ENDPOINTS.map((e) => e.category))];
  const filtered =
    appState.apiCategory === 'All'
      ? API_ENDPOINTS
      : API_ENDPOINTS.filter((e) => e.category === appState.apiCategory);
  const selected = getSelectedEndpoint();

  setText(root, '[data-el="page-title"]', t('Backend API Explorer & Integration Contracts', 'பின்தள API விவரக்குறிப்பு & சோதனை மையம்'));
  setText(root, '[data-el="download-label"]', t('Download OpenAPI (JSON)', 'OpenAPI (JSON) பதிவிறக்கு'));
  setText(root, '[data-el="base-url-label"]', t('Target Backend Base URL:', 'பின்தள முகவரி:'));
  setText(root, '[data-el="base-url-val"]', API_BASE_URL);

  const mockBtn = qs(root, '#api-exp-mock');
  const liveBtn = qs(root, '#api-exp-live');
  if (mockBtn) {
    mockBtn.classList.toggle('active-white', appState.apiMode === 'mock');
    mockBtn.style.color = appState.apiMode !== 'mock' ? '#fff' : '';
  }
  if (liveBtn) {
    liveBtn.classList.toggle('active-secondary', appState.apiMode === 'live');
    liveBtn.style.color = appState.apiMode !== 'live' ? '#fff' : '';
  }

  setText(root, '[data-el="cat-label"]', t('Endpoint Category:', 'API பிரிவு:'));
  fillSelect(
    qs(root, '#api-category-select'),
    categories.map((cat) => ({ value: cat, label: cat })),
    appState.apiCategory
  );
  setText(root, '[data-el="ep-count"]', `${filtered.length} Endpoints`);

  const epList = qs(root, '[data-el="ep-list"]');
  filtered.forEach((ep) => {
    const globalIdx = API_ENDPOINTS.indexOf(ep);
    const isSelected = globalIdx === appState.selectedEndpointIdx;
    const item = cloneTemplate('tpl-api-ep-item');
    item.setAttribute('data-select-ep', String(globalIdx));
    item.style.borderColor = isSelected ? 'var(--primary)' : 'var(--surface-container)';
    item.style.boxShadow = isSelected ? '0 0 0 1px var(--primary)' : 'var(--shadow-1)';

    const mEl = qs(item, '[data-el="ep-method"]');
    if (mEl) {
      mEl.className = `badge font-mono ${methodBadgeClass(ep.method)}`;
      mEl.textContent = ep.method;
    }
    setText(item, '[data-el="ep-path"]', ep.path);
    setText(item, '[data-el="ep-summary"]', ep.summary);
    setText(item, '[data-el="ep-category"]', ep.category);
    epList.appendChild(item);
  });

  const selMethod = qs(root, '[data-el="sel-method"]');
  if (selMethod) {
    selMethod.className = `badge font-mono ${methodBadgeClass(selected.method)}`;
    selMethod.textContent = selected.method;
  }
  setText(root, '[data-el="sel-path"]', selected.path);
  setText(root, '[data-el="sel-summary"]', selected.summary);
  setText(root, '[data-el="sel-desc"]', selected.description);

  setVisible(root, '[data-el="req-body-wrap"]', Boolean(selected.requestBody));
  if (selected.requestBody) {
    setText(root, '[data-el="req-body-label"]', t('Request Body (JSON Schema)', 'கோரிக்கை உள்ளடக்கம் (JSON Schema)'));
    setText(root, '[data-el="req-body-pre"]', JSON.stringify(selected.requestBody, null, 2));
  }

  root.querySelectorAll('[data-snip-tab]').forEach((tabBtn) => {
    tabBtn.classList.toggle('active-white', tabBtn.getAttribute('data-snip-tab') === appState.apiSnippetTab);
  });
  setText(root, '[data-el="snippet-pre"]', activeSnippetText(selected));
  setText(root, '[data-el="copy-label"]', t('Copy', 'நகலெடு'));

  const testBtn = qs(root, '#btn-test-endpoint');
  if (testBtn) testBtn.disabled = Boolean(appState.apiTesting);
  setVisible(root, '[data-el="test-spinner"]', appState.apiTesting);
  setVisible(root, '[data-el="test-icon"]', !appState.apiTesting);
  setText(root, '[data-el="test-label"]', appState.apiTesting
    ? 'Testing Endpoint...'
    : `Test Endpoint (${appState.apiMode.toUpperCase()} MODE)`);

  setVisible(root, '[data-el="test-result-wrap"]', Boolean(appState.apiTestResult));
  if (appState.apiTestResult) {
    setText(root, '[data-el="test-status"]', `${appState.apiTestResult.status} ${appState.apiTestResult.statusText || ''}`);
    setVisible(root, '[data-el="test-hint"]', Boolean(appState.apiTestResult.hint));
    if (appState.apiTestResult.hint) setText(root, '[data-el="test-hint"]', appState.apiTestResult.hint);
    setText(
      root,
      '[data-el="test-json"]',
      JSON.stringify(appState.apiTestResult.data || appState.apiTestResult.simulatedFallback, null, 2)
    );
  }

  return root;
}

export function bindApiExplorerEvents() {
  document.getElementById('api-exp-mock')?.addEventListener('click', () => switchApiMode('mock'));
  document.getElementById('api-exp-live')?.addEventListener('click', () => switchApiMode('live'));

  document.getElementById('api-category-select')?.addEventListener('change', (e) => {
    appState.apiCategory = e.target.value;
    const filtered =
      appState.apiCategory === 'All'
        ? API_ENDPOINTS
        : API_ENDPOINTS.filter((ep) => ep.category === appState.apiCategory);
    const current = API_ENDPOINTS[appState.selectedEndpointIdx];
    if (filtered.length > 0 && !filtered.includes(current)) {
      appState.selectedEndpointIdx = API_ENDPOINTS.indexOf(filtered[0]);
      appState.apiTestResult = null;
    }
    triggerRender();
  });

  document.querySelectorAll('[data-select-ep]').forEach((el) => {
    el.addEventListener('click', () => {
      appState.selectedEndpointIdx = Number(el.getAttribute('data-select-ep'));
      appState.apiTestResult = null;
      triggerRender();
    });
  });

  document.querySelectorAll('[data-snip-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      appState.apiSnippetTab = btn.getAttribute('data-snip-tab');
      triggerRender();
    });
  });

  document.getElementById('btn-copy-snippet')?.addEventListener('click', async () => {
    const ep = getSelectedEndpoint();
    try {
      await navigator.clipboard.writeText(activeSnippetText(ep));
      showToast('Code snippet copied to clipboard!', 'success');
    } catch (err) {
      showToast('Could not access clipboard in this browser context', 'warning');
    }
  });

  document.getElementById('btn-test-endpoint')?.addEventListener('click', async () => {
    const ep = getSelectedEndpoint();
    appState.apiTesting = true;
    triggerRender();
    showToast(`Dispatching test request to: ${ep.method} ${ep.path}`, 'info');
    const result = await apiClient.testEndpoint(ep);
    appState.apiTestResult = result;
    appState.apiTesting = false;
    if (result.error) {
      showToast('Live backend not reachable, displaying contract mock sample.', 'warning');
    } else {
      showToast(`Response received: ${result.status}`, 'success');
    }
    triggerRender();
  });

  document.getElementById('btn-download-openapi')?.addEventListener('click', () => {
    const spec = {
      openapi: '3.0.3',
      info: {
        title: 'JM Vertex ExamIQ — Backend REST API Specification',
        description: 'Complete API contracts for linking the HTML/CSS/JS + Python frontend to your backend server.',
        version: '1.0.0'
      },
      servers: [{ url: API_BASE_URL, description: 'Backend API Server' }],
      paths: API_ENDPOINTS.reduce((acc, ep) => {
        const path = ep.path.replace(/:([a-zA-Z]+)/g, '{$1}');
        acc[path] = acc[path] || {};
        acc[path][ep.method.toLowerCase()] = {
          tags: [ep.category],
          summary: ep.summary,
          description: ep.description,
          requestBody: ep.requestBody
            ? { content: { 'application/json': { schema: { type: 'object', example: ep.requestBody } } } }
            : undefined,
          responses: {
            200: {
              description: 'Successful Response',
              content: { 'application/json': { schema: { type: 'object', example: ep.responseSample } } }
            }
          }
        };
        return acc;
      }, {})
    };
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'examiq-openapi-spec.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('OpenAPI 3.0 JSON specification downloaded!', 'success');
  });
}
