import { Zap, Check } from "lucide-react";

export default function SystemPreferences() {
  return (
    <div
      suppressHydrationWarning
      className="sticky top-0 z-50 w-full core-system-nav"
    >
      <div
        suppressHydrationWarning
        className="bg-linear-to-r from-amber-400 via-orange-400 to-pink-400 py-6 px-4 sm:px-6 shadow-md"
      >
        <div
          suppressHydrationWarning
          className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-3 sm:gap-6"
        >
          <div
            suppressHydrationWarning
            className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0"
          >
            <div suppressHydrationWarning className="shrink-0">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-bounce" />
            </div>
            <div suppressHydrationWarning className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-lg sm:text-xl whitespace-nowrap">
                Enhanced System Experience
              </h3>
              <p className="text-white text-xs sm:text-sm opacity-90 leading-tight truncate hidden sm:block">
                Enable extra features to keep this service free. Your data
                remains private.
              </p>
            </div>
          </div>

          <div suppressHydrationWarning className="flex items-center shrink-0">
            <button
              type="button"
              className="flex items-center justify-center gap-1 bg-white text-orange-800 font-bold px-6 py-2 rounded-full hover:bg-orange-50 transition transform hover:scale-105 whitespace-nowrap text-xs sm:text-sm shadow-sm"
            >
              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Enable Mode</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
