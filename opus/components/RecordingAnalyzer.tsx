"use client";

import React, { useRef, useState, useEffect } from "react";
import type { RecordingAnalysis, RecordingStatus, SavedRecording } from "@/lib/types";

// Below this, audio is treated as silence/room noise rather than an instrument playing.
// RMS is computed on a 0-1 normalized scale from time-domain samples; raise it to require louder playing.
const SILENCE_RMS_THRESHOLD = 0.05;
const MIN_RECORDING_MS = 1500;

type RecordingAnalyzerProps = {
    songId: number;
    songTitle: string;
    artist: string;
    idToken: string;
    onAnalysisComplete: (analysis: RecordingAnalysis) => void;
    savedRecording?: SavedRecording | null;
};

export function RecordingAnalyzer({
    songId,
    songTitle,
    artist,
    idToken,
    onAnalysisComplete,
    savedRecording,
}: RecordingAnalyzerProps) {
    const [status, setStatus] = useState<RecordingStatus>("idle");
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<RecordingAnalysis | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const recordedBlobRef = useRef<Blob | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const levelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // -1 means level monitoring never started (e.g. AudioContext unavailable) - don't gate on it then.
    const peakLevelRef = useRef(-1);
    const recordingStartedAtRef = useRef(0);

    useEffect(() => {
        if (savedRecording) {
            setAnalysis(savedRecording.analysis);
            onAnalysisComplete(savedRecording.analysis);
            setStatus("done");
        }
    }, [savedRecording, onAnalysisComplete]);

    function stopLevelMonitoring() {
        if (levelIntervalRef.current) {
            clearInterval(levelIntervalRef.current);
            levelIntervalRef.current = null;
        }
        void audioContextRef.current?.close();
        audioContextRef.current = null;
    }

    function startLevelMonitoring(stream: MediaStream) {
        try {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            source.connect(analyser);
            audioContextRef.current = audioContext;
            peakLevelRef.current = 0;

            const samples = new Uint8Array(analyser.fftSize);
            levelIntervalRef.current = setInterval(() => {
                analyser.getByteTimeDomainData(samples);
                let sumSquares = 0;
                for (let i = 0; i < samples.length; i++) {
                    const normalized = (samples[i] - 128) / 128;
                    sumSquares += normalized * normalized;
                }
                const rms = Math.sqrt(sumSquares / samples.length);
                if (rms > peakLevelRef.current) {
                    peakLevelRef.current = rms;
                }
            }, 100);
        } catch {
            // Level monitoring is a best-effort safety check; recording still works without it.
            peakLevelRef.current = -1;
        }
    }

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
            recordingStartedAtRef.current = Date.now();
            startLevelMonitoring(stream);

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const recordingDurationMs = Date.now() - recordingStartedAtRef.current;
                const peakLevel = peakLevelRef.current;
                stopLevelMonitoring();

                if (recordingDurationMs < MIN_RECORDING_MS) {
                    setError("That recording was too short. Record for a few seconds and try again.");
                    setStatus("error");
                    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
                    mediaStreamRef.current = null;
                    return;
                }

                if (peakLevel >= 0 && peakLevel < SILENCE_RMS_THRESHOLD) {
                    setError("We didn't detect any playing. Make sure your microphone is audible and try again.");
                    setStatus("error");
                    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
                    mediaStreamRef.current = null;
                    return;
                }

                // Create audio URL for playback
                const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                
                // Store blob for later analysis using ref (safer than mediaRecorderRef)
                recordedBlobRef.current = audioBlob;
                
                setStatus("idle");
                mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
                mediaStreamRef.current = null;
            };

            mediaRecorder.start();
            setStatus("recording");
        } catch (error) {
            stopLevelMonitoring();
            setError(error instanceof Error ? error.message : "Microphone access failed");
            setStatus("error");
        }
    }

    function stopRecording() {
        mediaRecorderRef.current?.stop();
        mediaRecorderRef.current = null;
    }

    async function analyzeRecording() {
        if (!audioUrl || !recordedBlobRef.current) {
            setError("No recording to analyze");
            return;
        }

        try {
            setStatus("processing");
            setError(null);

            const audioBlob = recordedBlobRef.current;
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
        }
    }

    const statusLabel: Record<RecordingStatus, string> = {
        idle: "Ready",
        recording: "Recording…",
        processing: "Analyzing…",
        done: "Complete",
        error: "Error",
    };

    return (
        <div
            className="rounded-xl bg-black/[0.02] p-4 dark:bg-white/5"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        void startRecording();
                    }}
                    disabled={status === "recording" || status === "processing" || !idToken}
                    className="flex items-center gap-2 rounded-full bg-(--accent) px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-(--accent-hover) disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                        <circle cx="12" cy="12" r="8" />
                    </svg>
                    Record
                </button>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        stopRecording();
                    }}
                    disabled={status !== "recording"}
                    className="flex items-center gap-2 rounded-full bg-(--danger) px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-(--danger-hover) disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                        <rect x="5" y="5" width="14" height="14" rx="2" />
                    </svg>
                    Stop
                </button>

                <span className="flex items-center gap-2 text-sm text-(--muted)">
                    {status === "recording" && (
                        <span className="recording-pulse h-2 w-2 rounded-full bg-(--danger)" />
                    )}
                    {statusLabel[status]}
                </span>
            </div>

            {error ? <p className="mt-3 text-sm text-(--danger)">{error}</p> : null}

            {audioUrl && !analysis && (
                <div className="mt-4 p-4 rounded-lg bg-black/[0.02] dark:bg-white/5">
                    <h3 className="text-sm font-semibold mb-3">Review Your Recording</h3>
                    <audio
                        ref={audioPlayerRef}
                        src={audioUrl}
                        controls
                        className="w-full mb-3"
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                void analyzeRecording();
                            }}
                            disabled={status === "processing"}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-(--accent) px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-(--accent-hover) disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                            </svg>
                            Analyze
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setAudioUrl(null);
                                setError(null);
                                recordedBlobRef.current = null;
                            }}
                            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-(--muted) hover:bg-black/[0.05] dark:hover:bg-white/5 transition-colors"
                        >
                            Discard
                        </button>
                    </div>
                </div>
            )}

            {audioUrl && analysis && (
                <div className="mt-4 p-4 rounded-lg bg-black/[0.02] dark:bg-white/5">
                    <h3 className="text-sm font-semibold mb-3">Recording Playback</h3>
                    <audio
                        ref={audioPlayerRef}
                        src={audioUrl}
                        controls
                        className="w-full mb-3"
                    />
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setAudioUrl(null);
                            setAnalysis(null);
                            setError(null);
                            recordedBlobRef.current = null;
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-(--muted) hover:bg-black/[0.05] dark:hover:bg-white/5 transition-colors"
                    >
                        Clear Recording
                    </button>
                </div>
            )}

            {analysis && analysis.matches_expected_song === false ? (
                <div className="mt-4 rounded-xl border border-(--danger)/30 bg-(--danger)/10 p-4">
                    <h3 className="text-sm font-semibold text-(--danger)">Wrong piece detected</h3>
                    <p className="mt-1 text-sm text-(--muted)">
                        This recording doesn&apos;t sound like &ldquo;{songTitle}&rdquo; by {artist}
                        {analysis.mismatch_reason ? ` — ${analysis.mismatch_reason}` : ""}. Record
                        yourself playing this piece to get feedback.
                    </p>
                </div>
            ) : null}

            {analysis && analysis.matches_expected_song !== false ? (
                <div className="mt-4 flex flex-col gap-4 border-t border-(--surface-border) pt-4">
                    <div>
                        <h3 className="text-sm font-semibold">Summary</h3>
                        <p className="mt-1 text-sm text-(--muted)">{analysis.feedback_summary}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold">Transcript</h3>
                        <p className="mt-1 text-sm text-(--muted)">{analysis.transcript}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <h3 className="text-sm font-semibold text-(--success)">Strengths</h3>
                            <ul className="mt-1 list-disc pl-5 text-sm text-(--muted)">
                                {analysis.strengths.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-(--danger)">Weaknesses</h3>
                            <ul className="mt-1 list-disc pl-5 text-sm text-(--muted)">
                                {analysis.weaknesses.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold">Action items</h3>
                        <ul className="mt-1 list-disc pl-5 text-sm text-(--muted)">
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