import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { analyzeDocument } from '@/services/ai';
import { checkUserQuota } from '@/lib/actions/usage';
import { NextResponse } from 'next/server';
import { 
  ValidationError, 
  AuthorizationError, 
  ExternalServiceError,
  DatabaseError,
  normalizeError,
  createErrorResponse,
  validateRequiredFields,
  logError 
} from '@/lib/errorHandling';

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  
  try {
    // Validate request body
    let body: { documentId?: string; content?: string; userId?: string };
    try {
      body = await req.json();
    } catch {
      const error = new ValidationError("Invalid JSON request body");
      logError(error, "Analyze API");
      return NextResponse.json(
        createErrorResponse(error, requestId),
        { status: error.statusCode }
      );
    }

    // Validate required fields
    const validation = validateRequiredFields(body, ['documentId', 'content', 'userId']);
    if (!validation.isValid) {
      const error = new ValidationError(
        `Missing required fields: ${validation.missingFields.join(', ')}`
      );
      logError(error, "Analyze API");
      return NextResponse.json(
        createErrorResponse(error, requestId),
        { status: error.statusCode }
      );
    }

    const { documentId, content, userId } = body;

    // Quota check
    const quota = await checkUserQuota(userId!);
    if (!quota.allowed) {
      const error = new AuthorizationError(
        `You have reached your token limit for the ${quota.plan} plan (${quota.limit.toLocaleString()} tokens). Please upgrade to continue.`
      );
      logError(error, "Analyze API");
      return NextResponse.json(
        createErrorResponse(error, requestId),
        { status: error.statusCode }
      );
    }

    // 1. AI analysis with retry logic
    let result;
    try {
      result = await analyzeDocument(content!);
    } catch (aiError) {
      const error = normalizeError(aiError);
      logError(error, "Analyze API - AI Analysis");
      return NextResponse.json(
        createErrorResponse(error, requestId),
        { status: error.statusCode }
      );
    }

    // 2. Token Data
    const promptTokens = result.usage?.prompt_tokens || 0;
    const completionTokens = result.usage?.completion_tokens || 0;
    const totalTokens = result.usage?.total_tokens || 0;
    const totalCost = (totalTokens / 1000) * 0.01;

    // 3. Database operations with proper error handling
    let dbErrorOccurred = false;
    let dbErrorDetails: string[] = [];
    
    try {
      const supabase = await createSupabaseServerClient();

      // (A) usage_logs table
      const { error: logError } = await supabase
        .from('usage_logs')
        .insert({
          user_id: userId,
          document_id: documentId,
          token_count: totalTokens,
          cost: totalCost,
          action_type: 'document_analyze'
        });

      if (logError) {
        dbErrorOccurred = true;
        dbErrorDetails.push(`Usage log: ${logError.message}`);
        console.error("Usage log error:", logError);
      }

      // (B) documents table update
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
          total_cost: totalCost
        })
        .eq('id', documentId);

      if (updateError) {
        dbErrorOccurred = true;
        dbErrorDetails.push(`Document update: ${updateError.message}`);
        console.error("Document update error:", updateError);
      }

    } catch (dbError) {
      dbErrorOccurred = true;
      dbErrorDetails.push(`Database operation: ${dbError instanceof Error ? dbError.message : "Unknown error"}`);
      console.error("Database operation failed:", dbError);
    }

    // Return error if database operations failed - analysis without persistence is a failure
    if (dbErrorOccurred) {
      console.error("Analysis completed but failed to persist:", dbErrorDetails);
      return NextResponse.json(
        {
          error: "Analysis completed but failed to save to database",
          details: dbErrorDetails,
          requestId
        },
        { status: 500 }
      );
    }

    // Return success only if everything succeeded
    return NextResponse.json({ 
      summary: result.summary,
      requestId
    });

  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "Analyze API - Unhandled");
    
    return NextResponse.json(
      createErrorResponse(normalizedError, requestId),
      { status: normalizedError.statusCode }
    );
  }
}