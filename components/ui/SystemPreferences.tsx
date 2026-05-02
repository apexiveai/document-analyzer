import { Zap, Check } from "lucide-react"

export default function SystemPreferences() {
  return (
    <div suppressHydrationWarning className="sticky top-0 z-50 w-full core-system-nav">
      <div suppressHydrationWarning className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 px-3 py-3 sm:px-6 sm:py-4 shadow-md">
        <div suppressHydrationWarning className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div suppressHydrationWarning className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center sm:gap-4">
            <div suppressHydrationWarning className="shrink-0 pt-0.5 sm:pt-0">
              <Zap className="h-4 w-4 animate-bounce text-white sm:h-6 sm:w-6" />
            </div>
            <div suppressHydrationWarning className="min-w-0 flex-1">
              <h3 className="text-sm font-bold leading-tight text-white sm:text-xl">
                Enhanced System Experience
              </h3>
              <p className="mt-1 text-xs leading-snug text-white/90 sm:text-sm">
                Enable extra features to keep this service free. Your data remains private.
              </p>
            </div>
          </div>

          <div suppressHydrationWarning className="shrink-0">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-orange-800 shadow-sm transition hover:scale-[1.02] hover:bg-orange-50 sm:w-auto sm:px-5 sm:text-sm"
            >
              <Check className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
              <span>Enable Mode</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
