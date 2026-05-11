"use client"

import { useState } from "react"

export default function UpgradeButton({
  className = "",
}: {
  className?: string
}) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    try {
      setLoading(true)

      const res = await fetch("/api/lemonsqueezy/checkout", {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to start checkout")
      }

      if (!data?.url) {
        throw new Error("Missing checkout URL")
      }

      window.location.href = data.url
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to start checkout")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className={`rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? "Opening checkout..." : "Upgrade to Pro"}
    </button>
  )
}