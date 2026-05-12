import { useState, useCallback, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { checkUserQuota } from "@/lib/actions/usage";

export interface QuotaInfo {
  allowed: boolean;
  limit: number;
  usage: number;
  remaining: number;
  plan: string;
}

interface UseQuotaReturn {
  quota: QuotaInfo | null;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  usagePercent: number;
}

export function useQuota(user: User | null): UseQuotaReturn {
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const info = await checkUserQuota(user.id);
      setQuota(info as unknown as QuotaInfo);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch quota";
      setError(msg);
      console.error("Error fetching quota:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void fetch();
    }
  }, [user, fetch]);

  const usagePercent = quota
    ? Math.min(100, (quota.usage / quota.limit) * 100)
    : 0;

  return {
    quota,
    loading,
    error,
    fetch,
    usagePercent,
  };
}
