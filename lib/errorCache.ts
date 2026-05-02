/**
 * Error and response caching for the application.
 *
 * Three independent caches live here:
 *
 * 1. ResponseCache  — caches successful API responses by a caller-supplied key.
 *    Prevents identical GET-style requests from hitting the network repeatedly.
 *    TTL is configurable per entry; default 0 (disabled).
 *
 * 2. ErrorCache     — caches failed request outcomes by URL + method.
 *    When a request fails, subsequent identical requests within the error TTL
 *    window return the cached error immediately without touching the network.
 *    Only permanent errors (4xx except 429) are cached; transient errors
 *    (5xx, 429, network) are never cached so retries still work.
 *
 * 3. EnvValidationCache — caches the result of expensive environment-variable
 *    validation (URL parsing, regex) so it runs at most once per session
 *    instead of on every render / hook call.
 *
 * All caches use module-level Maps so they survive across re-renders but are
 * reset on full page reload (appropriate for client-side state).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CachedResponse<T = unknown> {
  data: T
  cachedAt: number
  ttl: number
}

export interface CachedError {
  error: { error: string; code: string; requestId?: string }
  cachedAt: number
  ttl: number
  /** HTTP status that caused the cache entry, if known */
  status?: number
}

// ─── 1. Response cache ────────────────────────────────────────────────────────

const RESPONSE_CACHE_MAX_SIZE = 500 // prevent unbounded growth

const responseStore = new Map<string, CachedResponse>()

/**
 * Prune expired entries from responseStore when size exceeds threshold.
 */
function pruneResponseCache(): void {
  if (responseStore.size < RESPONSE_CACHE_MAX_SIZE) return
  const now = Date.now()
  for (const [key, entry] of responseStore) {
    if (now - entry.cachedAt > entry.ttl) {
      responseStore.delete(key)
    }
  }
}

/**
 * Store a successful response under `key` for `ttlMs` milliseconds.
 * Pass ttlMs = 0 to disable caching (no-op).
 */
export function cacheResponse<T>(key: string, data: T, ttlMs: number): void {
  if (ttlMs <= 0) return
  pruneResponseCache()
  responseStore.set(key, { data, cachedAt: Date.now(), ttl: ttlMs })
}

/**
 * Retrieve a cached response. Returns `null` if missing or expired.
 */
export function getCachedResponse<T>(key: string): T | null {
  const entry = responseStore.get(key)
  if (!entry) return null
  if (Date.now() - entry.cachedAt > entry.ttl) {
    responseStore.delete(key)
    return null
  }
  return entry.data as T
}

/**
 * Explicitly invalidate a cached response (e.g. after a mutation).
 */
export function invalidateResponse(key: string): void {
  responseStore.delete(key)
}

/**
 * Invalidate all cached responses whose key starts with `prefix`.
 * Useful for invalidating a whole resource family (e.g. "/api/documents").
 */
export function invalidateResponsesByPrefix(prefix: string): void {
  for (const key of responseStore.keys()) {
    if (key.startsWith(prefix)) responseStore.delete(key)
  }
}

// ─── 2. Error cache ───────────────────────────────────────────────────────────

/**
 * HTTP status codes that represent permanent, cacheable failures.
 * Transient errors (5xx, 429, network) must NOT be cached — they may succeed
 * on the next attempt.
 */
const CACHEABLE_ERROR_STATUSES = new Set([400, 401, 403, 404, 405, 410, 422])

/**
 * TTLs per error type (milliseconds).
 *
 * Auth errors (401/403) are cached briefly — the user might log in and retry.
 * Not-found (404) is cached longer — the resource won't appear by itself.
 * Validation (400/422) is cached for the session — bad input stays bad.
 */
const ERROR_TTL_BY_STATUS: Record<number, number> = {
  400: 5 * 60 * 1000,   // 5 min  — bad request (malformed input)
  401: 30 * 1000,        // 30 sec — auth may change after login
  403: 60 * 1000,        // 1 min  — permissions may change
  404: 10 * 60 * 1000,  // 10 min — resource unlikely to appear
  405: 60 * 60 * 1000,  // 1 hr   — method not allowed (code bug)
  410: 60 * 60 * 1000,  // 1 hr   — gone permanently
  422: 5 * 60 * 1000,   // 5 min  — unprocessable entity
}

