"use client";

import { useCallback, useState } from "react";
import type { PracticeLog } from "@/lib/types";

export default function useLogs() {
  const [logs, setLogs] = useState<PracticeLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  const refreshLogs = useCallback(async (idToken: string) => {
    if (!idToken || typeof idToken !== "string" || idToken.trim() === "") {
      setLogs([]);
      return;
    }

    setLoadingLogs(true);
    setLogsError(null);

    try {
      const response = await fetch("/api/logs", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // If 401, likely not authenticated - silently return empty
        if (response.status === 401) {
          console.debug("User not authenticated, skipping logs fetch");
          setLogs([]);
          return;
        }
        
        throw new Error(data.error ?? "Failed to load logs");
      }

      setLogs(data.logs ?? []);
    } catch (error) {
      setLogsError(error instanceof Error ? error.message : "Failed to load logs");
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const addLog = useCallback(async (idToken: string, songId: number, durationMinutes: number) => {
    const response = await fetch("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken,
        songId,
        durationMinutes,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to add log");
    }

    await refreshLogs(idToken);
  }, [refreshLogs]);

  return {
    logs,
    loadingLogs,
    logsError,
    refreshLogs,
    addLog,
  };
}