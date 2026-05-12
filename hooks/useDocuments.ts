import { useState, useCallback, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, hasSupabasePublicEnv } from "@/lib/supabaseClient";

export interface DocumentAuditResult {
  compliance?: {
    score?: number;
  };
}

export interface DocumentRecord {
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

interface UseDocumentsReturn {
  documents: DocumentRecord[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  fetch: (page: number) => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
  refresh: () => Promise<void>;
}

const DOCUMENTS_PER_PAGE = 10;

export function useDocuments(user: User | null): UseDocumentsReturn {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetch = useCallback(
    async (page = 1) => {
      if (!user || !hasSupabasePublicEnv()) return;

      setLoading(true);
      setError(null);
      try {
        const supabaseClient = getSupabaseClient();
        const from = (page - 1) * DOCUMENTS_PER_PAGE;
        const to = from + DOCUMENTS_PER_PAGE - 1;

        const {
          data,
          error: err,
          count,
        } = await supabaseClient
          .from("documents")
          .select("*", { count: "exact" })
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (err) {
          setError(`Failed to fetch documents: ${err.message}`);
          return;
        }

        setDocuments(data || []);
        if (count !== null) {
          setTotalPages(Math.ceil(count / DOCUMENTS_PER_PAGE));
        }
        setCurrentPage(page);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to fetch documents";
        setError(msg);
        console.error("Error fetching documents:", err);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      void fetch(currentPage + 1);
    }
  }, [currentPage, totalPages, fetch]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      void fetch(currentPage - 1);
    }
  }, [currentPage, fetch]);

  const refresh = useCallback(async () => {
    await fetch(currentPage);
  }, [fetch, currentPage]);

  return {
    documents,
    loading,
    error,
    currentPage,
    totalPages,
    fetch,
    nextPage,
    prevPage,
    refresh,
  };
}
