import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getClientIp, createSafeJsonResponse } from "@/lib/apiSafety"
import {
  checkLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/loginRateLimit"

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const ip = getClientIp(request)

  // ── Environment check ──────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return createSafeJsonResponse(
      { error: "Server configuration error." },
      500,
      requestId
    )
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let payload: { email?: string; password?: string }
  try {
    payload = await request.json()
  } catch {
    return createSafeJsonResponse(
      { error: "Invalid request body." },
      400,
      requestId
    )
  }

  const email = payload.email?.trim()
  const password = payload.password

  if (!email || !password) {
    return createSafeJsonResponse(
      { error: "Email and password are required." },
      400,
      requestId
    )
  }

  // ── Rate limiting ──────────────────────────────────────────────────────────
  const rateLimit = checkLoginRateLimit(ip, email)

  if (!rateLimit.allowed) {
    const minutes = Math.ceil(rateLimit.retryAfterSeconds / 60)

    const messages: Record<string, string> = {
      lockout: `Account temporarily locked after repeated failures. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      email:   `Too many login attempts for this account. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      ip:      `Too many requests from your network. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    }

    const message = messages[rateLimit.blockedBy ?? "ip"] ?? messages.ip

    const response = createSafeJsonResponse(
      { error: message, code: "RATE_LIMITED", retryAfterSeconds: rateLimit.retryAfterSeconds },
      429,
      requestId
    )
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds))
    return response
  }

  // ── Supabase auth ──────────────────────────────────────────────────────────
  let response = NextResponse.json({ success: true })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        response = NextResponse.json({ success: true })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Track failure for progressive lockout
    recordLoginFailure(email)

    // Return a generic message — never reveal whether the email exists
    return createSafeJsonResponse(
      {
        error: "Invalid email or password.",
        code: "INVALID_CREDENTIALS",
        // Tell the client how many attempts remain so it can warn the user
        remainingAttempts: rateLimit.remainingAttempts - 1,
      },
      401,
      requestId
    )
  }

  // Success — reset failure counter
  recordLoginSuccess(email)

  // Attach security headers to the cookie-bearing response
  response.headers.set("x-request-id", requestId)
  response.headers.set("x-content-type-options", "nosniff")
  response.headers.set("cache-control", "no-store")
  return response
}
