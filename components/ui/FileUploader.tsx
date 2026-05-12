"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle,
  X,
  Image as ImageIcon,
  Shield,
  Truck,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { motion } from "framer-motion";

const MAX_BYTES = 10 * 1024 * 1024;
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
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAuditMode, setIsAuditMode] = useState(false);
  const [documentType, setDocumentType] = useState<
    "commercial_invoice" | "service_agreement"
  >("commercial_invoice");
  const { showToast } = useToast();

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_BYTES) {
      return "File too large (max 10MB).";
    }

    const isAcceptedType = Object.keys(ACCEPTED_TYPES).some(
      (type) =>
        file.type === type ||
        ACCEPTED_TYPES[type as keyof typeof ACCEPTED_TYPES].some((ext) =>
          file.name.toLowerCase().endsWith(ext),
        ),
    );

    if (!isAcceptedType) {
      return "File type not supported. Please upload PDF, DOCX, TXT, CSV, DOC, or image files.";
    }

    return null;
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="w-5 h-5 text-green-600" />;
    }
    return <FileText className="w-5 h-5 text-blue-600" />;
  };

  const getAcceptedTypesString = () => {
    return Object.values(ACCEPTED_TYPES).flat().join(", ");
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

  const handleFileSelect = (file: File) => {
    setErrorDetail(null);
    const validationError = validateFile(file);

    if (validationError) {
      setSelectedFile(file);
      setUploadStatus("error");
      setErrorDetail(validationError);
      showToast(validationError, "error");
      return;
    }

    setSelectedFile(file);
    void uploadFile(file);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void handleFileSelect(file);
  };

  const uploadFile = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);

      if (isAuditMode) {
        formData.append("documentType", documentType);
      }

      setLoading(true);
      setUploadStatus("uploading");
      setUploadProgress(0);

      const endpoint = isAuditMode ? "/api/audit" : "/api/upload";
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 401) {
          router.push("/login");
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
          setUploadStatus("success");
          setUploadProgress(100);
          showToast("Document uploaded successfully!", "success");
          if (onUploadSuccess) {
            onUploadSuccess();
          }
          setLoading(false);
          resolve();
        } else {
          const errorMsg = data?.error ?? `Upload failed (${xhr.status})`;
          setUploadStatus("error");
          setErrorDetail(errorMsg);
          showToast(errorMsg, "error");
          setLoading(false);
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => {
        setUploadStatus("error");
        const errorMsg = "Network error during upload";
        setErrorDetail(errorMsg);
        showToast(errorMsg, "error");
        setLoading(false);
        reject(new Error(errorMsg));
      };

      xhr.open("POST", endpoint, true);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  };

  return (
    <div className="w-full">
      {/* Mode Selection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload Mode</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAuditMode(false)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
              !isAuditMode
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <FileText className="w-4 h-4" />
            Document Analysis
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAuditMode(true)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
              isAuditMode
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Shield className="w-4 h-4" />
            Multi-Region Audit
          </motion.button>
        </div>

        {isAuditMode && (
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Document Type
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all">
                <input
                  type="radio"
                  name="documentType"
                  value="commercial_invoice"
                  checked={documentType === "commercial_invoice"}
                  onChange={(e) =>
                    setDocumentType(e.target.value as "commercial_invoice")
                  }
                  className="text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      Commercial Invoice
                    </span>
                    <span className="text-[10px] text-gray-500">
                      (HS Code Validation)
                    </span>
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all">
                <input
                  type="radio"
                  name="documentType"
                  value="service_agreement"
                  checked={documentType === "service_agreement"}
                  onChange={(e) =>
                    setDocumentType(e.target.value as "service_agreement")
                  }
                  className="text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-500 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      Service Agreement
                    </span>
                    <span className="text-[10px] text-gray-500">
                      (Legal Risk Assessment)
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* File Input Section */}
      <div
        className={`border-2 border-dashed rounded-xl p-4 sm:p-6 md:p-8 transition-all duration-200 ${
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
          <Upload
            className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 transition-colors ${
              dragActive ? "text-blue-500" : "text-gray-400"
            }`}
          />
          <label className="block">
            <span className="text-base sm:text-lg font-semibold text-gray-700 mb-2 block">
              {dragActive
                ? "Drop your file here"
                : "Choose or Drag & Drop File"}
            </span>
            <span className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 block">
              {getAcceptedTypesString()} files up to 10MB
            </span>
            <input
              ref={inputRef}
              type="file"
              accept={Object.values(ACCEPTED_TYPES).flat().join(",")}
              onChange={handleUpload}
              className="hidden"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="bg-linear-to-r from-blue-600 to-purple-600 text-white font-semibold py-2.5 px-4 sm:py-3 sm:px-6 rounded-lg hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
            >
              {loading ? "Uploading..." : "Select File"}
            </button>
          </label>
        </div>
      </div>

      {/* Upload Progress Bar */}
      {uploadStatus === "uploading" && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-linear-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">
            {uploadProgress}% uploaded
          </p>
        </div>
      )}

      {/* File Status */}
      <div className="mt-4">
        {selectedFile ? (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
            {getFileIcon(selectedFile)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{" "}
                {selectedFile.type || "Unknown type"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {uploadStatus === "uploading" && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              )}
              {uploadStatus === "success" && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {uploadStatus === "error" && (
                <div className="w-5 h-5 text-red-600 flex items-center justify-center">
                  <X className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center">No file chosen</p>
        )}

        {uploadStatus === "uploading" && (
          <p className="text-sm text-blue-600 text-center mt-2">
            Processing your document...
          </p>
        )}

        {uploadStatus === "success" && (
          <p className="text-sm text-green-600 text-center mt-2">
            Document uploaded successfully!
          </p>
        )}

        {uploadStatus === "error" && (
          <div className="text-sm text-red-600 text-center mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
            <p className="font-medium">Upload failed</p>
            <p>{errorDetail ?? "Please try again."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
