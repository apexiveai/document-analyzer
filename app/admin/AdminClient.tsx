"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabaseClient"
import DashboardClient from "@/app/dashboard/DashboardClient"
import UsageAnalytics from "@/components/UsageAnalytics"
import { getAllUsersUsage } from "@/lib/actions/usage"
import { ShieldCheck, Users, AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

const CORE_IDENTITY = "sdd@gmail.com"

interface UsageData {
  email: string
  total_tokens: number
}

export default function PortalClient() {
  const router = useRouter()
  const [data, setData] = useState<UsageData[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkAuthAndFetchData() {
      try {
        const supabase = getSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || user.email !== CORE_IDENTITY) {
          setIsAuthorized(false)
          // Don't push to dashboard, let the UI show access denied
          return
        }

        setIsAuthorized(true)
        const usage = await getAllUsersUsage()
        setData(usage)
      } catch (error) {
        console.error("Portal auth or data fetch error:", error)
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    }
    checkAuthAndFetchData()
  }, [router])

  // Prevent rendering management content if not authorized or still checking
  if (isAuthorized === false) {
    return (
      <DashboardClient>
        <div className="max-w-md mx-auto mt-12 sm:mt-20 p-8 bg-white rounded-2xl shadow-xl border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-8">
            You do not have the required permissions to view the System Console.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back to Dashboard
          </Link>
        </div>
      </DashboardClient>
    )
  }

  return (
    <DashboardClient>
      <div className="space-y-6 sm:space-y-8">
        {/* Core Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-indigo-50">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 sm:gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-nowrap">System Console</h2>
                {/* <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 text-[10px] sm:text-sm text-gray-500 hover:text-indigo-600 transition-colors group whitespace-nowrap"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Exit Console</span>
                </Link> */}
              </div>
              <p className="text-[10px] sm:text-sm text-gray-500">System-wide usage and user analytics</p>
            </div>
          </div>
          
          <div className="flex gap-2 sm:gap-3 self-start sm:self-center">
            <div className="bg-indigo-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-indigo-100 flex items-center gap-1.5 sm:gap-2">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
              <span className="text-[10px] sm:text-sm font-semibold text-indigo-700 whitespace-nowrap">{data.length} Active Users</span>
            </div>
          </div>
        </div>

        {/* The Chart */}
        {loading ? (
          <div className="w-full h-[400px] bg-white rounded-2xl shadow-sm border border-indigo-50 p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <UsageAnalytics data={data} />
        )}
      </div>
    </DashboardClient>
  )
}
