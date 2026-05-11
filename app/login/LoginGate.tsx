"use client";

import Loading from "@/components/Loading";
import dynamic from "next/dynamic";

const LoginClient = dynamic(() => import("./LoginClient"), {
  ssr: false,
  loading: () => <Loading />,
});

export default function LoginGate() {
  return <LoginClient />;
}
