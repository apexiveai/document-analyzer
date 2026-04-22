import Anthropic from "@anthropic-ai/sdk"
import OpenAI from "openai"

export interface AuditHighlight {
  excerpt: string
  reason: string
  level: 'critical' | 'review' | 'compliant'
}

export interface AuditResult {
  documentType: 'commercial_invoice' | 'service_agreement'
  summary: string
  highlights: AuditHighlight[]
  compliance: {
    status: 'compliant' | 'non_compliant' | 'requires_review'
    score: number // 0-100
    issues: string[]
    recommendations: string[]
  }
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  logistics?: {
    hsCodes: {
      found: string[]
      validated: boolean
      issues: string[]
      cbsaCompliant: boolean
      globalCompliant: boolean
    }
  }
  legal?: {
    highRiskClauses: {
      indemnity: {
        found: boolean
        severity: 'low' | 'medium' | 'high'
        details: string[]
      }
      liability: {
        found: boolean
        severity: 'low' | 'medium' | 'high'
        details: string[]
      }
      termination: {
        found: boolean
        severity: 'low' | 'medium' | 'high'
        details: string[]
      }
    }
    standards: {
      northAmerican: boolean
      uk: boolean
      issues: string[]
    }
  }
}

type StoredAuditResult = Partial<AuditResult> & {
  compliance?: AuditResult["compliance"]
  logistics?: AuditResult["logistics"]
  legal?: AuditResult["legal"]
}

type LogisticsAnalysis = {
  summary?: string
  highlights?: AuditHighlight[]
  hsCodes: {
    found: string[]
    validated: boolean
    issues: string[]
    cbsaCompliant: boolean
    globalCompliant: boolean
  }
}

type LegalAnalysis = {
  summary?: string
  highlights?: AuditHighlight[]
  highRiskClauses: {
    indemnity: {
      found: boolean
      severity: 'low' | 'medium' | 'high'
      details: string[]
    }
    liability: {
      found: boolean
      severity: 'low' | 'medium' | 'high'
      details: string[]
    }
    termination: {
      found: boolean
      severity: 'low' | 'medium' | 'high'
      details: string[]
    }
  }
  standards: {
    northAmerican: boolean
    uk: boolean
    issues: string[]
  }
}

const LOGISTICS_PROMPT = `You are a Multi-Region Audit Engine specializing in logistics compliance.

Analyze the following COMMERCIAL INVOICE for HS Code compliance:

1. EXTRACT all HS codes mentioned in the document
2. VALIDATE against Canadian CBSA requirements
3. CHECK for Global HS Code standards compliance
4. IDENTIFY any discrepancies or issues
5. INCLUDE up to 5 exact excerpts copied verbatim from the document that support your findings

Return JSON only, no markdown fences:
{
  "summary": "string",
  "highlights": [
    {
      "excerpt": "exact text copied from the document",
      "reason": "why this excerpt matters",
      "level": "critical|review|compliant"
    }
  ],
  "hsCodes": {
    "found": ["string"],
    "validated": boolean,
    "cbsaCompliant": boolean,
    "globalCompliant": boolean,
    "issues": ["string"]
  }
}

Document:
`

const LEGAL_PROMPT = `You are a Multi-Region Audit Engine specializing in legal compliance.

Analyze the following SERVICE AGREEMENT for high-risk clauses based on North American and UK standards:

1. SCAN for Indemnity clauses and assess risk level
2. SCAN for Liability clauses and assess risk level
3. SCAN for Termination clauses and assess risk level
4. EVALUATE compliance with North American and UK legal standards
5. INCLUDE up to 5 exact excerpts copied verbatim from the document that support your findings

Return JSON only, no markdown fences:
{
  "summary": "string",
  "highlights": [
    {
      "excerpt": "exact text copied from the document",
      "reason": "why this excerpt matters",
      "level": "critical|review|compliant"
    }
  ],
  "highRiskClauses": {
    "indemnity": {
      "found": boolean,
      "severity": "low|medium|high",
      "details": ["string"]
    },
    "liability": {
      "found": boolean,
      "severity": "low|medium|high",
      "details": ["string"]
    },
    "termination": {
      "found": boolean,
      "severity": "low|medium|high",
      "details": ["string"]
    }
  },
  "standards": {
    "northAmerican": boolean,
    "uk": boolean,
    "issues": ["string"]
  }
}

Document:
`

function stripCodeFences(s: string) {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
}

