"use client";

import React, { useRef, useState } from "react";
import type { RecordingAnalysis, RecordingStatus } from "@/lib/types";

type RecordingAnalyzerProps = {
    songId: number;
    idToken: string;
    onAnalysisComplete: (analysis: RecordingAnalysis) => void;
};

export function RecordingAnalyzer({
    songId,
    idToken,
    onAnalysisComplete,
}: RecordingAnalyzerProps) {
    const [status, setStatus] = useState<RecordingStatus>("idle");
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<RecordingAnalysis | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    async function startRecording() {
        setError(null);
        setAnalysis(null);

        if (!idToken) {
            setError("Authentication is still loading. Try again in a moment.");
            setStatus("error");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            chunksRef.current = [];

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                try {
                    setStatus("processing");

                    const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
                    console.debug("Sending /api/analyze request", {
                        songId,
                        hasIdToken: Boolean(idToken),
                        audioBytes: audioBlob.size,
                    });
                    const formData = new FormData();
                    formData.append("idToken", idToken);
                    formData.append("songId", String(songId));
                    formData.append("audio", audioBlob, "recording.webm");

                    const response = await fetch("/api/analyze", {
                        method: "POST",
                        body: formData,
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error ?? "Failed to analyze recording");
                    }

                    setAnalysis(data.analysis);
                    onAnalysisComplete(data.analysis);
                    setStatus("done");
                } catch (error) {
                    setError(error instanceof Error ? error.message : "Analysis failed");
                    setStatus("error");
                } finally {
                    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
                    mediaStreamRef.current = null;
                }
            };

            mediaRecorder.start();
            setStatus("recording");
        } catch (error) {
            setError(error instanceof Error ? error.message : "Microphone access failed");
            setStatus("error");
        }
    }

    function stopRecording() {
        mediaRecorderRef.current?.stop();
        mediaRecorderRef.current = null;
    }

    return (
        <div className="mt-4 rounded border border-gray-700 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        void startRecording();
                    }}
                    disabled={status === "recording" || status === "processing" || !idToken}
                    className="px-4 py-2 rounded bg-blue-500 text-white disabled:opacity-50"
                >
                    Record
                </button>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        stopRecording();
                    }}
                    disabled={status !== "recording"}
                    className="px-4 py-2 rounded bg-red-500 text-white disabled:opacity-50"
                >
                    Stop
                </button>
            </div>

            <p className="mt-3 text-sm text-gray-300">Status: {status}</p>

            {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}

            {analysis ? (
                <div className="mt-4 space-y-3">
                    <div>
                        <h3 className="font-semibold">Summary</h3>
                        <p className="text-sm text-gray-300">{analysis.feedback_summary}</p>
                    </div>

                    <div>
                        <h3 className="font-semibold">Transcript</h3>
                        <p className="text-sm text-gray-300">{analysis.transcript}</p>
                    </div>

                    <div>
                        <h3 className="font-semibold">Strengths</h3>
                        <ul className="list-disc pl-5 text-sm text-gray-300">
                            {analysis.strengths.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold">Weaknesses</h3>
                        <ul className="list-disc pl-5 text-sm text-gray-300">
                            {analysis.weaknesses.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold">Action Items</h3>
                        <ul className="list-disc pl-5 text-sm text-gray-300">
                            {analysis.action_items.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : null}
        </div>
    );
}