"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useDashboardData } from "@/hooks";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import RiskDashboard from "@/components/dashboard/RiskDashboard";
import UsageStatistics from "@/components/dashboard/UsageStatistics";
import DocumentUploadSection from "@/components/dashboard/DocumentUploadSection";
import DocumentsList from "@/components/dashboard/DocumentsList";
import Loading from "@/components/Loading";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function DashboardClient({
  children,
}: {
  children?: ReactNode;
}) {
  const pathname = usePathname();
  const {
    user,
    loading,
    error,
    documents,
    documentsLoading,
    quota,
    currentPage,
    totalPages,
    fetchDocuments,
    logout,
    displayName,
    audited,
    compliant,
    nonCompliant,
    needsReview,
    avgScore,
    totalTokens,
    totalCost,
    usagePercent,
  } = useDashboardData();

  const CORE_IDENTITY = "sdd@gmail.com";
  const isManager = user?.email === CORE_IDENTITY;
  const isCoreView = pathname === "/admin";

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-200 p-6">
          <h2 className="text-xl font-bold text-red-700 mb-2">
            Configuration Error
          </h2>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !user) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-blue-50 to-cyan-50">
        <DashboardHeader
          isManager={isManager}
          isCoreView={isCoreView}
          onLogout={logout}
        />

        <motion.main
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
            delay: 0.2,
          }}
          className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8"
        >
          {children ? (
            <div className="space-y-6 sm:space-y-8">{children}</div>
          ) : (
            <>
              <WelcomeSection displayName={displayName} />

              <RiskDashboard
                audited={audited}
                compliant={compliant}
                nonCompliant={nonCompliant}
                needsReview={needsReview}
                avgScore={avgScore}
              />

              <UsageStatistics
                quota={quota}
                totalTokens={totalTokens}
                totalCost={totalCost}
                usagePercent={usagePercent}
              />

              <DocumentUploadSection
                onUploadSuccess={() => {
                  void fetchDocuments(1);
                }}
              />

              <DocumentsList
                documents={documents}
                loading={documentsLoading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  void fetchDocuments(page);
                }}
              />
            </>
          )}
        </motion.main>
      </div>
    </ErrorBoundary>
  );
}
