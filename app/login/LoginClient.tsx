"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient, hasSupabasePublicEnv } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Lock, Mail, LogIn, UserPlus } from "lucide-react";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success or error
  const router = useRouter();

  useEffect(() => {
    if (!hasSupabasePublicEnv()) {
      setMessage("Missing Supabase public environment variables in this deployment.");
      setMessageType("error");
      return;
    }

    const checkExistingSession = async () => {
      try {
        const supabaseClient = getSupabaseClient();
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        if (user) {
          router.replace("/dashboard");
        }
      } catch (err: unknown) {
        setMessage(err instanceof Error ? err.message : "Unable to initialize Supabase client");
        setMessageType("error");
      }
    };

    checkExistingSession();
  }, [router]);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!hasSupabasePublicEnv()) {
      setMessage("Missing Supabase public environment variables in this deployment.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      const supabaseClient = getSupabaseClient();
      let result;
      if (isSignUp) {
        result = await supabaseClient.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
      } else {
        result = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });
      }

      if (result.error) {
        setMessage(result.error.message);
        setMessageType("error");
      } else if (isSignUp) {
        await supabaseClient.auth.signOut();
        setIsSignUp(false);
        setPassword("");
        setMessage(
          "Account created. Please sign in with your email and password. If your project uses email confirmation, check your inbox first."
        );
        setMessageType("success");
      } else {
        setMessage("Login successful! Redirecting...");
        setMessageType("success");
        setTimeout(() => {
          router.replace("/dashboard");
          router.refresh();
        }, 500);
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "An error occurred");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#f0f2f5] via-gray-100 to-white">
        <div className="flex flex-col lg:grid lg:grid-cols-2 min-h-screen">
          <div className="lg:flex bg-gradient-to-br from-[#1877f2] via-[#1a76d2] to-[#0d47a1] p-6 sm:p-8 lg:p-12 flex-col justify-between text-white order-2 lg:order-1">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-xl sm:text-2xl font-bold text-[#1877f2]">A</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Apexive AI</h1>
              </div>
              <p className="text-white/80 text-base sm:text-lg mb-6 lg:mb-0">Document Intelligence Platform</p>
            </div>
            <div className="space-y-3 sm:space-y-4 lg:space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base">Secure</div>
                  <div className="text-white/70 text-xs sm:text-sm">Enterprise-grade encryption</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base">Fast</div>
                  <div className="text-white/70 text-xs sm:text-sm">Process documents instantly</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-4 sm:p-6 lg:p-12 order-1 lg:order-2">
            <div className="w-full max-w-sm sm:max-w-md">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {isSignUp ? "Create Account" : "Welcome Back"}
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  {isSignUp ? "Join Apexive AI today" : "Sign in to your account"}
                </p>
              </div>

              {message && (
                <div
                  className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${
                    messageType === "success"
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  <span className="text-lg">
                    {messageType === "success" ? "✓" : "✕"}
                  </span>
                  {message}
                </div>
              )}

              <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setMessage("");
                    setEmail("");
                    setPassword("");
                    setName("");
                  }}
                  className={`flex-1 py-2 px-4 rounded font-medium transition-all text-sm ${
                    !isSignUp
                      ? "bg-white text-[#1877f2] shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <LogIn className="w-4 h-4 inline mr-2" />
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setMessage("");
                    setEmail("");
                    setPassword("");
                    setName("");
                  }}
                  className={`flex-1 py-2 px-4 rounded font-medium transition-all text-sm ${
                    isSignUp
                      ? "bg-white text-[#1877f2] shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <UserPlus className="w-4 h-4 inline mr-2" />
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] text-gray-900 placeholder-gray-500"
                      required={isSignUp}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] text-gray-900 placeholder-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] text-gray-900 placeholder-gray-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#1877f2] to-[#1a76d2] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isSignUp ? "Creating..." : "Signing In..."}
                    </>
                  ) : (
                    <>
                      {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                      {isSignUp ? "Create Account" : "Sign In"}
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-gray-600 text-sm mt-4">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[#1877f2] font-semibold hover:underline"
                >
                  {isSignUp ? "Login" : "Sign Up"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
