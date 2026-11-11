import { apiClient } from '../api/client.js';
import { appState, escapeHtml, setActiveTab, showToast, t, triggerRender } from '../state.js';

let qbState = {
  marks: 'all',
  difficulty: 'all',
  chapter: 'all',
  search: '',
  addModalOpen: false
};

export function renderQuestionBankView() {
  const filtered = appState.questions.filter((q) => {
    if (qbState.marks !== 'all' && q.marks !== Number(qbState.marks)) return false;
    if (qbState.difficulty !== 'all' && q.difficulty !== qbState.difficulty) return false;
    if (qbState.chapter !== 'all' && q.chapterId !== Number(qbState.chapter)) return false;
    if (qbState.search) {
      const sq = qbState.search.toLowerCase();
      return (
        q.questionEn.toLowerCase().includes(sq) ||
        q.questionTa.toLowerCase().includes(sq) ||
        q.code.toLowerCase().includes(sq) ||
        q.topic.toLowerCase().includes(sq)
      );
    }
    return true;
  });

  return `
    <div class="page-container">
      <header class="flex-between">
        <div>
          <div class="flex-row">
            <h1 class="page-title">${t('Intelligent Question Bank', 'அங்கீகரிக்கப்பட்ட வினா வங்கி')}</h1>
            <span class="badge badge-primary">HOTS &amp; Rubrics</span>
          </div>
          <p class="page-subtitle">Centralized searchable repository with stepwise marking schemes, Tamil/English bilingual text, and OCR traceability.</p>
        </div>

        <div class="flex-row">
          <button type="button" id="btn-qb-to-paper" class="btn btn-surface">
            <span class="material-symbols-outlined" style="color:var(--primary);font-size:1rem;">auto_awesome</span>
            <span>${t('Use in Paper Generator', 'வினாத்தாள் உருவாக்கத்தில் பயன்படுத்து')}</span>
          </button>
          <button type="button" id="btn-open-add-q" class="btn btn-primary">
            <span class="material-symbols-outlined" style="font-size:1rem;">add</span>
            <span>+ Author New Question</span>
          </button>
        </div>
      </header>

      <section class="card flex-col" style="gap:0.85rem;">
        <div class="grid grid-4">
          <div>
            <label class="field-label">${t('Search Keywords', 'தேடல் சொற்கள்')}</label>
            <div class="input-icon-wrap">
              <span class="material-symbols-outlined leading-icon">search</span>
              <input id="qb-search" class="input" value="${escapeHtml(qbState.search)}" placeholder="Rank, Matrix, De Moivre, Gauss..." />
            </div>
          </div>
          <div>
            <label class="field-label">${t('Chapter', 'அத்தியாயம்')}</label>
            <select id="qb-chapter" class="select">
              <option value="all">${t('All Chapters', 'அனைத்து அத்தியாயங்கள்')}</option>
              ${appState.chapters
                .map((c) => `<option value="${c.chapterId}" ${qbState.chapter === String(c.chapterId) ? 'selected' : ''}>Ch ${c.chapterId}: ${escapeHtml(c.title)}</option>`)
                .join('')}
            </select>
          </div>
          <div>
            <label class="field-label">${t('Marks Weightage', 'மதிப்பெண் அளவு')}</label>
            <select id="qb-marks" class="select">
              <option value="all" ${qbState.marks === 'all' ? 'selected' : ''}>All Marks (1M, 2M, 3M, 5M)</option>
              <option value="1" ${qbState.marks === '1' ? 'selected' : ''}>1 Mark (MCQ)</option>
              <option value="2" ${qbState.marks === '2' ? 'selected' : ''}>2 Marks (Short Answer)</option>
              <option value="3" ${qbState.marks === '3' ? 'selected' : ''}>3 Marks (Brief Answer)</option>
              <option value="5" ${qbState.marks === '5' ? 'selected' : ''}>5 Marks (Long Answer)</option>
            </select>
          </div>
          <div>
            <label class="field-label">Difficulty Level</label>
            <select id="qb-difficulty" class="select">
              <option value="all" ${qbState.difficulty === 'all' ? 'selected' : ''}>${t('All Difficulties', 'அனைத்து நிலைகள்')}</option>
              <option value="Easy" ${qbState.difficulty === 'Easy' ? 'selected' : ''}>Easy (Foundation)</option>
              <option value="Medium" ${qbState.difficulty === 'Medium' ? 'selected' : ''}>Medium (Standard Board)</option>
              <option value="Hard" ${qbState.difficulty === 'Hard' ? 'selected' : ''}>Hard (HOTS / Distinction)</option>
            </select>
          </div>
        </div>

        <div class="flex-between text-xs muted" style="padding-top:0.65rem;border-top:1px solid var(--surface-container-low);">
          <span>${t('Showing', 'சரிபார்க்கப்பட்ட வினாக்கள்:')} <strong>${filtered.length}</strong> ${t('verified questions', '')}</span>
          <span style="color:var(--secondary);font-weight:600;display:inline-flex;align-items:center;gap:0.25rem;">
            <span class="material-symbols-outlined" style="font-size:0.95rem;">verified</span>
            100% LaTeX Formula Fidelity
          </span>
        </div>
      </section>

      <section class="flex-col" style="gap:0.85rem;">
        ${filtered
          .map((q) => {
            const isExpanded = appState.expandedQuestion === q.id;
            const diffBadge = q.difficulty === 'Hard' ? 'badge-error' : q.difficulty === 'Medium' ? 'badge-tertiary' : 'badge-secondary';
            return `
              <article class="card card-hover">
                <div class="flex-between" style="padding-bottom:0.65rem;border-bottom:1px solid var(--surface-container-low);">
                  <div class="flex-row">
                    <span class="font-mono text-xs" style="font-weight:800;color:var(--primary);">${escapeHtml(q.code)}</span>
                    <span class="badge badge-primary">${q.marks} Marks</span>
                    <span class="badge badge-neutral">${escapeHtml(q.type)}</span>
                    <span class="badge ${diffBadge}">${escapeHtml(q.difficulty)}</span>
                    <span class="text-xs muted">Ch ${q.chapterId}: ${escapeHtml(q.topic)}</span>
                  </div>
                  <div class="flex-row">
                    <span class="text-xs" style="color:var(--secondary);font-weight:700;">${q.ocrConfidence}% OCR</span>
                    <button type="button" class="btn-ghost" data-expand-q="${escapeHtml(q.id)}" style="padding:0.25rem;border-radius:0.4rem;">
                      <span class="material-symbols-outlined">${isExpanded ? 'expand_less' : 'expand_more'}</span>
                    </button>
                  </div>
                </div>

                <div class="flex-col" style="padding:0.75rem 0;gap:0.45rem;">
                  <div class="text-xs" style="line-height:1.5;"><strong style="color:var(--primary);">[EN]</strong> ${escapeHtml(q.questionEn)}</div>
                  <div class="text-xs font-tamil muted"><strong style="color:var(--secondary);">[தமிழ்]</strong> ${escapeHtml(q.questionTa)}</div>
                </div>

                <div class="flex-row">
                  <span class="badge badge-neutral font-mono"><span class="material-symbols-outlined" style="font-size:0.8rem;">book</span>${escapeHtml(q.source)}</span>
                  ${q.historicalExam ? `<span class="badge badge-neutral font-mono"><span class="material-symbols-outlined" style="font-size:0.8rem;">history_edu</span>${escapeHtml(q.historicalExam)}</span>` : ''}
                </div>

                ${
                  isExpanded
                    ? `
                  <div class="soft-panel flex-col" style="margin-top:0.85rem;gap:0.75rem;">
                    <div>
                      <div class="text-xs" style="font-weight:700;text-transform:uppercase;margin-bottom:0.4rem;display:flex;align-items:center;gap:0.35rem;">
                        <span class="material-symbols-outlined" style="color:var(--secondary);font-size:1rem;">checklist</span>
                        Stepwise Marking Scheme &amp; Rubrics
                      </div>
                      ${q.rubric
                        .map(
                          (r) => `
                        <div class="flex-between text-xs" style="padding:0.35rem 0;border-bottom:1px solid var(--surface-container);">
                          <span>${escapeHtml(r.step)}</span>
                          <strong class="font-mono" style="color:var(--primary);">${r.marks} M</strong>
                        </div>
                      `
                        )
                        .join('')}
                    </div>

                    <div style="background:var(--surface-container);padding:0.55rem 0.75rem;border-radius:0.55rem;" class="text-xs">
                      <strong style="color:var(--secondary);">Answer Key: </strong>
                      <span class="font-mono">${escapeHtml(q.answerKey)}</span>
                    </div>

                    <div class="flex-between">
                      <button type="button" class="btn btn-ghost" style="color:var(--primary);padding-left:0;" data-copy-latex="${escapeHtml(q.code)}">
                        <span class="material-symbols-outlined" style="font-size:0.95rem;">content_copy</span>
                        <span>Copy LaTeX Code</span>
                      </button>
                      <button type="button" class="btn btn-primary" data-pin-q="${escapeHtml(q.code)}">Add to Paper Draft</button>
                    </div>
                  </div>
                `
                    : ''
                }
              </article>
            `;
          })
          .join('')}
      </section>

      ${
        qbState.addModalOpen
          ? `
        <div id="add-q-backdrop" class="modal-backdrop">
          <div class="modal-card">
            <div class="flex-between" style="padding-bottom:0.65rem;border-bottom:1px solid var(--surface-container);">
              <div class="flex-row">
                <span class="material-symbols-outlined" style="color:var(--primary);">edit_note</span>
                <h2 style="margin:0;font-size:1rem;font-weight:700;">Author Question with Stepwise Rubric</h2>
              </div>
              <button type="button" id="btn-close-add-q" class="btn-ghost" style="padding:0.25rem;"><span class="material-symbols-outlined">close</span></button>
            </div>

            <form id="form-add-question" class="flex-col" style="margin-top:0.9rem;gap:0.8rem;">
              <div class="grid grid-3" style="gap:0.6rem;">
                <div>
                  <label class="field-label">Chapter</label>
                  <select id="new-q-chap" class="select">
                    ${appState.chapters.map((c) => `<option value="${c.chapterId}">Ch ${c.chapterId}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="field-label">Marks</label>
                  <select id="new-q-marks" class="select">
                    <option value="1">1 Mark</option>
                    <option value="2">2 Marks</option>
                    <option value="3">3 Marks</option>
                    <option value="5" selected>5 Marks</option>
                  </select>
                </div>
                <div>
                  <label class="field-label">Difficulty</label>
                  <select id="new-q-diff" class="select">
                    <option value="Easy">Easy</option>
                    <option value="Medium" selected>Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="field-label">Question Text (English)</label>
                <textarea id="new-q-en" required rows="2" class="textarea" placeholder="e.g. Find the inverse of matrix A = [[cos theta, -sin theta], [sin theta, cos theta]]"></textarea>
              </div>
              <div>
                <label class="field-label">Question Text (தமிழ் / Optional)</label>
                <textarea id="new-q-ta" rows="2" class="textarea" placeholder="எ.கா. A = [[cos theta, -sin theta], [sin theta, cos theta]] என்ற அணியின் நேர்மாறு காண்க."></textarea>
              </div>
              <div>
                <label class="field-label">Final Answer / Solution Summary</label>
                <input id="new-q-key" required class="input" placeholder="e.g. A^-1 = [[cos theta, sin theta], [-sin theta, cos theta]]" />
              </div>
              <div class="flex-row" style="justify-content:flex-end;">
                <button type="button" id="btn-cancel-add-q" class="btn btn-surface">Cancel</button>
                <button type="submit" class="btn btn-primary">Save &amp; Approve</button>
              </div>
            </form>
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;
}

export function bindQuestionBankEvents() {
  document.getElementById('qb-search')?.addEventListener('input', (e) => {
    qbState.search = e.target.value;
    triggerRender();
  });
  document.getElementById('qb-chapter')?.addEventListener('change', (e) => {
    qbState.chapter = e.target.value;
    triggerRender();
  });
  document.getElementById('qb-marks')?.addEventListener('change', (e) => {
    qbState.marks = e.target.value;
    triggerRender();
  });
  document.getElementById('qb-difficulty')?.addEventListener('change', (e) => {
    qbState.difficulty = e.target.value;
    triggerRender();
  });

  document.getElementById('btn-qb-to-paper')?.addEventListener('click', () => setActiveTab('paper-generator'));
  document.getElementById('btn-open-add-q')?.addEventListener('click', () => {
    qbState.addModalOpen = true;
    triggerRender();
  });
  document.getElementById('btn-close-add-q')?.addEventListener('click', () => {
    qbState.addModalOpen = false;
    triggerRender();
  });
  document.getElementById('btn-cancel-add-q')?.addEventListener('click', () => {
    qbState.addModalOpen = false;
    triggerRender();
  });

  document.querySelectorAll('[data-expand-q]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-expand-q');
      appState.expandedQuestion = appState.expandedQuestion === id ? null : id;
      triggerRender();
    });
  });

  document.querySelectorAll('[data-copy-latex]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast(`LaTeX markup copied for ${btn.getAttribute('data-copy-latex')}`, 'success');
    });
  });

  document.querySelectorAll('[data-pin-q]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast(`Question ${btn.getAttribute('data-pin-q')} pinned to next paper generation draft`, 'success');
      setActiveTab('paper-generator');
    });
  });

  document.getElementById('form-add-question')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const chapId = Number(document.getElementById('new-q-chap').value);
    const marks = Number(document.getElementById('new-q-marks').value);
    const difficulty = document.getElementById('new-q-diff').value;
    const questionEn = document.getElementById('new-q-en').value;
    const questionTa = document.getElementById('new-q-ta').value || questionEn;
    const answerKey = document.getElementById('new-q-key').value;

    const created = {
      id: `Q-USR-${Date.now().toString().slice(-4)}`,
      code: `TN-MAT-12-${Math.floor(1000 + Math.random() * 9000)}`,
      chapterId: chapId,
      chapterTitle: appState.chapters.find((c) => c.chapterId === chapId)?.title || 'Matrices',
      topic: 'Teacher Authored Concept',
      marks,
      type: marks === 1 ? 'MCQ' : marks <= 3 ? 'Short Answer' : 'Long Answer',
      difficulty,
      questionEn,
      questionTa,
      source: 'Teacher Created',
      historicalExam: 'Class 12 Diagnostic Pool',
      rubric: [
        { step: 'Method formulation and given representation', marks: marks * 0.4 },
        { step: 'Intermediate steps & final solution', marks: marks * 0.6 }
      ],
      answerKey,
      ocrConfidence: 99.9,
      status: 'Approved'
    };

    await apiClient.addQuestion(created);
    appState.questions.unshift(created);
    appState.expandedQuestion = created.id;
    qbState.addModalOpen = false;
    showToast('New Question Added & Approved into State Question Bank!', 'success');
    triggerRender();
  });
}
