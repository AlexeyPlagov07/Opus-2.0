"use client";
import React, { useState } from "react";

export default function App() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [inputPracticeDuration, setInputPracticeDuration] = useState("");
  const [inputValueSong, setInputValueSong] = useState("");
  const [inputValueArtist, setInputValueArtist] = useState("");
  const [pieces, setPieces] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedPieces, setSelectedPieces] = useState<any[]>([]);
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
  return (
    <div className="flex justify-center min-h-screen p-8 gap-8">
      <div className="flex flex-col items-center justify-center flex-1 max-w-2x1">
        <h1 className="text-2xl font-bold">Opus 2.0</h1>
        
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
                          setLogs((prev) => [...prev, {song: piece.song, artist: piece.artist, duration: inputPracticeDuration}]);
                          setInputPracticeDuration("");

                          setExpandedIndex(null);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Enter Log
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
            setPieces((prev) => [...prev, { song: inputValueSong, artist: inputValueArtist}]);
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
    
  );
}
