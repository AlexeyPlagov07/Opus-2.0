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
  feedback_summary: string;
  strengths: string[];
  weaknesses: string[];
  action_items: string[];
};

export type AnalyzeRecordingResponse = {
  songId: number;
  analysis: RecordingAnalysis;
};

export type AnalyzeRecordingRequest = {
  idToken: string;
  songId: number;
}

export type RecordingStatus = "idle" | "recording" | "processing" | "done" | "error";