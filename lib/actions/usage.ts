"use server"

import { createClient } from "@supabase/supabase-js";
import { PLANS, PlanKey } from "../billing/plans";

export async function getUserTotalUsage(userId?: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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