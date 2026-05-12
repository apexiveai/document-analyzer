/**
 * Client-side API error handling utilities
 */

import { useToast } from "@/components/ui/Toast";
import { useState, useCallback, useRef } from "react";
import { ExternalServiceError } from "@/lib/errorHandling";
import {
  cacheResponse,
  getCachedResponse,
  cacheError,
  getCachedError,
  buildErrorCacheKey,
  isErrorCacheable,
} from "@/lib/errorCache";

export interface ApiError {
  error: string;
  code?: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

// Error cache to prevent showing same error repeatedly
const errorCache = new Map<string, { timestamp: number; count: number }>();
const ERROR_CACHE_TTL = 60000; // 1 minute
const MAX_ERRORS_PER_TTL = 3;

export function isApiError(error: unknown): error is ApiError {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  // Check if it has the basic structure of ApiError
  const potentialError = error as Record<string, unknown>;
  return "error" in potentialError && typeof potentialError.error === "string";
}

export function extractErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  // Handle fetch Response objects
  if (error instanceof Response) {
    return `HTTP ${error.status}: ${error.statusText}`;
  }

  return "An unexpected error occurred";
}

export function extractErrorCode(error: unknown): string {
  if (isApiError(error) && error.code) {
    return error.code;
  }

  // Extract from Error objects
  if (error instanceof Error) {
    if (error.name === "AbortError") return "TIMEOUT_ERROR";
    if (error.name === "TypeError" && error.message.includes("fetch"))
      return "NETWORK_ERROR";
    if (error.name === "SyntaxError") return "PARSE_ERROR";
  }

  // Extract from Response objects
  if (error instanceof Response) {
    if (error.status === 401) return "AUTHENTICATION_ERROR";
    if (error.status === 403) return "AUTHORIZATION_ERROR";
    if (error.status === 404) return "RESOURCE_NOT_FOUND";
    if (error.status === 429) return "RATE_LIMIT_ERROR";
    if (error.status >= 500) return "SERVER_ERROR";
    return `HTTP_${error.status}`;
  }

  return "UNKNOWN_ERROR";
}

export function extractRequestId(error: unknown): string | undefined {
  if (isApiError(error)) {
    return error.requestId;
  }

  // Try to extract from Error objects
  if (error instanceof Error && error.cause) {
    const cause = error.cause;
    if (typeof cause === "object" && cause !== null && "requestId" in cause) {
      return String(cause.requestId);
    }
  }

  return undefined;
}

/**
 * Check if error should be shown (rate limiting)
 */
function shouldShowError(errorKey: string): boolean {
  const now = Date.now();
  const cached = errorCache.get(errorKey);

  if (!cached) {
    errorCache.set(errorKey, { timestamp: now, count: 1 });
    return true;
  }

  // Reset cache if TTL expired
  if (now - cached.timestamp > ERROR_CACHE_TTL) {
    errorCache.set(errorKey, { timestamp: now, count: 1 });
    return true;
  }

  // Increment count
  cached.count += 1;

  // Only show if under limit
  if (cached.count <= MAX_ERRORS_PER_TTL) {
    return true;
  }

  return false;
}

/**
 * React hook for API error handling
 */
