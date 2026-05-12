"use client";

import { CheckCircle, X, ImageIcon, FileText } from "lucide-react";

interface FileStatusDisplayProps {
  selectedFile: File | null;
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
  error?: string | null;
}

function getFileIcon(file: File) {
  if (file.type.startsWith("image/")) {
    return <ImageIcon className="w-5 h-5 text-green-600" />;
  }
  return <FileText className="w-5 h-5 text-blue-600" />;
}

export function FileStatusDisplay({
  selectedFile,
  status,
  progress,
  error,
}: FileStatusDisplayProps) {
  return (
    <>
      {/* Upload Progress Bar */}
      {status === "uploading" && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-linear-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">
            {progress}% uploaded
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
              {status === "uploading" && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              )}
              {status === "success" && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {status === "error" && (
                <div className="w-5 h-5 text-red-600 flex items-center justify-center">
                  <X className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center">No file chosen</p>
        )}

        {status === "uploading" && (
          <p className="text-sm text-blue-600 text-center mt-2">
            Processing your document...
          </p>
        )}

        {status === "success" && (
          <p className="text-sm text-green-600 text-center mt-2">
            Document uploaded successfully!
          </p>
        )}

        {status === "error" && error && (
          <div className="text-sm text-red-600 text-center mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
            <p className="font-medium">Upload failed</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </>
  );
}
