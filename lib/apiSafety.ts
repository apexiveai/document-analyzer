import { NextResponse } from "next/server"

type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
}

declare global {
  var __apiRateLimitStore: Map<string, RateLimitEntry> | undefined
}

const rateLimitStore = globalThis.__apiRateLimitStore ?? new Map<string, RateLimitEntry>()
if (!globalThis.__apiRateLimitStore) {
  globalThis.__apiRateLimitStore = rateLimitStore
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }

  const realIp = req.headers.get("x-real-ip")
  if (realIp) {
    return realIp.trim()
  }

  const cfIp = req.headers.get("cf-connecting-ip")
  if (cfIp) {
    return cfIp.trim()
  }

  return "unknown"
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const current = rateLimitStore.get(key)

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  rateLimitStore.set(key, current)

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  }
}

export function applySecurityHeaders(
  response: NextResponse,
  requestId: string,
  rateLimit?: RateLimitResult
): NextResponse {
  response.headers.set("x-request-id", requestId)
  response.headers.set("x-content-type-options", "nosniff")
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin")
  response.headers.set("cache-control", "no-store")

  if (rateLimit) {
    response.headers.set("x-ratelimit-limit", String(rateLimit.limit))
    response.headers.set("x-ratelimit-remaining", String(rateLimit.remaining))
    response.headers.set("retry-after", String(rateLimit.retryAfterSeconds))
  }

  return response
}

export function createSafeJsonResponse(
  body: unknown,
  status: number,
  requestId: string,
  rateLimit?: RateLimitResult
): NextResponse {
  const response = NextResponse.json(body, { status })
  return applySecurityHeaders(response, requestId, rateLimit)
}
