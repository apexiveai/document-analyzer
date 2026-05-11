"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Zap, BadgeCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SMART_LINK =
  "https://www.profitablecpmratenetwork.com/dj0nmw1w95?key=ed360854d1192d08b84d13cd0be84546";

const NATIVE_INVOKE_SRC =
  "https://pl29414289.profitablecpmratenetwork.com/939a0ff3616170a251cdb0c4cfbe3ff6/invoke.js";

const POPUNDER_SCRIPT_SRC =
  "https://pl29414067.profitablecpmratenetwork.com/50/1a/85/501a8554e04bc296fe35e4f3a4adba60.js";

/** Must match Adsterra placement exactly */
const NATIVE_CONTAINER_ID = "container-939a0ff3616170a251cdb0c4cfbe3ff6";

/** Shown when the browser or an extension blocks ad scripts (ERR_BLOCKED_BY_CLIENT). */
const AD_SCRIPT_BLOCK_HINT =
  "[Ads] Script blocked (often ad blocker / Brave Shields). Pause blocking for this site to test; you cannot bypass visitors' blockers from code.";

function countAdSlides(el: HTMLElement): number {
  const n = el.children.length;
  if (n === 0) return 0;
  return n;
}

export default function SystemPreferences() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [slideCount, setSlideCount] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const hasAds = slideCount > 0;

  const openSmartLink = useCallback(() => {
    window.open(SMART_LINK, "_blank", "noopener,noreferrer");
  }, []);

  const handleBannerClick = useCallback(() => {
    openSmartLink();
  }, [openSmartLink]);

  const handleBannerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openSmartLink();
      }
    },
    [openSmartLink],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setReduceMotion(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const sync = () => {
      const n = countAdSlides(el);
      setSlideCount(n);
      if (n > 0) {
        console.log(`[Adsterra] ✓ Live ads active: ${n} slide(s) | Impressions tracking`);
      }
    };

    const mo = new MutationObserver(sync);
    mo.observe(el, { childList: true, subtree: true });
    
    // Initial sync
    sync();
    
    // Additional check after a delay to catch late-loading ads
    const timeoutId = setTimeout(sync, 2000);
    
    return () => {
      mo.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const apply = () => {
      const w = vp.clientWidth;
      if (w > 0) vp.style.setProperty("--viewport-w", `${w}px`);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [hasAds]);

  useEffect(() => {
    setSlideIndex((i) => {
      if (slideCount <= 0) return 0;
      return i % slideCount;
    });
  }, [slideCount]);

  useEffect(() => {
    if (!hasAds || slideCount <= 1 || reduceMotion) return;
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % slideCount);
    }, 4000);
    return () => window.clearInterval(id);
  }, [hasAds, slideCount, reduceMotion]);

  return (
    <div
      suppressHydrationWarning
      className="sticky top-0 z-50 w-full overflow-x-hidden core-system-nav"
    >
      <Script
        id="adsterra-native-invoke"
        src={NATIVE_INVOKE_SRC}
        strategy="afterInteractive"
        {...{ "data-cfasync": "false" }}
        onLoad={() => {
          console.log("[Adsterra] ✓ Ad script loaded | Live impressions enabled");
        }}
        onError={(e) => {
          console.error("[Adsterra] ✗ Script load failed:", e);
          console.warn(AD_SCRIPT_BLOCK_HINT);
        }}
      />
      <Script
        id="adsterra-popunder"
        src={POPUNDER_SCRIPT_SRC}
        strategy="afterInteractive"
        onLoad={() => {
          console.log("[Adsterra] ✓ Popunder script loaded");
        }}
        onError={(e) => {
          console.error("[Adsterra] ✗ Popunder failed:", e);
        }}
      />

      <div
        role="link"
        tabIndex={0}
        aria-label="Enhanced System Experience — opens partner offer in a new tab"
        suppressHydrationWarning
        onClick={handleBannerClick}
        onKeyDown={handleBannerKeyDown}
        className="block w-full cursor-pointer overflow-hidden bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 shadow-md outline-none transition hover:brightness-[1.02] focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-500"
      >
        <div
          suppressHydrationWarning
          className={cn(
            "relative w-full overflow-hidden",
            "h-[100px] sm:h-[120px]",
            !hasAds && "flex flex-row items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6",
          )}
        >
          {!hasAds && (
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <div className="shrink-0">
                <Zap className="h-4 w-4 animate-bounce text-white sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold leading-tight text-white sm:text-sm">
                  Enhanced System Experience
                </h3>
                <p className="mt-0.5 hidden text-[10px] leading-tight text-white/90 sm:block sm:text-xs">
                  Enable extra features to keep this service free.
                </p>
              </div>
            </div>
          )}

          <div
            ref={viewportRef}
            className={cn(
              "overflow-hidden",
              hasAds
                ? "ad-native-viewport-full pointer-events-auto absolute inset-0 z-0 flex h-full w-full items-center justify-center"
                : "hidden",
            )}
          >
            <div
              ref={containerRef}
              id={NATIVE_CONTAINER_ID}
              suppressHydrationWarning
              className={cn(
                "ad-native-track",
                hasAds && "ad-native-track--full h-full",
              )}
              style={
                hasAds && slideCount > 0
                  ? {
                      ["--slide-index" as string]: String(slideIndex),
                      transform:
                        "translateX(calc(-1 * var(--slide-index) * var(--viewport-w, 100%)))",
                      ...(reduceMotion
                        ? {}
                        : { transition: "transform 0.5s ease-in-out" }),
                    }
                  : undefined
              }
            />
          </div>

          <div
            className={cn(
              "pointer-events-auto z-40 flex shrink-0 gap-1.5",
              hasAds
                ? "absolute bottom-1.5 right-2 sm:bottom-auto sm:right-3 sm:top-1/2 sm:-translate-y-1/2"
                : "flex-row items-center",
            )}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openSmartLink();
              }}
              className={cn(
                "inline-flex h-6 shrink-0 items-center justify-center gap-1 rounded-full border-2 border-transparent bg-white px-2.5 text-center text-[9px] font-bold text-orange-600 shadow-lg ring-1 ring-black/5 transition hover:bg-orange-50 sm:h-7 sm:gap-1 sm:px-3 sm:text-[10px]",
              )}
            >
              <BadgeCheck className="h-2.5 w-2.5 shrink-0 text-orange-600 sm:h-3 sm:w-3" aria-hidden />
              <span className="hidden sm:inline">Accept</span>
              <span className="sm:hidden">✓</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                // Add hide logic here if needed
              }}
              className={cn(
                "inline-flex h-6 shrink-0 items-center justify-center gap-1 rounded-full border-2 border-white/90 bg-transparent px-2.5 text-center text-[9px] font-semibold text-white shadow-lg backdrop-blur-sm transition hover:bg-white/10 sm:h-7 sm:gap-1 sm:px-3 sm:text-[10px]",
              )}
            >
              <X className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" strokeWidth={2.5} aria-hidden />
              <span className="hidden sm:inline">Hide ads</span>
              <span className="sm:hidden">Hide</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
