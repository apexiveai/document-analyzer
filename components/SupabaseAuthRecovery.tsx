"use client"

import { useEffect } from "react"
import { getSupabaseClient, hasSupabasePublicEnv } from "@/lib/supabaseClient"

function looksLikeStaleAuthError(message: string) {
  const m = message.toLowerCase()
  return (
    m.includes("refresh") ||
    m.includes("invalid jwt") ||
    m.includes("jwt expired") ||
    (m.includes("session") && m.includes("invalid"))
  )
}

/**
 * Clears broken local auth state when the stored refresh token is invalid/expired,
 * which otherwise surfaces as 400 + "Invalid Refresh Token" from Supabase.
 */
export function SupabaseAuthRecovery() {
  useEffect(() => {
    if (!hasSupabasePublicEnv()) {
      return
    }

    let cancelled = false

    const clearIfStale = async () => {
      try {
        const supabaseClient = getSupabaseClient()
        const { error: sessionError } = await supabaseClient.auth.getSession()
        if (cancelled) return
        if (sessionError?.message && looksLikeStaleAuthError(sessionError.message)) {
          try {
            await supabaseClient.auth.signOut({ scope: "local" })
          } catch {
            /* ignore */
          }
          return
        }

        const { error: userError } = await supabaseClient.auth.getUser()
        if (cancelled) return
        if (userError?.message && looksLikeStaleAuthError(userError.message)) {
          try {
            await supabaseClient.auth.signOut({ scope: "local" })
          } catch {
            /* ignore */
          }
        }
      } catch {
        // Ignore runtime client init errors to avoid unhandled promise rejections.
      }
    }

    void clearIfStale()

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
