import React from "react"
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
  Banknote,
  ArrowLeft
} from "lucide-react"
import { twMerge } from "tailwind-merge"

export type PaymentMethod = "global" | "local" | "card" | "paypal" | null;

interface SelectionViewProps {
  onSelect: (method: PaymentMethod) => void;
}

/**
 * SelectionView: Initial screen to choose payment method
 */
export const SelectionView: React.FC<SelectionViewProps> = ({ onSelect }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black text-gray-900 mb-2">Choose your way to pay</h3>
        <p className="text-gray-500">Get unlimited analysis, priority support, and more.</p>
      </div>

      <div className="grid gap-4">
        <button
          type="button"
          title="Pay with Visa, Mastercard or PayPal" // Fix: Added title to override hover error
          onClick={() => onSelect("global")}
          className="group flex items-center justify-between p-5 rounded-2xl border-2 border-gray-100 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all text-left w-full"
        >
          <div className="flex items-center gap-4 pointer-events-none">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
              <Globe className="w-7 h-7 text-indigo-600 group-hover:text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Cards / PayPal</p>
              <p className="text-sm text-gray-500">Visa, Mastercard, Global Payment</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 pointer-events-none" />
        </button>

        <button
          type="button"
          title="Pay with KBZPay, WaveMoney or MMQR" // Fix: Added title to override hover error
          onClick={() => onSelect("local")}
          className="group flex items-center justify-between p-5 rounded-2xl border-2 border-gray-100 hover:border-green-500 hover:bg-green-50/30 transition-all text-left w-full"
        >
          <div className="flex items-center gap-4 pointer-events-none">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-green-600 transition-colors">
              <Smartphone className="w-7 h-7 text-green-600 group-hover:text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Local Mobile Banking</p>
              <p className="text-sm text-gray-500">KBZPay, WaveMoney, MMQR</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 pointer-events-none" />
        </button>
      </div>
      
      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
        <ShieldCheck className="w-4 h-4" />
        SECURE 256-BIT ENCRYPTED PAYMENT
      </div>
    </div>
  );
};

interface GlobalViewProps {
  onProceed: () => void;
  onSelectCard: () => void;
  onSelectPayPal: () => void;
}

/**
 * GlobalView: View for international payments
 */
export const GlobalView: React.FC<GlobalViewProps> = ({ onProceed, onSelectCard, onSelectPayPal }) => {
  return (
    <div className="space-y-8">
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Pro Plan</span>
          <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
        </div>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-4xl font-black text-gray-900">$19</span>
          <span className="text-gray-500">/month</span>
        </div>
        <ul className="space-y-3">
          {["Unlimited Documents", "Deep AI Analysis", "Priority Support"].map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm font-bold text-gray-700 mb-4 text-center">Select Payment Type</p>
          <div className="flex justify-center gap-4">
            <button 
              type="button"
              title="Pay with Credit/Debit Card" // Fix: Added title
              onClick={onSelectCard}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group"
            >
              <CreditCard className="w-10 h-10 text-indigo-600" />
              <div className="flex gap-1">
                <span className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[8px] font-black text-blue-700 group-hover:bg-white">VISA</span>
                <span className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[8px] font-black text-red-600 group-hover:bg-white">MASTER</span>
              </div>
            </button>
            
            <button 
              type="button"
              title="Pay with PayPal" // Fix: Added title
              onClick={onSelectPayPal}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black italic">P</div>
              <span className="text-[10px] font-bold text-blue-600">PayPal</span>
            </button>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-400">Secure global payment powered by Lemon Squeezy</p>
      </div>
    </div>
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
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Card Payment</p>
            <p className="text-[10px] text-gray-500">Secure 256-bit encryption</p>
          </div>
        </div>
        <div className="flex gap-1">
          <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-black text-blue-700">VISA</span>
          <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-black text-red-600">MASTER</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Card Number</label>
          <input
            type="text"
            placeholder="0000 0000 0000 0000"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Expiry Date</label>
            <input
              type="text"
              placeholder="MM/YY"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">CVV</label>
            <input
              type="password"
              placeholder="123"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono"
            />
          </div>
        </div>

        <button
          type="button"
          title="Proceed to Lemon Squeezy"
          onClick={onProceed}
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-200 mt-4"
        >
          Proceed to Checkout
        </button>
        <p className="text-center text-xs text-gray-400 italic">You will be redirected to Lemon Squeezy to complete payment</p>
      </div>
    </div>
  );
};

interface PayPalEntryViewProps {
  onProceed: () => void;
}

/**
 * PayPalEntryView: UI for PayPal details before redirect
 */
export const PayPalEntryView: React.FC<PayPalEntryViewProps> = ({ onProceed }) => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
            <div className="text-white font-black italic text-xl">P</div>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">PayPal Payment</p>
            <p className="text-[10px] text-gray-500">Fast and secure checkout</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-white border border-blue-200 rounded-lg text-[10px] font-bold text-blue-600">
          Official Partner
        </div>
      </div>

      <div className="space-y-6 text-center py-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
            <Globe className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-1">Pay with PayPal</h4>
          <p className="text-sm text-gray-500 px-4">
            You will be redirected to PayPal's secure portal to complete your transaction via Lemon Squeezy.
          </p>
        </div>

        <button
          type="button"
          title="Proceed to PayPal"
          onClick={onProceed}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-xl shadow-blue-200 mt-4"
        >
          Continue to PayPal
        </button>
        <p className="text-center text-xs text-gray-400 italic">No account required for guest checkout</p>
      </div>
    </div>
  );
};

interface LocalViewProps {
  selectedFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

/**
 * LocalView: View for local payments with MMQR receipt upload
 */
export const LocalView: React.FC<LocalViewProps> = ({
  selectedFile,
  onFileChange,
  isUploading,
  onSubmit,
  onBack
}) => {
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Payment Options
      </button>

      <div className="flex flex-col items-center bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <div className="w-40 h-40 bg-white p-3 rounded-2xl shadow-inner mb-4 flex items-center justify-center">
          <QrCode className="w-32 h-32 text-gray-900" />
        </div>
        <p className="text-sm font-bold text-gray-900">Scan QR with KBZPay / Wave</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Upload Receipt</label>
          <label className={twMerge(
            "relative flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all",
            selectedFile ? "bg-green-50 border-green-300" : "bg-white border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30"
          )}>
            {selectedFile ? (
              <div className="flex flex-col items-center text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
                <span className="text-sm font-bold text-gray-700 truncate max-w-[200px]">{selectedFile.name}</span>
                <span className="text-xs text-indigo-600 font-medium mt-1">Change receipt</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <UploadCloud className="w-10 h-10 text-indigo-500 mb-2" />
                <span className="text-sm font-bold text-gray-700">Click to upload receipt</span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
              </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={onFileChange} disabled={isUploading} />
          </label>
        </div>

        <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100 mb-2">
          <Banknote className="w-6 h-6 text-amber-600 mt-0.5" />
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> Verification takes 1-2 hours. Please ensure the screenshot is clear.
          </p>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isUploading || !selectedFile}
          className="w-full py-4 bg-green-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-bold rounded-2xl hover:bg-green-700 active:scale-[0.98] transition-all shadow-xl shadow-green-200"
        >
          {isUploading ? "Submitting..." : "Verify Payment"}
        </button>
      </div>
    </div>
  );
};