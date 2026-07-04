import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import OpenAI from "openai";
import { sql } from "@/lib/neon";
import type { Song } from "@/lib/types";

if (!getApps().length) {
    initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string)),
    });
}

const auth = getAuth();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

type AnalysisResult = {
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

        const decoded = await auth.verifyIdToken(idToken);
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
                        "You are an experienced clssical piano instructor. Your job is to provide constructive, encouraging, and specific feedback on practice recordings. Do not invent mistakes that cannot be reasonable inferred from the audio. If you are uncertain, explicitly state your uncertainty. Focus on: -Tempo consistency, -Rhythm, -Dynamics, -Articulation, -Musical phrasing, - Obvious hesitations or interruptions, - Overall practice suggestions. Do not critique recording quality unless it prevents analysis. Keep feedback supportive and actionable. Return valid JSON only.",
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        songTitle: song.song_title,
                        artist: song.artist,
                        transcript,
                        instructions: {
                            summary: "Write one short overall summary.",
                            strengths: "List 2 to 4 strengths.",
                            weaknesses: "List 2 to 4 weaknesses.",
                            action_items: "List 3 to 5 concrete practice actions.",
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