const galleryEl = document.getElementById('gallery');
const emptyStateEl = document.getElementById('empty-state');
const batchStatusEl = document.getElementById('batch-status');
const toastRootEl = document.getElementById('toast-root');

/**
 * Simple in-memory store of image items keyed by id.
 * Each item: { id, file, meta, rules, status, fixedBlob }
 */
const items = new Map();

export function getItems() {
  return items;
}

export function addItems(newItems) {
  for (const item of newItems) {
    items.set(item.id, item);
    renderCard(item);
  }
  updateEmptyState();
  setClearAllVisible(items.size > 0);
}

export function updateItem(id, patch) {
  const current = items.get(id);
  if (!current) return;
  const next = { ...current, ...patch };
  items.set(id, next);
  renderCard(next);
}

export function removeItem(id) {
  if (!items.has(id)) return;
  items.delete(id);
  const card = document.querySelector(`.image-card[data-id="${id}"]`);
  if (card) card.remove();
  updateEmptyState();
  setFixAllEnabled(items.size > 0);
  setClearAllVisible(items.size > 0);
}

export function setBatchStatus(text) {
  if (!batchStatusEl) return;
  batchStatusEl.textContent = text || '';
}

export function setFixAllEnabled(enabled) {
  const btn = document.getElementById('fix-all-btn');
  if (btn) {
    btn.disabled = !enabled;
  }
}

export function setClearAllVisible(visible) {
  const btn = document.getElementById('clear-all-btn');
  if (btn) {
    btn.style.display = visible ? '' : 'none';
  }
}

export function clearAllItems() {
  items.clear();
  if (galleryEl) {
    galleryEl.innerHTML = '';
  }
  updateEmptyState();
  setFixAllEnabled(false);
  setClearAllVisible(false);
}

export function showToast(message, kind = 'info') {
  if (!toastRootEl) return;
  const toast = document.createElement('div');
  toast.className = `toast ${kind === 'error' ? 'error' : ''}`;
  const dot = document.createElement('div');
  dot.className = kind === 'error' ? 'toast-error-dot' : 'toast-success-dot';
  const span = document.createElement('span');
  span.textContent = message;
  toast.appendChild(dot);
  toast.appendChild(span);
  toastRootEl.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function updateEmptyState() {
  if (!emptyStateEl) return;
  emptyStateEl.style.display = items.size === 0 ? 'block' : 'none';
}

function renderCard(item) {
  const existing = document.querySelector(`.image-card[data-id="${item.id}"]`);
  const card = existing || document.createElement('article');
  card.dataset.id = item.id;
  card.className = 'image-card';
  card.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'image-card-header';

  const img = document.createElement('img');
  img.className = 'thumb';
  img.src = item.meta?.dataUrl || '';
  img.alt = item.file.name;
  header.appendChild(img);

  const metaContainer = document.createElement('div');
  metaContainer.className = 'image-meta';

  const fileName = document.createElement('div');
  fileName.className = 'file-name';
  fileName.textContent = item.file.name;
  metaContainer.appendChild(fileName);

  const fileSize = document.createElement('div');
  fileSize.className = 'file-size';
  fileSize.textContent = formatBytes(item.file.size);
  metaContainer.appendChild(fileSize);

  if (item.meta) {
    const dimRow = document.createElement('div');
    dimRow.className = 'dimension-row';
    dimRow.textContent = `${item.meta.width}×${item.meta.height}px • ${item.meta.format.toUpperCase()} • DPI: ${
      item.meta.dpi ?? 'unknown'
    }`;
    metaContainer.appendChild(dimRow);
  }

  if (item.rules) {
    const badges = document.createElement('div');
    badges.className = 'badge-row';
    badges.appendChild(makeRuleBadge('Width', item.rules.widthOk));
    badges.appendChild(makeRuleBadge('Height', item.rules.heightOk));
    badges.appendChild(makeRuleBadge('Aspect', item.rules.aspectOk));
    badges.appendChild(makeRuleBadge('Format', item.rules.formatOk));
    badges.appendChild(makeRuleBadge('DPI', item.rules.dpiOk));
    metaContainer.appendChild(badges);
  }

  header.appendChild(metaContainer);
  card.appendChild(header);

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const left = document.createElement('div');
  left.className = 'card-actions-left';

  const autoBtn = document.createElement('button');
  autoBtn.type = 'button';
  autoBtn.className = 'btn secondary';
  autoBtn.textContent = 'Auto-Fix';
  autoBtn.disabled = item.status === 'processing';
  autoBtn.dataset.action = 'auto-fix';
  left.appendChild(autoBtn);

  const right = document.createElement('div');
  right.className = 'card-actions-right';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn secondary btn-icon';
  removeBtn.title = 'Remove from set';
  removeBtn.setAttribute('aria-label', 'Remove photo from set');
  removeBtn.dataset.action = 'remove';
  removeBtn.innerHTML = trashIconSvg();
  right.appendChild(removeBtn);

  const downloadBtn = document.createElement('button');
  downloadBtn.type = 'button';
  downloadBtn.className = 'btn secondary';
  downloadBtn.textContent = 'Download';
  downloadBtn.disabled = !item.fixedBlob;
  downloadBtn.dataset.action = 'download';
  right.appendChild(downloadBtn);

  const statusWrap = document.createElement('div');
  statusWrap.className = 'status-wrap';
  const statusText = document.createElement('span');
  statusText.className = 'status-text';
  if (item.status === 'processing') {
    statusText.textContent = 'Processing…';
  } else if (item.status === 'error') {
    statusText.textContent = item.error || 'Error';
    statusText.classList.add('error');
  } else if (item.fixedBlob) {
    statusText.textContent = 'Fixed';
  } else {
    statusText.textContent = 'Ready';
  }
  statusWrap.appendChild(statusText);
  if (item.status === 'processing') {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    statusWrap.appendChild(spinner);
  }

  actions.appendChild(left);
  actions.appendChild(statusWrap);
  actions.appendChild(right);
  card.appendChild(actions);

  if (!existing) {
    galleryEl.appendChild(card);
  }
}

function trashIconSvg() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
}

function makeRuleBadge(label, ok) {
  const badge = document.createElement('span');
  const state = ok === null ? 'unknown' : ok ? 'pass' : 'fail';
  badge.className = `badge ${state}`;
  const dot = document.createElement('span');
  dot.className = 'badge-dot';
  const text = document.createElement('span');
  text.textContent = label;
  badge.appendChild(dot);
  badge.appendChild(text);
  return badge;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function bindCardEvents(onAutoFix, onDownload, onRemove) {
  galleryEl.addEventListener('click', (event) => {
    const target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    const action = target.closest('[data-action]')?.dataset?.action;
    if (!action) return;
    const card = target.closest('.image-card');
    if (!card) return;
    const id = card.dataset.id;
    if (!id) return;
    if (action === 'auto-fix') {
      onAutoFix(id);
    } else if (action === 'download') {
      onDownload(id);
    } else if (action === 'remove') {
      onRemove(id);
    }
  });
}

