"use client";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, hasSupabasePublicEnv } from "@/lib/supabaseClient";
import { checkUserQuota } from "@/lib/actions/usage";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import RiskDashboard from "@/components/dashboard/RiskDashboard";
import UsageStatistics from "@/components/dashboard/UsageStatistics";
import DocumentUploadSection from "@/components/dashboard/DocumentUploadSection";
import DocumentsList from "@/components/dashboard/DocumentsList";

interface QuotaInfo {
  allowed: boolean;
  limit: number;
  usage: number;
  remaining: number;
  plan: string;
}

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

export default function DashboardClient({
  children,
}: {
  children?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const missingSupabaseEnv = !hasSupabasePublicEnv();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => !hasSupabasePublicEnv());
  const [authError, setAuthError] = useState<string | null>(() =>
    missingSupabaseEnv
      ? "Missing Supabase public environment variables in this deployment."
      : null,
  );
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const DOCUMENTS_PER_PAGE = 10;

  const CORE_IDENTITY = "sdd@gmail.com";
  const isManager = user?.email === CORE_IDENTITY;
  const isCoreView = pathname === "/admin";

  const fetchQuota = useCallback(async () => {
    if (!user) return;
    const info = await checkUserQuota(user.id);
    setQuota(info as unknown as QuotaInfo);
  }, [user]);

  useEffect(() => {
    if (missingSupabaseEnv) return;

    const checkUser = async () => {
      try {
        const supabaseClient = getSupabaseClient();
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        setUser(user);
      } catch (error) {
        setAuthError(
          error instanceof Error
            ? error.message
            : "Unable to initialize Supabase client",
        );
      } finally {
        setLoading(false);
      }
    };

    void checkUser();
  }, [missingSupabaseEnv]);

  const formatName = (rawName: string) => {
    return rawName
      .trim()
      .split(" ")
      .filter((part) => part.length > 0)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };

  const fetchDocuments = useCallback(
    async (page = 1) => {
      if (!user || !hasSupabasePublicEnv()) return;

      setDocumentsLoading(true);
      try {
        const supabaseClient = getSupabaseClient();
        const from = (page - 1) * DOCUMENTS_PER_PAGE;
        const to = from + DOCUMENTS_PER_PAGE - 1;

        const { data, error, count } = await supabaseClient
          .from("documents")
          .select("*", { count: "exact" })
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) {
          console.error("Error fetching documents:", error);
          return;
        }

        setDocuments(data || []);
        if (count !== null) {
          setTotalPages(Math.ceil(count / DOCUMENTS_PER_PAGE));
        }
        setCurrentPage(page);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setDocumentsLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    if (user) {
      const timeoutId = window.setTimeout(() => {
        void fetchDocuments();
        void fetchQuota();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [user, fetchDocuments, fetchQuota]);

  const getDisplayName = () => {
    const fallbackEmail = user?.email?.split("@")[0] ?? "User";
    const rawName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      fallbackEmail;

    return formatName(rawName);
  };

  const handleLogout = async () => {
    if (!hasSupabasePublicEnv()) {
      router.push("/login");
      return;
    }

    const supabaseClient = getSupabaseClient();
    await supabaseClient.auth.signOut();
    router.push("/login");
  };

  // Risk Dashboard calculations
  const audited = useMemo(
    () => documents.filter((d) => d.audit_result),
    [documents],
  );
  const compliant = useMemo(
    () => audited.filter((d) => d.compliance_status === "compliant").length,
    [audited],
  );
  const nonCompliant = useMemo(
    () => audited.filter((d) => d.compliance_status === "non_compliant").length,
    [audited],
  );
  const needsReview = useMemo(
    () =>
      audited.filter(
        (d) =>
          d.compliance_status &&
          d.compliance_status !== "compliant" &&
          d.compliance_status !== "non_compliant",
      ).length,
    [audited],
  );
  const avgScore = useMemo(
    () =>
      audited.length > 0
        ? Math.round(
            audited.reduce(
              (sum, d) => sum + (d.audit_result?.compliance?.score ?? 0),
              0,
            ) / audited.length,
          )
        : 0,
    [audited],
  );

  // Usage stats calculations
  const totalTokens = useMemo(
    () => documents.reduce((sum, d) => sum + (d.total_tokens || 0), 0),
    [documents],
  );
  const totalCost = useMemo(
    () => documents.reduce((sum, d) => sum + (Number(d.total_cost) || 0), 0),
    [documents],
  );
  const usagePercent = useMemo(
    () => (quota ? Math.min(100, (quota.usage / quota.limit) * 100) : 0),
    [quota],
  );

  if (authError) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-200 p-6">
          <h2 className="text-xl font-bold text-red-700 mb-2">
            Configuration Error
          </h2>
          <p className="text-sm text-red-600">{authError}</p>
        </div>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-blue-50 to-cyan-50">
      <DashboardHeader
        isManager={isManager}
        isCoreView={isCoreView}
        onLogout={handleLogout}
      />

      <motion.main
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
        className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8"
      >
        {children ? (
          <div className="space-y-6 sm:space-y-8">{children}</div>
        ) : (
          <>
            <WelcomeSection displayName={getDisplayName()} />

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
  );
}
