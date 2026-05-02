"use client"
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
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
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import UpgradeButton from "@/components/UpgradeButton"
import PaymentModal from "@/components/PaymentModal"
import ShareResults from "@/components/ShareResults"

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

export default function DashboardClient({ children }: { children?: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string>("")
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentsError, setDocumentsError] = useState<string>("")
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const [quotaError, setQuotaError] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const DOCUMENTS_PER_PAGE = 10
  const QUERY_TIMEOUT_MS = 10000 // 10 second timeout

  const CORE_IDENTITY = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const isManager = user?.email === CORE_IDENTITY
  const isCoreView = pathname === "/admin"

  const fetchQuota = useCallback(async () => {
    if (!user) return
    
    setQuotaError("")
    const timeoutId = setTimeout(() => {
      setQuotaError("Request timed out. Please try again.")
    }, QUERY_TIMEOUT_MS)
    
    try {
      const info = await checkUserQuota(user.id)
      clearTimeout(timeoutId)
      setQuota(info as unknown as QuotaInfo)
    } catch (error) {
      clearTimeout(timeoutId)
      console.error("Error fetching quota:", error)
      setQuotaError("Failed to load quota information")
    }
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

  const fetchDocuments = useCallback(async (page = 1) => {
    if (!user || !hasSupabasePublicEnv()) return

    setDocumentsLoading(true)
    setDocumentsError("")
    
    // Create AbortController for timeout
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => {
      abortController.abort()
    }, QUERY_TIMEOUT_MS)
    
    try {
      const supabaseClient = getSupabaseClient()
      const from = (page - 1) * DOCUMENTS_PER_PAGE
      const to = from + DOCUMENTS_PER_PAGE - 1

      const { data, error, count } = await supabaseClient
        .from("documents")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to)
        .abortSignal(abortController.signal)

      clearTimeout(timeoutId)

      if (error) {
        console.error("Error fetching documents:", error)
        setDocumentsError("Failed to load documents. Please try again.")
        return
      }

      setDocuments(data || [])
      if (count !== null) {
        setTotalPages(Math.ceil(count / DOCUMENTS_PER_PAGE))
      }
      setCurrentPage(page)
    } catch (error) {
      clearTimeout(timeoutId)
      console.error("Error fetching documents:", error)
      
      if (error instanceof Error && error.name === "AbortError") {
        setDocumentsError("Request timed out. Please check your connection and try again.")
      } else {
        setDocumentsError("Failed to load documents. Please try again.")
      }
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

  // Risk Dashboard calculations
  const audited = useMemo(() => documents.filter((d) => d.audit_result), [documents])
  const compliant = useMemo(() => audited.filter((d) => d.compliance_status === "compliant").length, [audited])
  const nonCompliant = useMemo(() => audited.filter((d) => d.compliance_status === "non_compliant").length, [audited])
  const needsReview = useMemo(() => audited.filter(
    (d) => d.compliance_status && d.compliance_status !== "compliant" && d.compliance_status !== "non_compliant"
  ).length, [audited])
  const avgScore = useMemo(() => 
    audited.length > 0
      ? Math.round(
          audited.reduce((sum, d) => sum + (d.audit_result?.compliance?.score ?? 0), 0) /
            audited.length
        )
      : 0
  , [audited])

  // Usage stats calculations
  const totalTokens = useMemo(() => documents.reduce((sum, d) => sum + (d.total_tokens || 0), 0), [documents])
  const totalCost = useMemo(() => documents.reduce((sum, d) => sum + (Number(d.total_cost) || 0), 0), [documents])
  const usagePercent = useMemo(() => quota ? Math.min(100, (quota.usage / quota.limit) * 100) : 0, [quota])

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
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white shadow-sm border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3">
              <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-600 shadow-lg">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                Apexive AI
              </h1>
            </Link>
            
            <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
              {isCoreView ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-[10px] sm:text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Console
                  </span>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-[10px] sm:text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors whitespace-nowrap"
                  >
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Exit View</span>
                  </Link>
                </div>
              ) : isManager ? (
                <Link 
                  href="/admin" 
                  className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Console
                </Link>
              ) : null}
              
              <div className="h-4 sm:h-6 w-px bg-gray-200" />
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 text-xs sm:text-sm font-medium transition"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 h-4" />
                <span>Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.main 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
        className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8"
      >
        
        {children ? (
          <div className="space-y-6 sm:space-y-8">
            {children}
          </div>
        ) : (
          <>
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
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8"
            >
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
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-700">{audited.length}</p>
                      <p className="text-[10px] sm:text-xs sm:text-sm text-indigo-600 mt-1">Audited</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-500" />
                      </div>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-700">{compliant}</p>
                      <p className="text-[10px] sm:text-xs sm:text-sm text-green-600 mt-1">Compliant</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-3 sm:p-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <XCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-500" />
                      </div>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-700">{nonCompliant}</p>
                      <p className="text-[10px] sm:text-xs sm:text-sm text-red-600 mt-1">Non-Compliant</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-3 sm:p-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-500" />
                      </div>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-700">{needsReview}</p>
                      <p className="text-[10px] sm:text-xs sm:text-sm text-yellow-600 mt-1">Needs Review</p>
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
            </motion.div>

        {/* Usage Statistics Card */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-indigo-100"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-indigo-400 to-blue-500 shrink-0">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                    Usage Statistics
                  </h3>
                </div>
                {quota && (
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 uppercase">
                      {quota.plan} PLAN
                    </span>
                    {quota.plan === "FREE" && (
                      <PaymentModal>
                        <UpgradeButton className="text-[10px] sm:text-xs py-1" />
                      </PaymentModal>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                <div className="bg-indigo-50/50 rounded-xl p-3 sm:p-4 border border-indigo-100">
                  <p className="text-xs sm:text-sm font-medium text-indigo-600 mb-1">Total Tokens Used</p>
                  <p className="text-xl sm:text-2xl font-bold text-indigo-900">{totalTokens.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-3 sm:p-4 border border-blue-100">
                  <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1">Estimated AI Cost</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-900">${totalCost.toFixed(4)}</p>
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
              
              {quotaError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 mb-2">{quotaError}</p>
                  <button
                    onClick={() => { void fetchQuota() }}
                    className="text-xs font-medium text-red-600 hover:text-red-800 underline"
                  >
                    Retry
                  </button>
                </div>
              )}
            </motion.div>

        <motion.div 
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-green-400 to-blue-500">
              <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
              Upload Documents
            </h3>
          </div>
          <FileUploader onUploadSuccess={() => { void fetchDocuments(1) }} />
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8"
        >
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
          ) : documentsError ? (
            <div className="border-2 border-red-200 bg-red-50 rounded-xl p-8 text-center">
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-700 text-lg font-semibold mb-2">{documentsError}</p>
              <button
                onClick={() => { void fetchDocuments(currentPage) }}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((doc) => (
                <Link key={doc.id} href={`/dashboard/${doc.id}`}>
                  <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-purple-300">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors truncate">
                            {doc.filename || doc.file_name}
                          </h3>
                          {doc.audit_result && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {doc.document_type === "commercial_invoice" ? (
                                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                              ) : (
                                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                              )}
                              <span className="text-[10px] font-medium px-2 py-0.5 sm:py-1 rounded-full bg-purple-100 text-purple-700 whitespace-nowrap">
                                Audited
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                          {doc.summary || "No summary available"}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-gray-500 mb-2">
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          <span className="opacity-50">•</span>
                          <span>{new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {doc.audit_result && (
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-1">
                              {doc.compliance_status === "compliant" ? (
                                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                              ) : doc.compliance_status === "non_compliant" ? (
                                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
                              )}
                              <span
                                className={`text-[10px] font-medium px-2 py-0.5 sm:py-1 rounded whitespace-nowrap ${
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
                            <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                              Score: {doc.audit_result.compliance?.score || 0}/100
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 self-start sm:self-center">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
                  <button
                    onClick={() => { void fetchDocuments(currentPage - 1) }}
                    disabled={currentPage <= 1 || documentsLoading}
                    className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => { void fetchDocuments(currentPage + 1) }}
                    disabled={currentPage >= totalPages || documentsLoading}
                    className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Your processed documents will appear here.</p>
              <p className="text-gray-400 text-sm mt-2">Upload your first document to get started</p>
            </div>
          )}
        </motion.div>
      </>
    )}
  </motion.main>
</div>
)
}
