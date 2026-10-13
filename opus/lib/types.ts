export type Song = {
  id: number;
  user_id: string;
  song_title: string;
  artist: string;
  status?: string | null;
  created_at: string;
};

export type PracticeLog = {
  id: number;
  user_id: string;
  song_id: number;
  song_title: string;
  artist: string;
  duration_minutes: number;
  created_at: string;
};

export type RecordingAnalysis = {
  transcript: string;
  matches_expected_song: boolean;
  mismatch_reason: string | null;
  feedback_summary: string;
  strengths: string[];
  weaknesses: string[];
  action_items: string[];
};

export type SavedRecording = {
  id: number;
  user_id: string;
  song_id: number;
  log_id: number | null;
  song_title: string;
  artist: string;
  audio_url: string;
  analysis: RecordingAnalysis;
  created_at: string;
  duration_seconds: number;
};

export type AnalyzeRecordingResponse = {
  songId: number;
  analysis: RecordingAnalysis;
  recordingId?: number;
};

export type AnalyzeRecordingRequest = {
  idToken: string;
  songId: number;
}

export type RecordingStatus = "idle" | "recording" | "processing" | "done" | "error";