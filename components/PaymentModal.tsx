"use client"

import { useState, useCallback } from "react"
import { Dialog } from "@headlessui/react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowLeft } from "lucide-react"
import { SelectionView, GlobalView, LocalView, CardEntryView, PayPalEntryView, PaymentSuccessView, SupportWidget, type PaymentMethod } from "./PaymentViews"

interface PaymentModalProps {
  children?: React.ReactNode;
}

export default function PaymentModal({ children }: PaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localPaymentStep, setLocalPaymentStep] = useState<'select' | 'qr' | 'upload'>('select')
  const [globalPaymentStep, setGlobalPaymentStep] = useState<'select' | 'card' | 'paypal'>('select')

  const openModal = useCallback(() => setIsOpen(true), [])
  const closeModal = useCallback(() => {
    setIsOpen(false)
    setActiveMethod(null)
    setIsUploading(false)
    setSelectedFile(null)
    setLocalPaymentStep('select')
    setGlobalPaymentStep('select')
  }, [])

  // Handle support chat
  const handleSupportChat = useCallback(() => {
    // For now, show an alert. In production, this would open a chat widget or AI assistant
    alert("Payment Assistant: မင်္ဂလာပါ! ငွေပေးချေမှုနဲ့ ပတ်သက်ပြီး ဘာကူညီပေးရမလဲ? \n\nHello! How can I help you with your payment?")
  }, [])

  // Hierarchical back navigation logic
  const handleBackNavigation = useCallback(() => {
    if (activeMethod === "success") {
      // From success screen, close modal
      closeModal();
      return;
    }
    
    if (activeMethod === "local") {
      if (localPaymentStep === 'select') {
        // If at Myanmar banking selection, go back to main payment selection
        setActiveMethod(null)
        setLocalPaymentStep('select')
      } else {
        // If at QR or Upload step, go back to Myanmar banking selection
        setLocalPaymentStep('select')
      }
    } else if (activeMethod === "global") {
      if (globalPaymentStep === 'select') {
        // If at international payment selection, go back to main payment selection
        setActiveMethod(null)
        setGlobalPaymentStep('select')
      } else {
        // If at card or paypal step, go back to international payment selection
        setGlobalPaymentStep('select')
      }
    } else if (activeMethod === "card" || activeMethod === "paypal") {
      // If at card/paypal details, go back to international payment selection
      setActiveMethod("global")
      setGlobalPaymentStep('select')
    } else {
      // For other payment methods, go back to main selection
      setActiveMethod(null)
    }
  }, [activeMethod, localPaymentStep, globalPaymentStep, closeModal])

  const handleLemonSqueezy = useCallback(async () => {
    console.log("Redirecting to Lemon Squeezy...")
    try {
      const res = await fetch("/api/lemonsqueezy/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        // For demo purposes, show success screen instead of redirect
        // In production, this would redirect to Lemon Squeezy
        // window.location.href = data.url;
        
        // Simulate successful payment after 2 seconds
        setTimeout(() => {
          setActiveMethod("success");
        }, 2000);
      } else {
        throw new Error(data.error || "Failed to get checkout URL");
      }
    } catch (err) {
      console.error(err);
      // For demo, show success even on error
      setTimeout(() => {
        setActiveMethod("success");
      }, 2000);
    }
  }, [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const handleMMQRSubmit = useCallback(async () => {
    if (!selectedFile) {
      alert("Please upload a receipt screenshot")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/payments/local", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        // Show success screen instead of alert
        setActiveMethod("success");
        setIsUploading(false);
        setSelectedFile(null);
      } else {
        throw new Error(data.error || "Submission failed");
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile])

  return (
    <>
      {children ? (
        <div onClick={openModal} className="cursor-pointer">{children}</div>
      ) : (
        <button
          onClick={openModal}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-700 shadow-md"
        >
          Upgrade to Pro
        </button>
      )}

      <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
          aria-hidden="true" 
        />

        <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4">
          <Dialog.Panel 
            as={motion.div}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md max-h-[95vh] sm:max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col relative"
          >
            {/* Header */}
            <motion.div 
              layout
              className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white flex-shrink-0"
            >
              <div className="flex items-center gap-2">
                <AnimatePresence mode="wait">
                  {activeMethod && activeMethod !== "success" && (
                    <motion.button 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      onClick={handleBackNavigation}
                      whileHover={{ x: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 text-gray-600" />
                    </motion.button>
                  )}
                </AnimatePresence>
                <Dialog.Title 
                  as={motion.h2}
                  layout
                  className="text-lg font-bold text-gray-900"
                >
                  {activeMethod === "success" ? "Payment Complete" :
                   activeMethod === "global" ? 
                     (globalPaymentStep === 'select' ? "International Payment" : "Payment Method") :
                   activeMethod === "card" ? "Card Details" :
                   activeMethod === "paypal" ? "PayPal Checkout" :
                   activeMethod === "local" ? 
                     (localPaymentStep === 'select' ? "Myanmar Mobile Banking" :
                      localPaymentStep === 'qr' ? "Scan & Pay" :
                      "Upload Receipt") : 
                   "Upgrade to Pro"}
                </Dialog.Title>
              </div>
              <motion.button 
                onClick={closeModal} 
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className="text-gray-400 hover:text-gray-600 transition p-1.5 hover:bg-gray-100 rounded-full"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </motion.div>

            <motion.div 
              layout
              className="p-4 sm:p-5 bg-gradient-to-br from-white to-gray-50/30 flex-1 overflow-y-auto"
            >
              <AnimatePresence mode="wait">
                {!activeMethod ? (
                  <SelectionView key="selection" onSelect={setActiveMethod} />
                ) : activeMethod === "success" ? (
                  <PaymentSuccessView key="success" onClose={closeModal} />
                ) : activeMethod === "global" ? (
                  <GlobalView 
                    key="global"
                    onProceed={handleLemonSqueezy} 
                    onSelectCard={() => setActiveMethod("card")} 
                    onSelectPayPal={() => setActiveMethod("paypal")}
                    currentStep={globalPaymentStep}
                    onStepChange={setGlobalPaymentStep}
                  />
                ) : activeMethod === "card" ? (
                  <CardEntryView key="card" onProceed={handleLemonSqueezy} />
                ) : activeMethod === "paypal" ? (
                  <PayPalEntryView key="paypal" onProceed={handleLemonSqueezy} />
                ) : (
                  <LocalView
                    key="local"
                    selectedFile={selectedFile}
                    onFileChange={handleFileChange}
                    isUploading={isUploading}
                    onSubmit={handleMMQRSubmit}
                    currentStep={localPaymentStep}
                    onStepChange={setLocalPaymentStep}
                  />
                )}
              </AnimatePresence>
            </motion.div>

            {/* Support Widget - Only show in sub-views, not on main selection */}
            <AnimatePresence>
              {isOpen && activeMethod && activeMethod !== "success" && (
                <SupportWidget onOpenChat={handleSupportChat} />
              )}
            </AnimatePresence>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  )
}
