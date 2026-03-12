import piexif from 'piexifjs';

export function readExifFromDataUrl(dataUrl) {
  try {
    const exifObj = piexif.load(dataUrl);
    return exifObj;
  } catch {
    return null;
  }
}

export function getDpi(exifObj) {
  if (!exifObj) return null;
  const { XResolution, YResolution, ResolutionUnit } = exifObj['0th'] || {};
  if (!XResolution || !Array.isArray(XResolution) || XResolution[1] === 0) return null;
  const dpi = XResolution[0] / XResolution[1];
  if (!dpi || !Number.isFinite(dpi)) return null;
  if (dpi < 10) return null;
  if (ResolutionUnit && ResolutionUnit !== 2) {
    return null;
  }
  return Math.round(dpi);
}

export function getOrientation(exifObj) {
  if (!exifObj) return 1;
  const orientation = exifObj['0th']?.[piexif.ImageIFD.Orientation];
  return orientation || 1;
}

export function insertDpiIntoJpegDataUrl(dataUrl, dpi) {
  const exif = readExifFromDataUrl(dataUrl) || { '0th': {}, Exif: {}, GPS: {}, Interop: {}, '1st': {} };
  const rational = [dpi, 1];
  exif['0th'][piexif.ImageIFD.XResolution] = rational;
  exif['0th'][piexif.ImageIFD.YResolution] = rational;
  exif['0th'][piexif.ImageIFD.ResolutionUnit] = 2;
  const exifBytes = piexif.dump(exif);
  return piexif.insert(exifBytes, dataUrl);
}

