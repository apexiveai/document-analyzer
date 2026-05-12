"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Truck,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface DocumentAuditResult {
  compliance?: {
    score?: number;
  };
}

interface DocumentRecord {
  id: string;
  filename?: string;
  file_name?: string;
  summary?: string;
  document_type?: string;
  audit_result?: DocumentAuditResult | null;
  compliance_status?: string;
  total_tokens?: number;
  total_cost?: number;
  created_at: string;
}

interface DocumentsListProps {
  documents: DocumentRecord[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function DocumentsList({
  documents,
  loading,
  currentPage,
  totalPages,
  onPageChange,
}: DocumentsListProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8"
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-linear-to-br from-purple-400 to-pink-500">
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
          Uploaded Documents
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600">Loading documents...</span>
        </div>
      ) : documents.length > 0 ? (
        <div className="space-y-4">
          {documents.map((doc) => (
            <Link key={doc.id} href={`/dashboard/${doc.id}`}>
              <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-purple-300">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors truncate">
                        {doc.filename || doc.file_name}
                      </h3>
                      {doc.audit_result && (
                        <div className="flex items-center gap-1 shrink-0">
                          {doc.document_type === "commercial_invoice" ? (
                            <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                          ) : (
                            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                          )}
                          <span className="text-[10px] font-medium px-2 py-0.5 sm:py-1 rounded-full bg-purple-100 text-purple-700 whitespace-nowrap">
                            Audited
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                      {doc.summary || "No summary available"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-gray-500 mb-2">
                      <span>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                      <span className="opacity-50">•</span>
                      <span>
                        {new Date(doc.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {doc.audit_result && (
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-1">
                          {doc.compliance_status === "compliant" ? (
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                          ) : doc.compliance_status === "non_compliant" ? (
                            <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
                          )}
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 sm:py-1 rounded whitespace-nowrap ${
                              doc.compliance_status === "compliant"
                                ? "bg-green-100 text-green-700"
                                : doc.compliance_status === "non_compliant"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {doc.compliance_status
                              ?.replace("_", " ")
                              .toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                          Score: {doc.audit_result.compliance?.score || 0}/100
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 self-start sm:self-center">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            Your processed documents will appear here.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Upload your first document to get started
          </p>
        </div>
      )}
    </motion.div>
  );
}
