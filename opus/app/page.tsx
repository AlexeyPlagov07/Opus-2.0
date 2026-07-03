"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function App() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [inputPracticeDuration, setInputPracticeDuration] = useState("");
  const [inputValueSong, setInputValueSong] = useState("");
  const [inputValueArtist, setInputValueArtist] = useState("");
  const [pieces, setPieces] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedPieces, setSelectedPieces] = useState<any[]>([]);
  const [editingSongId, setEditingSongId] = useState<number | null>(null);
  const [editSongTitle, setEditSongTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const { user, loading, signInWithGoogle, logOut } = useAuth();
  const [songs, setSongs] = useState<any[]>([]);

  async function refreshSongs(idToken: string) {
    const response = await fetch("/api/songs", {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    const data = await response.json();
    setSongs(data.songs ?? []);
  }

  async function refreshLogs(idToken: string) {
    const response = await fetch("/api/logs", {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    const data = await response.json();
    setLogs(data.logs ?? []);
  }

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      const idToken = await user.getIdToken();

      await refreshSongs(idToken);
      await refreshLogs(idToken);
    }

    loadData();
  }, [user]);

  async function handleAddSong() {
    if (!user) return;

    const idToken = await user.getIdToken();

    await fetch("/api/songs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken,
        song: inputValueSong,
        artist: inputValueArtist,
      }),
    });

    await refreshSongs(idToken);
  }

  async function handleAddLog(song: any) {
    if (!user) return;

    const idToken = await user.getIdToken();

    const response = await fetch("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken,
        songId: song.id,
        durationMinutes: inputPracticeDuration,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error ?? "Something went wrong");
      return;
    }

    await refreshLogs(idToken);
  }

  async function handleDeleteSong(song: any) {
    if (!user) return;

    const idToken = await user.getIdToken();

    await fetch("/api/songs", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken,
        songId: song.id,
      }),
    });

    await refreshSongs(idToken);
    await refreshLogs(idToken);
  }

  const handleAdd = (piece: any) => {
    setSelectedPieces((prev) => [...prev, piece]);
  };

  const handleUpdateSong = (e: any) => {
    setInputValueSong(e.target.value);
  };

  const handleUpdateArtist = (e: any) => {
    setInputValueArtist(e.target.value);
  }

  const handleUpdateDuration = (e: any) => {
    setInputPracticeDuration(e.target.value);
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

      <div>
        <div className="flex justify-center min-h-screen p-8 gap-8">
          <div className="flex flex-col items-center justify-center flex-1 max-w-2x1">
            <ul className="w-full flex flex-col items-center mt-4">
              {songs.map((song) => {
                const isExpanded = expandedIndex === song.id;

                return (
                  <li
                    key={song.id}
                    className="cursor-pointer flex-col mb-3 border border-gray-500 rounded-lg p-4 w-96"
                    onClick={() => setExpandedIndex(isExpanded ? null : song.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span>Song Title: {song.song_title}</span>
                        <span>Artist: {song.artist}</span>
                      </div>

                      <select className="text-white" onClick={(e) => e.stopPropagation()}>
                        <option value="notStarted">Not Started</option>
                        <option value="inProgress">In Progress</option>
                        <option value="finished">Finished</option>
                      </select>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 pt-4 border-t border-gray-600 text-gray-300">
                        <span>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();

                              if (editingSongId == song.id) {
                                setEditingSongId(null);
                                return;
                              }

                              setEditingSongId(song.id);
                              setEditSongTitle(song.song_title);
                              setEditArtist(song.artist);
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            Edit Song
                          </button>
                          {editingSongId === song.id && (
                            <div className="mt-3 flex flex-col gap-2">
                              <input
                                value={editSongTitle}
                                onChange={(e) => setEditSongTitle(e.target.value)}
                                className="border border-white px-3 py-2 rounded bg-transparent"
                                placeholder="Song title"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <input
                                value={editArtist}
                                onChange={(e) => setEditArtist(e.target.value)}
                                className="border border-white px-3 py-2 rounded bg-transparent"
                                placeholder="Artist"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();

                                  const idToken = await user.getIdToken();

                                  await fetch("/api/songs", {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      idToken,
                                      songId: song.id,
                                      song: editSongTitle,
                                      artist: editArtist,
                                    }),
                                  });

                                  await refreshSongs(idToken);
                                  await refreshLogs(idToken);
                                  setEditingSongId(null);
                                }}
                                className="px-4 py-2 bg-green-500 text-white rounded"
                              >
                                Save
                              </button>
                            </div>
                          )}
                        </span>
                        <span>
                          <h1>Add practice log</h1>
                        </span>

                        <span>
                          <input
                            name="practiceDuration"
                            value={inputPracticeDuration}
                            onChange={handleUpdateDuration}
                            onClick={(e) => e.stopPropagation()}
                            className="border border-white px-3 py-2 rounded bg-transparent"
                            placeholder="Practice Duration (min)"
                          />
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();

                              if (inputPracticeDuration.trim() === "") {
                                alert("Please enter a practice duration.");
                                return;
                              }

                              await handleAddLog(song);
                              setInputPracticeDuration("");
                              setExpandedIndex(null);
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            Enter Log
                          </button>
                        </span>

                        <span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedIndex(null);
                              handleDeleteSong(song);
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            Delete Piece
                          </button>
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="flex gap-2 mt-4">
              <input
                name="myInput"
                value={inputValueSong}
                onChange={handleUpdateSong}
                className="border border-white px-3 py-2 rounded bg-transparent"
                placeholder="Song Name..."
              />
              <input
                name="myInput"
                value={inputValueArtist}
                onChange={handleUpdateArtist}
                className="border border-white px-3 py-2 rounded bg-transparent"
                placeholder="Artist..."
              />
            </div>
            <button
              onClick={async () => {
                await handleAddSong();
                setInputValueSong("");
                setInputValueArtist("");
              }}
              className="px-4 py-2 bg-blue-500 mt-4 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Add Item
            </button>
          </div>
          <div className="flex flex-col flex-1 max-w-sm border-l border-gray-700 pl-8">
            <h2 className="text-xl font-bold mb-4 text-gray-300">Practice Logs</h2>
            <ul className="list-disc pl-5">
              {logs.map((log, index) => {
                return (
                  <li key={index} className="cursor-pointer flex-col mb-3 border border-gray-500 rounded-lg p-4 w-80">
                    <div className="flex flex-col">
                      <span>Song Title: {log.song_title}</span>
                      <span>Artist: {log.artist}</span>
                      <span>Duration: {log.duration_minutes}{" minutes"}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
