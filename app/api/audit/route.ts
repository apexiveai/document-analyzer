import { createClient } from "@/lib/supabaseServer"
import { parseDocument } from "@/services/parser"
import { auditDocument, AuditResult } from "@/services/audit"
import { checkUserQuota } from "@/lib/actions/usage"
import {
  checkRateLimit,
  createSafeJsonResponse,
  getClientIp,
} from "@/lib/apiSafety"

const MAX_FILE_BYTES = 10 * 1024 * 1024
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 10

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/msword",
])

export async function POST(req: Request) {
  const requestId = crypto.randomUUID()
  const ip = getClientIp(req)
  const rateLimit = checkRateLimit(
    `audit:${ip}`,
    RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW_MS
  )

  if (!rateLimit.allowed) {
    return createSafeJsonResponse(
      { error: "Too many audit requests. Please try again shortly." },
      429,
      requestId,
      rateLimit
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return createSafeJsonResponse({ error: "Unauthorized" }, 401, requestId, rateLimit)
  }

  const quota = await checkUserQuota(user.id)
  if (!quota.allowed) {
    return createSafeJsonResponse(
      { error: `You have reached your token limit for the ${quota.plan} plan (${quota.limit.toLocaleString()} tokens). Please upgrade to continue.` },
      403,
      requestId,
      rateLimit
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return createSafeJsonResponse(
      {
        error:
          "Failed to parse form data. Body may exceed limit or be malformed.",
      },
      400,
      requestId,
      rateLimit
    )
  }

  const file = formData.get("file") as File | null
  const documentType = formData.get("documentType") as 'commercial_invoice' | 'service_agreement' | null

  if (!file) {
    return createSafeJsonResponse({ error: "No file uploaded" }, 400, requestId, rateLimit)
  }

  if (file.size > MAX_FILE_BYTES) {
    return createSafeJsonResponse(
      {
        error: `File too large. Maximum size is ${MAX_FILE_BYTES / (1024 * 1024)}MB`,
      },
      400,
      requestId,
      rateLimit
    )
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return createSafeJsonResponse(
      {
        error: `Unsupported file type: ${file.type}. Supported types: PDF, DOCX, DOC, TXT, CSV`,
      },
      400,
      requestId,
      rateLimit
    )
  }

  try {
    // Parse the document
    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await parseDocument(buffer, file.type)

    if (!text || text.trim().length === 0) {
      return createSafeJsonResponse(
        { error: "Could not extract text from file" },
        400,
        requestId,
        rateLimit
      )
    }

    // Perform audit analysis
    const auditResult: AuditResult = await auditDocument(text, documentType || undefined)

    // Store audit result and usage in database
    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        filename: file.name,
        summary: auditResult.summary,
        content: text,
        audit_result: auditResult,
        document_type: auditResult.documentType,
        prompt_tokens: auditResult.usage?.prompt_tokens || 0,
        completion_tokens: auditResult.usage?.completion_tokens || 0,
        total_tokens: auditResult.usage?.total_tokens || 0,
        total_cost: ((auditResult.usage?.total_tokens || 0) / 1000) * 0.01, // Example cost calculation
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Database error", { requestId, error: error.message })
      return createSafeJsonResponse(
        { error: "Failed to save audit result" },
        500,
        requestId,
        rateLimit
      )
    }

    // Log usage to usage_logs
    if (auditResult.usage) {
      await supabase.from("usage_logs").insert({
        user_id: user.id,
        document_id: data.id,
        action_type: "document_audit",
        token_count: auditResult.usage.total_tokens,
        cost: (auditResult.usage.total_tokens / 1000) * 0.01,
      });
    }

    return createSafeJsonResponse(
      {
        success: true,
        audit: auditResult,
        documentId: data.id,
        message: "Document audited successfully"
      },
      200,
      requestId,
      rateLimit
    )

  } catch (error) {
    console.error("Audit processing error", { requestId, error })

    // Try to provide a more specific error message
    let errorMessage = "Failed to process document"
    if (error instanceof Error) {
      if (error.message.includes("AI")) {
        errorMessage = "AI analysis failed. Please check your API configuration."
      } else if (error.message.includes("parse")) {
        errorMessage = "Failed to parse document. Please ensure it's a valid file format."
      }
    }

    return createSafeJsonResponse(
      { error: errorMessage },
      500,
      requestId,
      rateLimit
    )
  }
}