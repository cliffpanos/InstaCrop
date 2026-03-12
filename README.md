# InstaCrop

Browser-based image processor that auto-formats photos for Instagram to avoid compression when uploading. All processing happens locally in your browser. Built with Cursor.

## Getting started

### Install dependencies

From the project root:

```bash
npm install
```

This installs Vite and the image libraries used by the app:

- Pica (high-quality resizing)
- piexifjs (EXIF read/write, DPI)
- FileSaver.js (downloads)
- JSZip (batch ZIP downloads)

### Run the dev server

```bash
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`) in your browser.

### Build for production

```bash
npm run build
```

This creates a `dist/` folder and copies its contents into `docs/`, which is used for GitHub Pages hosting.

## How it works

- Upload one or more images via drag-and-drop or file picker.
- The app reads each image’s metadata (dimensions, format, DPI) and shows whether it passes Instagram’s “max quality” rules:
  - Width exactly 1080 px
  - Height between 566 and 1350 px
  - Aspect ratio 1:1 (square) or 4:5 (vertical)
  - JPG format, sRGB color space
  - DPI between 72 and 300 (when present)
- Image requirements are based on [Your Guide to Instagram Image Sizes](https://www.adobe.com/express/discover/sizes/instagram) (Adobe Express).
- Use **Auto-Fix** to:
  - Correct orientation
  - Resize so width = 1080 px using high-quality resampling
  - Crop/pad to the selected aspect ratio (1:1 or 4:5)
  - Export as JPEG and write DPI into EXIF (default 72 if missing)

## Privacy & security

- Images never leave your browser; there is no server component.
- Avoid adding analytics or third-party scripts that could upload image data.
