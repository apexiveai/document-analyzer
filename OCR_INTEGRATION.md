# OCR Integration - Implementation Guide

## Overview

OCR (Optical Character Recognition) integration enables automatic text extraction from image files during batch upload. This feature allows users to extract text from images (JPEG, PNG, GIF, WebP) and export the results in CSV format.

## New Components

### `useOCR.ts`

Custom hook for OCR processing using Tesseract.js

**Features:**

- Image text extraction with configurable language (default: English)
- Single image and batch processing modes
- Progress tracking during OCR
- Error handling with user-friendly messages
- Dynamic module loading (optional dependency)

**Usage Example:**

```typescript
const { processImage, isProcessing, progress, error } = useOCR({
  language: "eng",
  onProgress: (p) => console.log(`${p}%`),
});

const result = await processImage(imageFile);
// result: { text: "...", confidence: 0.95, language: "eng" }
```

**Type Definition:**

```typescript
interface OCRResult {
  text: string;
  confidence: number;
  language: string;
}

interface UseOCROptions {
  language?: string;
  onProgress?: (progress: number) => void;
}
```

### `OCRProcessor.tsx`

UI component for displaying OCR processing status and progress

**Features:**

- Real-time processing status for each image
- Progress bar with percentage
- Success/failure indicators per file
- Confidence display for each file
- Auto-start option for batch processing
- Completion summary

**Props:**

```typescript
interface OCRProcessorProps {
  files: File[];
  onComplete?: (results: Map<string, OCRResult | null>) => void;
  autoStart?: boolean;
}
```

**Usage:**

```tsx
<OCRProcessor
  files={imageFiles}
  onComplete={(results) => handleOCRComplete(results)}
  autoStart={true}
/>
```

### `OCRResults.tsx`

Display component for detailed OCR results and export

**Features:**

- Expandable result cards for each image
- Extracted text display with syntax highlighting
- Confidence percentage for each result
- Copy individual extracted text to clipboard
- Export all results as CSV
- Success/failure count summary

**Props:**

```typescript
interface OCRResultsProps {
  results: Map<string, OCRResult | null>;
  onExport?: (results: Map<string, OCRResult | null>) => void;
}
```

**Usage:**

```tsx
<OCRResults results={ocrResults} onExport={handleExport} />
```

## Integration

### BatchFileUploader Enhancement

The [BatchFileUploader.tsx](BatchFileUploader.tsx) now includes:

- Automatic OCR detection for image files
- OCRProcessor display for image processing
- Results export capability

### DocumentUploadSection

Three-tab interface now includes OCR processing for batch uploads

## File Structure

```
hooks/
├── useOCR.ts                (NEW)
└── index.ts                 (UPDATED)

components/ui/upload/
├── OCRProcessor.tsx         (NEW)
├── OCRResults.tsx           (NEW)
├── BatchFileUploader.tsx    (UPDATED)
└── index.ts                 (UPDATED)
```

## Installation

To use OCR features, install Tesseract.js:

```bash
npm install tesseract.js
```

Without installation, the system will show a helpful error message:

> "Tesseract.js is not installed. Install it with: npm install tesseract.js"

## Supported Languages

Tesseract.js supports 100+ languages. Common language codes:

| Language              | Code    |
| --------------------- | ------- |
| English               | eng     |
| Spanish               | spa     |
| French                | fra     |
| German                | deu     |
| Chinese (Simplified)  | chi_sim |
| Chinese (Traditional) | chi_tra |
| Japanese              | jpn     |
| Korean                | kor     |
| Arabic                | ara     |

**Configure language:**

```typescript
const { processImage } = useOCR({ language: "fra" }); // French
```

## Workflow

### Single Image OCR

1. User selects image file in batch uploader
2. Click "Start Upload"
3. System detects image files
4. OCRProcessor displays processing status
5. Text extracted and displayed in OCRResults
6. User can copy text or export as CSV

### Batch Image OCR

1. User drags multiple images to batch uploader
2. Queue shows all files
3. Click "Start Upload"
4. OCRProcessor processes images sequentially
5. Results aggregated in OCRResults
6. Export all results in one CSV

### Export Workflow

1. OCR processing completes
2. Click "Export CSV" button
3. CSV file generated with columns:
   - Filename
   - Status (Success/Failed)
   - Confidence (0-100%)
   - Extracted Text

## Performance Considerations

- **Processing Time:** Varies by image size and complexity
  - Small images (< 100KB): ~2-5 seconds
  - Medium images (100-500KB): ~5-10 seconds
  - Large images (> 500KB): ~10-30 seconds
- **Memory:** Each worker uses ~50-100MB RAM
- **Concurrent Processing:** Single worker (sequential) by default
- **Language Models:** Auto-downloaded on first use (~50-100MB per language)

