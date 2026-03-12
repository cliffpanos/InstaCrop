## InstaCrop demo script (30–60 seconds)

1. **Intro**
   - “This is InstaCrop, a small client-only web app that makes photos Instagram-ready so they upload at max quality without extra compression.”

2. **Upload & validation**
   - Drag 2–3 sample images onto the drop area.
   - Point out the per-image cards:
     - Filename, file size, original width × height, format, and DPI.
     - Rule badges for width, height, aspect, format, and DPI with pass/fail colors.

3. **Auto-fix a single image**
   - Choose `Vertical 4:5 (1080×1350)` in the aspect dropdown.
   - Click **Auto-Fix** on one image card.
   - Explain that the app:
     - Fixes EXIF orientation.
     - Resizes the image so width = 1080 px using high-quality resampling.
     - Crops or pads to 4:5.
     - Exports a JPEG and writes a DPI value into EXIF.
   - Click **Download** and show the saved `*-instagram-ready.jpg` file.

4. **Batch ZIP**
   - Click **Fix all & download ZIP**.
   - Mention that images are processed sequentially for better stability on mobile devices.
   - Show that the resulting ZIP contains Instagram-ready JPEGs for each input image.

5. **Close**
   - “Everything runs entirely in the browser, so photos never leave your machine. It can be deployed as a static site on GitHub Pages with a custom domain.”