function sanitizeExcerpt(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim().replace(/^['"`]+|['"`]+$/g, "")
}

function normalizeHighlights(value: unknown): AuditHighlight[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null
      }

      const candidate = item as Record<string, unknown>
      const excerpt = sanitizeExcerpt(candidate.excerpt)
      const reason = typeof candidate.reason === "string" ? candidate.reason.trim() : ""
      const level = candidate.level

      if (!excerpt || !reason) {
        return null
      }

      if (level !== "critical" && level !== "review" && level !== "compliant") {
        return null
      }

      return {
        excerpt,
        reason,
        level,
      }
    })
    .filter((item): item is AuditHighlight => item !== null)
}

function buildLogisticsSummary(logistics: LogisticsAnalysis): string {
  const codeCount = logistics.hsCodes.found.length
  const appearsCompliant = logistics.hsCodes.cbsaCompliant && logistics.hsCodes.globalCompliant

  return `Commercial invoice audit found ${codeCount} HS code${codeCount === 1 ? "" : "s"} and ${appearsCompliant ? "no major compliance gaps" : "compliance issues that need review"}.`
}

function buildLegalSummary(legal: LegalAnalysis): string {
  const highRiskClauses = [
    legal.highRiskClauses.indemnity,
    legal.highRiskClauses.liability,
    legal.highRiskClauses.termination,
  ].filter((clause) => clause.found && clause.severity === "high").length
  const meetsStandards = legal.standards.northAmerican && legal.standards.uk

  return `Service agreement audit found ${highRiskClauses} high-risk clause${highRiskClauses === 1 ? "" : "s"} and ${meetsStandards ? "meets" : "does not fully meet"} the selected regional standards.`
}

function createFallbackHighlightsFromLogistics(logistics: LogisticsAnalysis): AuditHighlight[] {
  return logistics.hsCodes.found.slice(0, 5).map((code) => ({
    excerpt: code,
    reason: "HS code referenced in the document",
    level: logistics.hsCodes.cbsaCompliant && logistics.hsCodes.globalCompliant ? "compliant" : "review",
  }))
}

function createFallbackHighlightsFromLegal(legal: LegalAnalysis): AuditHighlight[] {
  const highlights: AuditHighlight[] = []

  for (const [clauseName, clause] of Object.entries(legal.highRiskClauses)) {
    if (!clause.found) {
      continue
    }

    for (const detail of clause.details.slice(0, 2)) {
      const excerpt = sanitizeExcerpt(detail)
      if (!excerpt) {
        continue
      }

      highlights.push({
        excerpt,
        reason: `${clauseName} clause called out by the audit`,
        level: clause.severity === "high" ? "critical" : clause.severity === "medium" ? "review" : "compliant",
      })
    }
  }

  return highlights.slice(0, 5)
}

function buildLegacyHighlightsFromResult(audit: StoredAuditResult): AuditHighlight[] {
  const highlights: AuditHighlight[] = []

  if (audit.logistics?.hsCodes.found) {
    for (const code of audit.logistics.hsCodes.found.slice(0, 5)) {
      const excerpt = sanitizeExcerpt(code)
      if (!excerpt) {
        continue
      }

      highlights.push({
        excerpt,
        reason: "HS code referenced in the document",
        level:
          audit.logistics.hsCodes.cbsaCompliant && audit.logistics.hsCodes.globalCompliant
            ? "compliant"
            : "review",
      })
    }
  }

  if (audit.legal?.highRiskClauses) {
    for (const [clauseName, clause] of Object.entries(audit.legal.highRiskClauses)) {
      if (!clause.found) {
        continue
      }

      for (const detail of clause.details.slice(0, 2)) {
        const excerpt = sanitizeExcerpt(detail)
        if (!excerpt) {
          continue
        }

        highlights.push({
          excerpt,
          reason: `${clauseName} clause called out by the audit`,
          level: clause.severity === "high" ? "critical" : clause.severity === "medium" ? "review" : "compliant",
        })
      }
    }
  }

  return highlights.slice(0, 5)
}

function buildSummaryFromStoredAudit(audit: StoredAuditResult): string {
  if (audit.documentType === "commercial_invoice" && audit.logistics) {
    return buildLogisticsSummary(audit.logistics)
  }

  if (audit.documentType === "service_agreement" && audit.legal) {
    return buildLegalSummary(audit.legal)
  }

  const status = audit.compliance?.status?.replace(/_/g, " ") ?? "audit"
  return `This ${status} result was generated from a previous audit record.`
}

