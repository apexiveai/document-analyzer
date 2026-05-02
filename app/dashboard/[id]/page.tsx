import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { redirect } from "next/navigation"
import nextDynamic from "next/dynamic"
import { normalizeStoredAuditResult } from "@/services/audit"

export const dynamic = "force-dynamic"

// Heavy client components — code-split so they don't inflate the initial bundle.
// Each gets a lightweight skeleton shown while the JS chunk loads.
const AuditResults = nextDynamic(() => import("@/components/ui/AuditResults"), {
  loading: () => (
    <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
      <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
        <div className="h-4 bg-gray-100 rounded w-4/6" />
      </div>
    </div>
  ),
})

const AuditReport = nextDynamic(() => import("@/components/AuditReport"), {
  loading: () => (
    <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
      <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${85 - i * 5}%` }} />
        ))}
      </div>
    </div>
  ),
})

const ShareResults = nextDynamic(() => import("@/components/ShareResults"), {
  loading: () => (
    <div className="w-24 h-9 bg-gray-100 rounded-lg animate-pulse" />
  ),
})

const TeamWorkspace = nextDynamic(() => import("@/components/TeamWorkspace"), {
  loading: () => (
    <div className="w-28 h-9 bg-gray-100 rounded-lg animate-pulse" />
  ),
})

export default async function DocumentDetails({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error || !data) {
    return <div className="p-10">Document not found</div>
  }

  const documentText = data.content ?? data.extracted_text
  const { audit: auditResult, changed } = normalizeStoredAuditResult(
    data.audit_result,
    documentText ?? undefined,
    data.document_type ?? undefined
  )
  const documentSummary = data.summary ?? auditResult?.summary ?? "No summary available."

  if (auditResult && changed) {
    await supabase
      .from("documents")
      .update({
        audit_result: auditResult,
        summary: data.summary ?? auditResult.summary,
      })
      .eq("id", id)
      .eq("user_id", user.id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 break-words">{data.filename || data.file_name}</h1>
            </div>
            
            {/* Collaboration Actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <ShareResults 
                documentId={id} 
                documentTitle={data.filename || data.file_name || "Document"} 
              />
              <TeamWorkspace documentId={id} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Document Summary</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{documentSummary}</p>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Document Details</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Uploaded:</span> {new Date(data.created_at).toLocaleString()}</p>
                {data.document_type && (
                  <p><span className="font-medium">Type:</span> {data.document_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                )}
                {data.compliance_status && (
                  <p className="flex flex-wrap items-center gap-1"><span className="font-medium">Compliance:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      data.compliance_status === 'compliant' ? 'bg-green-100 text-green-800' :
                      data.compliance_status === 'non_compliant' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {data.compliance_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {auditResult && (
          <AuditResults audit={auditResult} />
        )}

        {auditResult && documentText && (
          <AuditReport audit={auditResult} text={documentText} />
        )}

        {!auditResult && documentText && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Extracted Text</h2>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 max-h-72 sm:max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-700 font-mono leading-relaxed">
                {documentText}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