export function useApiErrorHandler() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<ApiError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const abortRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleApiError = useCallback(
    (
      error: unknown,
      context: string = "Operation",
      options?: {
        showToast?: boolean;
        fallbackMessage?: string;
        logToConsole?: boolean;
        allowRetry?: boolean;
      },
    ) => {
      const message = extractErrorMessage(error);
      const code = extractErrorCode(error);
      const requestId = extractRequestId(error);

      const errorKey = `${code}:${message}`;

      // Only log if enabled
      if (options?.logToConsole !== false) {
        console.error(`[${context}] API Error:`, {
          message,
          code,
          requestId,
          originalError: error,
          timestamp: new Date().toISOString(),
        });
      }

      const finalMessage = options?.fallbackMessage || message;

      // Check if we should show toast (rate limiting)
      const shouldShow = shouldShowError(errorKey);

      if (options?.showToast !== false && shouldShow) {
        // Format context for better UX
        const formattedContext = context
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        showToast(`${formattedContext}: ${finalMessage}`, "error");
      }

      const errorObject: ApiError = {
        error: finalMessage,
        code,
        requestId,
        details: error instanceof Error ? { stack: error.stack } : undefined,
      };

      setLastError(errorObject);

      return {
        message: finalMessage,
        code,
        requestId,
        isApiError: isApiError(error),
        error: errorObject,
        shouldRetry:
          options?.allowRetry !== false &&
          (code === "NETWORK_ERROR" ||
            code === "TIMEOUT_ERROR" ||
            code === "RATE_LIMIT_ERROR" ||
            code === "SERVER_ERROR"),
      };
    },
    [showToast],
  );

  const handleNetworkError = useCallback(
    (error: unknown, context: string = "Network request") => {
      console.error(`[${context}] Network Error:`, error);

      let message = "Network error occurred";
      let code = "NETWORK_ERROR";

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          message = "Request was cancelled";
          code = "REQUEST_CANCELLED";
        } else if (error.message.includes("Failed to fetch")) {
          message =
            "Unable to connect to server. Please check your internet connection.";
        } else if (error.message.includes("timeout")) {
          message = "Request timed out. Please try again.";
          code = "TIMEOUT_ERROR";
        }
      }

      const errorKey = `${code}:${message}`;
      if (shouldShowError(errorKey)) {
        showToast(`${context}: ${message}`, "error");
      }

      return {
        message,
        code,
        isNetworkError: true,
      };
    },
    [showToast],
  );

  const handleValidationError = useCallback(
    (errors: Record<string, string[]>, context: string = "Validation") => {
      const errorMessages = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
        .join("; ");

      console.error(`[${context}] Validation Error:`, errors);

      showToast(`${context}: ${errorMessages}`, "error");

      return {
        message: errorMessages,
        code: "VALIDATION_ERROR",
        errors,
      };
    },
    [showToast],
  );

  const withErrorHandling = useCallback(
    async <T>(
      operation: () => Promise<T>,
      context: string = "Operation",
      options?: {
        showToast?: boolean;
        fallbackMessage?: string;
        retryCount?: number;
      },
    ): Promise<{ data: T | null; error: ApiError | null }> => {
      setIsLoading(true);
      abortControllerRef.current = new AbortController();

      const retries = options?.retryCount || 0;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const data = await operation();
          setIsLoading(false);
          clearError();
          return { data, error: null };
        } catch (error) {
          // On last attempt, handle the error
          if (attempt === retries) {
            const errorResult = handleApiError(error, context, {
              ...options,
              allowRetry: false,
            });
            setIsLoading(false);
            return { data: null, error: errorResult.error };
          }

          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // This should never be reached
      setIsLoading(false);
      return {
        data: null,
        error: {
          error: "Operation failed after retries",
          code: "RETRY_FAILED",
        },
      };
    },
    [handleApiError, clearError],
  );

  return {
    handleApiError,
    handleNetworkError,
    handleValidationError,
    withErrorHandling,
    extractErrorMessage,
    extractErrorCode,
    extractRequestId,
    isApiError,
    isLoading,
    lastError,
    clearError,
    abortRequest,
  };
}

/**
 * Safe fetch wrapper with response caching and error caching.
 *
 * Response cache  — pass `cacheKey` + `cacheTtl` to cache successful responses.
 *                   The cache lives at module level so it persists across calls.
 *
 * Error cache     — permanent HTTP errors (400, 401, 403, 404, 422…) are cached
 *                   automatically. Subsequent identical requests return the cached
 *                   error immediately without hitting the network, until the TTL
 *                   expires. Transient errors (5xx, 429, network) are never cached.
 */
