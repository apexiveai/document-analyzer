import { Zap, Check } from "lucide-react"

export default function AdsConsent() {
  return (
    <div suppressHydrationWarning className="sticky top-0 z-50 w-full">
      <div suppressHydrationWarning className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 p-3 sm:p-4 md:p-6 lg:p-8 shadow-lg">
        <div suppressHydrationWarning className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 md:gap-6">
          <div suppressHydrationWarning className="flex items-start gap-2 sm:gap-3 md:gap-4 flex-1">
            <div suppressHydrationWarning className="shrink-0 pt-0.5 sm:pt-1">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white animate-bounce" />
            </div>
            <div suppressHydrationWarning className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base md:text-lg lg:text-xl mb-1 sm:mb-2">
                Enhanced Experience with Ads
              </h3>
              <p className="text-white text-xs sm:text-sm md:text-base opacity-90 leading-relaxed">
                We&apos;d like to show you relevant ads to keep this service free. Your data remains private and secure.
              </p>
              <p className="text-white text-xs opacity-75 mt-1 sm:mt-2 hidden sm:block">
                Support our development while enjoying premium features
              </p>
            </div>
          </div>

          <div suppressHydrationWarning className="flex items-centerr justify-center sm:justify-end gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
            <button
              type="button" 
              className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 bg-white text-orange-800 font-semibold px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-lg hover:bg-orange-50 transition transform hover:scale-105 whitespace-nowrap text-xs sm:text-sm md:text-base shadow-md min-w-20 sm:min-w-25"
            >
              <Check className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span className="sm:hidden">Accept</span>
              <span className="hidden sm:inline">Accept Ads</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}