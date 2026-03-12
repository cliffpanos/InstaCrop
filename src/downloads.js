import { saveAs } from 'file-saver';
import JSZip from 'jszip';

export function downloadSingle(blob, originalName) {
  const name = makeOutputName(originalName);
  saveAs(blob, name);
}

export async function downloadZipSequential(items, aspect, processFn, onProgress) {
  const zip = new JSZip();
  let processed = 0;
  for (const item of items) {
    const blob = await processFn(item, aspect);
    const name = makeOutputName(item.file.name);
    zip.file(name, blob);
    processed += 1;
    if (onProgress) onProgress(processed, items.length);
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, 'instacrop-batch.zip');
}

/** Build and download a ZIP from items that already have fixedBlob (no processing). */
export function downloadZipFromFixedItems(items) {
  const withFixed = items.filter((item) => item.fixedBlob);
  if (!withFixed.length) return;
  const zip = new JSZip();
  for (const item of withFixed) {
    zip.file(makeOutputName(item.file.name), item.fixedBlob);
  }
  zip.generateAsync({ type: 'blob' }).then((zipBlob) => {
    saveAs(zipBlob, 'instacrop-batch.zip');
  });
}

function makeOutputName(originalName) {
  const dot = originalName.lastIndexOf('.');
  const base = dot > 0 ? originalName.slice(0, dot) : originalName;
  return `${base}-instagram-ready.jpg`;
}

