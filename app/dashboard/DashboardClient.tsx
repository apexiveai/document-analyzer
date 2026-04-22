"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js"
import { getSupabaseClient, hasSupabasePublicEnv } from "@/lib/supabaseClient"
import FileUploader from "@/components/ui/FileUploader"
import { checkUserQuota } from "@/lib/actions/usage"
import {
  BarChart3,
  FileText,
  Upload,
  Home,
  LogOut,
  Shield,
  Truck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Zap,
} from "lucide-react"
import Link from "next/link"
import UpgradeButton from "@/components/UpgradeButton"
import PaymentModal from "@/components/PaymentModal"

interface QuotaInfo {
  allowed: boolean
  limit: number
  usage: number
  remaining: number
  plan: string
}

interface DocumentAuditResult {
  compliance?: {
    score?: number
  }
}

interface DocumentRecord {
  id: string
  filename?: string
  file_name?: string
  summary?: string
  document_type?: string
  audit_result?: DocumentAuditResult | null
  compliance_status?: string
  total_tokens?: number
  total_cost?: number
  created_at: string
}

export default function DashboardClient() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string>("")
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [quota, setQuota] = useState<QuotaInfo | null>(null)

  const fetchQuota = useCallback(async () => {
    if (!user) return
    const info = await checkUserQuota(user.id)
    setQuota(info as unknown as QuotaInfo)
  }, [user])

  useEffect(() => {
    if (!hasSupabasePublicEnv()) {
      setAuthError("Missing Supabase public environment variables in this deployment.")
      setLoading(false)
      return
    }

    const checkUser = async () => {
      try {
        const supabaseClient = getSupabaseClient()
        const {
          data: { user },
        } = await supabaseClient.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }
        setUser(user)
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : "Unable to initialize Supabase client")
      } finally {
        setLoading(false)
      }
    }

    void checkUser()

    const supabaseClient = getSupabaseClient()
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login")
      } else {
        setUser(session.user)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [router])

  const formatName = (rawName: string) => {
    return rawName
      .trim()
      .split(" ")
      .filter((part) => part.length > 0)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ")
  }

  const fetchDocuments = useCallback(async () => {
    if (!user || !hasSupabasePublicEnv()) return

    setDocumentsLoading(true)
    try {
      const supabaseClient = getSupabaseClient()
      const { data, error } = await supabaseClient
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching documents:", error)
        return
      }

      setDocuments(data || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setDocumentsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      void fetchDocuments()
      void fetchQuota()
    }
  }, [user, fetchDocuments, fetchQuota])

  const getDisplayName = () => {
    const fallbackEmail = user?.email?.split("@")[0] ?? "User"
    const rawName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      fallbackEmail

    return formatName(rawName)
  }

  const handleLogout = async () => {
    if (!hasSupabasePublicEnv()) {
      router.push("/login")
      return
    }

    const supabaseClient = getSupabaseClient()
    await supabaseClient.auth.signOut()
    router.push("/login")
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-200 p-6">
          <h2 className="text-xl font-bold text-red-700 mb-2">Configuration Error</h2>
          <p className="text-sm text-red-600">{authError}</p>
        </div>
      </div>
    )
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-600 shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                Apexive AI
              </h1>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
            <Home className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
            <span className="leading-tight">Welcome Back, {getDisplayName()}!</span>
          </h2>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Analyze and manage your documents with ease
          </p>
        </div>

        {/* Risk Dashboard */}
        {(() => {
          const audited = documents.filter((d) => d.audit_result)
          const compliant = audited.filter((d) => d.compliance_status === "compliant").length
          const nonCompliant = audited.filter((d) => d.compliance_status === "non_compliant").length
          const needsReview = audited.filter(
            (d) => d.compliance_status && d.compliance_status !== "compliant" && d.compliance_status !== "non_compliant"
          ).length
          const avgScore =
            audited.length > 0
              ? Math.round(
                  audited.reduce((sum, d) => sum + (d.audit_result?.compliance?.score ?? 0), 0) /
                    audited.length
                )
              : 0

          return (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-red-400 to-orange-500">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  Risk Dashboard
                </h3>
              </div>

              {audited.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No audited documents yet.</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Upload and audit documents to see your compliance overview
                  </p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {/* Score & Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-3 sm:p-4 text-center">
                      <p className="text-2xl sm:text-3xl font-bold text-indigo-700">{audited.length}</p>
                      <p className="text-xs sm:text-sm text-indigo-600 mt-1">Audited</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-green-700">{compliant}</p>
                      <p className="text-xs sm:text-sm text-green-600 mt-1">Compliant</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-3 sm:p-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-red-700">{nonCompliant}</p>
                      <p className="text-xs sm:text-sm text-red-600 mt-1">Non-Compliant</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-3 sm:p-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-yellow-700">{needsReview}</p>
                      <p className="text-xs sm:text-sm text-yellow-600 mt-1">Needs Review</p>
                    </div>
                  </div>

                  {/* Average Compliance Score Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Average Compliance Score</span>
                      <span
                        className={`text-sm font-bold ${
                          avgScore >= 80
                            ? "text-green-600"
                            : avgScore >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {avgScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          avgScore >= 80
                            ? "bg-gradient-to-r from-green-400 to-green-600"
                            : avgScore >= 50
                              ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                              : "bg-gradient-to-r from-red-400 to-red-600"
                        }`}
                        style={{ width: `${avgScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Document Type Breakdown */}
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {audited.filter((d) => d.document_type === "commercial_invoice").length > 0 && (
                      <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full text-xs sm:text-sm text-blue-700 font-medium">
                        <Truck className="w-3.5 h-3.5" />
                        {audited.filter((d) => d.document_type === "commercial_invoice").length} Commercial Invoice{audited.filter((d) => d.document_type === "commercial_invoice").length !== 1 ? "s" : ""}
                      </div>
                    )}
                    {audited.filter((d) => d.document_type === "service_agreement").length > 0 && (
                      <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full text-xs sm:text-sm text-purple-700 font-medium">
                        <Shield className="w-3.5 h-3.5" />
                        {audited.filter((d) => d.document_type === "service_agreement").length} Service Agreement{audited.filter((d) => d.document_type === "service_agreement").length !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* Usage Statistics Card */}
        {(() => {
          const totalTokens = documents.reduce((sum, d) => sum + (d.total_tokens || 0), 0)
          const totalCost = documents.reduce((sum, d) => sum + (Number(d.total_cost) || 0), 0)
          const usagePercent = quota ? Math.min(100, (quota.usage / quota.limit) * 100) : 0

          return (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-indigo-100">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-indigo-400 to-blue-500">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                    Usage Statistics
                  </h3>
                </div>
                {quota && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 uppercase">
                      {quota.plan} PLAN
                    </span>
                    {quota.plan === "FREE" && (
                      <PaymentModal>
                        <UpgradeButton className="text-xs py-1" />
                      </PaymentModal>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                  <p className="text-sm font-medium text-indigo-600 mb-1">Total Tokens Used</p>
                  <p className="text-2xl font-bold text-indigo-900">{totalTokens.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm font-medium text-blue-600 mb-1">Estimated AI Cost</p>
                  <p className="text-2xl font-bold text-blue-900">${totalCost.toFixed(4)}</p>
                </div>
              </div>

              {quota && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 font-medium text-gray-700">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Plan Quota
                    </div>
                    <span className="text-gray-500">
                      {quota.usage.toLocaleString()} / {quota.limit.toLocaleString()} tokens
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-amber-500" : "bg-indigo-600"
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-400">
                    {quota.remaining.toLocaleString()} tokens remaining on your current plan.
                  </p>
                </div>
              )}
            </div>
          )
        })()}

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-green-400 to-blue-500">
              <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
              Upload Documents
            </h3>
          </div>
          <FileUploader onUploadSuccess={fetchDocuments} />
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
              Uploaded Documents
            </h2>
          </div>

          {documentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-2 text-gray-600">Loading documents...</span>
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((doc) => (
                <Link key={doc.id} href={`/dashboard/${doc.id}`}>
                  <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-purple-300">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors truncate">
                            {doc.filename || doc.file_name}
                          </h3>
                          {doc.audit_result && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {doc.document_type === "commercial_invoice" ? (
                                <Truck className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Shield className="w-4 h-4 text-purple-500" />
                              )}
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700 whitespace-nowrap">
                                Audited
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                          {doc.summary || "No summary available"}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500 mb-2">
                          <span>Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
                          <span className="sm:ml-0">
                            {new Date(doc.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        {doc.audit_result && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <div className="flex items-center gap-1">
                              {doc.compliance_status === "compliant" ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : doc.compliance_status === "non_compliant" ? (
                                <XCircle className="w-4 h-4 text-red-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                                  doc.compliance_status === "compliant"
                                    ? "bg-green-100 text-green-700"
                                    : doc.compliance_status === "non_compliant"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {doc.compliance_status?.replace("_", " ").toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              Score: {doc.audit_result.compliance?.score || 0}/100
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 self-center sm:self-start">
                        <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Your processed documents will appear here.</p>
              <p className="text-gray-400 text-sm mt-2">Upload your first document to get started</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
