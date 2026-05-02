"use client"

import { AuditResult } from "@/services/audit"
import { CheckCircle, AlertTriangle, XCircle, Shield, Truck } from "lucide-react"

interface AuditResultsProps {
  audit: AuditResult
}

export default function AuditResults({ audit }: AuditResultsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'non_compliant':
        return <XCircle className="w-6 h-6 text-red-500" />
      case 'requires_review':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'non_compliant':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'requires_review':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        {audit.documentType === 'commercial_invoice' ? (
          <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
        ) : (
          <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 flex-shrink-0" />
        )}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {audit.documentType === 'commercial_invoice' ? 'Commercial Invoice Audit' : 'Service Agreement Audit'}
          </h2>
          <p className="text-sm text-gray-600">
            Multi-Region Audit Engine Results
          </p>
        </div>
      </div>

      {/* Compliance Status */}
      <div className={`p-4 rounded-lg border ${getStatusColor(audit.compliance.status)}`}>
        <div className="flex items-center gap-3">
          {getStatusIcon(audit.compliance.status)}
          <div>
            <h3 className="font-semibold capitalize">
              {audit.compliance.status.replace('_', ' ')}
            </h3>
            <p className="text-sm opacity-90">
              Compliance Score: {audit.compliance.score}/100
            </p>
          </div>
        </div>
      </div>

      {/* Issues */}
      {audit.compliance.issues.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Issues Found
          </h3>
          <ul className="space-y-2">
            {audit.compliance.issues.map((issue, index) => (
              <li key={index} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <span className="text-sm text-red-800">{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {audit.compliance.recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Recommendations
          </h3>
          <ul className="space-y-2">
            {audit.compliance.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm text-green-800">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Logistics Module Results */}
      {audit.logistics && (
        <div className="border-t pt-4 sm:pt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-500" />
            Logistics Module - HS Code Analysis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">HS Codes Found</h4>
              {audit.logistics.hsCodes.found.length > 0 ? (
                <ul className="space-y-1">
                  {audit.logistics.hsCodes.found.map((code, index) => (
                    <li key={index} className="text-sm text-blue-800 font-mono">{code}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-blue-700">No HS codes detected</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${audit.logistics.hsCodes.cbsaCompliant ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">CBSA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${audit.logistics.hsCodes.globalCompliant ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">Global HS Code Compliant</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legal Module Results */}
      {audit.legal && (
        <div className="border-t pt-4 sm:pt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            Legal Module - High-Risk Clauses Analysis
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
            {/* Indemnity */}
            <div className="p-3 sm:p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Indemnity Clauses</h4>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${audit.legal.highRiskClauses.indemnity.found ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <span className="text-sm capitalize">{audit.legal.highRiskClauses.indemnity.found ? 'Found' : 'Not Found'}</span>
              </div>
              {audit.legal.highRiskClauses.indemnity.found && (
                <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(audit.legal.highRiskClauses.indemnity.severity)}`}>
                  {audit.legal.highRiskClauses.indemnity.severity.toUpperCase()} RISK
                </span>
              )}
            </div>

            {/* Liability */}
            <div className="p-3 sm:p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Liability Clauses</h4>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${audit.legal.highRiskClauses.liability.found ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <span className="text-sm capitalize">{audit.legal.highRiskClauses.liability.found ? 'Found' : 'Not Found'}</span>
              </div>
              {audit.legal.highRiskClauses.liability.found && (
                <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(audit.legal.highRiskClauses.liability.severity)}`}>
                  {audit.legal.highRiskClauses.liability.severity.toUpperCase()} RISK
                </span>
              )}
            </div>

            {/* Termination */}
            <div className="p-3 sm:p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Termination Clauses</h4>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${audit.legal.highRiskClauses.termination.found ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <span className="text-sm capitalize">{audit.legal.highRiskClauses.termination.found ? 'Found' : 'Not Found'}</span>
              </div>
              {audit.legal.highRiskClauses.termination.found && (
                <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(audit.legal.highRiskClauses.termination.severity)}`}>
                  {audit.legal.highRiskClauses.termination.severity.toUpperCase()} RISK
                </span>
              )}
            </div>
          </div>

          {/* Standards Compliance */}
          <div className="p-3 sm:p-4 bg-gray-50 border rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Standards Compliance</h4>
            <div className="flex flex-wrap gap-3 sm:gap-6">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${audit.legal.standards.northAmerican ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">North American Standards</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${audit.legal.standards.uk ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">UK Standards</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}