const DEFAULT_ERROR_TTL = 2 * 60 * 1000 // 2 min fallback

const ERROR_CACHE_MAX_SIZE = 500 // prevent unbounded growth

const errorStore = new Map<string, CachedError>()

/**
 * Prune expired entries from errorStore when size exceeds threshold.
 */
function pruneErrorCache(): void {
  if (errorStore.size < ERROR_CACHE_MAX_SIZE) return
  const now = Date.now()
  for (const [key, entry] of errorStore) {
    if (now - entry.cachedAt > entry.ttl) {
      errorStore.delete(key)
    }
  }
}

/**
 * Build a stable cache key for a request.
 * We intentionally exclude request body — caching is keyed on the endpoint
 * and method only, which is appropriate for idempotent operations.
 */
export function buildErrorCacheKey(url: string, method = 'GET'): string {
  // Normalise the URL: strip query params that change per-request (e.g. timestamps)
  try {
    const parsed = new URL(url, 'https://localhost')
    return `${method.toUpperCase()}:${parsed.pathname}`
  } catch {
    return `${method.toUpperCase()}:${url}`
  }
}

/**
 * Returns true if this HTTP status should be cached as a permanent error.
 */
export function isErrorCacheable(status: number): boolean {
  return CACHEABLE_ERROR_STATUSES.has(status)
}

/**
 * Cache a failed response. Only call this for cacheable status codes.
 */
export function cacheError(
  key: string,
  error: CachedError['error'],
  status: number
): void {
  pruneErrorCache()
  const ttl = ERROR_TTL_BY_STATUS[status] ?? DEFAULT_ERROR_TTL
  errorStore.set(key, { error, cachedAt: Date.now(), ttl, status })
}

/**
 * Retrieve a cached error. Returns `null` if missing or expired.
 */
export function getCachedError(key: string): CachedError | null {
  const entry = errorStore.get(key)
  if (!entry) return null
  if (Date.now() - entry.cachedAt > entry.ttl) {
    errorStore.delete(key)
    return null
  }
  return entry
}

/**
 * Explicitly clear a cached error (e.g. after the user fixes their input).
 */
export function clearCachedError(key: string): void {
  errorStore.delete(key)
}

// ─── 3. Environment-variable validation cache ─────────────────────────────────

interface EnvValidationResult {
  valid: boolean
  /** Populated when valid === false */
  reason?: string
  cachedAt: number
}

// Env vars don't change at runtime — cache indefinitely (until page reload)
const ENV_CACHE_TTL = Infinity

let envValidationCache: EnvValidationResult | null = null

/**
 * Run `validator` once and cache the result for the lifetime of the page.
 * Subsequent calls return the cached result without re-running the validator.
 *
 * @param validator  Pure function that returns { valid, reason? }
 * @param bust       Pass `true` to force re-validation (e.g. after hot-reload)
 */
export function getCachedEnvValidation(
  validator: () => { valid: boolean; reason?: string },
  bust = false
): { valid: boolean; reason?: string } {
  if (!bust && envValidationCache) {
    const age = Date.now() - envValidationCache.cachedAt
    if (age < ENV_CACHE_TTL) {
      return { valid: envValidationCache.valid, reason: envValidationCache.reason }
    }
  }

  const result = validator()
  envValidationCache = { ...result, cachedAt: Date.now() }
  return result
}

/**
 * Invalidate the env validation cache (useful in tests or after config changes).
 */
export function bustEnvValidationCache(): void {
  envValidationCache = null
}

// ─── Diagnostics (dev only) ───────────────────────────────────────────────────

export function getCacheStats() {
  return {
    responses: responseStore.size,
    errors: errorStore.size,
    envValidationCached: envValidationCache !== null,
  }
}
