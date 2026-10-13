import { NextResponse } from "next/server";
import { getFirebaseAuth } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sql } from "@/lib/neon";
import type { Song } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

type AnalysisResult = {
    matches_expected_song: boolean;
    mismatch_reason: string | null;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    action_items: string[];
};

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const idTokenRaw = formData.get("idToken");
        const songIdRaw = formData.get("songId");
        const audioFile = formData.get("audio");

        const idToken = typeof idTokenRaw === "string" ? idTokenRaw.trim() : "";
        const songId = typeof songIdRaw === "string" ? songIdRaw.trim() : "";

        if (!idToken || !songId || !(audioFile instanceof File)) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const decoded = await getFirebaseAuth().verifyIdToken(idToken);
        const userId = decoded.uid;

        const songRows = await sql`
      select id, user_id, song_title, artist, status, created_at
      from songs
      where id = ${songId}
        and user_id = ${userId}
      limit 1
    `;

        const songs = songRows as Song[];

        if (songs.length === 0) {
            return NextResponse.json({ error: "Song not found" }, { status: 404 });
        }

        const song = songs[0];

        // Convert audio file to base64 for Gemini
        const audioBuffer = await audioFile.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString("base64");

        // Determine MIME type from file
        const mimeType = audioFile.type || "audio/webm";

        // Use Gemini 3.8 Flash to analyze audio directly
        const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

        const feedbackResponse = await model.generateContent([
            {
                text: `You are an experienced classical piano instructor writing private notes for a student right after their practice session. Write the way a real teacher actually talks: plain, direct, specific. Do not sound like an AI assistant - no emojis, no exclamation points, no filler like 'Great job!' or 'I hope this helps', no generic encouragement that isn't tied to something specific in the recording, no bullet-point cliches or corporate phrasing.

Listen to this piano recording and analyze it. The student was supposed to play:
- Song: ${song.song_title}
- Artist: ${song.artist}

First, determine whether this recording actually sounds like the expected piece. Only set matches_expected_song to false if you can clearly identify that a different, identifiable song was performed. If uncertain, assume it's the correct piece.

When matches_expected_song is false, briefly explain why in mismatch_reason and leave feedback fields empty.

When matches_expected_song is true, analyze the recording and provide:
- A brief overall summary of the performance
- 2-4 specific strengths observed in this performance
- 2-4 specific weaknesses to address
- 3-5 concrete practice actions

Focus on: tempo consistency, rhythm accuracy, dynamics control, articulation, musical phrasing, hesitations or interruptions, and specific practice suggestions. Do not critique recording quality unless it prevents analysis.

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "matches_expected_song": true/false,
  "mismatch_reason": null or string,
  "summary": "string or empty",
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "action_items": ["string", "string", "string"]
}`,
            },
            {
                inlineData: {
                    mimeType,
                    data: audioBase64,
                },
            },
        ]);

        const raw = feedbackResponse.response.text();

        let parsed: AnalysisResult;
        try {
            // Extract JSON from response (in case there's any extra text)
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : raw;
            parsed = JSON.parse(jsonStr) as AnalysisResult;
        } catch (e) {
            console.error("Failed to parse Gemini response:", raw);
            parsed = {
                matches_expected_song: true,
                mismatch_reason: null,
                summary: "Unable to parse model output.",
                strengths: [],
                weaknesses: [],
                action_items: [],
            };
        }

        const analysis = {
            matches_expected_song: Boolean(parsed.matches_expected_song ?? true),
            mismatch_reason:
                typeof parsed.mismatch_reason === "string" ? parsed.mismatch_reason : null,
            feedback_summary: String(parsed.summary ?? ""),
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
            action_items: Array.isArray(parsed.action_items) ? parsed.action_items : [],
        };

        const durationSeconds = Math.round(audioFile.size / 16000); // rough estimate

        // Ensure the table exists (CREATE TABLE IF NOT EXISTS is idempotent)
        try {
            await sql`
                CREATE TABLE IF NOT EXISTS saved_recordings (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    song_id UUID NOT NULL,
                    log_id INTEGER,
                    audio_data BYTEA NOT NULL,
                    analysis_json JSONB NOT NULL,
                    duration_seconds INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            // Create indexes separately to avoid constraint issues
            await sql`CREATE INDEX IF NOT EXISTS idx_saved_recordings_user_id ON saved_recordings(user_id)`;
            await sql`CREATE INDEX IF NOT EXISTS idx_saved_recordings_created_at ON saved_recordings(created_at DESC)`;
            await sql`CREATE INDEX IF NOT EXISTS idx_saved_recordings_log_id ON saved_recordings(log_id)`;
        } catch (tableError) {
            // If table creation fails, log but continue (table might already exist)
            console.warn("Table creation warning:", tableError);
        }

        // Add log_id column if it doesn't exist (schema migration)
        try {
            await sql`
                ALTER TABLE saved_recordings 
                ADD COLUMN IF NOT EXISTS log_id INTEGER
            `;
        } catch (migrationError) {
            console.warn("Migration warning (log_id column):", migrationError);
        }

        const result = await sql`
            insert into saved_recordings (
                user_id,
                song_id,
                audio_data,
                analysis_json,
                duration_seconds
            )
            values (
                ${userId},
                ${songId},
                ${audioBase64},
                ${JSON.stringify(analysis)},
                ${durationSeconds}
            )
            returning id
        `;

        const recordingId = (result as Array<{ id: number }>)[0]?.id;

        // Create a practice log entry and link the recording to it
        let logId: number | null = null;
        try {
            const logResult = await sql`
                insert into practice_logs (user_id, song_id, duration_minutes)
                values (
                    ${userId},
                    ${songId},
                    ${Math.ceil(durationSeconds / 60)}
                )
                returning id
            `;
            logId = (logResult as Array<{ id: number }>)[0]?.id ?? null;

            // Update recording with log_id if log was created
            if (logId && recordingId) {
                await sql`
                    update saved_recordings
                    set log_id = ${logId}
                    where id = ${recordingId}
                `;
            }
        } catch (logError) {
            console.warn("Failed to create practice log:", logError);
            // Continue anyway - recording was still saved
        }

        return NextResponse.json({
            songId,
            recordingId,
            logId,
            analysis,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Unauthorized or invalid request" },
            { status: 401 }
        );
    }
}