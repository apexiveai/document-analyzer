import { apiClient } from "./client";
import {
  LoginRequest,
  LoginResponse,
  UploadResponse,
  AuditRequest,
  AuditResponse,
  CheckoutRequest,
  CheckoutResponse,
  QuotaResponse,
} from "./types";

/**
 * Typed API endpoints - provides strongly typed access to all API routes
 */
export const api = {
  /**
   * Authentication endpoints
   */
  auth: {
    login: (data: LoginRequest) =>
      apiClient.post<LoginResponse>("/api/auth/login", data),

    logout: () => apiClient.post("/api/auth/logout"),

    refresh: () => apiClient.post("/api/auth/refresh"),
  },

  /**
   * Document upload and analysis
   */
  documents: {
    upload: (
      file: File,
      documentType: string,
      onProgress?: (progress: number) => void,
    ) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      return apiClient.upload<UploadResponse>("/api/upload", formData, {
        onProgress,
        timeout: 60000,
      });
    },

    get: (documentId: string) =>
      apiClient.get<UploadResponse>(`/api/documents/${documentId}`),

    list: (params?: { limit?: number; offset?: number }) =>
      apiClient.get<{ documents: UploadResponse[]; total: number }>(
        "/api/documents",
        { params: params as Record<string, string | number | boolean> },
      ),

    delete: (documentId: string) =>
      apiClient.delete(`/api/documents/${documentId}`),
  },

  /**
   * Compliance audit endpoints
   */
  audit: {
    start: (data: AuditRequest) =>
      apiClient.post<AuditResponse>("/api/audit", data, { timeout: 120000 }),

    get: (auditId: string) =>
      apiClient.get<AuditResponse>(`/api/audit/${auditId}`),

    list: (params?: { documentId?: string; limit?: number; offset?: number }) =>
      apiClient.get<{ audits: AuditResponse[]; total: number }>("/api/audit", {
        params: params as Record<string, string | number | boolean>,
      }),
  },

  /**
   * Quota and usage tracking
   */
  quota: {
    get: () => apiClient.get<QuotaResponse>("/api/quota"),

    usage: () =>
      apiClient.get<{
        uploads: number;
        audits: number;
        storage: number;
      }>("/api/usage"),

    reset: () => apiClient.post("/api/quota/reset"),
  },

  /**
   * Payment and billing
   */
  billing: {
    plans: () =>
      apiClient.get<
        Array<{
          id: string;
          name: string;
          price: number;
          limits: Record<string, number>;
        }>
      >("/api/billing/plans"),

    createCheckout: (data: CheckoutRequest) =>
      apiClient.post<CheckoutResponse>("/api/lemonsqueezy/checkout", data),

    validateSubscription: () =>
      apiClient.get<{
        isValid: boolean;
        plan: string;
        expiresAt?: string;
      }>("/api/billing/validate"),
  },

  /**
   * Admin endpoints
   */
  admin: {
    users: () =>
      apiClient.get<
        Array<{
          id: string;
          email: string;
          plan: string;
          createdAt: string;
        }>
      >("/api/admin/users"),

    stats: () =>
      apiClient.get<{
        totalUsers: number;
        totalDocuments: number;
        totalAudits: number;
        totalStorage: number;
      }>("/api/admin/stats"),

    logs: (params?: { limit?: number; offset?: number }) =>
      apiClient.get<{
        logs: Array<{
          id: string;
          action: string;
          userId: string;
          timestamp: string;
        }>;
        total: number;
      }>("/api/admin/logs", {
        params: params as Record<string, string | number | boolean>,
      }),
  },
};

/**
 * Helper function to add auth token to requests
 */
export function setupAuthInterceptor(getToken: () => string | null): void {
  apiClient.addRequestInterceptor((config) => {
    const token = getToken();
    if (token) {
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    }
    return config;
  });
}

/**
 * Helper function to handle rate limit errors
 */
export function setupRateLimitInterceptor(
  onRateLimit: (retryAfter: number) => void,
): void {
  apiClient.addResponseInterceptor(async (response) => {
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "60");
      onRateLimit(retryAfter);
    }
    return response;
  });
}

/**
 * Helper function to handle auth errors
 */
export function setupAuthErrorInterceptor(
  onAuthError: () => void | Promise<void>,
): void {
  apiClient.addErrorInterceptor(async (error) => {
    if (error instanceof Error && error.message.includes("401")) {
      await onAuthError();
    }
    return error;
  });
}
