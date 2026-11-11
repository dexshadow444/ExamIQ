import { apiClient } from '../api/client.js';
import { appState, setActiveTab, showToast, t, triggerRender } from '../state.js';
import { clearChildren, cloneTemplate, fillSelect, qs, setText, setVisible } from '../utils/dom.js';

let qbState = {
  marks: 'all',
  difficulty: 'all',
  chapter: 'all',
  search: '',
  addModalOpen: false
};

function getFilteredQuestions() {
  return appState.questions.filter((q) => {
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
}

function updateCountLabel(countEl, count) {
  if (!countEl) return;
  const strong = document.createElement('strong');
  strong.textContent = String(count);
  const suffix = t('verified questions', '');
  countEl.replaceChildren(
    document.createTextNode(`${t('Showing', 'சரிபார்க்கப்பட்ட வினாக்கள்:')} `),
    strong,
    document.createTextNode(suffix ? ` ${suffix}` : '')
  );
}

function renderQuestionCardsInto(container, filtered) {
  clearChildren(container);
  if (filtered.length === 0) {
    container.appendChild(cloneTemplate('tpl-qb-empty'));
    return;
  }

  filtered.forEach((q) => {
    const card = cloneTemplate('tpl-qb-card');
    const isExpanded = appState.expandedQuestion === q.id;
    const diffBadge = q.difficulty === 'Hard' ? 'badge-error' : q.difficulty === 'Medium' ? 'badge-tertiary' : 'badge-secondary';

    setText(card, '[data-el="q-code"]', q.code);
    setText(card, '[data-el="q-marks"]', `${q.marks} Marks`);
    setText(card, '[data-el="q-type"]', q.type);
    const diffEl = qs(card, '[data-el="q-diff"]');
    if (diffEl) {
      diffEl.className = `badge ${diffBadge}`;
      diffEl.textContent = q.difficulty;
    }
    setText(card, '[data-el="q-topic"]', `Ch ${q.chapterId}: ${q.topic}`);
    setText(card, '[data-el="q-ocr"]', `${q.ocrConfidence}% OCR`);
    qs(card, '[data-el="btn-expand"]')?.setAttribute('data-expand-q', q.id);
    setText(card, '[data-el="expand-icon"]', isExpanded ? 'expand_less' : 'expand_more');

    setText(card, '[data-el="q-en"]', q.questionEn);
    setText(card, '[data-el="q-ta"]', q.questionTa);
    setText(card, '[data-el="q-source"]', q.source);

    setVisible(card, '[data-el="q-exam-wrap"]', Boolean(q.historicalExam));
    if (q.historicalExam) setText(card, '[data-el="q-exam"]', q.historicalExam);

    setVisible(card, '[data-el="q-rubric-panel"]', isExpanded);
    if (isExpanded) {
      const rubricList = qs(card, '[data-el="q-rubric-list"]');
      q.rubric.forEach((r) => {
        const row = cloneTemplate('tpl-qb-rubric-row');
        setText(row, '[data-el="step-text"]', r.step);
        setText(row, '[data-el="step-marks"]', `${r.marks} M`);
        rubricList.appendChild(row);
      });
      setText(card, '[data-el="q-answer"]', q.answerKey);
      qs(card, '[data-el="btn-copy"]')?.setAttribute('data-copy-latex', q.code);
      qs(card, '[data-el="btn-pin"]')?.setAttribute('data-pin-q', q.code);
    }

    container.appendChild(card);
  });
}

function bindQuestionCardEvents() {
  document.querySelectorAll('[data-expand-q]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-expand-q');
      appState.expandedQuestion = appState.expandedQuestion === id ? null : id;
      const listEl = document.getElementById('qb-list-container');
      if (listEl) {
        renderQuestionCardsInto(listEl, getFilteredQuestions());
        bindQuestionCardEvents();
      } else {
        triggerRender();
      }
    });
  });

  document.querySelectorAll('[data-copy-latex]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = btn.getAttribute('data-copy-latex');
      const q = appState.questions.find((item) => item.code === code);
      const text = q ? `${q.questionEn}\nAnswer: ${q.answerKey}` : code;
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        console.warn('Clipboard fallback:', err);
      }
      showToast(`LaTeX markup copied for ${code}`, 'success');
    });
  });

  document.querySelectorAll('[data-pin-q]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast(`Question ${btn.getAttribute('data-pin-q')} pinned to next paper generation draft`, 'success');
      setActiveTab('paper-generator');
    });
  });
}

