"use client";

import React, { useState } from "react";
import type { PracticeLog, SavedRecording } from "@/lib/types";

type PracticeLogListProps = {
    logs: PracticeLog[];
    recordings: SavedRecording[];
    onRecordingClick?: (recording: SavedRecording) => void;
};

export function PracticeLogList({ logs, recordings, onRecordingClick }: PracticeLogListProps) {
    const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

    const getRecordingsForLog = (logId: number) => {
        return recordings.filter((rec) => rec.log_id === logId);
    };

    return (
        <section className="rounded-2xl border border-(--surface-border) bg-(--surface-solid) p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="mb-4 text-sm font-semibold text-(--muted)">Practice history</h2>

            {logs.length === 0 ? (
                <p className="text-sm text-(--muted)">No practice logs yet.</p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {logs.map((log) => {
                        const logRecordings = getRecordingsForLog(log.id);
                        const isExpanded = expandedLogId === log.id;

                        return (
                            <li
                                key={log.id}
                                className="rounded-xl bg-black/[0.02] p-3 dark:bg-white/5"
                            >
                                <button
                                    onClick={() =>
                                        setExpandedLogId(isExpanded ? null : log.id)
                                    }
                                    className="w-full text-left hover:opacity-80 transition-opacity"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex min-w-0 flex-col flex-1">
                                            <span className="truncate text-sm font-medium">
                                                {log.song_title}
                                            </span>
                                            <span className="truncate text-xs text-(--muted)">
                                                {log.artist}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="rounded-full bg-(--accent)/10 px-2.5 py-1 text-xs font-medium text-(--accent)">
                                                {log.duration_minutes} min
                                            </span>
                                            {logRecordings.length > 0 && (
                                                <span className="rounded-full bg-(--success)/10 px-2.5 py-1 text-xs font-medium text-(--success)">
                                                    {logRecordings.length} rec
                                                </span>
                                            )}
                                            {isExpanded && (
                                                <svg
                                                    className="w-4 h-4 text-(--muted)"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </button>
                                <p className="mt-2 text-xs text-(--muted)">
                                    {new Date(log.created_at).toLocaleString()}
                                </p>

                                {isExpanded && logRecordings.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-(--surface-border) space-y-2">
                                        <p className="text-xs font-medium text-(--muted)">
                                            Recordings:
                                        </p>
                                        {logRecordings.map((rec) => (
                                            <button
                                                key={rec.id}
                                                onClick={() => onRecordingClick?.(rec)}
                                                className="w-full text-left p-2 rounded-lg bg-black/[0.05] hover:bg-black/[0.1] dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium truncate">
                                                            {new Date(
                                                                rec.created_at
                                                            ).toLocaleTimeString()}
                                                        </p>
                                                        <p className="text-xs text-(--muted)">
                                                            {rec.duration_seconds}s recording
                                                        </p>
                                                    </div>
                                                    {rec.analysis && (
                                                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-(--success)/10 text-(--success)">
                                                            analyzed
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
