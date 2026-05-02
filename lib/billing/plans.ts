export const PLANS = {
  FREE: {
    name: "Free",
    tokenLimit: 50_000,
  },
  PRO: {
    name: "Pro",
    tokenLimit: 1_000_000,
  },
  ENTERPRISE: {
    name: "Enterprise",
    tokenLimit: 10_000_000,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanLimit(plan: PlanKey) {
  return PLANS[plan].tokenLimit;
}
