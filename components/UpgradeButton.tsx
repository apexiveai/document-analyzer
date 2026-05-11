"use client"

export default function UpgradeButton({
  className = "",
}: {
  className?: string
}) {
  return (
    <button
      className={`rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition hover:bg-purple-700 ${className}`}
    >
      Upgrade to Pro
    </button>
  )
}