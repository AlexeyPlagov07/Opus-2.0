"use client";
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function App() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [inputPracticeDuration, setInputPracticeDuration] = useState("");
  const [inputValueSong, setInputValueSong] = useState("");
  const [inputValueArtist, setInputValueArtist] = useState("");
  const [pieces, setPieces] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedPieces, setSelectedPieces] = useState<any[]>([]);
  const { user, loading, signInWithGoogle, logOut } = useAuth();

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
              {pieces.map((piece, index) => {
                const isExpanded = expandedIndex === index;
                return (
                  <li
                    key={index}
                    className="cursor-pointer flex-col mb-3 border border-gray-500 rounded-lg p-4 w-96"
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span>{"Song Title: "}{piece.song}</span>
                        <span>{"Artist: "}{piece.artist}</span>
                      </div>
                      <select className="text-white" onClick={(e) => e.stopPropagation()}>
                        <option value="notStarted">Not Started</option>
                        <option value="inProgress">In Progress</option>
                        <option value="finished">Finished</option>
                      </select>
                    </div>
                    {isExpanded && (
                      <div className="mt-2 pt-4 border-t border-gray-600 text-gray-300">
                        <span><h1>Add practice log</h1></span>
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
                            onClick={(e) => {
                              e.stopPropagation();

                              if (inputPracticeDuration.trim() === "") {
                                alert("Please enter a pratice duration.");
                                return;
                              }
                              setLogs((prev) => [...prev, { song: piece.song, artist: piece.artist, duration: inputPracticeDuration }]);
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
                              setPieces((prev) => prev.filter((_, i) => i !== index));
                              setExpandedIndex(null);
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
              onClick={() => {
                setPieces((prev) => [...prev, { song: inputValueSong, artist: inputValueArtist }]);
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
                      <span>{"Song Title: "}{log.song}</span>
                      <span>{"Artist: "}{log.artist}</span>
                      <span>{"Duration: "}{log.duration}{" minutes"}</span>
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
