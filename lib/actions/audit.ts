"use server";

import "server-only";
import { extractTextFromPDF } from "@/lib/pdf";
import { analyzeDocument } from "@/services/ai";
import { createClient as createSupabaseServerClient } from "@/lib/supabaseServer";

type StartAIAnalysisResult = {
  success: boolean;
  error?: string;
  summary?: string;
};

export async function startAIAnalysis(
  formData: FormData,
): Promise<StartAIAnalysisResult> {
  try {
    const documentId = formData.get("documentId");
    const documentType = formData.get("documentType");
    const file = formData.get("file");

    if (typeof documentId !== "string" || !documentId) {
      return { success: false, error: "Missing documentId" };
    }

    if (!(file instanceof File)) {
      return { success: false, error: "Missing file" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";
    const lowerName = file.name.toLowerCase();

    if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
      extractedText = await extractTextFromPDF(buffer);
    } else if (
      file.type === "text/plain" ||
      file.type === "text/csv" ||
      lowerName.endsWith(".txt") ||
      lowerName.endsWith(".csv")
    ) {
      extractedText = buffer.toString("utf-8").trim();
    } else {
      return {
        success: false,
        error: "This file type is not yet supported for AI text extraction.",
      };
    }

    if (!extractedText || extractedText.startsWith("Error:")) {
      return {
        success: false,
        error: extractedText || "No text extracted",
      };
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // 1. AI Analysis using service
    const result = await analyzeDocument(extractedText);

    const promptTokens = result.usage?.prompt_tokens || 0;
    const completionTokens = result.usage?.completion_tokens || 0;
    const totalTokens = result.usage?.total_tokens || 0;

    // Cost calculation
    const estimatedCost = (totalTokens / 1000) * 0.01;

    try {
      const { error: logError } = await supabase.from("usage_logs").insert({
        user_id: user.id,
        document_id: documentId,
        token_count: totalTokens,
        cost: estimatedCost,
        action_type:
          typeof documentType === "string" && documentType
            ? documentType
            : "document_analysis",
      });

      if (logError) {
        throw logError;
      }

      const { error: updateError } = await supabase
        .from("documents")
        .update({
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
          total_cost: estimatedCost,
        })
        .eq("id", documentId);

      if (updateError) {
        throw updateError;
      }
    } catch (dbError) {
      console.error("Database logging failed:", dbError);
    }

    return {
      success: true,
      summary: result.summary,
    };
  } catch (error) {
    console.error("startAIAnalysis failed:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "AI analysis failed",
    };
  }
}
