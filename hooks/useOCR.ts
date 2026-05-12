import { useState, useCallback, useEffect, useRef } from "react";
import { createWorker } from "tesseract.js";
import type { Worker } from "tesseract.js";

// Dynamic import for Tesseract.js to handle optional dependency
// let Tesseract: Record<string, unknown> | null = null;

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
}

interface UseOCROptions {
  language?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Hook to perform OCR on image files using Tesseract.js
 */
export function useOCR(options: UseOCROptions = {}) {
  const { language = "eng", onProgress } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onProgressRef = useRef<typeof onProgress>(onProgress);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  const processImage = useCallback(
    async (file: File): Promise<OCRResult | null> => {
      try {
        setIsProcessing(true);
        setError(null);
        setProgress(0);

        // Check if file is an image
        if (!file.type.startsWith("image/")) {
          throw new Error("File must be an image");
        }

        // Read file as data URL
        const fileUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });

        // Create worker (v7 signature: langs only)
        const worker: Worker = await createWorker([language]);

        // Initialize worker and load language
        await worker.load();

        // Recognize text from image
        const result = await worker.recognize(fileUrl);
        const extractedText = (result?.data?.text ?? "").trim();
        const confidence = result?.data?.confidence ?? 0;

        // Clean up worker
        await worker.terminate();

        setProgress(100);
        onProgressRef.current?.(100);

        return {
          text: extractedText,
          confidence,
          language,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "OCR processing failed";
        setError(errorMessage);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [language],
  );

  const processMultipleImages = useCallback(
    async (files: File[]): Promise<Map<string, OCRResult | null>> => {
      const results = new Map<string, OCRResult | null>();

      for (const file of files) {
        const result = await processImage(file);
        results.set(file.name, result);
      }

      return results;
    },
    [processImage],
  );

  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    processImage,
    processMultipleImages,
    isProcessing,
    progress,
    error,
    reset,
  };
}
