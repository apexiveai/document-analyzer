"use client"

import dynamic from "next/dynamic"

const LoginClient = dynamic(() => import("./LoginClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f2f5] via-gray-100 to-white">
      <div className="w-10 h-10 border-2 border-[#1877f2] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

export default function LoginGate() {
  return <LoginClient />
}
