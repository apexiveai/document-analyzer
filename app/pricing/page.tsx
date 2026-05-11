import UpgradeButton from "@/components/UpgradeButton"

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Pricing</h1>
        <p className="mt-2 text-gray-600">
          Upgrade your Document Analyzer for premium audit features.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">Free</h2>
          <p className="mt-2 text-sm text-gray-600">
            Standard document analysis
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            <li>Document Analysis</li>
            <li>Basic upload flow</li>
            <li>Standard AI summary</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-purple-900">Pro</h2>
          <p className="mt-2 text-sm text-purple-700">$19/month</p>
          <ul className="mt-4 space-y-2 text-sm text-purple-900">
            <li>Multi-Region Audit</li>
            <li>Commercial Invoice validation</li>
            <li>Service Agreement risk assessment</li>
          </ul>

          <div className="mt-6">
            <UpgradeButton />
          </div>
        </div>
      </div>
    </main>
  )
}