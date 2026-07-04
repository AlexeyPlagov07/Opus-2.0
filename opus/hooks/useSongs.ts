"use client";

import { useCallback, useState } from "react";
import type { Song } from "@/lib/types";

export default function useSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [songsError, setSongsError] = useState<string | null>(null);

  const refreshSongs = useCallback(async (idToken: string) => {
    setLoadingSongs(true);
    setSongsError(null);

    try {
      const response = await fetch("/api/songs", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load songs");
      }

      setSongs(data.songs ?? []);
    } catch (error) {
      setSongsError(error instanceof Error ? error.message : "Failed to load songs");
    } finally {
      setLoadingSongs(false);
    }
  }, []);

  const addSong = useCallback(async (idToken: string, song: string, artist: string) => {
    const response = await fetch("/api/songs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken,
        song,
        artist,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to add song");
    }

    await refreshSongs(idToken);
  }, [refreshSongs]);

  const updateSong = useCallback(async (
    idToken: string,
    songId: number,
    song: string,
    artist: string
  ) => {
    const response = await fetch("/api/songs", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken,
        songId,
        song,
        artist,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to update song");
    }

    await refreshSongs(idToken);
  }, [refreshSongs]);

  const deleteSong = useCallback(async (idToken: string, songId: number) => {
    const response = await fetch("/api/songs", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken,
        songId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to delete song");
    }

    await refreshSongs(idToken);
  }, [refreshSongs]);

  return {
    songs,
    loadingSongs,
    songsError,
    refreshSongs,
    addSong,
    updateSong,
    deleteSong,
  };
}