function enforceKnownHighlights(text: string | undefined, highlights: AuditHighlight[]): AuditHighlight[] {
  if (!text) {
    return highlights
  }

  const lowerText = text.toLowerCase()
  return highlights.filter((highlight) => lowerText.includes(highlight.excerpt.toLowerCase()))
}

export function normalizeStoredAuditResult(
  rawAudit: unknown,
  text?: string,
  documentType?: 'commercial_invoice' | 'service_agreement'
): { audit: AuditResult | null; changed: boolean } {
  if (!rawAudit || typeof rawAudit !== "object") {
    return { audit: null, changed: false }
  }

  const audit = rawAudit as StoredAuditResult
  if (!audit.compliance) {
    return { audit: null, changed: false }
  }

  const resolvedDocumentType =
    audit.documentType === "commercial_invoice" || audit.documentType === "service_agreement"
      ? audit.documentType
      : documentType

  if (!resolvedDocumentType) {
    return { audit: null, changed: false }
  }

  const normalizedHighlights = enforceKnownHighlights(text, normalizeHighlights(audit.highlights))
  const fallbackHighlights = buildLegacyHighlightsFromResult({ ...audit, documentType: resolvedDocumentType })
  const highlights = normalizedHighlights.length > 0 ? normalizedHighlights : fallbackHighlights
  const summary = typeof audit.summary === "string" && audit.summary.trim().length > 0
    ? audit.summary.trim()
    : buildSummaryFromStoredAudit({ ...audit, documentType: resolvedDocumentType })

  const normalizedAudit: AuditResult = {
    documentType: resolvedDocumentType,
    summary,
    highlights,
    compliance: audit.compliance,
    logistics: audit.logistics,
    legal: audit.legal,
  }

  const changed =
    audit.documentType !== normalizedAudit.documentType ||
    audit.summary !== normalizedAudit.summary ||
    JSON.stringify(audit.highlights ?? []) !== JSON.stringify(normalizedAudit.highlights)

  return { audit: normalizedAudit, changed }
}

function getAIProvider() {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase()

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set")
    }
    return {
      client: new Anthropic({ apiKey }),
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022"
    }
  } else {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set")
    }
    return {
      client: new OpenAI({ apiKey }),
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview"
    }
  }
}

async function analyzeWithAI(prompt: string, text: string): Promise<{ data: Record<string, unknown>; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
  const { client, model } = getAIProvider()
  const fullPrompt = `${prompt}${text.slice(0, 50000)}` // Limit input size

  try {
    if (client instanceof Anthropic) {
      const response = await client.messages.create({
        model,
        max_tokens: 4000,
        temperature: 0.1,
        messages: [{ role: "user", content: fullPrompt }]
      })
      const raw = response.content[0].type === 'text' ? response.content[0].text : ''
      return {
        data: JSON.parse(stripCodeFences(raw)),
        usage: {
          prompt_tokens: response.usage?.input_tokens || 0,
          completion_tokens: response.usage?.output_tokens || 0,
          total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
        }
      }
    } else {
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: fullPrompt }],
        temperature: 0.1,
        max_tokens: 4000
      })
      const raw = response.choices[0]?.message?.content || ''
      return {
        data: JSON.parse(stripCodeFences(raw)),
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0
        }
      }
    }
  } catch (error) {
    console.error('AI analysis failed:', error)
    throw new Error('Failed to analyze document with AI')
  }
}

function calculateComplianceScore(logistics?: AuditResult['logistics'], legal?: AuditResult['legal']): number {
  let score = 100

  if (logistics) {
    if (!logistics.hsCodes.cbsaCompliant) score -= 30
    if (!logistics.hsCodes.globalCompliant) score -= 20
    score -= logistics.hsCodes.issues.length * 5
  }

  if (legal) {
    const clauses = legal.highRiskClauses
    if (clauses.indemnity.found && clauses.indemnity.severity === 'high') score -= 25
    if (clauses.liability.found && clauses.liability.severity === 'high') score -= 25
    if (clauses.termination.found && clauses.termination.severity === 'high') score -= 20
    if (!legal.standards.northAmerican) score -= 15
    if (!legal.standards.uk) score -= 10
  }

  return Math.max(0, Math.min(100, score))
}

function determineStatus(score: number, issues: string[]): 'compliant' | 'non_compliant' | 'requires_review' {
  if (score >= 80 && issues.length === 0) return 'compliant'
  if (score < 50 || issues.length > 3) return 'non_compliant'
  return 'requires_review'
}

