import pica from 'pica';
import { readExifFromDataUrl, getDpi, getOrientation, insertDpiIntoJpegDataUrl } from './exif.js';

const picaInstance = pica();

export async function readImageFile(file) {
  const dataUrl = await readFileAsDataUrl(file);
  const exif = readExifFromDataUrl(dataUrl);
  const dpi = getDpi(exif);
  const orientation = getOrientation(exif);

  const img = await loadImage(dataUrl);
  const { width, height } = getOrientedDimensions(img, orientation);

  const format = (file.type || '').split('/')[1] || 'unknown';

  return {
    width,
    height,
    format,
    dpi,
    orientation,
    dataUrl
  };
}

export function validateRules(meta) {
  const widthOk = meta.width === 1080;
  const heightOk = meta.height >= 566 && meta.height <= 1350;
  const aspect = meta.width && meta.height ? meta.width / meta.height : 0;
  const eps = 0.01;
  const aspect1 = Math.abs(aspect - 1) < eps;
  const aspect45 = Math.abs(aspect - 4 / 5) < eps;
  const aspectOk = aspect1 || aspect45;

  const formatOk = meta.format.toLowerCase().includes('jpg') || meta.format.toLowerCase().includes('jpeg');

  const dpiOk = meta.dpi ? meta.dpi >= 72 && meta.dpi <= 300 : null;

  return {
    widthOk,
    heightOk,
    aspectOk,
    formatOk,
    dpiOk
  };
}

export async function autoFixImage(file, options) {
  const { aspect = '4:5', quality = 0.92 } = options || {};
  const dataUrl = await readFileAsDataUrl(file);
  const exif = readExifFromDataUrl(dataUrl);
  const existingDpi = getDpi(exif);
  const targetDpi = existingDpi && existingDpi >= 72 && existingDpi <= 300 ? existingDpi : 72;

  const img = await loadImage(dataUrl);
  const orientation = getOrientation(exif);
  const orientedCanvas = applyOrientationToCanvas(img, orientation);

  const targetWidth = 1080;
  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = targetWidth;
  resizedCanvas.height = Math.round((orientedCanvas.height / orientedCanvas.width) * targetWidth);

  await picaInstance.resize(orientedCanvas, resizedCanvas, {
    alpha: false
  });

  let finalCanvas;
  if (aspect === '1:1') {
    finalCanvas = enforceAspect(resizedCanvas, 1);
  } else {
    finalCanvas = enforceAspect(resizedCanvas, 4 / 5);
  }

  const blob = await canvasToBlob(finalCanvas, quality);

  const dataUrlOut = await blobToDataUrl(blob);
  const withDpi = insertDpiIntoJpegDataUrl(dataUrlOut, targetDpi);

  const outBlob = dataUrlToBlob(withDpi);
  return outBlob;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function getOrientedDimensions(img, orientation) {
  if (orientation >= 5 && orientation <= 8) {
    return { width: img.height, height: img.width };
  }
  return { width: img.width, height: img.height };
}

function applyOrientationToCanvas(img, orientation) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const w = img.width;
  const h = img.height;

  if (orientation >= 5 && orientation <= 8) {
    canvas.width = h;
    canvas.height = w;
  } else {
    canvas.width = w;
    canvas.height = h;
  }

  switch (orientation) {
    case 2:
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      break;
    case 3:
      ctx.translate(w, h);
      ctx.rotate(Math.PI);
      break;
    case 4:
      ctx.translate(0, h);
      ctx.scale(1, -1);
      break;
    case 5:
      ctx.rotate(0.5 * Math.PI);
      ctx.scale(1, -1);
      break;
    case 6:
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(0, -h);
      break;
    case 7:
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(w, -h);
      ctx.scale(-1, 1);
      break;
    case 8:
      ctx.rotate(-0.5 * Math.PI);
      ctx.translate(-w, 0);
      break;
    default:
      break;
  }

  ctx.drawImage(img, 0, 0);
  return canvas;
}

function enforceAspect(canvas, targetAspect) {
  const sourceAspect = canvas.width / canvas.height;
  const targetWidth = 1080;
  const targetHeight = Math.round(targetWidth / targetAspect);

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const ctx = finalCanvas.getContext('2d');
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  let drawWidth = canvas.width;
  let drawHeight = canvas.height;
  let sx = 0;
  let sy = 0;

  if (Math.abs(sourceAspect - targetAspect) < 0.01) {
    drawWidth = targetWidth;
    drawHeight = canvas.height * (targetWidth / canvas.width);
  } else if (sourceAspect > targetAspect) {
    const newWidth = canvas.height * targetAspect;
    sx = (canvas.width - newWidth) / 2;
    drawWidth = newWidth;
    drawHeight = canvas.height;
  } else {
    const newHeight = canvas.width / targetAspect;
    sy = (canvas.height - newHeight) / 2;
    drawWidth = canvas.width;
    drawHeight = newHeight;
  }

  const dx = (targetWidth - drawWidth) / 2;
  const dy = (targetHeight - drawHeight) / 2;

  ctx.drawImage(canvas, sx, sy, drawWidth, drawHeight, dx, dy, drawWidth, drawHeight);

  return finalCanvas;
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to export canvas to blob'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*);base64/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(data);
  const len = binary.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    arr[i] = binary.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}

