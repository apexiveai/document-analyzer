"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Shield,
  Truck,
  CheckCircle,
  AlertTriangle,
  XCircle,
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

interface RiskDashboardProps {
  audited: DocumentRecord[];
  compliant: number;
  nonCompliant: number;
  needsReview: number;
  avgScore: number;
}

export default function RiskDashboard({
  audited,
  compliant,
  nonCompliant,
  needsReview,
  avgScore,
}: RiskDashboardProps) {
  const commercialInvoices = audited.filter(
    (d) => d.document_type === "commercial_invoice",
  ).length;
  const serviceAgreements = audited.filter(
    (d) => d.document_type === "service_agreement",
  ).length;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8"
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-linear-to-br from-red-400 to-orange-500">
          <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
          Risk Dashboard
        </h3>
      </div>

      {audited.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No audited documents yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Upload and audit documents to see your compliance overview
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Score & Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-linear-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-700">
                {audited.length}
              </p>
              <p className="text-[10px] sm:text-sm text-indigo-600 mt-1">
                Audited
              </p>
            </div>
            <div className="bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-500" />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-700">
                {compliant}
              </p>
              <p className="text-[10px] sm:text-sm text-green-600 mt-1">
                Compliant
              </p>
            </div>
            <div className="bg-linear-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <XCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-500" />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-700">
                {nonCompliant}
              </p>
              <p className="text-[10px] sm:text-sm text-red-600 mt-1">
                Non-Compliant
              </p>
            </div>
            <div className="bg-linear-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-500" />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-700">
                {needsReview}
              </p>
              <p className="text-[10px] sm:text-sm text-yellow-600 mt-1">
                Needs Review
              </p>
            </div>
          </div>

          {/* Average Compliance Score Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Average Compliance Score
              </span>
              <span
                className={`text-sm font-bold ${
                  avgScore >= 80
                    ? "text-green-600"
                    : avgScore >= 50
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {avgScore}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  avgScore >= 80
                    ? "bg-linear-to-r from-green-400 to-green-600"
                    : avgScore >= 50
                      ? "bg-linear-to-r from-yellow-400 to-yellow-600"
                      : "bg-linear-to-r from-red-400 to-red-600"
                }`}
                style={{ width: `${avgScore}%` }}
              />
            </div>
          </div>

          {/* Document Type Breakdown */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {commercialInvoices > 0 && (
              <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full text-xs sm:text-sm text-blue-700 font-medium">
                <Truck className="w-3.5 h-3.5" />
                {commercialInvoices} Commercial Invoice
                {commercialInvoices !== 1 ? "s" : ""}
              </div>
            )}
            {serviceAgreements > 0 && (
              <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full text-xs sm:text-sm text-purple-700 font-medium">
                <Shield className="w-3.5 h-3.5" />
                {serviceAgreements} Service Agreement
                {serviceAgreements !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
