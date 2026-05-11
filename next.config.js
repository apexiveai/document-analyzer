/** @type {import('next').NextConfig} */

/**
 * Content Security Policy
 * ───────────────────────
 * Prevents XSS by telling the browser which sources are allowed to load
 * scripts, styles, images, etc.
 *
 * Directives explained:
 *   default-src 'self'          — block everything not explicitly allowed
 *   script-src  'self' 'unsafe-inline' 'unsafe-eval'
 *                               — Next.js requires unsafe-inline for its
 *                                 inline hydration scripts and unsafe-eval
 *                                 for development hot-reload. In production
 *                                 you can tighten this with nonces (see
 *                                 Next.js docs on CSP with nonces).
 *   style-src   'self' 'unsafe-inline'
 *                               — Tailwind and CSS-in-JS need unsafe-inline.
 *   img-src     'self' data: blob: https:
 *                               — Allow images from same origin, data URIs
 *                                 (used by some chart libs), blobs, and HTTPS.
 *   font-src    'self' data:    — Google Fonts loaded locally via next/font.
 *   connect-src 'self' https:   — Fetch/XHR to same origin and HTTPS APIs
 *                                 (Supabase, AI providers).
 *   frame-ancestors 'none'      — Prevents clickjacking (equivalent to
 *                                 X-Frame-Options: DENY).
 *   base-uri    'self'          — Prevents base-tag injection.
 *   form-action 'self'          — Forms may only submit to same origin.
 *   object-src  'none'          — Block Flash and other plugins.
 *   upgrade-insecure-requests   — Upgrade HTTP sub-resources to HTTPS.
 */
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self' data:;
  connect-src 'self' https:;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, ' ')
  .trim()

const securityHeaders = [
  // ── XSS / injection ──────────────────────────────────────────────────────
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  {
    // Legacy XSS filter for older browsers (Chrome < 78, IE)
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    // Prevent MIME-type sniffing — stops browsers treating text/plain as JS
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },

  // ── Clickjacking ─────────────────────────────────────────────────────────
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },

  // ── Transport security ────────────────────────────────────────────────────
  {
    // Force HTTPS for 2 years; include subdomains
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },

  // ── Referrer / privacy ────────────────────────────────────────────────────
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },

  // ── Permissions policy ────────────────────────────────────────────────────
  {
    // Disable browser features the app doesn't need
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
]

// Cache control header for API routes only (prevents caching sensitive data)
const apiCacheHeaders = [
  {
    key: 'Cache-Control',
    value: 'no-store',
  },
]

const nextConfig = {
  serverExternalPackages: ['pdf-parse', '@napi-rs/canvas'],

  async headers() {
    return [
      {
        // Apply general security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Apply no-store cache control to API routes only
        // This prevents sensitive data from being cached while allowing
        // static assets (JS, CSS, images) to be cached normally
        source: '/api/:path*',
        headers: apiCacheHeaders,
      },
    ]
  },
}

module.exports = nextConfig
