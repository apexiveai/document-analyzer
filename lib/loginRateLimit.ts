/**
 * Login-specific rate limiting.
 *
 * Two independent limiters run on every attempt:
 *
 *   1. Per-IP   — 10 attempts per 15-minute window.
 *      Stops distributed credential-stuffing from a single IP.
 *
 *   2. Per-email — 5 attempts per 15-minute window.
 *      Stops targeted brute-force against a known account even when
 *      the attacker rotates IPs.
 *
 * Progressive lockout
 * ───────────────────
 * After LOGIN_LOCKOUT_THRESHOLD consecutive failures for the same email
 * the window is extended to LOGIN_LOCKOUT_WINDOW_MS (default 1 hour).
 * The failure counter resets on a successful login.
 *
 * All state lives in a module-level Map that is kept alive across hot-reloads
 * via globalThis (same pattern as apiSafety.ts).
 */

// ─── Config ───────────────────────────────────────────────────────────────────

/** Max attempts per IP per window */
const IP_LIMIT = 10;
/** Max attempts per email per window */
const EMAIL_LIMIT = 5;
/** Normal sliding window: 15 minutes */
const WINDOW_MS = 15 * 60 * 1000;
/** Extended lockout window after repeated failures: 1 hour */
const LOCKOUT_WINDOW_MS = 60 * 60 * 1000;
/** Consecutive failures before extended lockout kicks in */
const LOCKOUT_THRESHOLD = 3;

// ─── Store types ──────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface FailureEntry {
  consecutiveFailures: number;
  lockedUntil: number;
}

declare global {
  var __loginRateLimitStore: Map<string, RateLimitEntry> | undefined;
  var __loginFailureStore: Map<string, FailureEntry> | undefined;
}

const store: Map<string, RateLimitEntry> =
  globalThis.__loginRateLimitStore ?? new Map();
if (!globalThis.__loginRateLimitStore) {
  globalThis.__loginRateLimitStore = store;
}

const failureStore: Map<string, FailureEntry> =
  globalThis.__loginFailureStore ?? new Map();
if (!globalThis.__loginFailureStore) {
  globalThis.__loginFailureStore = failureStore;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function check(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - entry.count),
    retryAfterSeconds: 0,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface LoginRateLimitResult {
  allowed: boolean;
  /** Which limiter blocked the request: 'ip' | 'email' | 'lockout' | null */
  blockedBy: "ip" | "email" | "lockout" | null;
  retryAfterSeconds: number;
  /** Remaining attempts before the tighter of the two limits is hit */
  remainingAttempts: number;
}

/**
 * Call this before processing a login attempt.
 * Returns `allowed: false` if either limiter is exhausted.
 */
export function checkLoginRateLimit(
  ip: string,
  email: string,
): LoginRateLimitResult {
  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();

  // ── 1. Progressive lockout check ──────────────────────────────────────────
  const failure = failureStore.get(normalizedEmail);
  if (failure && failure.lockedUntil > now) {
    return {
      allowed: false,
      blockedBy: "lockout",
      retryAfterSeconds: Math.ceil((failure.lockedUntil - now) / 1000),
      remainingAttempts: 0,
    };
  }

  // ── 2. Per-IP check ───────────────────────────────────────────────────────
  const ipResult = check(`ip:${ip}`, IP_LIMIT, WINDOW_MS);
  if (!ipResult.allowed) {
    return {
      allowed: false,
      blockedBy: "ip",
      retryAfterSeconds: ipResult.retryAfterSeconds,
      remainingAttempts: 0,
    };
  }

  // ── 3. Per-email check ────────────────────────────────────────────────────
  const emailResult = check(`email:${normalizedEmail}`, EMAIL_LIMIT, WINDOW_MS);
  if (!emailResult.allowed) {
    return {
      allowed: false,
      blockedBy: "email",
      retryAfterSeconds: emailResult.retryAfterSeconds,
      remainingAttempts: 0,
    };
  }

  return {
    allowed: true,
    blockedBy: null,
    retryAfterSeconds: 0,
    remainingAttempts: Math.min(ipResult.remaining, emailResult.remaining),
  };
}

/**
 * Call this after a **failed** login attempt to track consecutive failures
 * and apply progressive lockout when the threshold is reached.
 */
export function recordLoginFailure(email: string): void {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const existing = failureStore.get(key);
  const failures = (existing?.consecutiveFailures ?? 0) + 1;

  const lockedUntil =
    failures >= LOCKOUT_THRESHOLD ? now + LOCKOUT_WINDOW_MS : 0;

  failureStore.set(key, { consecutiveFailures: failures, lockedUntil });
}

/**
 * Call this after a **successful** login to reset the failure counter.
 */
export function recordLoginSuccess(email: string): void {
  failureStore.delete(email.toLowerCase().trim());
}
