"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import type { OCRResult } from "@/hooks/useOCR";

interface OCRResultsProps {
  results: Map<string, OCRResult | null>;
  onExport?: (results: Map<string, OCRResult | null>) => void;
}

export function OCRResults({ results, onExport }: OCRResultsProps) {
  const { showToast } = useToast();
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  if (results.size === 0) {
    return null;
  }

  const successCount = Array.from(results.values()).filter(
    (r) => r !== null,
  ).length;

  const handleCopyText = (fileName: string, text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied text from ${fileName}`, "success");
  };

  const handleExport = () => {
    if (onExport) {
      onExport(results);
    }

    // Generate CSV
    const rows = Array.from(results.entries()).map(([fileName, result]) => {
      if (!result)
        return { fileName, status: "Failed", text: "", confidence: 0 };
      return {
        fileName,
        status: "Success",
        text: result.text.replace(/"/g, '""'), // Escape quotes for CSV
        confidence: (result.confidence * 100).toFixed(1),
      };
    });

    const csv = [
      ["Filename", "Status", "Confidence", "Extracted Text"],
      ...rows.map((r) => [r.fileName, r.status, r.confidence, `"${r.text}"`]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ocr-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast("OCR results exported as CSV", "success");
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-blue-900">
          OCR Results: {successCount}/{results.size} succeeded
        </h3>
        <button
          onClick={handleExport}
          className="text-sm px-3 py-1 text-blue-600 hover:bg-blue-100 rounded transition-colors flex items-center gap-1"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="space-y-2">
        {Array.from(results.entries()).map(([fileName, result]) => (
          <motion.div
            key={fileName}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded border"
          >
            <button
              onClick={() =>
                setExpandedFile(expandedFile === fileName ? null : fileName)
              }
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2 flex-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    result ? "bg-green-600" : "bg-red-600"
                  }`}
                />
                <span className="font-medium text-gray-900">{fileName}</span>
                {result && (
                  <span className="text-xs text-gray-500">
                    Confidence: {(result.confidence * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              {expandedFile === fileName ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>

            <AnimatePresence>
              {expandedFile === fileName && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t bg-gray-50 p-3"
                >
                  {result ? (
                    <div className="space-y-2">
                      <div className="max-h-48 overflow-y-auto">
                        <p className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                          {result.text || "(No text extracted)"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopyText(fileName, result.text)}
                        className="text-xs px-2 py-1 text-gray-600 hover:bg-white border rounded transition-colors flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Text
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">
                      OCR processing failed
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
