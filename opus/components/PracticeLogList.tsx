"use client";

import React from "react";
import type { PracticeLog } from "@/lib/types";

type PracticeLogListProps = {
    logs: PracticeLog[];
};

export function PracticeLogList({ logs }: PracticeLogListProps) {
    return (
        <section className="w-full max-w-md rounded-lg border border-gray-500 p-4">
            <h2 className="mb-4 text-xl font-semibold">Practice Logs</h2>

            {logs.length === 0 ? (
                <p className="text-sm text-gray-400">No practice logs yet.</p>
            ) : (
                <ul className="space-y-3">
                    {logs.map((log) => (
                        <li key={log.id} className="rounded border border-gray-700 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex flex-col">
                                    <span className="font-medium">{log.song_title}</span>
                                    <span className="text-sm text-gray-400">{log.artist}</span>
                                </div>
                                <span className="shrink-0 text-sm text-gray-300">
                                    {log.duration_minutes} min
                                </span>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                {new Date(log.created_at).toLocaleString()}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
