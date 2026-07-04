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
      className="cursor-pointer flex-col mb-3 border border-gray-500 rounded-lg p-4 w-96"
      onClick={onToggleExpanded}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span>Song Title: {song.song_title}</span>
          <span>Artist: {song.artist}</span>
        </div>
      </div>

      {isExpanded && (
        <div
          className="mt-2 pt-4 border-t border-gray-600 text-gray-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4">
            <RecordingAnalyzer
              songId={song.id}
              idToken={idToken}
              onAnalysisComplete={(analysis: RecordingAnalysis) => {
                console.log("Analysis complete", analysis);
              }}
            />

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
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Edit Song
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

          <div className="mb-4">
            <h1 className="mb-2">Add practice log</h1>
            <div className="flex gap-2">
              <input
                name="practiceDuration"
                value={practiceDuration}
                onChange={(e) => setPracticeDuration(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="border border-white px-3 py-2 rounded bg-transparent"
                placeholder="Practice Duration (min)"
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
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Enter Log
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              await onDeleteSong(song.id);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Delete Piece
          </button>
        </div>
      )}
    </li>
  );
}