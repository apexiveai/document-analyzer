import { createBrowserClient } from "@supabase/ssr";

export function hasSupabasePublicEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Lazily initialize the browser client so build-time module evaluation
 * does not fail prerender when env vars are unavailable.
 */
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey)
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — " +
        "add these to your Vercel Environment Variables.",
    );

  const browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
