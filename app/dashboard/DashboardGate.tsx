"use client";

import dynamic from "next/dynamic";

const DashboardClient = dynamic(() => import("./DashboardClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
    </div>
  ),
});

export default function DashboardGate() {
  return <DashboardClient />;
}
