// Lightweight DOM & <template> hydration helpers (keeps all HTML markup in templates/*.html)

export function cloneTemplate(templateId) {
  const tpl = document.getElementById(templateId);
  if (!tpl) {
    throw new Error(`Missing HTML template: #${templateId}`);
  }
  const fragment = tpl.content.cloneNode(true);
  return fragment.firstElementChild || fragment;
}

export function qs(root, selector) {
  return root.querySelector(selector);
}

export function setText(root, selector, text) {
  const node = typeof selector === 'string' ? root.querySelector(selector) : selector;
  if (node) node.textContent = text ?? '';
  return node;
}

export function setVisible(root, selector, visible) {
  const node = typeof selector === 'string' ? root.querySelector(selector) : selector;
  if (node) node.hidden = !visible;
  return node;
}

export function clearChildren(node) {
  if (node) node.replaceChildren();
}

export function fillSelect(selectEl, options, selectedValue) {
  if (!selectEl) return;
  const frag = document.createDocumentFragment();
  options.forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    if (String(value) === String(selectedValue)) opt.selected = true;
    frag.appendChild(opt);
  });
  selectEl.replaceChildren(frag);
}
