"use client";

import React from "react";
import type { PracticeLog } from "@/lib/types";

type PracticeLogListProps = {
    logs: PracticeLog[];
};

export function PracticeLogList({ logs }: PracticeLogListProps) {
    return (
        <section className="rounded-2xl border border-(--surface-border) bg-(--surface-solid) p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="mb-4 text-sm font-semibold text-(--muted)">Practice history</h2>

            {logs.length === 0 ? (
                <p className="text-sm text-(--muted)">No practice logs yet.</p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {logs.map((log) => (
                        <li
                            key={log.id}
                            className="rounded-xl bg-black/[0.02] p-3 dark:bg-white/5"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 flex-col">
                                    <span className="truncate text-sm font-medium">{log.song_title}</span>
                                    <span className="truncate text-xs text-(--muted)">{log.artist}</span>
                                </div>
                                <span className="shrink-0 rounded-full bg-(--accent)/10 px-2.5 py-1 text-xs font-medium text-(--accent)">
                                    {log.duration_minutes} min
                                </span>
                            </div>
                            <p className="mt-2 text-xs text-(--muted)">
                                {new Date(log.created_at).toLocaleString()}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
