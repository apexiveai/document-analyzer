import { createClient as createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import AuditReport from "@/components/AuditReport";
import AuditResults from "@/components/ui/AuditResults";
import ShareResults from "@/components/ShareResults";
import TeamWorkspace from "@/components/TeamWorkspace";
import { normalizeStoredAuditResult } from "@/services/audit";

export const dynamic = "force-dynamic";

export default async function DocumentDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return <div className="p-10">Document not found</div>;
  }

  const documentText = data.content ?? data.extracted_text;
  const { audit: auditResult, changed } = normalizeStoredAuditResult(
    data.audit_result,
    documentText ?? undefined,
    data.document_type ?? undefined,
  );
  const documentSummary =
    data.summary ?? auditResult?.summary ?? "No summary available.";

  if (auditResult && changed) {
    await supabase
      .from("documents")
      .update({
        audit_result: auditResult,
        summary: data.summary ?? auditResult.summary,
      })
      .eq("id", id)
      .eq("user_id", user.id);
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-blue-50 to-cyan-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {data.filename || data.file_name}
              </h1>
            </div>

            {/* Collaboration Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <ShareResults
                documentId={id}
                documentTitle={data.filename || data.file_name || "Document"}
              />
              <TeamWorkspace documentId={id} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Document Summary
              </h2>
              <p className="text-gray-700 leading-relaxed">{documentSummary}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Document Details
              </h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Uploaded:</span>{" "}
                  {new Date(data.created_at).toLocaleString()}
                </p>
                {data.document_type && (
                  <p>
                    <span className="font-medium">Type:</span>{" "}
                    {data.document_type
                      .replace("_", " ")
                      .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </p>
                )}
                {data.compliance_status && (
                  <p>
                    <span className="font-medium">Compliance:</span>
                    <span
                      className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                        data.compliance_status === "compliant"
                          ? "bg-green-100 text-green-800"
                          : data.compliance_status === "non_compliant"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {data.compliance_status.replace("_", " ").toUpperCase()}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {auditResult && <AuditResults audit={auditResult} />}

        {auditResult && documentText && (
          <AuditReport audit={auditResult} text={documentText} />
        )}

        {!auditResult && documentText && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Extracted Text
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                {documentText}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
