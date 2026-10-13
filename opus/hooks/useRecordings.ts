import { useState, useCallback } from "react";
import type { SavedRecording } from "@/lib/types";

export function useRecordings() {
    const [recordings, setRecordings] = useState<SavedRecording[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshRecordings = useCallback(async (idToken: string) => {
        if (!idToken || typeof idToken !== "string" || idToken.trim() === "") {
            setRecordings([]);
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/recordings", {
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMsg = errorData.error || "Failed to fetch recordings";
                
                // If table doesn't exist, silently fail (will be created after schema setup)
                if (response.status === 500 && errorMsg.includes("table")) {
                    console.warn("Recordings table not yet created:", errorMsg);
                    setRecordings([]);
                    return;
                }
                
                // If 401, likely not authenticated - silently return empty
                if (response.status === 401) {
                    console.debug("User not authenticated, skipping recordings fetch");
                    setRecordings([]);
                    return;
                }
                
                throw new Error(errorMsg);
            }

            const data = await response.json();
            setRecordings(data.recordings || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
            console.error("Failed to fetch recordings:", message);
        } finally {
            setLoading(false);
        }
    }, []);

    const downloadRecording = useCallback(
        async (idToken: string, recordingId: number) => {
            if (!idToken) return null;
            try {
                const response = await fetch("/api/recordings", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ idToken, recordingId }),
                });

                if (!response.ok) {
                    throw new Error("Failed to download recording");
                }

                return await response.blob();
            } catch (err) {
                const message = err instanceof Error ? err.message : "Unknown error";
                console.error(message);
                return null;
            }
        },
        []
    );

    return {
        recordings,
        loading,
        error,
        refreshRecordings,
        downloadRecording,
    };
}
