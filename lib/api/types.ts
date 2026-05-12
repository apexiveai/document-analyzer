// API Response wrapper types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  statusCode?: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

// Upload Types
export interface UploadRequest {
  file: File;
  documentType: "pdf" | "docx" | "doc" | "txt" | "csv" | "image";
  useAudit?: boolean;
}

export interface UploadResponse {
  documentId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  status: "pending" | "processing" | "completed" | "failed";
  analysis?: {
    text: string;
    pageCount?: number;
    extractedAt: string;
  };
}

// Audit Types
export interface AuditRequest {
  documentId: string;
  documentType: string;
  text: string;
  regions?: string[];
  complianceFrameworks?: string[];
}

export interface AuditIssue {
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  description: string;
  location?: string;
  remediation?: string;
}

export interface AuditResponse {
  auditId: string;
  documentId: string;
  status: "completed" | "failed";
  complianceScore: number;
  frameworks: {
    name: string;
    score: number;
    status: "compliant" | "non-compliant" | "partial";
  }[];
  issues: AuditIssue[];
  summary: string;
  executedAt: string;
}

// Payment Types
export interface CheckoutRequest {
  planId: string;
  email: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
}

// Quota Types
export interface QuotaResponse {
  userId: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  limits: {
    uploadsPerMonth: number;
    auditsPerMonth: number;
    storageGB: number;
  };
  usage: {
    uploadsUsed: number;
    auditsUsed: number;
    storageUsedGB: number;
  };
  resetDate: string;
}

// Generic error response
export class ApiErrorResponse extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiErrorResponse";
  }
}
