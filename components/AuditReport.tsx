"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuditHighlight, AuditResult } from "@/services/audit"

interface AuditReportProps {
  audit: AuditResult
  text: string
}

export default function AuditReport({ audit, text }: AuditReportProps) {
  const highlights = audit.highlights ?? []

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  const getHighlightClasses = (level: AuditHighlight["level"]) => {
    if (level === "critical") {
      return "bg-red-100 text-red-950 ring-1 ring-red-200"
    }

    if (level === "review") {
      return "bg-yellow-100 text-yellow-950 ring-1 ring-yellow-200"
    }

    return "bg-green-100 text-green-950 ring-1 ring-green-200"
  }

  const buildHighlightRanges = () => {
    if (!text || highlights.length === 0) {
      return [] as Array<{ start: number; end: number; highlight: AuditHighlight }>
    }

    const ranges: Array<{ start: number; end: number; highlight: AuditHighlight }> = []

    for (const highlight of highlights) {
      const excerpt = highlight.excerpt.trim()
      if (!excerpt) {
        continue
      }

      const pattern = escapeRegExp(excerpt).replace(/\s+/g, "\\s+")
      const matcher = new RegExp(pattern, "gi")

      let match: RegExpExecArray | null
      while ((match = matcher.exec(text)) !== null) {
        ranges.push({
          start: match.index,
          end: match.index + match[0].length,
          highlight,
        })
      }
    }

    return ranges
      .sort((left, right) => {
        if (left.start !== right.start) {
          return left.start - right.start
        }

        return right.end - left.end
      })
      .reduce<Array<{ start: number; end: number; highlight: AuditHighlight }>>((acc, range) => {
        const previous = acc[acc.length - 1]
        if (!previous || range.start >= previous.end) {
          acc.push(range)
        }
        return acc
      }, [])
  }

  const highlightRanges = buildHighlightRanges()

  const renderHighlightedText = () => {
    if (!text) {
      return <p className="text-gray-500">No text available</p>
    }

    if (highlightRanges.length === 0) {
      return <p className="text-gray-700 whitespace-pre-wrap">{text}</p>
    }

    const parts: React.ReactNode[] = []
    let cursor = 0

    for (const range of highlightRanges) {
      if (cursor < range.start) {
        parts.push(
          <span key={`plain-${cursor}`}>
            {text.slice(cursor, range.start)}
          </span>
        )
      }

      parts.push(
        <mark
          key={`highlight-${range.start}-${range.end}`}
          className={`rounded px-1 py-0.5 ${getHighlightClasses(range.highlight.level)}`}
          title={range.highlight.reason}
        >
          {text.slice(range.start, range.end)}
        </mark>
      )

      cursor = range.end
    }

    if (cursor < text.length) {
      parts.push(
        <span key={`plain-${cursor}-end`}>
          {text.slice(cursor)}
        </span>
      )
    }

    return parts
  }

  const criticalCount = highlights.filter((item) => item.level === 'critical').length
  const reviewCount = highlights.filter((item) => item.level === 'review').length
  const compliantCount = highlights.filter((item) => item.level === 'compliant').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            <p className="text-sm text-gray-600">issues found</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-600 flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              Review Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{reviewCount}</p>
            <p className="text-sm text-gray-600">needs review</p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              Compliant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{compliantCount}</p>
            <p className="text-sm text-gray-600">compliant items</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{audit.summary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${
              audit.compliance.status === 'compliant' ? 'bg-green-500' :
              audit.compliance.status === 'non_compliant' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            Compliance Status: {audit.compliance.status.replace('_', ' ').toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Score: <span className="font-bold">{audit.compliance.score}/100</span></p>
          <p className="text-sm text-gray-600 mt-2">
            Document Type: {audit.documentType.replace('_', ' ').toUpperCase()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flagged Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          {highlights.length > 0 ? (
            <div className="space-y-3">
              {highlights.map((highlight, index) => (
                <div key={`${highlight.excerpt}-${index}`} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase ${getHighlightClasses(highlight.level)}`}>
                      {highlight.level}
                    </span>
                    <p className="text-sm text-gray-700">{highlight.reason}</p>
                  </div>
                  <p className="text-sm text-gray-900 font-medium whitespace-pre-wrap">{highlight.excerpt}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No exact evidence excerpts were returned for this audit.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Highlighted Document Text</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap leading-relaxed text-gray-800">
            {renderHighlightedText()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}