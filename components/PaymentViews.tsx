import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Zap,
  CheckCircle,
  CreditCard,
  QrCode,
  UploadCloud,
  ArrowLeft,
  ExternalLink,
  Scan,
  Camera,
  Check,
  Sparkles,
  Gift,
  Copy,
  Phone,
  MessageCircle,
  X,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

// Payment method type
export type PaymentMethod =
  | "global"
  | "local"
  | "card"
  | "paypal"
  | "success"
  | null;

// Copy to clipboard hook
const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return { copied, copyToClipboard };
};

// Merchant Contact Info Component
const MerchantContactInfo: React.FC = () => {
  const { copied, copyToClipboard } = useCopyToClipboard();
  const merchantPhone = "+95 9 123 456 789";

  return (
    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 max-w-xs mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-blue-600" />
          <div className="text-left">
            <p className="text-xs text-blue-700 font-medium">
              Merchant Contact
            </p>
            <p className="text-sm font-semibold text-blue-900">
              {merchantPhone}
            </p>
          </div>
        </div>
        <motion.button
          onClick={() => copyToClipboard(merchantPhone)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={twMerge(
            "p-2 rounded-lg transition-all flex items-center justify-center",
            copied
              ? "bg-green-500 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white",
          )}
          title={copied ? "Copied!" : "Copy phone number"}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Check className="w-4 h-4" />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Copy className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
      {copied && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-xs text-green-600 font-medium mt-1 text-center"
        >
          Phone number copied!
        </motion.p>
      )}
    </div>
  );
};

// Support Chat Widget Component
interface SupportWidgetProps {
  onOpenChat: () => void;
}

/**
 * SupportWidget: Minimizable floating chat — phone only (hidden on tablet/desktop)
 */
export const SupportWidget: React.FC<SupportWidgetProps> = ({ onOpenChat }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onOpenChat();
      setMessage("");
    }
  };

  return (
    // visible on all screen sizes
    <div className="fixed bottom-4 right-4 z-9999 flex flex-col items-end gap-2">
      {/* Expanded Chat Panel — opens upward */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white font-semibold text-xs">
                  Payment Support
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-4" />
              </button>
            </div>

            {/* Messages area — scrollable */}
            <div className="p-3 bg-gray-50 h-28 overflow-y-auto flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shrink-0">
                  <MessageCircle className="w-3 h-3 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none px-2.5 py-1.5 shadow-sm border border-gray-100">
                  <p className="text-[11px] text-gray-700">
                    မင်္ဂလာပါ! ဘာကူညီပေးရမလဲ?
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    How can I help you?
                  </p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="p-2.5 border-t border-gray-100 bg-white flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 text-xs px-2.5 py-1.5 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                className="w-7 h-7 bg-linear-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shrink-0 shadow-md"
              >
                <svg
                  className="w-3.5 h-4 text-white rotate-45"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
        className="w-12 h-12 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-xl flex items-center justify-center relative"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification dot — only when closed */}
        {!isOpen && (
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
          />
        )}
      </motion.button>
    </div>
  );
};

// Payment Success View Component
interface PaymentSuccessViewProps {
  onClose: () => void;
}

/**
 * PaymentSuccessView: Beautiful success screen with animations
 */
