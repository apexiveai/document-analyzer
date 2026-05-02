import Anthropic from "@anthropic-ai/sdk"
import OpenAI from "openai"
import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  ExternalServiceError,
  RateLimitError,
  retryWithBackoff
} from "@/lib/errorHandling"

const MAX_INPUT_CHARS = 100_000

const PROMPT = `Summarize the following document and extract key points.

Return JSON only, no markdown fences:
{
  "summary": "short summary",
  "keyPoints": ["point1","point2","point3"]
}

Document:
`

export type AnalyzeResult = {
  raw: string
  summary: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

function stripCodeFences(s: string) {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
}

function summaryFromRaw(raw: string): string {
  try {
    const parsed = JSON.parse(stripCodeFences(raw)) as { summary?: string }
    if (typeof parsed.summary === "string" && parsed.summary.length > 0) {
      return parsed.summary
    }
  } catch {
    /* use fallback */
  }
  return raw.slice(0, 4000)
}

export async function analyzeDocument(text: string): Promise<AnalyzeResult> {
  return retryWithBackoff(
    () => _analyzeDocument(text),
    {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 15_000,
      onRetry: (error, attempt, delayMs) => {
        console.warn(`[analyzeDocument] Retry ${attempt}/3 after ${Math.round(delayMs)}ms — ${error.message}`)
      }
    }
  )
}

async function _analyzeDocument(text: string): Promise<AnalyzeResult> {
  const body = text.length > MAX_INPUT_CHARS ? text.slice(0, MAX_INPUT_CHARS) : text
  const prompt = `${PROMPT}${body}`

  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase()

  try {
    if (provider === "anthropic") {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        throw new ValidationError("ANTHROPIC_API_KEY is not set")
      }
      const model =
        process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022"
      const client = new Anthropic({ apiKey })
      const msg = await client.messages.create({
        model,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      })
      const block = msg.content[0]
      const raw = block.type === "text" ? block.text : ""
      
      return { 
        raw, 
        summary: summaryFromRaw(raw),
        usage: {
          prompt_tokens: msg.usage?.input_tokens || 0,
          completion_tokens: msg.usage?.output_tokens || 0,
          total_tokens: (msg.usage?.input_tokens || 0) + (msg.usage?.output_tokens || 0)
        }
      }
    }

    if (provider === "azure") {
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "")
      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT
      const apiKey = process.env.AZURE_OPENAI_API_KEY
      const apiVersion =
        process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview"
      if (!endpoint || !deployment || !apiKey) {
        throw new ValidationError(
          "Azure OpenAI requires AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT, and AZURE_OPENAI_API_KEY"
        )
      }
      const client = new OpenAI({
        apiKey,
        baseURL: `${endpoint}/openai/deployments/${deployment}`,
        defaultQuery: { "api-version": apiVersion },
      })
      const response = await client.chat.completions.create({
        model: deployment,
        messages: [{ role: "user", content: prompt }],
      })
      const raw = response.choices[0]?.message?.content ?? ""
      return { 
        raw, 
        summary: summaryFromRaw(raw),
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0
        }
      }
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new ValidationError("OPENAI_API_KEY is not set")
    }
    const client = new OpenAI({ apiKey })
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini"
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
    })
    const raw = response.choices[0]?.message?.content ?? ""
    return { 
      raw, 
      summary: summaryFromRaw(raw),
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0
      }
    }
  } catch (error) {
    console.error("AI analysis failed:", error)
    
    // Provide more specific error messages using AppError classes
    if (error instanceof Error) {
      if (error.message.includes("API key") || error.message.includes("authentication")) {
        throw new AuthenticationError(
          `AI API authentication failed: ${error.message}. Please check your API keys.`
        )
      } else if (error.message.includes("rate limit") || error.message.includes("quota")) {
        throw new RateLimitError(
          `AI API rate limit exceeded: ${error.message}. Please try again later or upgrade your plan.`
        )
      } else if (error.message.includes("timeout") || error.message.includes("network")) {
        throw new ExternalServiceError(
          "AI API",
          `Network error: ${error.message}. Please check your internet connection and try again.`
        )
      }
    }
    
    throw new ExternalServiceError(
      "AI",
      `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}
