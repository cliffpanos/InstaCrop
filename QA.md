## QA checklist – Instagram-ready image prep

Use these scenarios to manually verify behavior across browsers (Chrome, Firefox, Safari, mobile where possible).

### 1. Large landscape JPG (e.g., 4000×3000)

- Upload a 4000×3000 JPG.
- Verify:
  - Original metadata shows as `4000×3000px` with format `JPG` and correct/unknown DPI.
  - Several rule badges fail initially (width/height/aspect).
- Action:
  - Select `Vertical 4:5 (1080×1350)` and click **Auto-Fix**.
  - Download the fixed image.
- Expected:
  - Output dimensions are exactly 1080×1350.
  - File format is JPG.
  - DPI is between 72 and 300 in EXIF.

### 2. Already-correct vertical JPG (1080×1350)

- Upload an existing 1080×1350 JPG.
- Verify:
  - All rule badges are passing.
- Action:
  - Run **Auto-Fix** and download the result.
- Expected:
  - Output remains 1080×1350 JPG.
  - DPI is preserved if valid, or set to a default (e.g., 72).

### 3. Panoramic PNG (1080×566)

- Upload a 1080×566 PNG.
- Verify:
  - Width passes, height and aspect may fail depending on aspect choice.
  - Format badge fails (PNG).
- Action:
  - Run **Auto-Fix** (either 1:1 or 4:5).
- Expected:
  - Output is JPG with width 1080 px and height within 566–1350 px.
  - Aspect badge passes for the chosen ratio.

### 4. Image with EXIF DPI 300

- Upload a JPG known to have 300 DPI.
- Verify:
  - DPI badge passes (within 72–300).
- Action:
  - Run **Auto-Fix** and inspect output EXIF.
- Expected:
  - DPI remains 300 in the output.

### 5. Non-sRGB profile (e.g., CMYK JPG/PNG)

- Upload an image with a non-sRGB color profile (e.g., CMYK).
- Expected:
  - Image renders correctly in the browser (canvas conversion to sRGB).
  - The app does not crash; treat it like any other image.

### 6. Batch of 10 images

- Upload 10 mixed images (various sizes and formats).
- Verify:
  - App accepts all 10 and shows cards for each.
- Action:
  - Click **Fix all & download ZIP**.
- Expected:
  - Progress text updates as each image is processed.
  - A ZIP downloads containing 10 `*-instagram-ready.jpg` files.

