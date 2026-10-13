"use client";

import React, { useState } from "react";
import type { SavedRecording } from "@/lib/types";

type RecordingsListProps = {
    recordings: SavedRecording[];
    onRecordingClick?: (recording: SavedRecording) => void;
};

export function RecordingsList({ recordings, onRecordingClick }: RecordingsListProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    return (
        <section className="rounded-2xl border border-(--surface-border) bg-(--surface-solid) p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-(--muted)">Saved Recordings</h2>

            {recordings.length === 0 ? (
                <p className="text-sm text-(--muted)">No saved recordings yet.</p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {recordings.map((recording) => {
                        const isExpanded = expandedId === recording.id;
                        return (
                            <li
                                key={recording.id}
                                className="rounded-xl border border-(--surface-border) bg-black/[0.02] dark:bg-white/5"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setExpandedId(
                                            isExpanded ? null : recording.id
                                        )
                                    }
                                    className="w-full p-3 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/10"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex min-w-0 flex-col">
                                            <span className="truncate text-sm font-medium">
                                                {recording.song_title}
                                            </span>
                                            <span className="truncate text-xs text-(--muted)">
                                                {recording.artist}
                                            </span>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-2">
                                            <span className="rounded-full bg-(--accent)/10 px-2.5 py-1 text-xs font-medium text-(--accent)">
                                                {Math.round(
                                                    recording.duration_seconds / 60
                                                )}{" "}
                                                min
                                            </span>
                                            <svg
                                                className={`h-4 w-4 transition-transform ${
                                                    isExpanded ? "rotate-180" : ""
                                                }`}
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                            >
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-xs text-(--muted)">
                                        {new Date(
                                            recording.created_at
                                        ).toLocaleString()}
                                    </p>
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-(--surface-border) p-4 text-sm">
                                        {recording.analysis.matches_expected_song ===
                                        false ? (
                                            <div className="rounded-lg border border-(--danger)/30 bg-(--danger)/10 p-3 mb-4">
                                                <h4 className="font-semibold text-(--danger)">
                                                    Wrong piece detected
                                                </h4>
                                                <p className="mt-1 text-(--muted)">
                                                    {recording.analysis
                                                        .mismatch_reason ||
                                                        "This recording doesn't match the expected piece."}
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="mb-4">
                                                    <h4 className="font-semibold mb-1">
                                                        Summary
                                                    </h4>
                                                    <p className="text-(--muted)">
                                                        {
                                                            recording.analysis
                                                                .feedback_summary
                                                        }
                                                    </p>
                                                </div>

                                                {recording.analysis
                                                    .transcript && (
                                                    <div className="mb-4">
                                                        <h4 className="font-semibold mb-1">
                                                            Transcript
                                                        </h4>
                                                        <p className="text-(--muted) text-xs italic">
                                                            {
                                                                recording
                                                                    .analysis
                                                                    .transcript
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                                                    {recording.analysis
                                                        .strengths.length >
                                                        0 && (
                                                        <div>
                                                            <h4 className="font-semibold text-(--success) mb-1">
                                                                Strengths
                                                            </h4>
                                                            <ul className="list-disc pl-4 text-xs text-(--muted) space-y-1">
                                                                {recording.analysis.strengths.map(
                                                                    (item) => (
                                                                        <li
                                                                            key={
                                                                                item
                                                                            }
                                                                        >
                                                                            {
                                                                                item
                                                                            }
                                                                        </li>
                                                                    )
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {recording.analysis
                                                        .weaknesses.length >
                                                        0 && (
                                                        <div>
                                                            <h4 className="font-semibold text-(--danger) mb-1">
                                                                Weaknesses
                                                            </h4>
                                                            <ul className="list-disc pl-4 text-xs text-(--muted) space-y-1">
                                                                {recording.analysis.weaknesses.map(
                                                                    (item) => (
                                                                        <li
                                                                            key={
                                                                                item
                                                                            }
                                                                        >
                                                                            {
                                                                                item
                                                                            }
                                                                        </li>
                                                                    )
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>

                                                {recording.analysis
                                                    .action_items.length >
                                                    0 && (
                                                    <div>
                                                        <h4 className="font-semibold mb-1">
                                                            Action Items
                                                        </h4>
                                                        <ul className="list-disc pl-4 text-xs text-(--muted) space-y-1">
                                                            {recording.analysis.action_items.map(
                                                                (item) => (
                                                                    <li
                                                                        key={
                                                                            item
                                                                        }
                                                                    >
                                                                        {
                                                                            item
                                                                        }
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <div className="mt-4 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onRecordingClick?.(
                                                        recording
                                                    );
                                                }}
                                                className="inline-flex items-center gap-2 rounded-full bg-(--accent) px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-(--accent-hover)"
                                            >
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    className="h-3 w-3"
                                                    fill="currentColor"
                                                >
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                                Play
                                            </button>
                                        </div>
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