export function renderQuestionBankView() {
  const root = cloneTemplate('tpl-question-bank');
  const filtered = getFilteredQuestions();
  const hasFilters = qbState.search || qbState.chapter !== 'all' || qbState.marks !== 'all' || qbState.difficulty !== 'all';

  setText(root, '[data-el="qb-title"]', t('Verified Question Bank & Rubrics', 'அங்கீகரிக்கப்பட்ட வினா வங்கி & மதிப்பெண் பிரிவு'));
  setText(root, '[data-el="qb-to-paper-label"]', t('Open Paper Generator', 'வினாத்தாள் உருவாக்கியைத் திற'));
  setText(root, '[data-el="qb-search-label"]', t('Search Question', 'வினா தேடல்'));
  setText(root, '[data-el="qb-chapter-label"]', t('Chapter', 'பாடம்'));
  setText(root, '[data-el="qb-marks-label"]', t('Marks Weightage', 'மதிப்பெண்'));
  setText(root, '[data-el="qb-diff-all"]', t('All Difficulty Levels', 'அனைத்து கடின நிலைகளும்'));

  qs(root, '#qb-search').value = qbState.search;
  fillSelect(
    qs(root, '#qb-chapter'),
    [
      { value: 'all', label: t('All Chapters', 'அனைத்து பாடங்களும்') },
      ...appState.chapters.map((c) => ({ value: String(c.chapterId), label: `Ch ${c.chapterId}: ${c.title}` }))
    ],
    String(qbState.chapter)
  );
  qs(root, '#qb-marks').value = qbState.marks;
  qs(root, '#qb-difficulty').value = qbState.difficulty;

  updateCountLabel(qs(root, '#qb-count-text'), filtered.length);
  setVisible(root, '#btn-qb-reset-filters', Boolean(hasFilters));

  renderQuestionCardsInto(qs(root, '#qb-list-container'), filtered);

  setVisible(root, '#add-q-backdrop', qbState.addModalOpen);
  fillSelect(
    qs(root, '#new-q-chap'),
    appState.chapters.map((c) => ({ value: String(c.chapterId), label: `Ch ${c.chapterId}: ${c.title}` })),
    String(appState.chapters[0]?.chapterId || 1)
  );

  return root;
}

export function bindQuestionBankEvents() {
  document.getElementById('qb-search')?.addEventListener('input', (e) => {
    qbState.search = e.target.value;
    const filtered = getFilteredQuestions();
    const listEl = document.getElementById('qb-list-container');
    if (listEl) {
      renderQuestionCardsInto(listEl, filtered);
      bindQuestionCardEvents();
    }
    updateCountLabel(document.getElementById('qb-count-text'), filtered.length);
    const resetBtn = document.getElementById('btn-qb-reset-filters');
    if (resetBtn) {
      resetBtn.hidden = !(qbState.search || qbState.chapter !== 'all' || qbState.marks !== 'all' || qbState.difficulty !== 'all');
    }
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
  document.getElementById('btn-qb-reset-filters')?.addEventListener('click', () => {
    qbState.search = '';
    qbState.chapter = 'all';
    qbState.marks = 'all';
    qbState.difficulty = 'all';
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
  document.getElementById('add-q-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'add-q-backdrop') {
      qbState.addModalOpen = false;
      triggerRender();
    }
  });

  bindQuestionCardEvents();

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
