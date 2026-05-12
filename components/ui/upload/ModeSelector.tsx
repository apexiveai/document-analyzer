"use client";

import { useCallback, useState } from "react";
import { Shield, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface ModeSelectionProps {
  isAuditMode: boolean;
  onModeChange: (isAudit: boolean) => void;
  disabled?: boolean;
}

export function ModeSelector({
  isAuditMode,
  onModeChange,
  disabled,
}: ModeSelectionProps) {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Upload Mode</h3>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onModeChange(false)}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base disabled:opacity-50 ${
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
          onClick={() => onModeChange(true)}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base disabled:opacity-50 ${
            isAuditMode
              ? "bg-purple-600 text-white shadow-md"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Shield className="w-4 h-4" />
          Multi-Region Audit
        </motion.button>
      </div>
    </div>
  );
}
