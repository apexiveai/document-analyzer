import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { analyzeDocument } from '@/services/ai';
import { checkUserQuota } from '@/lib/actions/usage';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { documentId, content, userId } = await req.json();

    // Quota check
    const quota = await checkUserQuota(userId);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `You have reached your token limit for the ${quota.plan} plan (${quota.limit.toLocaleString()} tokens). Please upgrade to continue.` },
        { status: 403 }
      );
    }

    // 1. AI ကို လှမ်းခေါ်ခြင်း (Use service instead of raw fetch)
    const result = await analyzeDocument(content);
    
    // 2. Token Data
    const promptTokens = result.usage?.prompt_tokens || 0;
    const completionTokens = result.usage?.completion_tokens || 0;
    const totalTokens = result.usage?.total_tokens || 0;
    const totalCost = (totalTokens / 1000) * 0.01;

    // 3. Database ထဲသိမ်းခြင်း
    try {
      const supabase = await createSupabaseServerClient();

      // (A) usage_logs table ထဲကို ထည့်ခြင်း
      const { error: logError } = await supabase
        .from('usage_logs')
        .insert({
          user_id: userId,
          document_id: documentId,
          token_count: totalTokens,
          cost: totalCost,
          action_type: 'document_analyze'
        });
      
      if (logError) throw logError;

      // (B) documents table ကို update လုပ်ခြင်း
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
          total_cost: totalCost
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

    } catch (dbError) {
      console.error("Database logging failed:", dbError);
    }

    return NextResponse.json({ summary: result.summary });

  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}