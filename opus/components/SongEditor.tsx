"use client";

import React from "react";

type SongEditorProps = {
  songTitle: string;
  artist: string;
  onSongTitleChange: (value: string) => void;
  onArtistChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function SongEditor({
  songTitle,
  artist,
  onSongTitleChange,
  onArtistChange,
  onSave,
  onCancel,
}: SongEditorProps) {
  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl bg-black/[0.02] p-3 dark:bg-white/5">
      <input
        value={songTitle}
        onChange={(e) => onSongTitleChange(e.target.value)}
        className="rounded-xl border border-(--surface-border) bg-(--surface-solid) px-3 py-2 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20"
        placeholder="Song title"
        onClick={(e) => e.stopPropagation()}
      />
      <input
        value={artist}
        onChange={(e) => onArtistChange(e.target.value)}
        className="rounded-xl border border-(--surface-border) bg-(--surface-solid) px-3 py-2 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20"
        placeholder="Artist"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          className="rounded-full bg-(--accent) px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-(--accent-hover)"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full bg-black/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}