export const PaymentSuccessView: React.FC<PaymentSuccessViewProps> = ({
  onClose,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti animation after checkmark animation
    const timer = setTimeout(() => setShowConfetti(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-center space-y-6 py-8"
    >
      {/* Animated Checkmark */}
      <div className="relative flex justify-center">
        {/* Pulse Background */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-32 h-32 bg-green-500 rounded-full"
        />

        {/* Main Checkmark Circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            duration: 0.6,
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
          className="relative w-24 h-24 bg-linear-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30"
        >
          {/* Checkmark Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 0.5,
              duration: 0.5,
              type: "spring",
              stiffness: 300,
            }}
          >
            <Check className="w-12 h-12 text-white stroke-[3]" />
          </motion.div>
        </motion.div>

        {/* Sparkles Animation */}
        {showConfetti && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  scale: 0,
                  x: 0,
                  y: 0,
                  rotate: 0,
                }}
                animate={{
                  scale: [0, 1, 0],
                  x: [0, Math.cos((i * 45 * Math.PI) / 180) * 60],
                  y: [0, Math.sin((i * 45 * Math.PI) / 180) * 60],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
                className="absolute"
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="space-y-3"
      >
        <h2 className="text-2xl font-bold text-gray-900">
          Payment Successful!
        </h2>
        <p className="text-gray-600 max-w-sm mx-auto">
          Your Pro subscription has been activated. You now have access to
          unlimited document analysis and priority support.
        </p>
      </motion.div>

      {/* Features Unlocked */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="bg-linear-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 max-w-sm mx-auto"
      >
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Features Unlocked</h3>
        </div>
        <div className="space-y-2">
          {[
            "Unlimited Document Analysis",
            "AI-Powered Insights",
            "Priority Customer Support",
            "Advanced Export Options",
          ].map((feature, index) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + index * 0.1, duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-green-800">{feature}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="space-y-3"
      >
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-linear-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-200 transition-all"
        >
          Start Using Pro Features
        </motion.button>

        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          Close
        </motion.button>
      </motion.div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 0,
              y: 100,
              x: (i % 2 === 0 ? -1 : 1) * (60 + i * 18),
            }}
            animate={{
              opacity: [0, 1, 0],
              y: -100,
              x: (i % 2 === 0 ? 1 : -1) * (60 + i * 18),
            }}
            transition={{
              duration: 3,
              delay: 1.5 + i * 0.3,
              ease: "easeOut",
            }}
            className="absolute bottom-0 left-1/2"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                i % 3 === 0
                  ? "bg-green-400"
                  : i % 3 === 1
                    ? "bg-emerald-400"
                    : "bg-yellow-400"
              }`}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

interface SelectionViewProps {
  onSelect: (method: PaymentMethod) => void;
}

/**
 * SelectionView: Initial screen to choose payment method
 */
export const SelectionView: React.FC<SelectionViewProps> = ({ onSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="text-center mb-4">
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-lg font-bold text-gray-900 mb-1"
        >
          Choose Payment Method
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-500"
        >
          Get unlimited analysis, priority support, and more.
        </motion.p>
      </div>

      <div className="grid gap-3">
        <motion.button
          type="button"
          title="Pay with Myanmar Mobile Banking"
          onClick={() => onSelect("local")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group flex items-center justify-between p-4 rounded-xl bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-400 hover:shadow-md transition-all text-left w-full"
        >
          <div className="flex items-center gap-3 pointer-events-none">
            <motion.div
              whileHover={{ rotate: 5 }}
              className="w-12 h-12 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md"
            >
              <Smartphone className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <p className="font-bold text-gray-900">Myanmar Mobile Banking</p>
              <p className="text-xs text-green-700 font-medium">
                KBZPay • WavePay • CB Pay • MMQR
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-semibold">
                  RECOMMENDED
                </span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform pointer-events-none" />
        </motion.button>

        <motion.button
          type="button"
          title="Pay with International Cards"
          onClick={() => onSelect("global")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group flex items-center justify-between p-4 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all text-left w-full"
        >
          <div className="flex items-center gap-3 pointer-events-none">
            <motion.div
              whileHover={{ rotate: -5 }}
              className="w-12 h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md"
            >
              <Globe className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <p className="font-bold text-gray-900">International Cards</p>
              <p className="text-xs text-blue-700 font-medium">
                Visa • Mastercard • PayPal
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform pointer-events-none" />
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium"
      >
        <ShieldCheck className="w-3 h-3" />
        SECURE 256-BIT ENCRYPTED PAYMENT
      </motion.div>
    </motion.div>
  );
};

interface GlobalViewProps {
  // onProceed: () => void;
  onSelectCard: () => void;
  onSelectPayPal: () => void;
  // currentStep: "select" | "card" | "paypal";
  // onStepChange: (step: "select" | "card" | "paypal") => void;
}

/**
 * GlobalView: View for international payments
 */
export const GlobalView: React.FC<GlobalViewProps> = ({
  onSelectCard,
  onSelectPayPal,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Plan Summary */}
      <div className="bg-linear-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
            Pro Plan
          </span>
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
        </div>
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-2xl font-black text-gray-900">$19</span>
          <span className="text-gray-500 text-sm">/month</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
            <p className="text-xs font-medium text-gray-700">
              Unlimited Documents
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
            <p className="text-xs font-medium text-gray-700">
              AI Analysis & Priority Support
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-3">
        <h4 className="text-base font-bold text-gray-900 text-center">
          Select Payment Method
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <motion.button
            type="button"
            title="Pay with Credit/Debit Card"
            onClick={onSelectCard}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
          >
            <CreditCard className="w-8 h-8 text-indigo-600" />
            <div className="flex gap-1">
              <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[8px] font-black text-blue-700">
                VISA
              </span>
              <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[8px] font-black text-red-600">
                MASTER
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-700">
              Credit Card
            </span>
          </motion.button>

          <motion.button
            type="button"
            title="Pay with PayPal"
            onClick={onSelectPayPal}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-black italic text-sm">
              P
            </div>
            <span className="text-xs font-bold text-blue-600">PayPal</span>
            <span className="text-xs font-semibold text-gray-700">
              Digital Wallet
            </span>
          </motion.button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">
          Secure global payment powered by Lemon Squeezy
        </p>
      </div>
    </motion.div>
  );
};

interface CardEntryViewProps {
  onProceed: () => void;
}

/**
 * CardEntryView: UI for entering card details
 */
export const CardEntryView: React.FC<CardEntryViewProps> = ({ onProceed }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Card Header */}
      <div className="bg-linear-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Card Payment</p>
            <p className="text-xs text-gray-500">Secure 256-bit encryption</p>
          </div>
        </div>
        <div className="flex gap-1">
          <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-black text-blue-700">
            VISA
          </span>
          <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-black text-red-600">
            MASTER
          </span>
        </div>
      </div>

      {/* Card Form */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Card Number
          </label>
          <input
            type="text"
            placeholder="0000 0000 0000 0000"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Expiry Date
            </label>
            <input
              type="text"
              placeholder="MM/YY"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              CVV
            </label>
            <input
              type="password"
              placeholder="123"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
            />
          </div>
        </div>

        <motion.button
          type="button"
          title="Proceed to Lemon Squeezy"
          onClick={onProceed}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-linear-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-200 mt-4"
        >
          Proceed to Checkout
        </motion.button>
        <p className="text-center text-xs text-gray-400 italic">
          You will be redirected to Lemon Squeezy to complete payment
        </p>
      </div>
    </motion.div>
  );
};

interface PayPalEntryViewProps {
  onProceed: () => void;
}

/**
 * PayPalEntryView: UI for PayPal details before redirect
 */
export const PayPalEntryView: React.FC<PayPalEntryViewProps> = ({
  onProceed,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* PayPal Header */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <div className="text-white font-black italic text-lg">P</div>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">PayPal Payment</p>
            <p className="text-xs text-gray-500">Fast and secure checkout</p>
          </div>
        </div>
        <div className="px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs font-bold text-blue-600">
          Official Partner
        </div>
      </div>

      {/* PayPal Content */}
      <div className="space-y-4 text-center py-2">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <Globe className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-1">
            Pay with PayPal
          </h4>
          <p className="text-sm text-gray-500 px-2">
            You will be redirected to PayPal&apos;s secure portal to complete
            your transaction via Lemon Squeezy.
          </p>
        </div>

        <motion.button
          type="button"
          title="Proceed to PayPal"
          onClick={onProceed}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 mt-4"
        >
          Continue to PayPal
        </motion.button>
        <p className="text-center text-xs text-gray-400 italic">
          No account required for guest checkout
        </p>
      </div>
    </motion.div>
  );
};

// Animated QR Scanner Component
const AnimatedQRScanner: React.FC = () => {
  return (
    <div className="relative">
      {/* QR Code Container with Pulse Effect */}
      <motion.div
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(34, 197, 94, 0.4)",
            "0 0 0 15px rgba(34, 197, 94, 0)",
            "0 0 0 0 rgba(34, 197, 94, 0)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-36 h-36 bg-white p-3 rounded-2xl shadow-xl border-3 border-green-200 flex items-center justify-center relative overflow-hidden"
      >
        {/* QR Code Placeholder */}
        <div className="w-full h-full bg-linear-to-br from-gray-900 via-gray-800 to-black rounded-xl flex items-center justify-center relative">
          <QrCode className="w-24 h-24 text-white" />

          {/* Scanning Line Animation */}
          <motion.div
            animate={{ y: [-120, 120] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-green-400 to-transparent shadow-md shadow-green-400/50"
            style={{
              boxShadow: "0 0 15px #22c55e, 0 0 30px #22c55e",
            }}
          />

          {/* Corner Brackets */}
          <div className="absolute inset-1.5">
            <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-green-400 rounded-tl-md"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-green-400 rounded-tr-md"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-green-400 rounded-bl-md"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-green-400 rounded-br-md"></div>
          </div>
        </div>

        {/* Active Indicator */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-md">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>
      </motion.div>

      {/* Scan Status */}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-1 text-green-600"
      >
        <Scan className="w-3 h-3" />
        <span className="text-xs font-semibold">Ready to Scan</span>
      </motion.div>
    </div>
  );
};

// Mobile Banking Button Component
const MobileBankingButton: React.FC<{
  icon: React.ReactNode;
  name: string;
  color: string;
  deepLink?: string;
  onClick?: () => void;
}> = ({ icon, name, color, deepLink, onClick }) => {
  const handleClick = () => {
    // Always run the onClick (e.g. navigate to QR step)
    if (onClick) {
      onClick();
    }
    // Additionally, attempt to open the app via deep link on mobile
    if (
      deepLink &&
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      )
    ) {
      setTimeout(() => {
        window.location.href = deepLink;
      }, 100);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${color} w-full`}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="font-semibold text-gray-900 text-sm">{name}</p>
        <p className="text-xs text-gray-600">Tap to open app</p>
      </div>
      <ExternalLink className="w-4 h-4 text-gray-400" />
    </motion.button>
  );
};

interface LocalViewProps {
  selectedFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  onSubmit: () => void;
  currentStep: "select" | "qr" | "upload";
  onStepChange: (step: "select" | "qr" | "upload") => void;
}

/**
 * LocalView: Premium Myanmar Mobile Banking Payment Interface
 */
export const LocalView: React.FC<LocalViewProps> = ({
  selectedFile,
  onFileChange,
  isUploading,
  onSubmit,
  currentStep,
  onStepChange,
}) => {
  // Use the step from parent component instead of local state
  const paymentStep = currentStep;
  const setPaymentStep = onStepChange;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 pt-2"
    >
      {/* Live Session Indicator - Moved to top right */}
      <div className="flex justify-end mb-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-green-700">
            LIVE SESSION
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {paymentStep === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Plan Summary */}
            <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
                  Pro Plan
                </span>
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-black text-gray-900">
                  15,000
                </span>
                <span className="text-gray-600 font-semibold text-sm">MMK</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                  <p className="text-xs font-medium text-gray-700">
                    Unlimited Documents
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                  <p className="text-xs font-medium text-gray-700">
                    AI Analysis & Priority Support
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <h4 className="text-base font-bold text-gray-900 text-center">
                Select Payment Method
              </h4>

              <div className="space-y-2">
                <MobileBankingButton
                  icon={
                    <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-xs">
                      K
                    </div>
                  }
                  name="KBZPay"
                  color="border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                  deepLink="kbzpay://pay?amount=15000&merchant=DocumentAnalyzer"
                  onClick={() => setPaymentStep("qr")}
                />

                {/* <MobileBankingButton
                  icon={<div className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center text-white font-bold text-xs">W</div>}
                  name="WavePay"
                  color="border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                  deepLink="wavepay://pay?amount=15000&merchant=DocumentAnalyzer"
                  onClick={() => setPaymentStep('qr')}
                />
                
                <MobileBankingButton
                  icon={<div className="w-6 h-6 bg-red-600 rounded-md flex items-center justify-center text-white font-bold text-xs">CB</div>}
                  name="CB Pay"
                  color="border-red-200 hover:border-red-400 hover:bg-red-50"
                  deepLink="cbpay://pay?amount=15000&merchant=DocumentAnalyzer"
                  onClick={() => setPaymentStep('qr')}
                /> */}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentStep("qr")}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-green-300 bg-linear-to-r from-green-50 to-emerald-50 hover:border-green-400 hover:shadow-md transition-all w-full"
                >
                  <div className="w-10 h-10 bg-linear-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 text-sm">
                      MMQR Code
                    </p>
                    <p className="text-xs text-green-700 font-medium">
                      Universal QR Payment
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-semibold">
                      RECOMMENDED
                    </span>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {paymentStep === "qr" && (
          <motion.div
            key="qr"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-4 text-center"
          >
            {/* QR Code Section */}
            <div className="bg-linear-to-br from-gray-50 to-white rounded-2xl p-5 border border-gray-200 shadow-inner">
              <div className="flex justify-center mb-4">
                <AnimatedQRScanner />
              </div>

              <div className="space-y-2 text-center">
                <h4 className="text-lg font-bold text-gray-900">Scan & Pay</h4>
                <p className="text-sm text-gray-600">
                  Open your banking app and scan the QR code above
                </p>

                {/* Merchant Contact Info */}
                <MerchantContactInfo />

                <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-semibold">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  Live Scanning Animation Active
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-blue-900 text-sm">
                      Open your mobile banking app
                    </p>
                    <p className="text-xs text-blue-700">
                      KBZPay, WavePay, CB Pay, or any MMQR compatible app
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-green-900 text-sm">
                      Scan the QR code above
                    </p>
                    <p className="text-xs text-green-700">
                      Amount: 15,000 MMK will be auto-filled
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-amber-900 text-sm">
                      Complete payment & take screenshot
                    </p>
                    <p className="text-xs text-amber-700">
                      We&apos;ll need the transaction receipt for verification
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPaymentStep("upload")}
              className="w-full py-4 bg-linear-to-r from-green-600 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-700 hover:to-emerald-700 shadow-xl shadow-green-200 flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              I&apos;ve Completed Payment - Upload Receipt
            </motion.button>
          </motion.div>
        )}

        {paymentStep === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Upload Section */}
            <div className="text-center mb-4">
              <h4 className="text-lg font-bold text-gray-900 mb-1">
                Upload Transaction Receipt
              </h4>
              <p className="text-sm text-gray-600">
                Upload a clear screenshot of your payment confirmation
              </p>
            </div>

            <div className="space-y-3">
              <label
                className={twMerge(
                  "relative flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                  selectedFile
                    ? "bg-green-50 border-green-300 shadow-md shadow-green-100"
                    : "bg-white border-gray-300 hover:border-green-400 hover:bg-green-50/30",
                )}
              >
                <AnimatePresence mode="wait">
                  {selectedFile ? (
                    <motion.div
                      key="uploaded"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center text-center"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3 shadow-md"
                      >
                        <CheckCircle className="w-6 h-6 text-white" />
                      </motion.div>
                      <span className="text-base font-bold text-gray-900 truncate max-w-[200px]">
                        {selectedFile.name}
                      </span>
                      <span className="text-sm text-green-600 font-medium mt-1">
                        ✓ Receipt uploaded successfully
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        Click to change receipt
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center text-center"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <UploadCloud className="w-6 h-6 text-gray-400" />
                      </div>
                      <span className="text-base font-bold text-gray-700">
                        Click to upload receipt
                      </span>
                      <span className="text-sm text-gray-500 mt-1">
                        PNG, JPG up to 5MB
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onFileChange}
                  disabled={isUploading}
                />
              </label>

              {/* Verification Info */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Automated Verification
                  </p>
                  <p className="text-xs text-blue-700">
                    Our system will automatically verify your payment via
                    Supabase Realtime. You&apos;ll receive instant confirmation
                    once verified (usually within 1-2 minutes).
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="button"
                onClick={onSubmit}
                disabled={isUploading || !selectedFile}
                whileHover={!isUploading && selectedFile ? { scale: 1.02 } : {}}
                whileTap={!isUploading && selectedFile ? { scale: 0.98 } : {}}
                className={twMerge(
                  "w-full py-3 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2",
                  isUploading || !selectedFile
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-linear-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-green-200",
                )}
              >
                {isUploading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Verifying Payment...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify Payment & Activate Pro
                  </>
                )}
              </motion.button>

              {/* Back Button - Only show in upload step */}
              {paymentStep === "upload" && (
                <motion.button
                  type="button"
                  onClick={() => setPaymentStep("qr")}
                  whileHover={{ x: -2 }}
                  className="w-full py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to QR Code
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
