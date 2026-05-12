"use client";

import { useState, useCallback, useRef } from "react";
import { X, CheckCircle, AlertCircle, RotateCcw, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { useFileUpload } from "@/hooks";
import { useUploadQueue, type QueuedFile } from "@/hooks/useUploadQueue";
import { useUploadHistory } from "@/hooks/useUploadHistory";
import { OCRProcessor } from "./OCRProcessor";

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "application/msword": [".doc"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};

interface BatchFileUploaderProps {
  onUploadComplete?: () => void;
  maxConcurrent?: number;
}

export function BatchFileUploader({
  onUploadComplete,
  maxConcurrent = 2,
}: BatchFileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { upload } = useFileUpload();
  const { addItem, updateItem } = useUploadHistory();

  const uploadAdapter = useCallback(
    (file: File, documentType: string, onProgress: (p: number) => void) =>
      upload(file, documentType, onProgress).then(() => {}),
    [upload],
  );

  const { queue, addFiles, processQueue, cancelFile, clearCompleted, stats } =
    useUploadQueue(uploadAdapter, { maxConcurrent });

  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOCRResults, setShowOCRResults] = useState(false);

  const validateFiles = (
    files: File[],
  ): { valid: File[]; invalid: string[] } => {
    const MAX_BYTES = 10 * 1024 * 1024;
    const valid: File[] = [];
    const invalid: string[] = [];

    files.forEach((file) => {
      if (file.size > MAX_BYTES) {
        invalid.push(`${file.name}: File too large (max 10MB)`);
        return;
      }

      const isAcceptedType = Object.keys(ACCEPTED_TYPES).some(
        (type) =>
          file.type === type ||
          ACCEPTED_TYPES[type as keyof typeof ACCEPTED_TYPES].some((ext) =>
            file.name.toLowerCase().endsWith(ext),
          ),
      );

      if (!isAcceptedType) {
        invalid.push(`${file.name}: File type not supported`);
        return;
      }

      valid.push(file);
    });

    return { valid, invalid };
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const { valid, invalid } = validateFiles(files);

    if (valid.length > 0) {
      addFiles(valid, "pdf");
      showToast(`Added ${valid.length} file(s) to queue`, "success");
    }

    if (invalid.length > 0) {
      invalid.forEach((msg) => showToast(msg, "error"));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const { valid, invalid } = validateFiles(files);

    if (valid.length > 0) {
      addFiles(valid, "pdf");
      showToast(`Added ${valid.length} file(s) to queue`, "success");
    }

    if (invalid.length > 0) {
      invalid.forEach((msg) => showToast(msg, "error"));
    }

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleStartUpload = async () => {
    if (queue.length === 0) {
      showToast("No files to upload", "error");
      return;
    }

    setIsProcessing(true);

    try {
      // Record start times for each file
      const startTimes = new Map<string, number>();
      queue.forEach((item) => {
        startTimes.set(item.id, Date.now());
      });

      await processQueue();

      // Add completed items to history
      queue.forEach((item) => {
        if (
          item.status === "success" ||
          item.status === "error" ||
          item.status === "cancelled"
        ) {
          const duration = startTimes.get(item.id)
            ? Date.now() - startTimes.get(item.id)!
            : undefined;

          addItem({
            fileName: item.file.name,
            fileSize: item.file.size,
            documentType: item.documentType,
            status: item.status as "success" | "error" | "cancelled",
            uploadDurationMs: duration,
            error: item.error,
          });
        }
      });

      showToast("Upload queue completed", "success");
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Upload failed",
        "error",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: QueuedFile["status"]) => {
    switch (status) {
      case "pending":
        return "text-gray-400";
      case "uploading":
        return "text-blue-500";
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "cancelled":
        return "text-yellow-600";
      default:
        return "text-gray-500";
    }
  };

  const getStatusBgColor = (status: QueuedFile["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-50";
      case "error":
        return "bg-red-50";
      case "cancelled":
        return "bg-yellow-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
          dragActive
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-gray-300 hover:border-blue-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">📁</div>
          <p className="text-lg font-semibold text-gray-700 mb-2">
            {dragActive
              ? "Drop files here"
              : "Drag & drop multiple files or click to select"}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supports PDF, DOCX, TXT, CSV, DOC, and image files (max 10MB each)
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={Object.keys(ACCEPTED_TYPES).join(",")}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isProcessing}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isProcessing}
            className="bg-linear-to-r from-blue-600 to-purple-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            Select Files
          </button>
        </div>
      </div>

      {/* Queue Statistics */}
      {queue.length > 0 && (
        <div className="grid grid-cols-5 gap-2 text-center">
          <div className="p-2 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-lg font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600">Pending</p>
            <p className="text-lg font-bold text-blue-900">{stats.pending}</p>
          </div>
          <div className="p-2 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-600">Uploading</p>
            <p className="text-lg font-bold text-amber-900">
              {stats.uploading}
            </p>
          </div>
          <div className="p-2 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600">Success</p>
            <p className="text-lg font-bold text-green-900">{stats.success}</p>
          </div>
          <div className="p-2 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">Error</p>
            <p className="text-lg font-bold text-red-900">{stats.error}</p>
          </div>
        </div>
      )}

      {/* Queue List */}
      <AnimatePresence>
        {queue.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Upload Queue</h3>
              <div className="flex gap-2">
                <button
                  onClick={clearCompleted}
                  className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Clear Completed
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {queue.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3 rounded-lg border ${getStatusBgColor(
                    item.status,
                  )}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className={`mt-1 ${getStatusColor(item.status)}`}>
                      {item.status === "uploading" && (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
                      )}
                      {item.status === "success" && (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      {item.status === "error" && (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      {item.status === "pending" && (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB • Retry{" "}
                        {item.retries}/{item.maxRetries}
                      </p>
                      {item.error && (
                        <p className="text-xs text-red-600 mt-1">
                          {item.error}
                        </p>
                      )}
                    </div>

                    {/* Progress */}
                    {item.status === "uploading" && (
                      <div className="w-24">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-1">
                          {item.progress}%
                        </p>
                      </div>
                    )}

                    {/* Cancel Button */}
                    {(item.status === "pending" ||
                      item.status === "uploading") && (
                      <button
                        onClick={() => cancelFile(item.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}

                    {/* Retry Button */}
                    {item.status === "error" &&
                      item.retries < item.maxRetries && (
                        <button
                          onClick={() => {
                            // Mark as pending to be retried
                            // Update will happen through queue mechanism
                          }}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                      )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Start Upload Button */}
      {queue.length > 0 && (
        <button
          onClick={handleStartUpload}
          disabled={isProcessing || stats.pending === 0}
          className="w-full bg-linear-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Processing..." : `Start Upload (${stats.pending})`}
        </button>
      )}

      {/* OCR Processing for Images */}
      <AnimatePresence>
        {queue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <OCRProcessor
              files={queue.map((item) => item.file)}
              autoStart={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
