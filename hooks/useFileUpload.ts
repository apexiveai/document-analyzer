import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { APP_CONFIG } from "@/constants/config";

const MAX_BYTES = 10 * 1024 * 1024;

export interface UploadedFile {
  id: string;
  filename: string;
  size: number;
  type: string;
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

export interface UseFileUploadOptions {
  onUploadSuccess?: () => void;
}

interface UseFileUploadReturn {
  files: UploadedFile[];
  isAuditMode: boolean;
  documentType: "commercial_invoice" | "service_agreement";
  dragActive: boolean;
  loading: boolean;

  // Legacy-friendly fields for FileUploader compatibility
  upload: (
    file: File,
    type?: string,
    onProgress?: (p: number) => void,
  ) => Promise<UploadedFile>;
  selectedFile: File | null;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  error?: string | null;

  setIsAuditMode: (value: boolean) => void;
  setDocumentType: (value: "commercial_invoice" | "service_agreement") => void;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileSelect: (file: File) => void;
  uploadFile: (file: File) => Promise<UploadedFile>;
  clearFiles: () => void;
  removeFile: (id: string) => void;
  retryUpload: (id: string) => Promise<void>;
}

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

export function useFileUpload(
  options?: UseFileUploadOptions,
): UseFileUploadReturn {
  const router = useRouter();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuditMode, setIsAuditMode] = useState(false);
  const [documentType, setDocumentType] = useState<
    "commercial_invoice" | "service_agreement"
  >("commercial_invoice");

  const validateFile = useCallback((file: File): string | null => {
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
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    },
    [setDragActive],
  );

  const uploadFile = useCallback(
    (file: File): Promise<UploadedFile> => {
      return new Promise((resolve, reject) => {
        const fileId = crypto.randomUUID();
        const uploadedFile: UploadedFile = {
          id: fileId,
          filename: file.name,
          size: file.size,
          type: file.type,
          status: "uploading",
          progress: 0,
        };

        setFiles((prev) => [...prev, uploadedFile]);
        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);

        if (isAuditMode) {
          formData.append("documentType", documentType);
        }

        const endpoint = isAuditMode ? "/api/audit" : "/api/upload";
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setFiles((prev) =>
              prev.map((f) => (f.id === fileId ? { ...f, progress } : f)),
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status === 401) {
            router.push(APP_CONFIG.ROUTES.LOGIN);
            setLoading(false);
            reject(new Error("Unauthorized"));
            return;
          }

          const text = xhr.responseText;
          let data: {
            id?: string;
            audit?: Record<string, unknown>;
            documentId?: string;
            error?: string;
            success?: boolean;
          } | null;
          try {
            data = text ? JSON.parse(text) : null;
          } catch {
            data = { error: text || "Invalid JSON response from upload API" };
          }

          if (xhr.status >= 200 && xhr.status < 300 && data) {
            const updatedFile: UploadedFile = {
              ...uploadedFile,
              status: "success",
              progress: 100,
            };
            setFiles((prev) =>
              prev.map((f) => (f.id === fileId ? updatedFile : f)),
            );
            showToast("Document uploaded successfully!", "success");
            if (options?.onUploadSuccess) {
              options.onUploadSuccess();
            }
            setLoading(false);
            resolve(updatedFile);
          } else {
            const errorMsg = data?.error ?? `Upload failed (${xhr.status})`;
            const failedFile: UploadedFile = {
              ...uploadedFile,
              status: "error",
              error: errorMsg,
            };
            setFiles((prev) =>
              prev.map((f) => (f.id === fileId ? failedFile : f)),
            );
            showToast(errorMsg, "error");
            setLoading(false);
            reject(new Error(errorMsg));
          }
        };

        xhr.onerror = () => {
          const errorMsg = "Network error during upload";
          const failedFile: UploadedFile = {
            ...uploadedFile,
            status: "error",
            error: errorMsg,
          };
          setFiles((prev) =>
            prev.map((f) => (f.id === fileId ? failedFile : f)),
          );
          showToast(errorMsg, "error");
          setLoading(false);
          reject(new Error(errorMsg));
        };

        xhr.open("POST", endpoint, true);
        xhr.withCredentials = true;
        xhr.send(formData);
      });
    },
    [isAuditMode, documentType, router, showToast, options],
  );

  // Legacy-friendly wrapper used by FileUploader component
  const upload = useCallback(
    (file: File, _type?: string, _onProgress?: (p: number) => void) => {
      setSelectedFileObj(file);
      return uploadFile(file);
    },
    [uploadFile],
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file);

      if (validationError) {
        showToast(validationError, "error");
        return;
      }

      setSelectedFileObj(file);
      void uploadFile(file);
    },
    [validateFile, uploadFile, showToast],
  );

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const retryUpload = useCallback(
    async (id: string) => {
      const file = files.find((f) => f.id === id);
      if (!file) return;

      // Create a new File from the original upload
      // Note: This is a limitation - we don't store the original file
      // In production, you'd want to keep the original File object
      removeFile(id);
    },
    [files, removeFile],
  );

  return {
    files,
    isAuditMode,
    documentType,
    dragActive,
    loading,
    setIsAuditMode,
    setDocumentType,
    handleDrag,
    handleDrop,
    handleFileSelect,
    uploadFile,
    clearFiles,
    removeFile,
    retryUpload,
    // Legacy-friendly props
    upload,
    selectedFile: selectedFileObj,
    // expose simple progress/status/error for the selected file
    progress:
      selectedFileObj && files
        ? (files.find((f) => f.filename === selectedFileObj.name)?.progress ??
          0)
        : 0,
    status:
      selectedFileObj && files
        ? ((files.find((f) => f.filename === selectedFileObj.name)?.status as
            | "idle"
            | "uploading"
            | "success"
            | "error") ?? "idle")
        : "idle",
    error:
      selectedFileObj && files
        ? (files.find((f) => f.filename === selectedFileObj.name)?.error ??
          null)
        : null,
  };
}
