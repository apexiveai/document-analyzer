import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, hasSupabasePublicEnv } from "@/lib/supabaseClient";
import { APP_CONFIG } from "@/constants/config";

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  formatName: () => string;
  isManager: boolean;
}

const CORE_IDENTITY = "sdd@gmail.com";

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const missingSupabaseEnv = !hasSupabasePublicEnv();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => !hasSupabasePublicEnv());
  const [error, setError] = useState<string | null>(() =>
    missingSupabaseEnv
      ? "Missing Supabase public environment variables in this deployment."
      : null,
  );

  const formatName = useCallback((rawName: string) => {
    return rawName
      .trim()
      .split(" ")
      .filter((part) => part.length > 0)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }, []);

  const logout = useCallback(async () => {
    if (!hasSupabasePublicEnv()) {
      router.push(APP_CONFIG.ROUTES.LOGIN);
      return;
    }

    const supabaseClient = getSupabaseClient();
    await supabaseClient.auth.signOut();
    router.push(APP_CONFIG.ROUTES.LOGIN);
  }, [router]);

  useEffect(() => {
    if (missingSupabaseEnv) return;

    const checkUser = async () => {
      try {
        const supabaseClient = getSupabaseClient();
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        setUser(user);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to initialize Supabase client",
        );
      } finally {
        setLoading(false);
      }
    };

    void checkUser();
  }, [missingSupabaseEnv]);

  const getDisplayName = useCallback(() => {
    const fallbackEmail = user?.email?.split("@")[0] ?? "User";
    const rawName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      fallbackEmail;

    return formatName(rawName);
  }, [user, formatName]);

  return {
    user,
    loading,
    error,
    logout,
    formatName: getDisplayName,
    isManager: user?.email === CORE_IDENTITY,
  };
}