export async function auditCommercialInvoice(text: string): Promise<AuditResult> {
  const { data, usage } = await analyzeWithAI(LOGISTICS_PROMPT, text)
  const logisticsData = data as LogisticsAnalysis
  const highlights = normalizeHighlights(logisticsData.highlights)

  const issues: string[] = []
  const recommendations: string[] = []

  // Generate issues and recommendations based on analysis
  if (!logisticsData.hsCodes.cbsaCompliant) {
    issues.push('CBSA compliance issues detected')
    recommendations.push('Review HS codes against current CBSA regulations')
  }
  if (!logisticsData.hsCodes.globalCompliant) {
    issues.push('Global HS code compliance issues')
    recommendations.push('Verify HS codes with World Customs Organization standards')
  }
  if (logisticsData.hsCodes.issues.length > 0) {
    issues.push(...logisticsData.hsCodes.issues)
  }

  const score = calculateComplianceScore(logisticsData, undefined)
  const status = determineStatus(score, issues)

  return {
    documentType: 'commercial_invoice',
    summary: logisticsData.summary?.trim() || buildLogisticsSummary(logisticsData),
    highlights: highlights.length > 0 ? highlights : createFallbackHighlightsFromLogistics(logisticsData),
    compliance: {
      status,
      score,
      issues,
      recommendations
    },
    usage,
    logistics: {
      hsCodes: logisticsData.hsCodes
    }
  }
}

export async function auditServiceAgreement(text: string): Promise<AuditResult> {
  const { data, usage } = await analyzeWithAI(LEGAL_PROMPT, text)
  const legalData = data as LegalAnalysis
  const highlights = normalizeHighlights(legalData.highlights)

  const issues: string[] = []
  const recommendations: string[] = []

  // Generate issues and recommendations based on analysis
  const clauses = legalData.highRiskClauses

  if (clauses.indemnity.found && clauses.indemnity.severity === 'high') {
    issues.push('High-risk indemnity clauses detected')
    recommendations.push('Review indemnity clauses with legal counsel')
  }
  if (clauses.liability.found && clauses.liability.severity === 'high') {
    issues.push('High-risk liability clauses detected')
    recommendations.push('Consider liability limitations or legal review')
  }
  if (clauses.termination.found && clauses.termination.severity === 'high') {
    issues.push('High-risk termination clauses detected')
    recommendations.push('Review termination conditions for fairness')
  }
  if (!legalData.standards.northAmerican) {
    issues.push('Not compliant with North American legal standards')
    recommendations.push('Align with North American contract standards')
  }
  if (!legalData.standards.uk) {
    issues.push('Not compliant with UK legal standards')
    recommendations.push('Consider UK contract law requirements')
  }

  const score = calculateComplianceScore(undefined, legalData)
  const status = determineStatus(score, issues)

  return {
    documentType: 'service_agreement',
    summary: legalData.summary?.trim() || buildLegalSummary(legalData),
    highlights: highlights.length > 0 ? highlights : createFallbackHighlightsFromLegal(legalData),
    compliance: {
      status,
      score,
      issues,
      recommendations
    },
    usage,
    legal: legalData
  }
}

// Main audit function that determines document type and runs appropriate analysis
export async function auditDocument(text: string, documentType?: 'commercial_invoice' | 'service_agreement'): Promise<AuditResult> {
  // Auto-detect document type if not specified
  const detectedType = documentType || detectDocumentType(text)

  if (detectedType === 'commercial_invoice') {
    return auditCommercialInvoice(text)
  } else {
    return auditServiceAgreement(text)
  }
}

function detectDocumentType(text: string): 'commercial_invoice' | 'service_agreement' {
  const lowerText = text.toLowerCase()

  // Check for commercial invoice indicators
  const invoiceIndicators = ['commercial invoice', 'hs code', 'harmonized system', 'cbsa', 'customs', 'import', 'export']
  const invoiceScore = invoiceIndicators.reduce((score, indicator) =>
    score + (lowerText.includes(indicator) ? 1 : 0), 0)

  // Check for service agreement indicators
  const agreementIndicators = ['service agreement', 'terms of service', 'indemnity', 'liability', 'termination', 'contract']
  const agreementScore = agreementIndicators.reduce((score, indicator) =>
    score + (lowerText.includes(indicator) ? 1 : 0), 0)

  return invoiceScore > agreementScore ? 'commercial_invoice' : 'service_agreement'
}