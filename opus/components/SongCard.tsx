"use client";

import React, { useEffect, useState } from "react";
import type { Song } from "@/lib/types";
import { SongEditor } from "@/components/SongEditor";
import { RecordingAnalyzer } from "@/components/RecordingAnalyzer";
import type { RecordingAnalysis } from "@/lib/types";

type SongCardProps = {
  song: Song;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onUpdateSong: (songId: number, songTitle: string, artist: string) => Promise<void>;
  onAddPracticeLog: (songId: number, durationMinutes: number) => Promise<void>;
  onDeleteSong: (songId: number) => Promise<void>;
  idToken: string;
};

export function SongCard({
  song,
  isExpanded,
  onToggleExpanded,
  onUpdateSong,
  onAddPracticeLog,
  onDeleteSong,
  idToken,
}: SongCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(song.song_title);
  const [draftArtist, setDraftArtist] = useState(song.artist);
  const [practiceDuration, setPracticeDuration] = useState("");

  useEffect(() => {
    if (!isExpanded) {
      setIsEditing(false);
      setPracticeDuration("");
    }
  }, [isExpanded]);

  useEffect(() => {
    if (!isEditing) {
      setDraftTitle(song.song_title);
      setDraftArtist(song.artist);
    }
  }, [song.song_title, song.artist, isEditing]);

  return (
    <li
      className="cursor-pointer rounded-2xl border border-(--surface-border) bg-(--surface-solid) p-5 shadow-sm transition-all hover:shadow-md"
      onClick={onToggleExpanded}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{song.song_title}</span>
          <span className="truncate text-sm text-(--muted)">{song.artist}</span>
        </div>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-(--muted) transition-transform duration-200 ${isExpanded ? "rotate-90" : ""
            }`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </div>

      {isExpanded && (
        <div
          className="mt-4 flex flex-col gap-4 border-t border-(--surface-border) pt-4"
          onClick={(e) => e.stopPropagation()}
        >
          <RecordingAnalyzer
            songId={song.id}
            songTitle={song.song_title}
            artist={song.artist}
            idToken={idToken}
            onAnalysisComplete={(analysis: RecordingAnalysis) => {
              console.log("Analysis complete", analysis);
            }}
          />

          <div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();

                if (isEditing) {
                  setIsEditing(false);
                  return;
                }

                setDraftTitle(song.song_title);
                setDraftArtist(song.artist);
                setIsEditing(true);
              }}
              className="rounded-full bg-black/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
            >
              {isEditing ? "Cancel edit" : "Edit song"}
            </button>

            {isEditing && (
              <SongEditor
                songTitle={draftTitle}
                artist={draftArtist}
                onSongTitleChange={setDraftTitle}
                onArtistChange={setDraftArtist}
                onSave={async () => {
                  await onUpdateSong(song.id, draftTitle.trim(), draftArtist.trim());
                  setIsEditing(false);
                }}
                onCancel={() => setIsEditing(false)}
              />
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-(--muted)">Add practice log</h3>
            <div className="flex gap-2">
              <input
                name="practiceDuration"
                value={practiceDuration}
                onChange={(e) => setPracticeDuration(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="min-w-0 flex-1 rounded-xl border border-(--surface-border) bg-black/[0.02] px-3 py-2 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20 dark:bg-white/5"
                placeholder="Minutes practiced"
              />
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();

                  const duration = Number(practiceDuration);

                  if (!Number.isInteger(duration) || duration <= 0) {
                    alert("Please enter a valid practice duration.");
                    return;
                  }

                  await onAddPracticeLog(song.id, duration);
                  setPracticeDuration("");
                }}
                className="shrink-0 rounded-xl bg-(--accent) px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-(--accent-hover)"
              >
                Log
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              await onDeleteSong(song.id);
            }}
            className="self-start rounded-full px-4 py-2 text-sm font-medium text-(--danger) transition-colors hover:bg-(--danger)/10"
          >
            Delete piece
          </button>
        </div>
      )}
    </li>
  );
}