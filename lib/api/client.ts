import { ApiResponse, ApiError, ApiErrorResponse } from "./types";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
}

interface RequestInterceptor {
  (config: RequestOptions): RequestOptions | Promise<RequestOptions>;
}

interface ResponseInterceptor {
  (response: Response): Response | Promise<Response>;
}

interface ErrorInterceptor {
  (error: Error): Error | Promise<Error>;
}

/**
 * Centralized API Client with interceptors, error handling, and retry logic
 */
class ApiClient {
  private baseURL: string;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private tokenRefreshPromise: Promise<string> | null = null;

  constructor(baseURL: string = "") {
    this.baseURL = baseURL;
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Build URL with query params
   */
  private buildURL(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): string {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    return url.toString();
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(
    config: RequestOptions,
  ): Promise<RequestOptions> {
    let processedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }
    return processedConfig;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors(
    response: Response,
  ): Promise<Response> {
    let processedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    return processedResponse;
  }

  /**
   * Apply error interceptors
   */
  private async applyErrorInterceptors(error: Error): Promise<Error> {
    let processedError = error;
    for (const interceptor of this.errorInterceptors) {
      processedError = await interceptor(processedError);
    }
    return processedError;
  }

  /**
   * Retry logic with exponential backoff
   */
  private async executeWithRetry(
    fn: () => Promise<Response>,
    retries: number = 0,
    maxRetries: number = 3,
  ): Promise<Response> {
    try {
      return await fn();
    } catch (error) {
      if (retries < maxRetries && error instanceof Error) {
        // Only retry on network errors, not on client errors (4xx)
        const isNetworkError =
          error.message.includes("Failed to fetch") ||
          error.message.includes("Network error") ||
          error.message.includes("timeout");

        if (isNetworkError) {
          const delay = Math.pow(2, retries) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.executeWithRetry(fn, retries + 1, maxRetries);
        }
      }
      throw error;
    }
  }

  /**
   * Main request method
   */
  async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { params, timeout = 30000, retries = 3, ...fetchOptions } = options;

    try {
      // Apply request interceptors
      const config = await this.applyRequestInterceptors({
        ...fetchOptions,
        params,
        timeout,
      });

      const url = this.buildURL(endpoint, config.params);

      // Setup timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const requestFn = () =>
          fetch(url, {
            ...config,
            signal: controller.signal,
          } as RequestInit);

        // Execute with retry logic
        const response = await this.executeWithRetry(requestFn, 0, retries);
        clearTimeout(timeoutId);

        // Apply response interceptors
        const processedResponse =
          await this.applyResponseInterceptors(response);

        // Handle response
        if (!processedResponse.ok) {
          const error = await this.handleErrorResponse(processedResponse);
          throw error;
        }

        const data = await processedResponse.json();
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      const processedError = await this.applyErrorInterceptors(
        error instanceof Error ? error : new Error(String(error)),
      );
      throw processedError;
    }
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(response: Response): Promise<Error> {
    try {
      const data = (await response.json()) as ApiError & {
        details?: Record<string, unknown>;
        message?: string;
      };
      const errorMessage = data.message ?? data.error ?? response.statusText;
      const error = new ApiErrorResponse(
        response.status,
        data.code || `HTTP_${response.status}`,
        errorMessage,
        data.details,
      );
      return error;
    } catch {
      return new ApiErrorResponse(
        response.status,
        `HTTP_${response.status}`,
        response.statusText || "Unknown error",
      );
    }
  }

  /**
   * GET request
   */
  get<T = unknown>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  /**
   * POST request
   */
  post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  delete<T = unknown>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request(endpoint, { ...options, method: "DELETE" });
  }

  /**
   * Upload file with FormData
   */
  async upload<T = unknown>(
    endpoint: string,
    formData: FormData,
    options?: RequestOptions & { onProgress?: (progress: number) => void },
  ): Promise<ApiResponse<T>> {
    const { onProgress, timeout = 60000, ...fetchOptions } = options || {};

    try {
      const config = await this.applyRequestInterceptors({
        ...fetchOptions,
        method: "POST",
        timeout,
      });

      const url = this.buildURL(endpoint);

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        // Setup timeout
        const timeoutId = setTimeout(() => {
          xhr.abort();
          reject(new Error("Upload timeout"));
        }, timeout);

        // Progress tracking
        if (onProgress) {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const progress = (e.loaded / e.total) * 100;
              onProgress(progress);
            }
          });
        }

        // Complete
        xhr.addEventListener("load", async () => {
          clearTimeout(timeoutId);

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch {
              reject(new Error("Failed to parse upload response"));
            }
          } else {
            reject(
              new ApiErrorResponse(
                xhr.status,
                `HTTP_${xhr.status}`,
                "Upload failed",
              ),
            );
          }
        });

        // Error
        xhr.addEventListener("error", () => {
          clearTimeout(timeoutId);
          reject(new Error("Upload failed"));
        });

        // Abort
        xhr.addEventListener("abort", () => {
          clearTimeout(timeoutId);
          reject(new Error("Upload aborted"));
        });

        xhr.open("POST", url);

        // Add intercepted headers
        if (config.headers && typeof config.headers === "object") {
          Object.entries(config.headers).forEach(([key, value]) => {
            if (typeof value === "string") {
              xhr.setRequestHeader(key, value);
            }
          });
        }

        xhr.send(formData);
      });
    } catch (error) {
      const processedError = await this.applyErrorInterceptors(
        error instanceof Error ? error : new Error(String(error)),
      );
      throw processedError;
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

export type {
  RequestOptions,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
};
export { ApiClient, ApiErrorResponse };
