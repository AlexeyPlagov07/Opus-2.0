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
    <div className="mt-3 flex flex-col gap-2">
      <input
        value={songTitle}
        onChange={(e) => onSongTitleChange(e.target.value)}
        className="border border-white px-3 py-2 rounded bg-transparent"
        placeholder="Song title"
        onClick={(e) => e.stopPropagation()}
      />
      <input
        value={artist}
        onChange={(e) => onArtistChange(e.target.value)}
        className="border border-white px-3 py-2 rounded bg-transparent"
        placeholder="Artist"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}