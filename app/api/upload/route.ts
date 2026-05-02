import { createClient } from "@/lib/supabaseServer"
import { parseDocument } from "@/services/parser"
import { analyzeDocument } from "@/services/ai"
import { checkUserQuota } from "@/lib/actions/usage"
import {
  checkRateLimit,
  createSafeJsonResponse,
  getClientIp,
} from "@/lib/apiSafety"

const MAX_FILE_BYTES = 10 * 1024 * 1024
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 20

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/msword",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
])

function isMissingColumnError(message: string, columnName: string) {
  return (
    message.includes(`Could not find the '${columnName}' column`) ||
    message.includes(`column \"${columnName}\" does not exist`)
  )
}

function buildSchemaMismatchMessage() {
  return "Supabase documents table is missing the columns required by this app. Apply the SQL migrations in supabase/migrations/20250406000000_documents.sql and supabase/migrations/20250406000001_audit_fields.sql, then retry the upload."
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID()
  const ip = getClientIp(req)
  const rateLimit = checkRateLimit(
    `upload:${ip}`,
    RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW_MS
  )

  if (!rateLimit.allowed) {
    return createSafeJsonResponse(
      { error: "Too many upload attempts. Please try again shortly." },
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

  // Quota check
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

  if (!file) {
    return createSafeJsonResponse({ error: "No file uploaded" }, 400, requestId, rateLimit)
  }

  if (file.size > MAX_FILE_BYTES) {
    return createSafeJsonResponse(
      { error: "File too large (max 10MB)" },
      400,
      requestId,
      rateLimit
    )
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return createSafeJsonResponse(
      { error: "Only PDF, DOCX, DOC, TXT, CSV, and image files (JPG, PNG, GIF, WebP) are allowed" },
      400,
      requestId,
      rateLimit
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const extractedText = await parseDocument(buffer, file.type)

    // Try to analyze document with AI, but don't fail the upload if it fails
    let ai: { summary: string; raw?: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } } = { summary: "AI analysis unavailable - please check your OpenAI API key" }
    try {
      const result = await analyzeDocument(extractedText)
      ai = {
        summary: result.summary,
        raw: result.raw,
        usage: result.usage
      }
    } catch {
      console.warn("AI analysis failed", { requestId })
      // Continue with upload even if AI analysis fails
    }

    let row: { id: string } | null = null
    let insertError: { message?: string } | null = null

    const promptTokens = ai.usage?.prompt_tokens || 0
    const completionTokens = ai.usage?.completion_tokens || 0
    const totalTokens = ai.usage?.total_tokens || 0
    const totalCost = (totalTokens / 1000) * 0.01

    const primaryInsert = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        filename: file.name,
        summary: ai.summary,
        content: extractedText,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        total_cost: totalCost
      })
      .select("id")
      .single()

    row = primaryInsert.data
    insertError = primaryInsert.error

    if (row && ai.usage) {
      // Log usage to usage_logs
      await supabase.from("usage_logs").insert({
        user_id: user.id,
        document_id: row.id,
        action_type: "document_upload_analyze",
        token_count: totalTokens,
        cost: totalCost,
      });
    }

    if (
      insertError?.message &&
      (isMissingColumnError(insertError.message, "filename") ||
        isMissingColumnError(insertError.message, "content"))
    ) {
      const legacyInsert = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          file_name: file.name,
          summary: ai.summary,
          extracted_text: extractedText,
        })
        .select("id")
        .single()

      row = legacyInsert.data
      insertError = legacyInsert.error
    }

    if (
      insertError?.message &&
      (isMissingColumnError(insertError.message, "filename") ||
        isMissingColumnError(insertError.message, "content") ||
        isMissingColumnError(insertError.message, "file_name") ||
        isMissingColumnError(insertError.message, "extracted_text"))
    ) {
      return createSafeJsonResponse(
        {
          error: buildSchemaMismatchMessage(),
          text: extractedText,
          ai: ai.raw || "AI analysis failed",
        },
        500,
        requestId,
        rateLimit
      )
    }

    if (insertError || !row) {
      // Log detailed error server-side for debugging
      console.error("documents insert failed", { 
        requestId, 
        error: insertError?.message,
        errorDetails: insertError,
        userId: user.id,
        fileName: file.name
      })
      
      // Return generic error to client to avoid leaking database schema
      return createSafeJsonResponse(
        {
          error: "Failed to save document",
          text: extractedText,
          ai: ai.raw || "AI analysis failed",
        },
        500,
        requestId,
        rateLimit
      )
    }

    return createSafeJsonResponse(
      {
        id: row.id,
        text: extractedText,
        ai: ai.raw || "AI analysis not available",
        summary: ai.summary,
      },
      200,
      requestId,
      rateLimit
    )
  } catch (error: unknown) {
    console.error("Upload processing failed", { requestId, error })
    const message = error instanceof Error ? error.message : "Document processing failed"
    return createSafeJsonResponse({ error: message }, 500, requestId, rateLimit)
  }
}
