"use client";

import { useMemo } from "react";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  HardDrive,
  TrendingUp,
} from "lucide-react";
import { useUploadHistory } from "@/hooks/useUploadHistory";

export function UploadHistory() {
  const { history, isLoading, getSuccessRate, getTotalSize, clearHistory } =
    useUploadHistory();

  const stats = useMemo(() => {
    return {
      successRate: getSuccessRate(),
      totalSize: getTotalSize(),
      successCount: history.filter((i) => i.status === "success").length,
      errorCount: history.filter((i) => i.status === "error").length,
    };
  }, [history, getSuccessRate, getTotalSize]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-500">Loading upload history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6 text-center">
        <p className="text-gray-500">No upload history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.successRate}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Uploaded</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatBytes(stats.totalSize)}
              </p>
            </div>
            <HardDrive className="w-8 h-8 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.successCount}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.errorCount}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Upload History Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Recent Uploads</h3>
          <button
            onClick={clearHistory}
            className="text-xs px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            Clear History
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  File
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr
                  key={item.id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.fileName}
                    </p>
                    {item.error && (
                      <p className="text-xs text-red-600 mt-1">{item.error}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatBytes(item.fileSize)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.status === "success" && (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">
                            Success
                          </span>
                        </>
                      )}
                      {item.status === "error" && (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-600 font-medium">
                            Failed
                          </span>
                        </>
                      )}
                      {item.status === "cancelled" && (
                        <>
                          <XCircle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-yellow-600 font-medium">
                            Cancelled
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(item.uploadedAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.uploadDurationMs
                      ? `${(item.uploadDurationMs / 1000).toFixed(1)}s`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
