import { createBrowserClient } from "@supabase/ssr"
import { ValidationError } from "@/lib/errorHandling"
import { getCachedEnvValidation } from "@/lib/errorCache"

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function hasSupabasePublicEnv(): boolean {
  const { valid } = getCachedEnvValidation(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return { valid: false, reason: 'missing_vars' }
    }

    try {
      const url = new URL(supabaseUrl)
      if (!url.protocol.startsWith('https')) {
        return { valid: false, reason: 'not_https' }
      }
      if (!url.hostname.includes('.supabase.co')) {
        return { valid: false, reason: 'not_supabase_domain' }
      }
      const projectRef = url.hostname.split('.')[0]
      if (!projectRef || projectRef.length < 3) {
        return { valid: false, reason: 'short_project_ref' }
      }
    } catch {
      return { valid: false, reason: 'invalid_url' }
    }

    if (!supabaseAnonKey.startsWith('eyJ')) {
      return { valid: false, reason: 'invalid_key_format' }
    }
    if (supabaseAnonKey.length < 50) {
      return { valid: false, reason: 'key_too_short' }
    }

    return { valid: true }
  })

  return valid
}

/**
 * Lazily initialize the browser client so build-time module evaluation
 * does not fail prerender when env vars are unavailable.
 */
export function getSupabaseClient() {
  if (browserClient) {
    return browserClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new ValidationError(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Add them to your .env file and restart the development server."
    )
  }

  // Validate URL format before creating client
  try {
    const url = new URL(supabaseUrl)
    
    if (!url.protocol.startsWith('https')) {
      throw new ValidationError(
        `Invalid Supabase URL: ${supabaseUrl}. ` +
        `URL must use HTTPS protocol.`
      )
    }
    
    if (!url.hostname.includes('.supabase.co')) {
      throw new ValidationError(
        `Invalid Supabase URL: ${supabaseUrl}. ` +
        `URL must be a valid Supabase project URL (e.g., https://<project-ref>.supabase.co).`
      )
    }
    
    const projectRef = url.hostname.split('.')[0]
    if (!projectRef || projectRef.length < 3) {
      throw new ValidationError(
        `Invalid Supabase URL: ${supabaseUrl}. ` +
        `Project reference is missing or too short.`
      )
    }
    
  } catch (error) {
    if (error instanceof Error) {
      throw new ValidationError(
        `Invalid Supabase URL format: ${supabaseUrl}. ` +
        `URL must be a valid HTTPS URL (e.g., https://<project-ref>.supabase.co). ` +
        `Error: ${error.message}`
      )
    }
    throw new ValidationError(
      `Invalid Supabase URL format: ${supabaseUrl}. ` +
      `URL must be a valid HTTPS URL (e.g., https://<project-ref>.supabase.co).`
    )
  }

  // Validate API key format
  if (!supabaseAnonKey.startsWith('eyJ')) {
    throw new ValidationError(
      `Invalid Supabase anon key format. ` +
      `The key should be a JWT token starting with 'eyJ'. ` +
      `Check your NEXT_PUBLIC_SUPABASE_ANON_KEY in .env file.`
    )
  }

  if (supabaseAnonKey.length < 50) {
    throw new ValidationError(
      `Invalid Supabase anon key: key is too short. ` +
      `Check your NEXT_PUBLIC_SUPABASE_ANON_KEY in .env file.`
    )
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return browserClient
}