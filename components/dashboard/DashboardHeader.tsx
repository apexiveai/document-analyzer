"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BarChart3, LogOut, ArrowLeft } from "lucide-react";

interface DashboardHeaderProps {
  isManager: boolean;
  isCoreView: boolean;
  onLogout: () => Promise<void>;
}

export default function DashboardHeader({
  isManager,
  isCoreView,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white shadow-sm border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-linear-to-br from-indigo-600 to-cyan-600 shadow-lg">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              Apexive AI
            </h1>
          </Link>

          <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
            {isCoreView ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-[10px] sm:text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors whitespace-nowrap"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Exit</span>
                </Link>
              </div>
            ) : isManager ? (
              <Link
                href="/admin"
                className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Console
              </Link>
            ) : null}

            <div className="h-4 sm:h-6 w-px bg-gray-200" />

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 text-xs sm:text-sm font-medium transition"
            >
              <LogOut className="w-3.5 sm:w-4 h-4" />
              <span>Logout</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
