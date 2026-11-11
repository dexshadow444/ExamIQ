import { apiClient } from '../api/client.js';
import { API_BASE_URL, API_ENDPOINTS } from '../api/endpoints.js';
import { appState, escapeHtml, getSelectedEndpoint, showToast, switchApiMode, t, triggerRender } from '../state.js';

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

export function renderApiExplorerView() {
  const categories = ['All', ...new Set(API_ENDPOINTS.map((e) => e.category))];
  const filtered =
    appState.apiCategory === 'All'
      ? API_ENDPOINTS
      : API_ENDPOINTS.filter((e) => e.category === appState.apiCategory);
  const selected = getSelectedEndpoint();

  const methodBadge = (m) =>
    m === 'GET' ? 'badge-secondary' : m === 'POST' ? 'badge-primary' : m === 'PUT' ? 'badge-tertiary' : 'badge-error';

  return `
    <div class="page-container">
      <header class="flex-between">
        <div>
          <div class="flex-row">
            <h1 class="page-title">${t('Backend API Explorer & Integration Contracts', 'பின்தள API விவரக்குறிப்பு & சோதனை மையம்')}</h1>
            <span class="badge badge-secondary">Ready for Backend Developer</span>
          </div>
          <p class="page-subtitle">Complete REST endpoints catalog, JSON payload schemas, curl/fetch/Python snippets, and live testing sandbox to link this frontend to your backend.</p>
        </div>

        <button type="button" id="btn-download-openapi" class="btn btn-surface">
          <span class="material-symbols-outlined" style="font-size:1rem;">download</span>
          <span>${t('Download OpenAPI (JSON)', 'OpenAPI (JSON) பதிவிறக்கு')}</span>
        </button>
      </header>

      <section class="card hero-gradient">
        <div class="flex-between" style="gap:1rem;">
          <div>
            <div class="flex-row">
              <strong style="font-size:0.9rem;">${t('Target Backend Base URL:', 'பின்தள முகவரி:')}</strong>
              <code class="font-mono" style="background:rgba(0,0,0,0.3);color:var(--secondary-fixed);padding:0.2rem 0.6rem;border-radius:0.4rem;font-size:0.78rem;">
                ${escapeHtml(API_BASE_URL)}
              </code>
            </div>
            <p class="text-xs" style="margin:0.35rem 0 0;color:var(--on-primary-container);">
              Configure <code class="font-mono">API_BASE_URL</code> in <code class="font-mono">.env</code> (read by Python <code class="font-mono">app.py</code>). Frontend automatically falls back to in-browser mock data when backend is offline.
            </p>
          </div>

          <div class="segmented-pill" style="background:rgba(0,0,0,0.22);">
            <span class="text-xs" style="padding:0 0.45rem;font-weight:700;color:#fff;">Mode:</span>
            <button type="button" id="api-exp-mock" class="segmented-btn ${appState.apiMode === 'mock' ? 'active-white' : ''}" style="${appState.apiMode !== 'mock' ? 'color:#fff;' : ''}">Mock Data</button>
            <button type="button" id="api-exp-live" class="segmented-btn ${appState.apiMode === 'live' ? 'active-secondary' : ''}" style="${appState.apiMode !== 'live' ? 'color:#fff;' : ''}">Live API</button>
          </div>
        </div>
      </section>

      <div class="card flex-between" style="padding:0.85rem 1rem;">
        <div class="flex-row" style="gap:0.6rem;">
          <label for="api-category-select" class="text-xs muted" style="font-weight:700;">${t('Endpoint Category:', 'API பிரிவு:')}</label>
          <select id="api-category-select" class="select" style="width:auto;min-width:18rem;">
            ${categories
              .map(
                (cat) => `<option value="${escapeHtml(cat)}" ${appState.apiCategory === cat ? 'selected' : ''}>${escapeHtml(cat)}</option>`
              )
              .join('')}
          </select>
        </div>
        <span class="badge badge-neutral font-mono">${filtered.length} Endpoints</span>
      </div>

      <div class="grid grid-12" style="gap:1.25rem;align-items:start;">
        <div class="col-span-5 flex-col" style="gap:0.55rem;max-height:46rem;overflow-y:auto;">
          ${filtered
            .map((ep) => {
              const globalIdx = API_ENDPOINTS.indexOf(ep);
              const isSelected = globalIdx === appState.selectedEndpointIdx;
              return `
              <div
                data-select-ep="${globalIdx}"
                class="card"
                style="padding:0.85rem;cursor:pointer;border-color:${isSelected ? 'var(--primary)' : 'var(--surface-container)'};box-shadow:${isSelected ? '0 0 0 1px var(--primary)' : 'var(--shadow-1)'};"
              >
                <div class="flex-row" style="flex-wrap:nowrap;">
                  <span class="badge font-mono ${methodBadge(ep.method)}" style="font-size:0.65rem;">${escapeHtml(ep.method)}</span>
                  <span class="font-mono text-xs" style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(ep.path)}</span>
                </div>
                <div class="text-xs" style="font-weight:600;margin-top:0.35rem;">${escapeHtml(ep.summary)}</div>
                <div class="font-mono" style="font-size:0.68rem;color:var(--outline);margin-top:0.15rem;">${escapeHtml(ep.category)}</div>
              </div>
            `;
            })
            .join('')}
        </div>

        <div class="card card-lg col-span-7 flex-col" style="gap:1.1rem;">
          <div style="padding-bottom:0.85rem;border-bottom:1px solid var(--surface-container);">
            <div class="flex-row" style="margin-bottom:0.35rem;">
              <span class="badge font-mono ${methodBadge(selected.method)}">${escapeHtml(selected.method)}</span>
              <code class="font-mono" style="font-size:0.88rem;font-weight:800;">${escapeHtml(selected.path)}</code>
            </div>
            <h2 style="margin:0;font-size:1rem;font-weight:700;">${escapeHtml(selected.summary)}</h2>
            <p class="text-xs muted" style="margin:0.3rem 0 0;line-height:1.5;">${escapeHtml(selected.description)}</p>
          </div>

          ${
            selected.requestBody
              ? `
            <div>
              <div class="flex-between text-xs" style="margin-bottom:0.4rem;">
                <strong>${t('Request Body (JSON Schema)', 'கோரிக்கை உள்ளடக்கம் (JSON Schema)')}</strong>
                <span class="font-mono muted">application/json</span>
              </div>
              <pre class="code-block">${escapeHtml(JSON.stringify(selected.requestBody, null, 2))}</pre>
            </div>
          `
              : ''
          }

          <div>
            <div class="flex-between" style="padding-bottom:0.35rem;margin-bottom:0.45rem;border-bottom:1px solid var(--surface-container);">
              <strong class="text-xs" style="text-transform:uppercase;">Implementation Snippets</strong>
              <div class="segmented-pill">
                <button type="button" class="segmented-btn ${appState.apiSnippetTab === 'curl' ? 'active-white' : ''}" data-snip-tab="curl">cURL</button>
                <button type="button" class="segmented-btn ${appState.apiSnippetTab === 'fetch' ? 'active-white' : ''}" data-snip-tab="fetch">Fetch (JS)</button>
                <button type="button" class="segmented-btn ${appState.apiSnippetTab === 'python' ? 'active-white' : ''}" data-snip-tab="python">Python Requests</button>
              </div>
            </div>
            <div style="position:relative;">
              <pre class="code-block amber">${escapeHtml(activeSnippetText(selected))}</pre>
              <button type="button" id="btn-copy-snippet" class="btn" style="position:absolute;top:0.5rem;right:0.5rem;padding:0.25rem 0.55rem;background:#1e293b;color:#e2e8f0;font-size:0.68rem;">
                <span class="material-symbols-outlined" style="font-size:0.85rem;">content_copy</span>
                <span>${t('Copy', 'நகலெடு')}</span>
              </button>
            </div>
          </div>

          <div>
            <button type="button" id="btn-test-endpoint" class="btn btn-secondary" style="width:100%;padding:0.7rem;" ${appState.apiTesting ? 'disabled' : ''}>
              ${appState.apiTesting ? '<span class="spinner"></span>' : '<span class="material-symbols-outlined" style="font-size:1.05rem;">play_arrow</span>'}
              <span>${appState.apiTesting ? 'Testing Endpoint...' : `Test Endpoint (${appState.apiMode.toUpperCase()} MODE)`}</span>
            </button>

            ${
              appState.apiTestResult
                ? `
              <div class="soft-panel flex-col" style="margin-top:0.85rem;gap:0.5rem;">
                <div class="flex-between text-xs">
                  <strong>Execution Result:</strong>
                  <strong class="font-mono" style="color:var(--secondary);">${escapeHtml(appState.apiTestResult.status)} ${escapeHtml(appState.apiTestResult.statusText || '')}</strong>
                </div>
                ${appState.apiTestResult.hint ? `<div class="text-xs" style="color:var(--error);font-weight:600;">${escapeHtml(appState.apiTestResult.hint)}</div>` : ''}
                <pre class="code-block emerald">${escapeHtml(JSON.stringify(appState.apiTestResult.data || appState.apiTestResult.simulatedFallback, null, 2))}</pre>
              </div>
            `
                : ''
            }
          </div>
        </div>
      </div>
    </div>
  `;
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
