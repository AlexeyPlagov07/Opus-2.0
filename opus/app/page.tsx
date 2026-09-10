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

  const totalPracticeMinutes = logs.reduce((sum, log) => sum + log.duration_minutes, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--background)">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--muted) border-t-(--accent)" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-(--background) px-6 py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-(--accent)/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-(--success)/20 blur-3xl"
        />

        <div className="relative grid w-full max-w-5xl items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <div className="text-center lg:text-left">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent) text-2xl font-semibold text-white lg:mx-0">
              O
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Practice with purpose.
            </h1>
            <p className="mt-4 text-lg text-(--muted)">
              Opus keeps every session logged, gives you AI feedback on your
              recordings, and shows your progress building up over time.
            </p>

            <ul className="mt-10 flex flex-col gap-5">
              <FeatureRow
                icon={
                  <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-7 9a7 7 0 0 0 14 0M12 19v3" />
                }
                title="Record and get feedback"
                description="Capture a take and get AI-generated notes on your playing."
              />
              <FeatureRow
                icon={
                  <path d="M4 19V5m6 14V9m6 10V3M3 19h18" />
                }
                title="Track your progress"
                description="See practice time build up piece by piece, session by session."
              />
              <FeatureRow
                icon={
                  <path d="M5 4h11a2 2 0 0 1 2 2v14l-7.5-4L3 20V6a2 2 0 0 1 2-2Z" />
                }
                title="Organize your repertoire"
                description="Keep every song and artist you're learning in one place."
              />
            </ul>
          </div>

          <div className="mx-auto w-full max-w-sm rounded-3xl border border-(--surface-border) bg-(--surface-solid) p-10 text-center shadow-xl shadow-black/5">
            <h2 className="text-xl font-semibold tracking-tight">Get started</h2>
            <p className="mt-2 text-sm text-(--muted)">
              Sign in to sync your practice log across every device.
            </p>
            <button
              onClick={signInWithGoogle}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-(--accent) px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-(--accent-hover)"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
                />
              </svg>
              Sign in with Google
            </button>
            <p className="mt-6 text-xs text-(--muted)">
              Free to use. No credit card required.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--background) text-(--foreground)">
      <header className="sticky top-0 z-10 border-b border-(--surface-border) bg-(--surface) backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--accent) text-sm font-semibold text-white">
              O
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Opus</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-(--muted) sm:inline">{user.email}</span>
            <button
              onClick={logOut}
              className="rounded-full bg-black/5 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm text-(--muted)">{getGreeting()}</p>
          <h2 className="text-2xl font-semibold tracking-tight">
            {user.displayName ?? user.email}
          </h2>
        </div>

        <div className="mb-10 grid grid-cols-3 gap-4">
          <StatCard label="Pieces" value={String(songs.length)} />
          <StatCard label="Sessions logged" value={String(logs.length)} />
          <StatCard label="Practice time" value={formatDuration(totalPracticeMinutes)} />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <section className="flex-1">
            <div className="mb-6 rounded-2xl border border-(--surface-border) bg-(--surface-solid) p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-(--muted)">Add a piece</h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  name="myInput"
                  value={inputValueSong}
                  onChange={(e) => setInputValueSong(e.target.value)}
                  className="flex-1 rounded-xl border border-(--surface-border) bg-black/[0.02] px-4 py-2.5 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20 dark:bg-white/5"
                  placeholder="Song title"
                />
                <input
                  name="myInput"
                  value={inputValueArtist}
                  onChange={(e) => setInputValueArtist(e.target.value)}
                  className="flex-1 rounded-xl border border-(--surface-border) bg-black/[0.02] px-4 py-2.5 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20 dark:bg-white/5"
                  placeholder="Artist"
                />
                <button
                  onClick={handleAddSong}
                  className="shrink-0 rounded-xl bg-(--accent) px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-(--accent-hover)"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-(--muted)">Your repertoire</h2>
              <span className="text-xs text-(--muted)">{songs.length} piece{songs.length === 1 ? "" : "s"}</span>
            </div>

            {songs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-(--surface-border) py-16 text-center text-sm text-(--muted)">
                No pieces yet. Add your first one above.
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
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
            )}
          </section>

          <aside className="w-full lg:w-96 lg:shrink-0">
            <PracticeLogList logs={logs} />
          </aside>
        </div>
      </main>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDuration(totalMinutes: number) {
  if (totalMinutes <= 0) return "0 min";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

type StatCardProps = {
  label: string;
  value: string;
};

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-(--surface-border) bg-(--surface-solid) p-4 text-center shadow-sm sm:text-left">
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-(--muted)">{label}</p>
    </div>
  );
}

type FeatureRowProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function FeatureRow({ icon, title, description }: FeatureRowProps) {
  return (
    <li className="flex items-start gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--accent)/10 text-(--accent)">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {icon}
        </svg>
      </span>
      <div className="text-left">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-(--muted)">{description}</p>
      </div>
    </li>
  );
}