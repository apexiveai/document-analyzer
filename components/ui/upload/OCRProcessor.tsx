"use client";

import { useEffect, useState } from "react";
import { Eye, FileText, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOCR, type OCRResult } from "@/hooks/useOCR";

interface OCRProcessorProps {
  files: File[];
  onComplete?: (results: Map<string, OCRResult | null>) => void;
  autoStart?: boolean;
}

export function OCRProcessor({
  files,
  onComplete,
  autoStart = false,
}: OCRProcessorProps) {
  const { processMultipleImages, isProcessing, progress } = useOCR();
  const [results, setResults] = useState<Map<string, OCRResult | null>>(
    new Map(),
  );
  //   const [currentFile, setCurrentFile] = useState<string | null>(null);

  useEffect(() => {
    if (!autoStart || files.length === 0) return;

    const processFiles = async () => {
      const processedResults = await processMultipleImages(files);
      setResults(processedResults);

      if (onComplete) {
        onComplete(processedResults);
      }
    };

    processFiles();
  }, [autoStart, files, processMultipleImages, onComplete]);

  const imageFiles = files.filter((f) => f.type.startsWith("image/"));
  const processedCount = results.size;
  const successCount = Array.from(results.values()).filter(
    (r) => r !== null,
  ).length;

  if (imageFiles.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Eye className="w-5 h-5 text-blue-600" />
        <h4 className="font-semibold text-blue-900">OCR Processing</h4>
        {isProcessing && (
          <span className="text-sm text-blue-600 ml-auto">
            {processedCount}/{imageFiles.length} • {progress}%
          </span>
        )}
      </div>

      <div className="space-y-2">
        {imageFiles.map((file) => {
          const result = results.get(file.name);
          const isProcessed = result !== undefined;

          return (
            <motion.div
              key={file.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-2 bg-white rounded border"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                {result && (
                  <p className="text-xs text-gray-600">
                    Confidence: {(result.confidence * 100).toFixed(1)}%
                  </p>
                )}
              </div>

              {!isProcessed && isProcessing ? (
                <div className="animate-spin">
                  <Loader className="w-4 h-4 text-blue-600" />
                </div>
              ) : result ? (
                <div
                  title={result.text.substring(0, 100)}
                  className="cursor-help"
                >
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
              ) : (
                <div title="OCR failed">
                  <FileText className="w-4 h-4 text-red-600" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded border p-3"
          >
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Processing image text extraction...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!isProcessing && processedCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded border p-3"
        >
          <p className="text-sm text-gray-900">
            ✓ OCR Complete: <strong>{successCount}</strong> of{" "}
            <strong>{imageFiles.length}</strong> images processed
          </p>
        </motion.div>
      )}
    </div>
  );
}
