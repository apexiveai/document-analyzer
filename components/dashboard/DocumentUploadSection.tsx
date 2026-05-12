"use client";

import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import FileUploader from "@/components/ui/FileUploader";

interface DocumentUploadSectionProps {
  onUploadSuccess: () => void;
}

export default function DocumentUploadSection({
  onUploadSuccess,
}: DocumentUploadSectionProps) {
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
      <FileUploader onUploadSuccess={onUploadSuccess} />
    </motion.div>
  );
}
