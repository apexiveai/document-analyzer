"use server"

import { createSupabaseServerClient } from "../supabaseServer";
import { createAdminClient } from "../supabaseadmin";
import { PLANS, PlanKey } from "../billing/plans";

const CORE_IDENTITY = process.env.ADMIN_EMAIL;

export async function getUserTotalUsage(userId?: string) {
  const supabase = createAdminClient();
  
  const query = supabase
    .from("documents")
    .select("total_tokens");

  if (userId) {
    query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error fetching usage:", error);
    return 0;
  }

  const total = data.reduce((acc, curr) => acc + (curr.total_tokens || 0), 0);
  return total;
}

export async function checkUserQuota(userId: string) {
  const supabase = createAdminClient();

  // 1. Get user plan
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    console.warn("Could not find user profile, defaulting to FREE plan");
  }

  const planKey = (profile?.plan || "FREE") as PlanKey;
  const limit = PLANS[planKey]?.tokenLimit || PLANS.FREE.tokenLimit;

  // 2. Get total usage
  const totalUsage = await getUserTotalUsage(userId);

  return {
    allowed: totalUsage < limit,
    limit,
    usage: totalUsage,
    remaining: Math.max(0, limit - totalUsage),
    plan: planKey,
  };
}

export async function getUserUsageStats(userId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("usage_logs")
    .select("token_count, cost, created_at")
    .eq("user_id", userId);

  if (error || !data) {
    console.error("Error fetching usage stats:", error);
    return { totalTokens: 0, totalCost: 0, logs: [] };
  }

  const totalTokens = data.reduce((acc, curr) => acc + (curr.token_count || 0), 0);
  const totalCost = data.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);

  return { totalTokens, totalCost, logs: data };
}

export async function getAllUsersUsage() {
  // Fail fast if admin email is not configured
  if (!CORE_IDENTITY) {
    throw new Error("ADMIN_EMAIL environment variable is not set")
  }

  // Server-side security check
  const serverSupabase = await createSupabaseServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();

  if (!user || user.email !== CORE_IDENTITY) {
    throw new Error("Unauthorized: System access only");
  }

  const supabase = createAdminClient();

  // 1. Fetch all users from auth
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Error fetching users:", authError);
    return [];
  }

  // 2. Fetch all document token usage
  const { data: documents, error: docError } = await supabase
    .from("documents")
    .select("user_id, total_tokens");

  if (docError) {
    console.error("Error fetching documents:", docError);
    return [];
  }

  // 3. Aggregate data
  const usageMap: Record<string, number> = {};
  documents?.forEach(doc => {
    usageMap[doc.user_id] = (usageMap[doc.user_id] || 0) + (doc.total_tokens || 0);
  });

  return users.map(user => ({
    email: user.email || "Unknown",
    total_tokens: usageMap[user.id] || 0
  })).filter(u => u.total_tokens > 0); // Only show users with usage
}
