"use client"

import { useState, useCallback } from "react"
import { Dialog } from "@headlessui/react"
import { X, ArrowLeft } from "lucide-react"
import { SelectionView, GlobalView, LocalView, CardEntryView, PayPalEntryView, type PaymentMethod } from "./PaymentViews"

interface PaymentModalProps {
  children?: React.ReactNode;
}

export default function PaymentModal({ children }: PaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const openModal = useCallback(() => setIsOpen(true), [])
  const closeModal = useCallback(() => {
    setIsOpen(false)
    setActiveMethod(null)
    setIsUploading(false)
    setSelectedFile(null)
  }, [])

  const handleLemonSqueezy = useCallback(async () => {
    console.log("Redirecting to Lemon Squeezy...")
    try {
      const res = await fetch("/api/lemonsqueezy/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to get checkout URL");
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Payment failed");
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
        alert("Payment submitted successfully! Verification in progress.");
        closeModal();
      } else {
        throw new Error(data.error || "Submission failed");
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, closeModal])

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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                {activeMethod && (
                  <button 
                    onClick={() => setActiveMethod(null)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors mr-1"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                <Dialog.Title className="text-xl font-bold text-gray-900">
                  {activeMethod === "global" ? "Select Payment Type" : 
                   activeMethod === "card" ? "Card Details" :
                   activeMethod === "paypal" ? "PayPal Checkout" :
                   activeMethod === "local" ? "Local Bank Transfer" : 
                   "Upgrade to Pro"}
                </Dialog.Title>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8">
              {!activeMethod ? (
                <SelectionView onSelect={setActiveMethod} />
              ) : activeMethod === "global" ? (
                <GlobalView 
                  onProceed={handleLemonSqueezy} 
                  onSelectCard={() => setActiveMethod("card")} 
                  onSelectPayPal={() => setActiveMethod("paypal")} 
                />
              ) : activeMethod === "card" ? (
                <CardEntryView onProceed={handleLemonSqueezy} />
              ) : activeMethod === "paypal" ? (
                <PayPalEntryView onProceed={handleLemonSqueezy} />
              ) : (
                <LocalView
                  selectedFile={selectedFile}
                  onFileChange={handleFileChange}
                  isUploading={isUploading}
                  onSubmit={handleMMQRSubmit}
                  onBack={() => setActiveMethod(null)}
                />
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  )
}
