"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import FileUploader from "@/components/ui/FileUploader";
import { BatchFileUploader, UploadHistory } from "@/components/ui/upload";

interface DocumentUploadSectionProps {
  onUploadSuccess: () => void;
}

type TabType = "single" | "batch" | "history";

export default function DocumentUploadSection({
  onUploadSuccess,
}: DocumentUploadSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>("single");

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8"
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-linear-to-br from-green-400 to-blue-500">
          <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
          Upload Documents
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab("single")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "single"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Single File
        </button>
        <button
          onClick={() => setActiveTab("batch")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "batch"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Batch Upload
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "history"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          History
        </button>
      </div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "single" && (
          <FileUploader onUploadSuccess={onUploadSuccess} />
        )}
        {activeTab === "batch" && (
          <BatchFileUploader onUploadComplete={onUploadSuccess} />
        )}
        {activeTab === "history" && <UploadHistory />}
      </motion.div>
    </motion.div>
  );
}
