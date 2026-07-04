"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import useSongs from "@/hooks/useSongs";
import useLogs from "@/hooks/useLogs";
import { SongCard } from "@/components/SongCard";
import { PracticeLogList } from "@/components/PracticeLogList";

export default function App() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [inputValueSong, setInputValueSong] = useState("");
  const [inputValueArtist, setInputValueArtist] = useState("");

  const { user, loading, signInWithGoogle, logOut } = useAuth();
  const { songs, refreshSongs, addSong, updateSong, deleteSong } = useSongs();
  const { logs, refreshLogs, addLog } = useLogs();

  const [idToken, setIdToken] = useState("");

  useEffect(() => {
    async function loadToken() {
      if (!user) return;
      const token = await user.getIdToken();
      setIdToken(token);
    }

    loadToken();
  }, [user]);
  useEffect(() => {
    async function loadData() {
      if (!user) return;

      const idToken = await user.getIdToken();
      await refreshSongs(idToken);
      await refreshLogs(idToken);
    }

    loadData();
  }, [user, refreshSongs, refreshLogs]);

  async function handleAddSong() {
    if (!user) return;

    const song = inputValueSong.trim();
    const artist = inputValueArtist.trim();

    if (!song || !artist) {
      alert("Please enter both a song title and artist.");
      return;
    }

    const idToken = await user.getIdToken();
    await addSong(idToken, song, artist);
    setInputValueSong("");
    setInputValueArtist("");
  }

  async function handleUpdateSong(
    songId: number,
    songTitle: string,
    artist: string
  ) {
    if (!user) return;

    const idToken = await user.getIdToken();
    await updateSong(idToken, songId, songTitle, artist);
    await refreshLogs(idToken);
  }

  async function handleAddPracticeLog(songId: number, durationMinutes: number) {
    if (!user) return;

    const idToken = await user.getIdToken();
    await addLog(idToken, songId, durationMinutes);
  }

  async function handleDeleteSong(songId: number) {
    if (!user) return;

    const idToken = await user.getIdToken();
    await deleteSong(idToken, songId);
    await refreshLogs(idToken);

    if (expandedIndex === songId) {
      setExpandedIndex(null);
    }
  }

  async function getIdToken() {
    if (!user) return "";
    return user.getIdToken();
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <button
          onClick={signInWithGoogle}
          className="px-4 py-2 rounded bg-blue-500 text-white"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Opus 2.0</h1>
        <div className="flex items-center gap-4">
          <span>{user.email}</span>
          <button
            onClick={logOut}
            className="px-4 py-2 rounded bg-red-500 text-white"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="flex justify-center min-h-screen p-8 gap-8">
        <div className="flex flex-col items-center justify-center flex-1 max-w-2xl">
          <ul className="w-full flex flex-col items-center mt-4">
            {songs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                isExpanded={expandedIndex === song.id}
                onToggleExpanded={() =>
                  setExpandedIndex((current) => (current === song.id ? null : song.id))
                }
                onUpdateSong={handleUpdateSong}
                onAddPracticeLog={handleAddPracticeLog}
                onDeleteSong={handleDeleteSong}
                idToken={idToken}
              />
            ))}
          </ul>

          <div className="flex gap-2 mt-4">
            <input
              name="myInput"
              value={inputValueSong}
              onChange={(e) => setInputValueSong(e.target.value)}
              className="border border-white px-3 py-2 rounded bg-transparent"
              placeholder="Song Name..."
            />
            <input
              name="myInput"
              value={inputValueArtist}
              onChange={(e) => setInputValueArtist(e.target.value)}
              className="border border-white px-3 py-2 rounded bg-transparent"
              placeholder="Artist..."
            />
          </div>

          <button
            onClick={handleAddSong}
            className="px-4 py-2 bg-blue-500 mt-4 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Add Item
          </button>
        </div>

        <PracticeLogList logs={logs} />
      </div>
    </div>
  );
}