## Error Handling

1. **File Type Error:** File is not an image
   - Message: "File must be an image"
   - Solution: Select image files only

2. **Module Not Found:** Tesseract.js not installed
   - Message: "Tesseract.js is not installed. Install it with: npm install tesseract.js"
   - Solution: `npm install tesseract.js`

3. **Processing Failure:** OCR algorithm failed
   - Shows failure indicator
   - User can retry with different image
   - Error logged in console

4. **Language Load Failure:** Language model unavailable
   - Message: "Failed to load language model"
   - Solution: Check internet connection, retry

## Confidence Scores

Each OCR result includes confidence (0-1):

- **> 0.95:** Excellent (high accuracy)
- **0.80-0.95:** Good (normal accuracy)
- **0.60-0.80:** Fair (some errors expected)
- **< 0.60:** Poor (many errors, review manually)

## Data Privacy

- OCR processing happens in the browser (client-side)
- Image data is NOT sent to external servers
- Tesseract.js models downloaded once per language
- Results only stored in component state (not persisted)

## Browser Support

- Chrome/Edge 60+
- Firefox 55+
- Safari 11+
- Mobile browsers (iOS 11+, Android 5+)

**Requirements:**

- WebWorkers support
- FileReader API
- Canvas API

## Advanced Usage

### Custom Language

```typescript
const { processImage } = useOCR({
  language: "jpn", // Japanese
  onProgress: (progress) => {
    console.log(`Processing: ${progress}%`);
  },
});
```

### Process Multiple Formats

```typescript
const { processMultipleImages } = useOCR();

const results = await processMultipleImages([
  image1, // JPEG
  image2, // PNG
  image3, // WebP
]);

for (const [fileName, result] of results) {
  console.log(`${fileName}: "${result?.text}"`);
}
```

### Manual Progress Tracking

```typescript
const { processImage, progress, isProcessing } = useOCR();

// Start processing
processImage(imageFile);

// Monitor progress
useEffect(() => {
  if (isProcessing) {
    console.log(`OCR: ${progress}% complete`);
  }
}, [progress, isProcessing]);
```

## CSV Export Format

Example CSV export:

```
Filename,Status,Confidence,Extracted Text
document-1.jpg,Success,95.2,"The quick brown fox jumps over the lazy dog"
document-2.png,Success,87.5,"Lorem ipsum dolor sit amet"
document-3.gif,Failed,0,"(OCR processing failed)"
```

## Limitations

1. **Best Performance:** Printed text on clean, well-lit images
2. **Handwriting:** Limited support for handwritten text
3. **Complex Layouts:** May struggle with multi-column or heavily formatted text
4. **Large Images:** Very large images (>5000px) may timeout
5. **Language Mixing:** Single language at a time (not ideal for mixed-language documents)

## Future Enhancements

1. **Multi-language Support:** Auto-detect and process multiple languages
2. **Parallel Processing:** Process multiple images concurrently
3. **Handwriting Recognition:** Better support for cursive/handwritten text
4. **Layout Preservation:** Maintain document structure in extracted text
5. **Caching:** Cache language models to reduce download time
6. **Offline Mode:** Pre-download language models for offline use
7. **Table Extraction:** Detect and extract tabular data
8. **Bar Code Recognition:** Extract QR codes and barcodes

## Troubleshooting

### "Cannot find module 'tesseract.js'"

```bash
npm install tesseract.js
npm install --save-dev @types/tesseract.js
```

### OCR Processing Fails for All Images

- Check browser console for detailed error
- Verify image files are valid images
- Try with smaller image files
- Ensure sufficient disk space for language models

### Slow OCR Processing

- Expected for first-time language model download
- Subsequent processing of same language is faster
- Process one image at a time for better performance
- Use smaller images for faster processing

### Cannot Copy/Export Results

- Enable clipboard permissions in browser settings
- Check if pop-ups are blocked (for file download)
- Verify sufficient disk space

## Testing OCR

### Quick Test

```typescript
// In component
const { processImage } = useOCR();
const result = await processImage(testImageFile);
console.log("OCR Test:", result);
```

### Unit Test Example

```typescript
// In test file
const { renderHook, act } = render;
const { result } = renderHook(() => useOCR());

act(() => {
  result.current.processImage(mockImageFile);
});

expect(result.current.isProcessing).toBe(true);
```

## Documentation

- Tesseract.js: https://github.com/naptha/tesseract.js
- Language codes: https://github.com/naptha/tesseract.js/blob/master/docs/languages.md
- Browser support: https://caniuse.com/webworkers

## Status: COMPLETE ✓

OCR integration is fully implemented and ready for use. All components are type-safe with zero TypeScript errors.