export async function safeFetch<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: {
    timeout?: number;
    retries?: number;
    context?: string;
    showToast?: boolean;
    fallbackMessage?: string;
    requestId?: string;
    cacheKey?: string;
    cacheTtl?: number;
    /** Set true to skip the error cache check for this call */
    skipErrorCache?: boolean;
  },
): Promise<{
  data: T | null;
  error: ApiError | null;
  response: Response | null;
  metadata: { attempts: number; duration: number; fromCache?: boolean };
}> {
  const startTime = Date.now();
  const context = options?.context || "API Request";
  const timeout = options?.timeout || 30000;
  const retries = options?.retries || 0;
  const requestId = options?.requestId || crypto.randomUUID();
  const method = (init?.method ?? "GET").toUpperCase();
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  // ── 1. Response cache check ────────────────────────────────────────────────
  if (options?.cacheKey && (options.cacheTtl ?? 0) > 0) {
    const cached = getCachedResponse<T>(options.cacheKey);
    if (cached !== null) {
      return {
        data: cached,
        error: null,
        response: null,
        metadata: {
          attempts: 0,
          duration: Date.now() - startTime,
          fromCache: true,
        },
      };
    }
  }

  // ── 2. Error cache check ───────────────────────────────────────────────────
  if (!options?.skipErrorCache) {
    const errorKey = buildErrorCacheKey(url, method);
    const cachedErr = getCachedError(errorKey);
    if (cachedErr) {
      return {
        data: null,
        error: { ...cachedErr.error, requestId },
        response: null,
        metadata: {
          attempts: 0,
          duration: Date.now() - startTime,
          fromCache: true,
        },
      };
    }
  }

  // ── 3. Live fetch ──────────────────────────────────────────────────────────
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError: ApiError | null = null;
  let attempts = 0;

  for (let attempt = 0; attempt <= retries; attempt++) {
    attempts = attempt + 1;

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
        headers: {
          ...init?.headers,
          "X-Request-ID": requestId,
          "X-Client-Version": "1.0.0",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: ApiError;

        try {
          const errorResponse = await response.json();
          errorData = isApiError(errorResponse)
            ? errorResponse
            : {
                error:
                  errorResponse.error ||
                  `HTTP ${response.status}: ${response.statusText}`,
                code: errorResponse.code || `HTTP_${response.status}`,
                requestId,
                details: errorResponse.details,
              };
        } catch {
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
            code: `HTTP_${response.status}`,
            requestId,
          };
        }

        lastError = errorData;

        // Cache permanent errors so identical requests skip the network
        if (!options?.skipErrorCache && isErrorCacheable(response.status)) {
          const errorKey = buildErrorCacheKey(url, method);
          cacheError(
            errorKey,
            {
              error: errorData.error,
              code: errorData.code ?? `HTTP_${response.status}`,
              requestId: errorData.requestId,
            },
            response.status,
          );
        }

        if (determineRetryStrategy(response.status, attempt, retries)) {
          const delay = calculateBackoffDelay(attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        break;
      }

      // Parse successful response
      let data: T;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          data = await response.json();
        } else if (contentType?.includes("text/")) {
          data = (await response.text()) as unknown as T;
        } else {
          data = (await response.blob()) as unknown as T;
        }
      } catch (parseError) {
        throw new ExternalServiceError(
          "API",
          `Failed to parse response: ${parseError instanceof Error ? parseError.message : "Unknown parse error"}`,
        );
      }

      // Store in response cache if requested
      if (options?.cacheKey && (options.cacheTtl ?? 0) > 0) {
        cacheResponse(options.cacheKey, data, options.cacheTtl!);
      }

      return {
        data,
        error: null,
        response,
        metadata: { attempts, duration: Date.now() - startTime },
      };
    } catch (error) {
      clearTimeout(timeoutId);

      const errorMessage = extractErrorMessage(error);
      const errorCode = extractErrorCode(error);

      lastError = {
        error: errorMessage,
        code: errorCode,
        requestId,
        details:
          error instanceof Error
            ? { stack: error.stack, name: error.name, cause: error.cause }
            : undefined,
      };

      if (shouldRetryBasedOnError(errorCode, attempt, retries)) {
        const delay = calculateBackoffDelay(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      break;
    }
  }

  const duration = Date.now() - startTime;

  console.error(
    `[${context}] Fetch failed after ${attempts} attempt${attempts === 1 ? "" : "s"}:`,
    {
      error: lastError,
      requestId,
      duration,
      url,
      timestamp: new Date().toISOString(),
    },
  );

  return {
    data: null,
    error: lastError,
    response: null,
    metadata: { attempts, duration },
  };
}

/**
 * Determine if request should be retried based on HTTP status
 */
function determineRetryStrategy(
  status: number,
  attempt: number,
  maxRetries: number,
): boolean {
  // Don't retry on client errors (4xx) except 429 (rate limit)
  if (status >= 400 && status < 500 && status !== 429) {
    return false;
  }

  // Always retry on server errors (5xx)
  if (status >= 500) {
    return attempt < maxRetries;
  }

  // Retry on rate limits (429)
  if (status === 429) {
    return attempt < maxRetries;
  }

  return false;
}

/**
 * Determine if request should be retried based on error type
 */
function shouldRetryBasedOnError(
  errorCode: string,
  attempt: number,
  maxRetries: number,
): boolean {
  if (attempt >= maxRetries) {
    return false;
  }

  // Retry on transient errors
  const retryableErrors = [
    "NETWORK_ERROR",
    "TIMEOUT_ERROR",
    "SERVER_ERROR",
    "RATE_LIMIT_ERROR",
    "REQUEST_CANCELLED",
  ];

  return retryableErrors.includes(errorCode);
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoffDelay(attempt: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds

  // Exponential backoff: 1s, 2s, 4s, 8s, etc.
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

  // Add jitter (±20%) to prevent thundering herd
  const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);

  return exponentialDelay + jitter;
}

/**
 * Create a fetch function with pre-configured options
 */
export function createApiClient(
  baseUrl: string,
  defaultOptions?: {
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
  },
) {
  return async function apiFetch<T = unknown>(
    endpoint: string,
    init?: RequestInit,
    options?: Parameters<typeof safeFetch>[2],
  ) {
    const url = new URL(endpoint, baseUrl).toString();

    return safeFetch<T>(
      url,
      {
        ...(defaultOptions?.headers && { headers: defaultOptions.headers }),
        ...init,
      },
      {
        timeout: defaultOptions?.timeout,
        retries: defaultOptions?.retries,
        ...options,
      },
    );
  };
}
