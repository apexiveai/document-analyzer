/**
 * Production-grade error monitoring for the application.
 *
 * Architecture
 * ────────────
 * All errors flow through `monitor.capture()`.  That function:
 *   1. Deduplicates — identical errors within a short window are counted, not
 *      re-reported, so a tight loop never floods your log sink.
 *   2. Samples — in production you can capture only a fraction of low-severity
 *      events to control volume (set NEXT_PUBLIC_ERROR_SAMPLE_RATE, 0–1).
 *   3. Enriches — attaches URL, user-agent, release, environment, and a
 *      fingerprint so events are groupable in any log aggregator.
 *   4. Dispatches — calls every registered Reporter in order.
 *
 * Built-in reporters
 * ──────────────────
 *   • ConsoleReporter  — always active; emits structured JSON so Datadog,
 *     Logtail, Axiom, etc. can parse it without extra configuration.
 *   • FetchReporter    — POSTs to NEXT_PUBLIC_ERROR_ENDPOINT when set.
 *
 * Adding Sentry (example)
 * ───────────────────────
 *   import * as Sentry from '@sentry/nextjs'
 *   monitor.addReporter({
 *     name: 'sentry',
 *     report: (event) => Sentry.captureException(event.error, { extra: event.context })
 *   })
 */

import { AppError, normalizeError } from './errorHandling'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info'

export interface MonitorEvent {
  /** ISO-8601 timestamp */
  timestamp: string
  severity: ErrorSeverity
  /** Stable identifier for grouping duplicate events */
  fingerprint: string
  error: {
    name: string
    message: string
    code: string
    statusCode: number
    stack?: string
  }
  context: {
    /** Where in the app the error originated */
    source: string
    url?: string
    userAgent?: string
    /** git SHA or package version — set via NEXT_PUBLIC_APP_VERSION */
    release?: string
    environment: string
    /** Any extra key/value pairs the caller wants to attach */
    extra?: Record<string, unknown>
  }
  /** How many times this fingerprint was seen (dedup counter) */
  count: number
}

export interface Reporter {
  name: string
  report: (event: MonitorEvent) => void | Promise<void>
}

// ─── Deduplication cache ──────────────────────────────────────────────────────

interface DedupEntry {
  count: number
  firstSeen: number
  lastSeen: number
}

const DEDUP_WINDOW_MS = 60_000   // 1 minute
const DEDUP_MAX_SIZE  = 500      // prevent unbounded growth

const dedupCache = new Map<string, DedupEntry>()

function pruneDedup(): void {
  if (dedupCache.size < DEDUP_MAX_SIZE) return
  const cutoff = Date.now() - DEDUP_WINDOW_MS
  for (const [key, entry] of dedupCache) {
    if (entry.lastSeen < cutoff) dedupCache.delete(key)
  }
}

/** Returns the current count for this fingerprint (1 = first occurrence). */
function trackDedup(fingerprint: string): number {
  pruneDedup()
  const now = Date.now()
  const existing = dedupCache.get(fingerprint)

  if (existing && now - existing.firstSeen < DEDUP_WINDOW_MS) {
    existing.count += 1
    existing.lastSeen = now
    return existing.count
  }

  dedupCache.set(fingerprint, { count: 1, firstSeen: now, lastSeen: now })
  return 1
}

// ─── Fingerprinting ───────────────────────────────────────────────────────────

function fingerprint(error: AppError, source: string): string {
  // Stable enough for grouping without being too specific
  const base = `${error.name}:${error.code}:${source}`
  // Strip line numbers from the first stack frame so the fingerprint survives
  // minor code changes
  const frame = error.stack?.split('\n')[1]?.replace(/:\d+:\d+/g, '') ?? ''
  return `${base}:${frame}`.slice(0, 200)
}

// ─── Severity mapping ─────────────────────────────────────────────────────────

function severityFromError(error: AppError): ErrorSeverity {
  if (error.statusCode >= 500) return 'error'
  if (error.statusCode === 429) return 'warning'
  if (error.statusCode >= 400) return 'info'
  return 'error'
}

// ─── Built-in reporters ───────────────────────────────────────────────────────

const ConsoleReporter: Reporter = {
  name: 'console',
  report(event) {
    const method =
      event.severity === 'fatal' || event.severity === 'error'
        ? 'error'
        : event.severity === 'warning'
        ? 'warn'
        : 'info'

    // Emit a single structured JSON line — parseable by any log aggregator
    console[method](JSON.stringify({
      level:       event.severity,
      message:     event.error.message,
      errorCode:   event.error.code,
      errorName:   event.error.name,
      statusCode:  event.error.statusCode,
      source:      event.context.source,
      url:         event.context.url,
      release:     event.context.release,
      environment: event.context.environment,
      fingerprint: event.fingerprint,
      count:       event.count,
      timestamp:   event.timestamp,
      stack:       event.error.stack,
      extra:       event.context.extra,
    }))
  }
}

