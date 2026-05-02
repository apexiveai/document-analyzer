/**
 * Comprehensive error handling utilities for the application
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with ID ${id} not found` : `${resource} not found`,
      'RESOURCE_NOT_FOUND',
      404
    )
    this.name = 'ResourceNotFoundError'
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', 429)
    this.name = 'RateLimitError'
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`${service} error: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502)
    this.name = 'ExternalServiceError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(`Database error: ${message}`, 'DATABASE_ERROR', 500, details)
    this.name = 'DatabaseError'
  }
}

/**
 * Safe error handler for async functions
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorContext: string = 'Operation'
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await fn()
    return { data, error: null }
  } catch (error) {
    console.error(`${errorContext} failed:`, error)
    
    if (error instanceof AppError) {
      return { data: null, error }
    }
    
    const appError = new AppError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      'UNKNOWN_ERROR',
      500,
      { context: errorContext }
    )
    
    return { data: null, error: appError }
  }
}

/**
 * Convert any error to AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }
  
  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new ExternalServiceError('Network', error.message)
    }
    
    if (error.message.includes('timeout')) {
      return new ExternalServiceError('Timeout', error.message)
    }
    
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return new ValidationError(error.message)
    }
    
    if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      return new AuthenticationError(error.message)
    }
    
    if (error.message.includes('forbidden') || error.message.includes('permission')) {
      return new AuthorizationError(error.message)
    }
    
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return new ResourceNotFoundError('Resource')
    }
    
    if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
      return new RateLimitError(error.message)
    }
    
    if (error.message.includes('database') || error.message.includes('SQL')) {
      return new DatabaseError(error.message)
    }
    
    return new AppError(error.message, 'UNKNOWN_ERROR', 500)
  }
  
  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 500)
}

/**
 * Log error with context — routes through the monitor so every logged error
 * is also captured by all registered reporters (console, fetch, Sentry, etc.)
 */
export function logError(error: unknown, context: string = 'Application'): void {
  // Lazy import avoids a circular-dependency at module load time
  // (globalErrorHandler imports from errorHandling, not the other way around)
  import('./globalErrorHandler').then(({ monitor }) => {
    monitor.capture(error, context)
  }).catch(() => {
    // Fallback if dynamic import fails (e.g. during SSR build)
    const normalizedError = normalizeError(error)
    console.error(`[${context}] ${normalizedError.name}:`, {
      message:    normalizedError.message,
      code:       normalizedError.code,
      statusCode: normalizedError.statusCode,
      stack:      normalizedError.stack,
    })
  })
}

/**
 * Create standardized API error response
 */
export function createErrorResponse(
  error: unknown,
  requestId?: string
): { error: string; code: string; requestId?: string; details?: Record<string, unknown> } {
  const normalizedError = normalizeError(error)
  
  return {
    error: normalizedError.message,
    code: normalizedError.code,
    requestId,
    details: normalizedError.details
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(field => {
    const value = body[field]
    return value === undefined || value === null || value === ''
  })
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  }
}

/**
 * Retry function with exponential backoff.
 *
 * Only retries on transient errors (network, rate limits, external service).
 * Permanent errors (validation, authentication, authorization) are thrown immediately.
 */

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number   // ms — first retry delay
  maxDelay?: number    // ms — cap on any single delay
  onRetry?: (error: AppError, attempt: number, delayMs: number) => void
}

/** Errors that should never be retried — they won't resolve on their own. */
function isPermanentError(error: unknown): boolean {
  return (
    error instanceof ValidationError ||
    error instanceof AuthenticationError ||
    error instanceof AuthorizationError ||
    error instanceof ResourceNotFoundError
  )
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions | number = {},
  // Legacy overload: retryWithBackoff(fn, maxRetries, baseDelay)
  legacyBaseDelay?: number
): Promise<T> {
  // Support old (fn, maxRetries, baseDelay) call signature for backwards compat
  let maxRetries: number
  let baseDelay: number
  let maxDelay: number
  let onRetry: RetryOptions['onRetry']

  if (typeof options === 'number') {
    maxRetries = options
    baseDelay = legacyBaseDelay ?? 1000
    maxDelay = 30_000
    onRetry = undefined
  } else {
    maxRetries = options.maxRetries ?? 3
    baseDelay = options.baseDelay ?? 1000
    maxDelay = options.maxDelay ?? 30_000
    onRetry = options.onRetry
  }

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Never retry permanent errors — they won't resolve by retrying
      if (isPermanentError(error)) {
        throw error
      }

      // Last attempt — stop retrying
      if (attempt === maxRetries) {
        break
      }

      // Exponential backoff with ±20% jitter to avoid thundering herd
      const exponential = baseDelay * Math.pow(2, attempt)
      const jitter = exponential * 0.2 * (Math.random() * 2 - 1)
      const delayMs = Math.min(exponential + jitter, maxDelay)

      const normalizedError = normalizeError(error)
      onRetry?.(normalizedError, attempt + 1, delayMs)

      console.warn(
        `[retryWithBackoff] Attempt ${attempt + 1}/${maxRetries} failed: ${normalizedError.message}. ` +
        `Retrying in ${Math.round(delayMs)}ms…`
      )

      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  throw lastError ?? new AppError('Operation failed after retries', 'RETRY_EXHAUSTED', 503)
}