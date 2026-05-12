"use client";

import { useRef, useCallback, ReactNode } from "react";
import { Upload } from "lucide-react";

interface FileInputAreaProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  acceptedTypes: Record<string, string[]>;
  dragActive?: boolean;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export function FileInputArea({
  onFileSelect,
  disabled,
  acceptedTypes,
  dragActive,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: FileInputAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileSelect(file);
  };

  const getAcceptedTypesString = () => {
    return Object.values(acceptedTypes).flat().join(", ");
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-4 sm:p-6 md:p-8 transition-all duration-200 ${
        dragActive
          ? "border-blue-500 bg-blue-50 scale-105"
          : "border-gray-300 hover:border-blue-400"
      }`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="text-center">
        <Upload
          className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 transition-colors ${
            dragActive ? "text-blue-500" : "text-gray-400"
          }`}
        />
        <label className="block">
          <span className="text-base sm:text-lg font-semibold text-gray-700 mb-2 block">
            {dragActive ? "Drop your file here" : "Choose or Drag & Drop File"}
          </span>
          <span className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 block">
            {getAcceptedTypesString()} <br />
            Up to 10MB
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={Object.values(acceptedTypes).flat().join(",")}
            onChange={handleUpload}
            className="hidden"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="bg-linear-to-r from-blue-600 to-purple-600 text-white font-semibold py-2.5 px-4 sm:py-3 sm:px-6 rounded-lg hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
          >
            Select File
          </button>
        </label>
      </div>
    </div>
  );
}