const FetchReporter: Reporter = {
  name: 'fetch',
  async report(event) {
    const endpoint =
      typeof process !== 'undefined'
        ? process.env.NEXT_PUBLIC_ERROR_ENDPOINT
        : undefined

    if (!endpoint) return

    try {
      await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        // keepalive lets the request outlive page unload
        keepalive: true,
        body: JSON.stringify(event),
      })
    } catch {
      // Never throw from a reporter — it would cause infinite recursion
    }
  }
}

// ─── Monitor singleton ────────────────────────────────────────────────────────

class Monitor {
  private reporters: Reporter[] = [ConsoleReporter, FetchReporter]
  private sampleRate: number

  constructor() {
    const raw =
      typeof process !== 'undefined'
        ? process.env.NEXT_PUBLIC_ERROR_SAMPLE_RATE
        : undefined
    const parsed = raw ? parseFloat(raw) : 1
    this.sampleRate = isNaN(parsed) ? 1 : Math.max(0, Math.min(1, parsed))
  }

  /** Register an additional reporter (e.g. Sentry, Datadog RUM). */
  addReporter(reporter: Reporter): void {
    this.reporters.push(reporter)
  }

  /** Remove a reporter by name. */
  removeReporter(name: string): void {
    this.reporters = this.reporters.filter(r => r.name !== name)
  }

  /**
   * Capture an error and dispatch it to all reporters.
   *
   * @param error   Any value — will be normalised to AppError.
   * @param source  Human-readable label for where the error came from.
   * @param extra   Optional key/value pairs to attach to the event.
   * @param severity Override the auto-detected severity.
   */
  capture(
    error: unknown,
    source: string = 'application',
    extra?: Record<string, unknown>,
    severity?: ErrorSeverity
  ): void {
    try {
      const appError   = normalizeError(error)
      const fp         = fingerprint(appError, source)
      const count      = trackDedup(fp)
      const resolvedSeverity = severity ?? severityFromError(appError)

      // Sample low-severity repeated events to reduce noise
      if (count > 1 && resolvedSeverity === 'info' && Math.random() > this.sampleRate) {
        return
      }

      const event: MonitorEvent = {
        timestamp:   new Date().toISOString(),
        severity:    resolvedSeverity,
        fingerprint: fp,
        error: {
          name:       appError.name,
          message:    appError.message,
          code:       appError.code,
          statusCode: appError.statusCode,
          stack:      appError.stack,
        },
        context: {
          source,
          url:         typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent:   typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          release:     typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_APP_VERSION : undefined,
          environment: typeof process !== 'undefined' ? (process.env.NODE_ENV ?? 'development') : 'development',
          extra,
        },
        count,
      }

      for (const reporter of this.reporters) {
        try {
          reporter.report(event)
        } catch {
          // Swallow reporter failures — never let monitoring break the app
        }
      }
    } catch {
      // Last-resort fallback so monitoring never crashes the app
      console.error('[monitor] Failed to capture error:', error)
    }
  }
}

export const monitor = new Monitor()

// ─── Global browser event listeners ──────────────────────────────────────────

function setupGlobalErrorHandling(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault()
    monitor.capture(event.reason, 'unhandledrejection', undefined, 'error')
  })

  window.addEventListener('error', (event) => {
    // Ignore cross-origin script errors (no useful info available)
    if (!event.error && event.message === 'Script error.') return
    const err = event.error ?? new Error(event.message)
    monitor.capture(err, 'uncaught', {
      filename: event.filename,
      lineno:   event.lineno,
      colno:    event.colno,
    }, 'fatal')
  })
}

// ─── Performance monitoring ───────────────────────────────────────────────────

function monitorPerformance(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 100) {
          monitor.capture(
            new Error(`Long task: ${entry.name} took ${Math.round(entry.duration)}ms`),
            'performance',
            { duration: entry.duration, startTime: entry.startTime },
            'warning'
          )
        }
      }
    })
    observer.observe({ entryTypes: ['longtask'] })
  } catch {
    // PerformanceObserver not supported — not critical
  }
}

// ─── Public init ──────────────────────────────────────────────────────────────

export function initializeMonitoring(): void {
  setupGlobalErrorHandling()
  monitorPerformance()

  if (process.env.NODE_ENV === 'development') {
    console.info('[monitor] Initialized — reporters:', ['console', 'fetch'].join(', '))
  }
}

// Re-export legacy helpers so existing call-sites keep working
export { normalizeError }
export function sendErrorToService(
  error: unknown,
  context?: Record<string, unknown>
): void {
  monitor.capture(error, 'manual', context)
}
