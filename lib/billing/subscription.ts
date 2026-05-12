import { createClient as createSupabaseServerClient } from "@/lib/supabaseServer";

export type UserPlan = "free" | "pro";

export async function getCurrentUserPlan(): Promise<{
  plan: UserPlan;
  subscription: {
    status: string;
    plan_name: string;
    variant_id: string | null;
    renews_at: string | null;
    ends_at: string | null;
  } | null;
}> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { plan: "free", subscription: null };
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, plan_name, variant_id, renews_at, ends_at")
    .eq("user_id", user.id)
    .in("status", ["active", "on_trial", "trialing"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { plan: "free", subscription: null };
  }

  const normalizedPlan =
    data.plan_name?.toLowerCase() === "pro" ? "pro" : "free";

  return {
    plan: normalizedPlan,
    subscription: {
      status: data.status,
      plan_name: data.plan_name,
      variant_id: data.variant_id,
      renews_at: data.renews_at,
      ends_at: data.ends_at,
    },
  };
}

export async function requireProForAudit() {
  const { plan } = await getCurrentUserPlan();

  if (plan !== "pro") {
    return {
      allowed: false,
      error: "Multi-Region Audit is a Pro feature. Please upgrade to continue.",
    };
  }

  return { allowed: true };
}
