import { useState, useCallback, useRef } from "react";

export interface QueuedFile {
  id: string;
  file: File;
  documentType: string;
  status: "pending" | "uploading" | "success" | "error" | "cancelled";
  progress: number;
  error?: string;
  retries: number;
  maxRetries: number;
}

interface UseUploadQueueOptions {
  maxConcurrent?: number;
  maxRetries?: number;
}

/**
 * Hook to manage a queue of file uploads with concurrency control and retry logic
 */
export function useUploadQueue(
  uploadFn: (
    file: File,
    documentType: string,
    onProgress: (progress: number) => void,
  ) => Promise<void>,
  options: UseUploadQueueOptions = {},
) {
  const { maxConcurrent = 2, maxRetries = 3 } = options;

  const [queue, setQueue] = useState<Map<string, QueuedFile>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const activeUploads = useRef<Set<string>>(new Set());

  // Add files to the queue
  const addFiles = useCallback(
    (files: File[], documentType: string = "pdf") => {
      const newItems = new Map(queue);
      const addedIds: string[] = [];

      files.forEach((file) => {
        const id = `${file.name}-${Date.now()}-${Math.random()}`;
        newItems.set(id, {
          id,
          file,
          documentType,
          status: "pending",
          progress: 0,
          retries: 0,
          maxRetries,
        });
        addedIds.push(id);
      });

      setQueue(newItems);
      return addedIds;
    },
    [queue, maxRetries],
  );

  // Update file status and progress
  const updateFileStatus = useCallback(
    (id: string, updates: Partial<QueuedFile>) => {
      setQueue((prev) => {
        const newQueue = new Map(prev);
        const item = newQueue.get(id);
        if (item) {
          newQueue.set(id, { ...item, ...updates });
        }
        return newQueue;
      });
    },
    [],
  );

  // Process upload queue with concurrency control
  const processQueue = useCallback(async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    while (true) {
      // Find pending items
      let pendingItem: QueuedFile | null = null;
      let pendingId: string | null = null;

      for (const [id, item] of queue) {
        if (
          item.status === "pending" &&
          activeUploads.current.size < maxConcurrent
        ) {
          pendingItem = item;
          pendingId = id;
          break;
        }
      }

      if (!pendingItem || !pendingId) {
        // Check if all are done
        const allDone = Array.from(queue.values()).every(
          (item) =>
            item.status === "success" ||
            item.status === "error" ||
            item.status === "cancelled",
        );

        if (allDone) {
          setIsProcessing(false);
          return;
        }

        // Wait a bit before checking again
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      // Start upload
      activeUploads.current.add(pendingId);
      updateFileStatus(pendingId, { status: "uploading", progress: 0 });

      try {
        await uploadFn(
          pendingItem.file,
          pendingItem.documentType,
          (progress) => {
            updateFileStatus(pendingId, { progress });
          },
        );

        updateFileStatus(pendingId, { status: "success", progress: 100 });
      } catch (error) {
        const isRetryable = pendingItem.retries < pendingItem.maxRetries;

        if (isRetryable) {
          updateFileStatus(pendingId, {
            status: "pending",
            retries: pendingItem.retries + 1,
            error: error instanceof Error ? error.message : "Upload failed",
          });
        } else {
          updateFileStatus(pendingId, {
            status: "error",
            error: error instanceof Error ? error.message : "Upload failed",
          });
        }
      } finally {
        activeUploads.current.delete(pendingId);
      }
    }
  }, [queue, maxConcurrent, uploadFn, updateFileStatus, isProcessing]);

  // Cancel a file upload
  const cancelFile = useCallback(
    (id: string) => {
      updateFileStatus(id, { status: "cancelled" });
      activeUploads.current.delete(id);
    },
    [updateFileStatus],
  );

  // Cancel all uploads
  const cancelAll = useCallback(() => {
    queue.forEach((item) => {
      if (item.status === "pending" || item.status === "uploading") {
        cancelFile(item.id);
      }
    });
  }, [queue, cancelFile]);

  // Remove completed items from queue
  const clearCompleted = useCallback(() => {
    setQueue((prev) => {
      const newQueue = new Map(prev);
      for (const [id, item] of newQueue) {
        if (
          item.status === "success" ||
          item.status === "error" ||
          item.status === "cancelled"
        ) {
          newQueue.delete(id);
        }
      }
      return newQueue;
    });
  }, []);

  // Get statistics
  const stats = {
    total: queue.size,
    pending: Array.from(queue.values()).filter((i) => i.status === "pending")
      .length,
    uploading: Array.from(queue.values()).filter(
      (i) => i.status === "uploading",
    ).length,
    success: Array.from(queue.values()).filter((i) => i.status === "success")
      .length,
    error: Array.from(queue.values()).filter((i) => i.status === "error")
      .length,
    cancelled: Array.from(queue.values()).filter(
      (i) => i.status === "cancelled",
    ).length,
  };

  return {
    queue: Array.from(queue.values()),
    addFiles,
    processQueue,
    cancelFile,
    cancelAll,
    clearCompleted,
    stats,
    isProcessing,
  };
}
