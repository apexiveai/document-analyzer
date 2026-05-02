"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient, hasSupabasePublicEnv } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Lock, Mail, LogIn, UserPlus, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import { useApiErrorHandler } from "@/lib/apiErrorHandler";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success or error
  const [fieldErrors, setFieldErrors] = useState<{
    email: string;
    password: string;
    name: string;
  }>({
    email: "",
    password: "",
    name: "",
  });
  // Client-side rate limiting state
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const router = useRouter();

  const buildAuthNetworkErrorMessage = () => {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!rawUrl) {
      return "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to your .env file and restart the dev server.";
    }

    try {
      const url = new URL(rawUrl);
      const hostname = url.hostname;
      
      // Check if it's a valid Supabase URL
      if (!url.protocol.startsWith('https')) {
        return `Invalid Supabase URL: ${rawUrl}. URL must use HTTPS protocol. Update NEXT_PUBLIC_SUPABASE_URL in .env file.`;
      }
      
      if (!hostname.includes('.supabase.co')) {
        return `Invalid Supabase URL: ${rawUrl}. Must be a valid Supabase project URL (e.g., https://<project-ref>.supabase.co). Update NEXT_PUBLIC_SUPABASE_URL in .env file.`;
      }
      
      return `Unable to reach Supabase at ${hostname}. Check NEXT_PUBLIC_SUPABASE_URL in .env file (project URL), verify internet/DNS, then restart the dev server.`;
    } catch {
      return `Invalid NEXT_PUBLIC_SUPABASE_URL format: ${rawUrl}. It must be a full HTTPS URL like https://<project-ref>.supabase.co. Update .env file and restart the dev server.`;
    }
  };

  // Validation functions
  const validateEmail = (email: string): { isValid: boolean; message: string } => {
    if (!email.trim()) {
      return { isValid: false, message: "Email is required" };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: "Please enter a valid email address" };
    }
    
    return { isValid: true, message: "" };
  };

  const validatePassword = (password: string, isSignUp: boolean): { isValid: boolean; message: string } => {
    if (!password.trim()) {
      return { isValid: false, message: "Password is required" };
    }
    
    if (isSignUp) {
      // Strong password validation for sign-up
      if (password.length < 8) {
        return { isValid: false, message: "Password must be at least 8 characters" };
      }
      
      if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one uppercase letter" };
      }
      
      if (!/[a-z]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one lowercase letter" };
      }
      
      if (!/\d/.test(password)) {
        return { isValid: false, message: "Password must contain at least one number" };
      }
      
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one special character" };
      }
    } else {
      // Basic validation for login
      if (password.length < 6) {
        return { isValid: false, message: "Password must be at least 6 characters" };
      }
    }
    
    return { isValid: true, message: "" };
  };

  const validateName = (name: string): { isValid: boolean; message: string } => {
    if (!name.trim()) {
      return { isValid: false, message: "Full name is required" };
    }
    
    if (name.trim().length < 2) {
      return { isValid: false, message: "Full name must be at least 2 characters" };
    }
    
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
      return { isValid: false, message: "Full name can only contain letters, spaces, hyphens, and apostrophes" };
    }
    
    return { isValid: true, message: "" };
  };

  // Real-time validation functions
  const validateEmailField = (value: string) => {
    const validation = validateEmail(value);
    setFieldErrors(prev => ({ ...prev, email: validation.isValid ? "" : validation.message }));
    return validation.isValid;
  };

  const validatePasswordField = (value: string) => {
    const validation = validatePassword(value, isSignUp);
    setFieldErrors(prev => ({ ...prev, password: validation.isValid ? "" : validation.message }));
    return validation.isValid;
  };

  const validateNameField = (value: string) => {
    const validation = validateName(value);
    setFieldErrors(prev => ({ ...prev, name: validation.isValid ? "" : validation.message }));
    return validation.isValid;
  };

  // Clear all field errors
  const clearFieldErrors = () => {
    setFieldErrors({
      email: "",
      password: "",
      name: "",
    });
  };

  // Re-validate password when switching between login and sign-up
  useEffect(() => {
    if (password) {
      validatePasswordField(password);
    }
  }, [isSignUp]);

  // Countdown timer — ticks every second while a cooldown is active
  useEffect(() => {
    if (!cooldownUntil) return;
    const tick = () => {
      const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setCooldownUntil(null);
        setCooldownSeconds(0);
      } else {
        setCooldownSeconds(remaining);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  useEffect(() => {
    // Check environment variables with detailed validation
    if (!hasSupabasePublicEnv()) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      let errorMessage = "Missing or invalid Supabase environment variables.";
      
      if (!supabaseUrl && !supabaseAnonKey) {
        errorMessage = "Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env file.";
      } else if (!supabaseUrl) {
        errorMessage = "Missing NEXT_PUBLIC_SUPABASE_URL in .env file.";
      } else if (!supabaseAnonKey) {
        errorMessage = "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env file.";
      } else {
        // Both exist but failed validation
        try {
          new URL(supabaseUrl);
          errorMessage = `Invalid Supabase configuration. Check NEXT_PUBLIC_SUPABASE_URL format in .env file.`;
        } catch {
          errorMessage = `Invalid NEXT_PUBLIC_SUPABASE_URL format in .env file. Must be a valid HTTPS URL like https://<project-ref>.supabase.co`;
        }
      }
      
      setMessage(errorMessage);
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

  // Hook must be called at top level, not conditionally
  const { handleApiError, handleNetworkError } = useApiErrorHandler();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side cooldown guard
    if (cooldownUntil && Date.now() < cooldownUntil) {
      setMessage(`Too many attempts. Please wait ${cooldownSeconds} second${cooldownSeconds === 1 ? "" : "s"} before trying again.`);
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    if (!hasSupabasePublicEnv()) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      let errorMsg = "Missing or invalid Supabase environment variables.";
      
      if (!supabaseUrl && !supabaseAnonKey) {
        errorMsg = "Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env file. Add them and restart the dev server.";
      } else if (!supabaseUrl) {
        errorMsg = "Missing NEXT_PUBLIC_SUPABASE_URL in .env file. Add it and restart the dev server.";
      } else if (!supabaseAnonKey) {
        errorMsg = "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env file. Add it and restart the dev server.";
      } else {
        // Both exist but failed validation
        try {
          const url = new URL(supabaseUrl);
          if (!url.protocol.startsWith('https')) {
            errorMsg = `Invalid NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}. URL must use HTTPS protocol.`;
          } else if (!url.hostname.includes('.supabase.co')) {
            errorMsg = `Invalid NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}. Must be a valid Supabase URL (e.g., https://<project-ref>.supabase.co).`;
          } else if (!supabaseAnonKey.startsWith('eyJ')) {
            errorMsg = `Invalid NEXT_PUBLIC_SUPABASE_ANON_KEY format. Should be a JWT token starting with 'eyJ'.`;
          } else {
            errorMsg = `Invalid Supabase configuration. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env file.`;
          }
        } catch {
          errorMsg = `Invalid NEXT_PUBLIC_SUPABASE_URL format: ${supabaseUrl}. Must be a valid HTTPS URL like https://<project-ref>.supabase.co`;
        }
      }
      
      setMessage(errorMsg);
      setMessageType("error");
      setLoading(false);
      handleApiError({ error: errorMsg }, "Authentication", { showToast: false });
      return;
    }

    try {
      // Client-side validation before making API calls
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.message);
      }
      
      const passwordValidation = validatePassword(password, isSignUp);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message);
      }
      
      if (isSignUp) {
        const nameValidation = validateName(name);
        if (!nameValidation.isValid) {
          throw new Error(nameValidation.message);
        }
      }
      
      const supabaseClient = getSupabaseClient();
      let result;
      
      if (isSignUp) {
        result = await supabaseClient.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() } },
        });
      } else {
        result = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });
      }

      if (result.error) {
        const errorMsg = result.error.message;

        // Client-side progressive cooldown on login failures
        if (!isSignUp) {
          const newAttempts = loginAttempts + 1;
          setLoginAttempts(newAttempts);

          // Cooldown schedule: 3 fails → 30s, 5 fails → 2 min, 7+ fails → 5 min
          let cooldownMs = 0;
          if (newAttempts >= 7) cooldownMs = 5 * 60 * 1000;
          else if (newAttempts >= 5) cooldownMs = 2 * 60 * 1000;
          else if (newAttempts >= 3) cooldownMs = 30 * 1000;

          if (cooldownMs > 0) {
            setCooldownUntil(Date.now() + cooldownMs);
          }
        }

        setMessage(errorMsg);
        setMessageType("error");
        handleApiError({ error: errorMsg }, "Authentication", { showToast: false });
      } else if (isSignUp) {
        // Sign up successful - sign out and show success message
        await supabaseClient.auth.signOut();
        setIsSignUp(false);
        setPassword("");
        setMessage(
          "Account created. Please sign in with your email and password. If your project uses email confirmation, check your inbox first."
        );
        setMessageType("success");
      } else {
        // Login successful — reset attempt counter
        setLoginAttempts(0);
        setCooldownUntil(null);
        setMessage("Login successful! Redirecting...");
        setMessageType("success");
        setTimeout(() => {
          router.replace("/dashboard");
          router.refresh();
        }, 500);
      }
    } catch (err: unknown) {
      if (err instanceof TypeError && /fetch/i.test(err.message)) {
        const errorMsg = buildAuthNetworkErrorMessage();
        setMessage(errorMsg);
        setMessageType("error");
        handleNetworkError(err, "Authentication");
      } else if (err instanceof Error) {
        const errorMsg = err.message;
        setMessage(errorMsg);
        setMessageType("error");
        handleApiError({ error: errorMsg }, "Authentication", { showToast: false });
      } else {
        const errorMsg = "An unexpected error occurred";
        setMessage(errorMsg);
        setMessageType("error");
        handleApiError({ error: errorMsg }, "Authentication", { showToast: false });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f0f2f5] via-gray-100 to-white">
      {/* Safe render for BackgroundAnimation */}
      {(function() {
        try {
          return <BackgroundAnimation />;
        } catch (error) {
          console.error('BackgroundAnimation failed:', error);
          return null;
        }
      })()}
      <div className="relative z-10 flex flex-col lg:grid lg:grid-cols-2 min-h-screen">
          <div className="lg:flex bg-gradient-to-br from-[#1877f2] via-[#1a76d2] to-[#0d47a1] p-6 sm:p-8 lg:p-12 xl:p-20 flex-col justify-start text-white order-2 lg:order-1 pt-6 sm:pt-8 lg:pt-10 xl:pt-12">
            <div className="text-center lg:text-left mb-10 lg:mb-12">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <motion.div 
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100, 
                    damping: 25,
                    delay: 0.2 
                  }}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg flex items-center justify-center shrink-0"
                >
                  <span className="text-xl sm:text-2xl font-bold text-[#1877f2]">A</span>
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
                        delay: 0.8 + (i * 0.4)
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
                  visible: { transition: { staggerChildren: 0.2, delayChildren: 2.2 } }
                }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/5">
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
                      ease: "easeInOut"
                    }}
                  >
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </motion.div>
                </div>

                <motion.div 
                  variants={{
                    hidden: { scaleY: 0 },
                    visible: { scaleY: 1, transition: { duration: 0.5, ease: "easeInOut" } }
                  }}
                  className="w-[1px] h-8 bg-white/20 origin-top"
                />

                <div className="flex flex-col">
                  <motion.div
                    variants={{
                      hidden: { x: -10, opacity: 0 },
                      visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
                    }}
                    className="font-bold text-sm sm:text-base text-white"
                  >
                    Secure
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: { x: -10, opacity: 0 },
                      visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
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
                  visible: { transition: { staggerChildren: 0.2, delayChildren: 2.4 } }
                }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/5">
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
                      ease: "easeInOut"
                    }}
                  >
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </motion.div>
                </div>

                <motion.div 
                  variants={{
                    hidden: { scaleY: 0 },
                    visible: { scaleY: 1, transition: { duration: 0.5, ease: "easeInOut" } }
                  }}
                  className="w-[1px] h-8 bg-white/20 origin-top"
                />

                <div className="flex flex-col">
                  <motion.div
                    variants={{
                      hidden: { x: -10, opacity: 0 },
                      visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
                    }}
                    className="font-bold text-sm sm:text-base text-white"
                  >
                    Fast
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: { x: -10, opacity: 0 },
                      visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
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
                    clearFieldErrors();
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
                    clearFieldErrors();
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
                      onChange={(e) => {
                        setName(e.target.value);
                        validateNameField(e.target.value);
                      }}
                      onBlur={() => validateNameField(name)}
                      placeholder="Enter your full name"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                        fieldErrors.name ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-[#1877f2]"
                      }`}
                      required={isSignUp}
                    />
                    {fieldErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                    )}
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      validateEmailField(e.target.value);
                    }}
                    onBlur={() => validateEmailField(email)}
                    placeholder="Enter your email"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                      fieldErrors.email ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-[#1877f2]"
                    }`}
                    required
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                    {isSignUp && (
                      <span className="text-xs text-gray-500 font-normal ml-1">
                        (min 8 chars, uppercase, lowercase, number, special char)
                      </span>
                    )}
                  </label>
                  <div className="relative w-full flex items-center">
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        validatePasswordField(e.target.value);
                      }}
                      onBlur={() => validatePasswordField(password)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                        fieldErrors.password ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-[#1877f2]"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 focus:outline-none text-gray-500 hover:text-gray-700 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                  )}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={loading || (cooldownUntil !== null && Date.now() < cooldownUntil)}
                  className="w-full bg-gradient-to-r from-[#1877f2] to-[#1a76d2] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isSignUp ? "Creating..." : "Signing In..."}
                    </>
                  ) : cooldownSeconds > 0 ? (
                    <>
                      <Lock className="w-5 h-5" />
                      Try again in {cooldownSeconds}s
                    </>
                  ) : (
                    <>
                      {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
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
                    console.log('Google login clicked');
                  }}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 hover:shadow-md transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    // TODO: Implement GitHub OAuth
                    console.log('GitHub login clicked');
                  }}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 hover:shadow-md transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
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
