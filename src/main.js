import { addItems, updateItem, bindCardEvents, getItems, removeItem, clearAllItems, setBatchStatus, setFixAllEnabled, showToast } from './ui.js';
import { readImageFile, validateRules, autoFixImage } from './processors.js';
import { downloadSingle, downloadZipSequential, downloadZipFromFixedItems } from './downloads.js';

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fixAllBtn = document.getElementById('fix-all-btn');
const aspectSelect = document.getElementById('aspect-select');

const MAX_BATCH = 10;

let idCounter = 0;

function nextId() {
  idCounter += 1;
  return `img-${idCounter}`;
}

function init() {
  wireUpload();
  wireBatchActions();
  wireClearAll();
  bindCardEvents(handleAutoFixClick, handleDownloadClick, handleRemoveClick);
}

function wireUpload() {
  if (!dropZone || !fileInput) return;

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove('drag-active');
    });
  });

  dropZone.addEventListener('drop', (event) => {
    const dt = event.dataTransfer;
    if (!dt) return;
    handleFiles(dt.files);
  });

  dropZone.addEventListener('click', (event) => {
    if (event.target.closest('label[for="file-input"]')) return;
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files || []);
    fileInput.value = '';
    if (files.length > 0) {
      handleFiles(files);
    }
  });
}

function wireClearAll() {
  const clearAllBtn = document.getElementById('clear-all-btn');
  if (!clearAllBtn) return;
  clearAllBtn.addEventListener('click', () => {
    clearAllItems();
    showToast('Cleared. Add new images to continue.', 'info');
  });
}

function wireBatchActions() {
  if (!fixAllBtn) return;
  fixAllBtn.addEventListener('click', async () => {
    const items = Array.from(getItems().values());
    if (!items.length) return;
    const remaining = items.filter((item) => !item.fixedBlob);
    if (!remaining.length) {
      downloadZipFromFixedItems(items);
      showToast('ZIP downloaded.', 'success');
      return;
    }
    const aspect = aspectSelect?.value || '4:5';

    fixAllBtn.disabled = true;
    setBatchStatus('Processing batch…');
    try {
      await downloadZipSequential(
        remaining,
        aspect,
        async (item, asp) => {
          updateItem(item.id, { status: 'processing' });
          const blob = await autoFixImage(item.file, { aspect: asp, quality: 0.92 });
          updateItem(item.id, { fixedBlob: blob, status: 'done' });
          return blob;
        },
        (done, total) => {
          setBatchStatus(`Processed ${done}/${total} images…`);
        }
      );
      setBatchStatus('Batch ZIP downloaded.');
      showToast('Batch ZIP downloaded.', 'success');
    } catch (error) {
      console.error(error);
      setBatchStatus('Batch failed.');
      showToast('Batch processing failed.', 'error');
    } finally {
      setFixAllEnabled(true);
      setTimeout(() => setBatchStatus(''), 2500);
    }
  });
}

async function handleFiles(fileList) {
  const files = Array.from(fileList).filter((file) => file.type.startsWith('image/'));
  if (!files.length) {
    showToast('No image files detected.', 'error');
    return;
  }
  if (files.length > MAX_BATCH) {
    showToast(`For stability, only the first ${MAX_BATCH} images will be loaded.`, 'error');
  }
  const limited = files.slice(0, MAX_BATCH);

  const items = [];
  for (const file of limited) {
    const id = nextId();
    const baseItem = {
      id,
      file,
      meta: null,
      rules: null,
      status: 'processing',
      fixedBlob: null,
      error: null
    };
    items.push(baseItem);
  }
  addItems(items);
  setFixAllEnabled(true);

  for (const item of items) {
    try {
      const meta = await readImageFile(item.file);
      const rules = validateRules(meta);
      updateItem(item.id, { meta, rules, status: 'ready' });
    } catch (error) {
      console.error(error);
      updateItem(item.id, { status: 'error', error: 'Failed to read image metadata' });
    }
  }
}

async function handleAutoFixClick(id) {
  const items = getItems();
  const item = items.get(id);
  if (!item || item.status === 'processing') return;
  const aspect = aspectSelect?.value || '4:5';
  updateItem(id, { status: 'processing', error: null });
  try {
    const blob = await autoFixImage(item.file, { aspect, quality: 0.92 });
    updateItem(id, { fixedBlob: blob, status: 'done' });
    showToast(`Fixed ${item.file.name}`, 'success');
  } catch (error) {
    console.error(error);
    updateItem(id, { status: 'error', error: 'Auto-fix failed' });
    showToast(`Auto-fix failed for ${item.file.name}`, 'error');
  }
}

function handleDownloadClick(id) {
  const items = getItems();
  const item = items.get(id);
  if (!item || !item.fixedBlob) return;
  downloadSingle(item.fixedBlob, item.file.name);
}

function handleRemoveClick(id) {
  removeItem(id);
}

init();

