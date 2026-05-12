"use client";

import { motion } from "framer-motion";
import { Activity, Zap } from "lucide-react";
import PaymentModal from "@/components/PaymentModal";
import UpgradeButton from "@/components/UpgradeButton";

interface QuotaInfo {
  allowed: boolean;
  limit: number;
  usage: number;
  remaining: number;
  plan: string;
}

interface UsageStatisticsProps {
  quota: QuotaInfo | null;
  totalTokens: number;
  totalCost: number;
  usagePercent: number;
}

export default function UsageStatistics({
  quota,
  totalTokens,
  totalCost,
  usagePercent,
}: UsageStatisticsProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-indigo-100"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-linear-to-br from-indigo-400 to-blue-500 shrink-0">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
            Usage Statistics
          </h3>
        </div>
        {quota && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 uppercase">
              {quota.plan} PLAN
            </span>
            {quota.plan === "FREE" && (
              <PaymentModal>
                <UpgradeButton className="text-[10px] sm:text-xs py-1" />
              </PaymentModal>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
        <div className="bg-indigo-50/50 rounded-xl p-3 sm:p-4 border border-indigo-100">
          <p className="text-xs sm:text-sm font-medium text-indigo-600 mb-1">
            Total Tokens Used
          </p>
          <p className="text-xl sm:text-2xl font-bold text-indigo-900">
            {totalTokens.toLocaleString()}
          </p>
        </div>
        <div className="bg-blue-50/50 rounded-xl p-3 sm:p-4 border border-blue-100">
          <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1">
            Estimated AI Cost
          </p>
          <p className="text-xl sm:text-2xl font-bold text-blue-900">
            ${totalCost.toFixed(4)}
          </p>
        </div>
      </div>

      {quota && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 font-medium text-gray-700">
              <Zap className="w-4 h-4 text-amber-500" />
              Plan Quota
            </div>
            <span className="text-gray-500">
              {quota.usage.toLocaleString()} / {quota.limit.toLocaleString()}{" "}
              tokens
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                usagePercent > 90
                  ? "bg-red-500"
                  : usagePercent > 70
                    ? "bg-amber-500"
                    : "bg-indigo-600"
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400">
            {quota.remaining.toLocaleString()} tokens remaining on your current
            plan.
          </p>
        </div>
      )}
    </motion.div>
  );
}
