import { NextResponse } from "next/server";
import { getFirebaseAuth } from "@/lib/firebase-admin";
import { sql } from "@/lib/neon";
import type { SavedRecording, RecordingAnalysis } from "@/lib/types";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");

        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing token" }, { status: 401 });
        }

        const idToken = authHeader.slice(7);
        const decoded = await getFirebaseAuth().verifyIdToken(idToken);
        const userId = decoded.uid;

        // Ensure table exists (CREATE TABLE IF NOT EXISTS is idempotent)
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

        const recordings = await sql`
            select
                sr.id,
                sr.user_id,
                sr.song_id,
                sr.log_id,
                s.song_title,
                s.artist,
                sr.analysis_json,
                sr.created_at,
                sr.duration_seconds
            from saved_recordings sr
            join songs s on s.id = sr.song_id
            where sr.user_id = ${userId}
            order by sr.created_at desc
        `;

        const formattedRecordings = (recordings as Array<any>).map((rec) => ({
            id: rec.id,
            user_id: rec.user_id,
            song_id: rec.song_id,
            log_id: rec.log_id,
            song_title: rec.song_title,
            artist: rec.artist,
            analysis: typeof rec.analysis_json === 'string' 
              ? JSON.parse(rec.analysis_json) 
              : rec.analysis_json as RecordingAnalysis,
            created_at: rec.created_at,
            duration_seconds: rec.duration_seconds,
            // audio_url is not returned in list for bandwidth reasons
        }));

        return NextResponse.json({ recordings: formattedRecordings });
    } catch (error) {
        console.error("GET /api/recordings error:", error);
        
        // If it's a database error (table doesn't exist), return 500 with helpful message
        if (error instanceof Error && error.message.includes("relation")) {
            return NextResponse.json(
                { error: "Database table not created. Run the CREATE TABLE SQL from DATABASE_SCHEMA.md" },
                { status: 500 }
            );
        }
        
        return NextResponse.json(
            { error: "Unauthorized or invalid request" },
            { status: 401 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const { idToken, recordingId } = await req.json();

        if (!idToken || !recordingId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const decoded = await getFirebaseAuth().verifyIdToken(idToken);
        const userId = decoded.uid;

        const recording = await sql`
            select
                sr.id,
                sr.user_id,
                sr.song_id,
                s.song_title,
                s.artist,
                sr.audio_data,
                sr.analysis_json,
                sr.created_at,
                sr.duration_seconds
            from saved_recordings sr
            join songs s on s.id = sr.song_id
            where sr.id = ${recordingId}
                and sr.user_id = ${userId}
            limit 1
        `;

        if ((recording as Array<any>).length === 0) {
            return NextResponse.json({ error: "Recording not found" }, { status: 404 });
        }

        const rec = (recording as Array<any>)[0];
        const audioBuffer = Buffer.from(rec.audio_data, "base64");

        return new NextResponse(audioBuffer, {
            headers: {
                "Content-Type": "audio/webm",
                "Content-Disposition": `attachment; filename="recording-${recordingId}.webm"`,
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
