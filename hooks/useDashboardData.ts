import { useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";
import { useDocuments, type DocumentRecord } from "./useDocuments";
import { useQuota, type QuotaInfo } from "./useQuota";

interface RiskMetrics {
  audited: DocumentRecord[];
  compliant: number;
  nonCompliant: number;
  needsReview: number;
  avgScore: number;
}

interface UsageMetrics {
  totalTokens: number;
  totalCost: number;
}

interface UseDashboardDataReturn {
  // Auth
  user: ReturnType<typeof useAuth>["user"];
  authLoading: boolean;
  authError: string | null;
  isManager: boolean;
  displayName: string;
  logout: () => Promise<void>;
  // Backwards-compatible convenience
  loading: boolean;
  error: string | null;
  fetchDocuments: (page?: number) => Promise<void> | void;

  // Documents
  documents: DocumentRecord[];
  documentsLoading: boolean;
  documentsError: string | null;
  currentPage: number;
  totalPages: number;
  nextPage: () => void;
  prevPage: () => void;
  refreshDocuments: () => Promise<void>;

  // Quota
  quota: QuotaInfo | null;
  quotaLoading: boolean;
  quotaError: string | null;
  usagePercent: number;

  // Combined metrics
  riskMetrics: RiskMetrics;
  usageMetrics: UsageMetrics;
  // Top-level metric fields for legacy components
  audited: DocumentRecord[];
  compliant: number;
  nonCompliant: number;
  needsReview: number;
  avgScore: number;
  totalTokens: number;
  totalCost: number;
}

export function useDashboardData(): UseDashboardDataReturn {
  const auth = useAuth();
  const documents = useDocuments(auth.user);
  const quota = useQuota(auth.user);

  const riskMetrics: RiskMetrics = useMemo(() => {
    const audited = documents.documents.filter((d) => d.audit_result);
    const compliant = audited.filter(
      (d) => d.compliance_status === "compliant",
    ).length;
    const nonCompliant = audited.filter(
      (d) => d.compliance_status === "non_compliant",
    ).length;
    const needsReview = audited.filter(
      (d) =>
        d.compliance_status &&
        d.compliance_status !== "compliant" &&
        d.compliance_status !== "non_compliant",
    ).length;
    const avgScore =
      audited.length > 0
        ? Math.round(
            audited.reduce(
              (sum, d) => sum + (d.audit_result?.compliance?.score ?? 0),
              0,
            ) / audited.length,
          )
        : 0;

    return {
      audited,
      compliant,
      nonCompliant,
      needsReview,
      avgScore,
    };
  }, [documents.documents]);

  const usageMetrics: UsageMetrics = useMemo(() => {
    const totalTokens = documents.documents.reduce(
      (sum, d) => sum + (d.total_tokens || 0),
      0,
    );
    const totalCost = documents.documents.reduce(
      (sum, d) => sum + (Number(d.total_cost) || 0),
      0,
    );

    return {
      totalTokens,
      totalCost,
    };
  }, [documents.documents]);

  const handleLogout = useCallback(async () => {
    await auth.logout();
  }, [auth]);

  return {
    // Backwards-compatible convenience aliases
    loading: auth.loading || documents.loading || quota.loading,
    error: auth.error || documents.error || quota.error,
    fetchDocuments: async (page?: number) => {
      if (typeof page === "number") {
        return documents.fetch(page);
      }
      return documents.fetch(documents.currentPage);
    },
    // Auth
    user: auth.user,
    authLoading: auth.loading,
    authError: auth.error,
    isManager: auth.isManager,
    displayName: auth.user ? auth.formatName() : "User",
    logout: handleLogout,

    // Documents
    documents: documents.documents,
    documentsLoading: documents.loading,
    documentsError: documents.error,
    currentPage: documents.currentPage,
    totalPages: documents.totalPages,
    nextPage: documents.nextPage,
    prevPage: documents.prevPage,
    refreshDocuments: documents.refresh,

    // Quota
    quota: quota.quota,
    quotaLoading: quota.loading,
    quotaError: quota.error,
    usagePercent: quota.usagePercent,

    // Combined metrics
    riskMetrics,
    usageMetrics,
    // Expose metric fields at top-level for legacy consumers
    audited: riskMetrics.audited,
    compliant: riskMetrics.compliant,
    nonCompliant: riskMetrics.nonCompliant,
    needsReview: riskMetrics.needsReview,
    avgScore: riskMetrics.avgScore,
    totalTokens: usageMetrics.totalTokens,
    totalCost: usageMetrics.totalCost,
  };
}
