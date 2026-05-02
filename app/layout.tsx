import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SupabaseAuthRecovery } from "@/components/SupabaseAuthRecovery";
import SystemPreferences from "@/components/ui/SystemPreferences";
import { ToastProvider } from "@/components/ui/Toast";
import ScrollToTop from "@/components/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initializeMonitoring } from "@/lib/globalErrorHandler";

// Initialize global error handling (client-side only)
if (typeof window !== 'undefined') {
  initializeMonitoring();
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Apexive AI – Document Intelligence",
  description: "Analyze, audit, and manage your documents with AI-powered intelligence.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden" suppressHydrationWarning>
        <ToastProvider>
          <ScrollToTop />
          <SystemPreferences />
          <SupabaseAuthRecovery />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </ToastProvider>
      </body>
    </html>
  );
}
