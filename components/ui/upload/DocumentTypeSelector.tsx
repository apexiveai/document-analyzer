"use client";

import { Shield, Truck } from "lucide-react";

interface DocumentTypeSelectorProps {
  value: "commercial_invoice" | "service_agreement";
  onChange: (type: "commercial_invoice" | "service_agreement") => void;
  disabled?: boolean;
}

export function DocumentTypeSelector({
  value,
  onChange,
  disabled,
}: DocumentTypeSelectorProps) {
  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Document Type</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all disabled:opacity-50">
          <input
            type="radio"
            name="documentType"
            value="commercial_invoice"
            checked={value === "commercial_invoice"}
            onChange={(e) => onChange(e.target.value as "commercial_invoice")}
            disabled={disabled}
            className="text-purple-600 focus:ring-purple-500 w-4 h-4"
          />
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">
                Commercial Invoice
              </span>
              <span className="text-[10px] text-gray-500">
                (HS Code Validation)
              </span>
            </div>
          </div>
        </label>
        <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all disabled:opacity-50">
          <input
            type="radio"
            name="documentType"
            value="service_agreement"
            checked={value === "service_agreement"}
            onChange={(e) => onChange(e.target.value as "service_agreement")}
            disabled={disabled}
            className="text-purple-600 focus:ring-purple-500 w-4 h-4"
          />
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">
                Service Agreement
              </span>
              <span className="text-[10px] text-gray-500">
                (Legal Risk Assessment)
              </span>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
