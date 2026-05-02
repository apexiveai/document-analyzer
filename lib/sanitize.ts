/**
 * XSS protection utilities.
 *
 * React auto-escapes JSX text nodes, so direct injection via JSX is already
 * safe. This module provides:
 *
 *   1. `sanitizeText`   — strips control characters and trims whitespace from
 *      any string before it enters state or gets stored. Use on all
 *      user-supplied and AI-generated strings.
 *
 *   2. `sanitizeUrl`    — validates URLs before use in href/src attributes.
 *      Blocks javascript: and data: schemes.
 *
 *   3. `sanitizeFilename` — strips path traversal and shell-special characters
 *      from filenames shown in the UI.
 *
 *   4. `escapeRegExp`   — correctly escapes a string for use inside
 *      `new RegExp(...)`. Fixes the corrupted version in AuditReport.tsx.
 *
 *   5. `sanitizeAuditText` — sanitizes AI-generated audit content (summaries,
 *      excerpts, reasons) before rendering.
 *
 * None of these functions parse or produce HTML — they operate on plain text
 * only. If you ever need to render rich HTML, use a dedicated library such as
 * DOMPurify (browser) or sanitize-html (server).
 */

// ─── Control-character strip ──────────────────────────────────────────────────

/**
 * Characters that have no legitimate place in display text but could be used
 * to confuse parsers or inject hidden content:
 *   - C0 controls except tab (0x09), LF (0x0A), CR (0x0D)
 *   - C1 controls (0x80–0x9F)
 *   - Unicode direction overrides (U+202A–U+202E, U+2066–U+2069)
 *   - Zero-width characters (U+200B–U+200F, U+FEFF)
 */
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\x80-\x9F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g

/**
 * Sanitize a plain-text string for safe display.
 *
 * - Removes control characters and Unicode direction overrides
 * - Collapses runs of whitespace to a single space (optional, off by default)
 * - Trims leading/trailing whitespace
 * - Returns an empty string for non-string input
 */
export function sanitizeText(
  value: unknown,
  options: { collapseWhitespace?: boolean; maxLength?: number } = {}
): string {
  if (typeof value !== 'string') return ''

  let result = value
    .replace(CONTROL_CHARS, '')
    .trim()

  if (options.collapseWhitespace) {
    result = result.replace(/\s+/g, ' ')
  }

  if (options.maxLength && result.length > options.maxLength) {
    result = result.slice(0, options.maxLength)
  }

  return result
}

// ─── URL sanitization ─────────────────────────────────────────────────────────

const SAFE_URL_SCHEMES = new Set(['https:', 'http:', 'mailto:'])

/**
 * Validate a URL for use in href or src attributes.
 *
 * Returns the original URL if it uses a safe scheme, otherwise returns '#'.
 * Blocks javascript:, data:, vbscript:, and any other non-allowlisted scheme.
 */
export function sanitizeUrl(value: unknown): string {
  if (typeof value !== 'string') return '#'

  const trimmed = value.trim()
  if (!trimmed) return '#'

  try {
    const url = new URL(trimmed, typeof window !== 'undefined' ? window.location.href : 'https://localhost')
    if (SAFE_URL_SCHEMES.has(url.protocol)) {
      return trimmed
    }
  } catch {
    // Relative URLs that fail URL parsing are fine — return as-is
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
      return trimmed
    }
  }

  return '#'
}

// ─── Filename sanitization ────────────────────────────────────────────────────

/**
 * Strip path traversal sequences and shell-special characters from a filename.
 * Safe to display in the UI; not a substitute for server-side validation.
 */
export function sanitizeFilename(value: unknown): string {
  if (typeof value !== 'string') return 'unknown'

  return value
    .replace(CONTROL_CHARS, '')
    // Remove path separators and traversal sequences
    .replace(/[/\\]/g, '')
    .replace(/\.\./g, '')
    // Remove shell-special characters
    .replace(/[<>:"|?*]/g, '')
    .trim()
    .slice(0, 255) // Filesystem limit
    || 'unknown'
}

// ─── Regex escaping ───────────────────────────────────────────────────────────

/**
 * Escape a string so it can be safely used inside `new RegExp(pattern)`.
 *
 * This is the correct implementation — it replaces the corrupted version
 * in AuditReport.tsx that had a UUID as the replacement string.
 */
export function escapeRegExp(value: string): string {
  // MDN-recommended pattern: escape all regex special characters
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ─── Audit content sanitization ───────────────────────────────────────────────

/**
 * Sanitize a single AI-generated audit string (summary, excerpt, reason, issue,
 * recommendation). Removes control characters and enforces a reasonable length.
 */
export function sanitizeAuditText(value: unknown, maxLength = 2000): string {
  return sanitizeText(value, { maxLength })
}

/**
 * Sanitize an array of strings (issues, recommendations, HS codes).
 * Filters out empty strings after sanitization.
 */
export function sanitizeStringArray(values: unknown, maxLength = 500): string[] {
  if (!Array.isArray(values)) return []
  return values
    .map(v => sanitizeAuditText(v, maxLength))
    .filter(Boolean)
}
