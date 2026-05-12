"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { useFileUpload } from "@/hooks";
import {
  ModeSelector,
  DocumentTypeSelector,
  FileInputArea,
  FileStatusDisplay,
} from "./upload";

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

export default function FileUploader({
  onUploadSuccess,
}: {
  onUploadSuccess?: () => void;
}) {
  const { showToast } = useToast();
  const [isAuditMode, setIsAuditMode] = useState(false);
  const [documentType, setDocumentType] = useState<
    "commercial_invoice" | "service_agreement"
  >("commercial_invoice");
  const [dragActive, setDragActive] = useState(false);

  const { upload, progress, status, error, selectedFile } = useFileUpload();

  const validateFile = (file: File): string | null => {
    const MAX_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_BYTES) return "File too large (max 10MB).";

    const isAcceptedType = Object.keys(ACCEPTED_TYPES).some(
      (type) =>
        file.type === type ||
        ACCEPTED_TYPES[type as keyof typeof ACCEPTED_TYPES].some((ext) =>
          file.name.toLowerCase().endsWith(ext),
        ),
    );

    if (!isAcceptedType)
      return "File type not supported. Please upload PDF, DOCX, TXT, CSV, DOC, or image files.";

    return null;
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    const onProgress = (progress: number) => {
      console.log(`Upload progress: ${progress}%`);
    };

    try {
      await upload(file, isAuditMode ? documentType : "pdf", onProgress);
      showToast("Document uploaded successfully!", "success");
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Upload failed";
      showToast(errorMsg, "error");
    }
  };

  const isLoading = status === "uploading";

  return (
    <div className="w-full">
      <ModeSelector
        isAuditMode={isAuditMode}
        onModeChange={setIsAuditMode}
        disabled={isLoading}
      />

      {isAuditMode && (
        <DocumentTypeSelector
          value={documentType}
          onChange={setDocumentType}
          disabled={isLoading}
        />
      )}

      <FileInputArea
        onFileSelect={handleFileSelect}
        disabled={isLoading}
        acceptedTypes={ACCEPTED_TYPES}
        dragActive={dragActive}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      />

      <FileStatusDisplay
        selectedFile={selectedFile}
        status={status}
        progress={progress}
        error={error}
      />
    </div>
  );
}
