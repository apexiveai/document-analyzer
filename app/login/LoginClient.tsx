"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient, hasSupabasePublicEnv } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Lock, Mail, LogIn, UserPlus, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import { APP_CONFIG } from "@/constants/config";

export default function LoginClient() {
  const missingSupabaseEnv = !hasSupabasePublicEnv();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(() =>
    missingSupabaseEnv
      ? "Missing Supabase public environment variables in this deployment."
      : "",
  );
  const [messageType, setMessageType] = useState<"success" | "error" | "">(
    () => (missingSupabaseEnv ? "error" : ""),
  );
  const router = useRouter();

  useEffect(() => {
    if (missingSupabaseEnv) return;

    const checkExistingSession = async () => {
      try {
        const supabaseClient = getSupabaseClient();
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        if (user) router.replace(APP_CONFIG.ROUTES.DASHBOARD);
      } catch (err) {
        setMessage(
          err instanceof Error
            ? err.message
            : "Unable to initialize Supabase client",
        );
        setMessageType("error");
      }
    };

    void checkExistingSession();
  }, [missingSupabaseEnv, router]);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (missingSupabaseEnv) {
      setMessage(
        "Missing Supabase public environment variables in this deployment.",
      );
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
          "Account created. Please sign in with your email and password. If your project uses email confirmation, check your inbox first.",
        );
        setMessageType("success");
      } else {
        setMessage("Login successful! Redirecting...");
        setMessageType("success");
        const timer = setTimeout(() => {
          router.replace("/dashboard");
          router.refresh();
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "An error occurred");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-[#f0f2f5] via-gray-100 to-white">
      <BackgroundAnimation />
      <div className="relative z-10 flex flex-col lg:grid lg:grid-cols-2 min-h-screen">
        <div className="lg:flex bg-linear-to-br from-[#1877f2] via-[#1a76d2] to-[#0d47a1] p-6 sm:p-8 lg:p-12 xl:p-20 flex-col justify-start text-white order-2 lg:order-1 pt-6 sm:pt-8 lg:pt-10 xl:pt-12">
          <div className="text-center lg:text-left mb-10 lg:mb-12">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 25,
                  delay: 0.2,
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg flex items-center justify-center shrink-0"
              >
                <span className="text-xl sm:text-2xl font-bold text-[#1877f2]">
                  A
                </span>
              </motion.div>

              <div className="flex gap-2 overflow-hidden">
                {"Apexive AI".split(" ").map((word, i) => (
                  <motion.h1
                    key={i}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{
                      duration: 1.2,
                      ease: "easeOut",
                      delay: 0.8 + i * 0.4,
                    }}
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold whitespace-nowrap"
                  >
                    {word}
                  </motion.h1>
                ))}
              </div>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 1.8 }}
              className="text-white/80 text-base sm:text-lg"
            >
              Document Intelligence Platform
            </motion.p>
          </div>
          <div className="space-y-4 sm:space-y-6 lg:space-y-8 mt-6 lg:mt-12 xl:mt-16">
            {/* Secure Feature */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: {
                  transition: { staggerChildren: 0.2, delayChildren: 2.2 },
                },
              }}
              className="flex items-center gap-4"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/5">
                <motion.div
                  animate={{
                    x: [0, -2, 2, -1, 0],
                    scale: [1, 1.05, 1, 1.02, 1],
                    opacity: [1, 0.8, 1, 0.9, 1],
                  }}
                  transition={{
                    duration: 0.4,
                    repeat: Infinity,
                    repeatDelay: 6.6,
                    ease: "easeInOut",
                  }}
                >
                  <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </motion.div>
              </div>

              <motion.div
                variants={{
                  hidden: { scaleY: 0 },
                  visible: {
                    scaleY: 1,
                    transition: { duration: 0.5, ease: "easeInOut" },
                  },
                }}
                className="w-[1px] h-8 bg-white/20 origin-top"
              />

              <div className="flex flex-col">
                <motion.div
                  variants={{
                    hidden: { x: -10, opacity: 0 },
                    visible: {
                      x: 0,
                      opacity: 1,
                      transition: { duration: 0.4, ease: "easeOut" },
                    },
                  }}
                  className="font-bold text-sm sm:text-base text-white"
                >
                  Secure
                </motion.div>
                <motion.div
                  variants={{
                    hidden: { x: -10, opacity: 0 },
                    visible: {
                      x: 0,
                      opacity: 1,
                      transition: { duration: 0.4, ease: "easeOut" },
                    },
                  }}
                  className="text-white/70 text-xs sm:text-sm"
                >
                  Enterprise-grade encryption
                </motion.div>
              </div>
            </motion.div>

            {/* Fast Feature */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: {
                  transition: { staggerChildren: 0.2, delayChildren: 2.4 },
                },
              }}
              className="flex items-center gap-4"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/5">
                <motion.div
                  animate={{
                    x: [0, -2, 2, -1, 0],
                    scale: [1, 1.05, 1, 1.02, 1],
                    opacity: [1, 0.8, 1, 0.9, 1],
                  }}
                  transition={{
                    duration: 0.4,
                    repeat: Infinity,
                    repeatDelay: 6.6,
                    ease: "easeInOut",
                  }}
                >
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </motion.div>
              </div>

              <motion.div
                variants={{
                  hidden: { scaleY: 0 },
                  visible: {
                    scaleY: 1,
                    transition: { duration: 0.5, ease: "easeInOut" },
                  },
                }}
                className="w-[1px] h-8 bg-white/20 origin-top"
              />

              <div className="flex flex-col">
                <motion.div
                  variants={{
                    hidden: { x: -10, opacity: 0 },
                    visible: {
                      x: 0,
                      opacity: 1,
                      transition: { duration: 0.4, ease: "easeOut" },
                    },
                  }}
                  className="font-bold text-sm sm:text-base text-white"
                >
                  Fast
                </motion.div>
                <motion.div
                  variants={{
                    hidden: { x: -10, opacity: 0 },
                    visible: {
                      x: 0,
                      opacity: 1,
                      transition: { duration: 0.4, ease: "easeOut" },
                    },
                  }}
                  className="text-white/70 text-xs sm:text-sm"
                >
                  Process documents instantly
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="flex items-start justify-center p-6 sm:p-8 lg:p-12 xl:p-20 order-1 lg:order-2 pt-6 sm:pt-8 lg:pt-10 xl:pt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-sm sm:max-w-md"
          >
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="text-gray-500 text-sm sm:text-base font-medium">
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
              <motion.button
                whileTap={{ scale: 0.95 }}
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
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
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
              </motion.button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] text-gray-900 placeholder-gray-500 transition-all duration-200"
                    required={isSignUp}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] text-gray-900 placeholder-gray-500 transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative w-full flex items-center">
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] text-gray-900 placeholder-gray-500 transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 focus:outline-none text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-[#1877f2] to-[#1a76d2] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isSignUp ? "Creating..." : "Signing In..."}
                  </>
                ) : (
                  <>
                    {isSignUp ? (
                      <UserPlus className="w-5 h-5" />
                    ) : (
                      <LogIn className="w-5 h-5" />
                    )}
                    {isSignUp ? "Create Account" : "Sign In"}
                  </>
                )}
              </motion.button>
            </form>

            {/* Social Login Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500 font-medium">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  // TODO: Implement Google OAuth
                  console.log("Google login clicked");
                }}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 hover:shadow-md transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  // TODO: Implement GitHub OAuth
                  console.log("GitHub login clicked");
                }}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 hover:shadow-md transition-all flex items-center justify-center gap-3"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Continue with GitHub
              </motion.button>
            </div>

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
          </motion.div>
        </div>
      </div>
    </div>
  );
}
