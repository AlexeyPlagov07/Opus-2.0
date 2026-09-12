import { NextResponse } from "next/server";
import { getFirebaseAuth } from "@/lib/firebase-admin";
import OpenAI from "openai";
import { sql } from "@/lib/neon";
import type { Song } from "@/lib/types";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
        });

        const transcript = transcription.text?.trim() ?? "";

        const feedbackResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.3,
            messages: [
                {
                    role: "system",
                    content:
                        "You are an experienced classical piano instructor writing private notes for a student right after their practice session. Write the way a real teacher actually talks: plain, direct, specific. Do not sound like an AI assistant - no emojis, no exclamation points, no filler like 'Great job!' or 'I hope this helps', no generic encouragement that isn't tied to something specific in the recording, no bullet-point cliches or corporate phrasing. Before writing any feedback, first check whether the recording actually sounds like the expected piece. You are given the expected song title and artist, plus a speech-to-text transcript of the recording (the transcript will often be empty or nonsense for purely instrumental playing - that is expected and is not evidence of a mismatch). Only set matches_expected_song to false if the transcript contains clear, specific evidence that a different, identifiable song was performed (for example, recognizable lyrics or a spoken remark naming a different piece). If the transcript is empty, garbled, or simply inconclusive, assume the student played the correct piece and set matches_expected_song to true. When matches_expected_song is false, briefly explain why in mismatch_reason and leave summary, strengths, weaknesses, and action_items as empty. When matches_expected_song is true, set mismatch_reason to null and do not invent mistakes that cannot be reasonably inferred from the audio - if uncertain, say so briefly and move on. Focus feedback on: tempo consistency, rhythm, dynamics, articulation, musical phrasing, obvious hesitations or interruptions, and concrete practice suggestions. Do not critique recording quality unless it prevents analysis. Return valid JSON only.",
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        songTitle: song.song_title,
                        artist: song.artist,
                        transcript,
                        instructions: {
                            matches_expected_song:
                                "true or false - whether the recording sounds like the expected song/artist.",
                            mismatch_reason:
                                "If matches_expected_song is false, briefly explain why. Otherwise null.",
                            summary: "Write one short overall summary. Empty string if matches_expected_song is false.",
                            strengths: "List 2 to 4 strengths. Empty array if matches_expected_song is false.",
                            weaknesses: "List 2 to 4 weaknesses. Empty array if matches_expected_song is false.",
                            action_items: "List 3 to 5 concrete practice actions. Empty array if matches_expected_song is false.",
                        },
                    }),
                },
            ],
        });

        const raw = feedbackResponse.choices[0]?.message?.content ?? "{}";

        let parsed: AnalysisResult;
        try {
            parsed = JSON.parse(raw) as AnalysisResult;
        } catch {
            parsed = {
                matches_expected_song: true,
                mismatch_reason: null,
                summary: "Unable to parse model output.",
                strengths: [],
                weaknesses: [],
                action_items: [],
            };
        }

        return NextResponse.json({
            songId,
            analysis: {
                transcript,
                matches_expected_song: Boolean(parsed.matches_expected_song ?? true),
                mismatch_reason:
                    typeof parsed.mismatch_reason === "string" ? parsed.mismatch_reason : null,
                feedback_summary: String(parsed.summary ?? ""),
                strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
                weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
                action_items: Array.isArray(parsed.action_items) ? parsed.action_items : [],
            },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Unauthorized or invalid request" },
            { status: 401 }
        );
    }
}