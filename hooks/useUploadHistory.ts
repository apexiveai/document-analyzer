import { useState, useCallback, useEffect } from "react";

export interface UploadHistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  documentType: string;
  status: "success" | "error" | "cancelled";
  uploadedAt: string;
  uploadDurationMs?: number;
  error?: string;
  auditStatus?: "pending" | "processing" | "completed" | "failed";
}

const STORAGE_KEY = "document_analyzer_upload_history";
const MAX_HISTORY_ITEMS = 50;

/**
 * Hook to manage upload history with localStorage persistence
 */
export function useUploadHistory() {
  const [history, setHistory] = useState<UploadHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UploadHistoryItem[];
        setHistory(parsed);
      }
    } catch (error) {
      console.error("Failed to load upload history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save history to localStorage
  const saveToStorage = useCallback((items: UploadHistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save upload history:", error);
    }
  }, []);

  // Add item to history
  const addItem = useCallback(
    (item: Omit<UploadHistoryItem, "id" | "uploadedAt">) => {
      const newItem: UploadHistoryItem = {
        ...item,
        id: `${Date.now()}-${Math.random()}`,
        uploadedAt: new Date().toISOString(),
      };

      const updated = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
      setHistory(updated);
      saveToStorage(updated);

      return newItem;
    },
    [history, saveToStorage],
  );

  // Update item in history
  const updateItem = useCallback(
    (id: string, updates: Partial<UploadHistoryItem>) => {
      const updated = history.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      );
      setHistory(updated);
      saveToStorage(updated);
    },
    [history, saveToStorage],
  );

  // Remove item from history
  const removeItem = useCallback(
    (id: string) => {
      const updated = history.filter((item) => item.id !== id);
      setHistory(updated);
      saveToStorage(updated);
    },
    [history, saveToStorage],
  );

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get success rate
  const getSuccessRate = useCallback(() => {
    if (history.length === 0) return 0;
    const successCount = history.filter((i) => i.status === "success").length;
    return Math.round((successCount / history.length) * 100);
  }, [history]);

  // Get total uploaded size
  const getTotalSize = useCallback(() => {
    return history.reduce((sum, item) => sum + item.fileSize, 0);
  }, [history]);

  // Get history by status
  const getByStatus = useCallback(
    (status: UploadHistoryItem["status"]) => {
      return history.filter((item) => item.status === status);
    },
    [history],
  );

  // Get recent uploads (last N items)
  const getRecent = useCallback(
    (count: number = 10) => {
      return history.slice(0, count);
    },
    [history],
  );

  return {
    history,
    isLoading,
    addItem,
    updateItem,
    removeItem,
    clearHistory,
    getSuccessRate,
    getTotalSize,
    getByStatus,
    getRecent,
  };
}
