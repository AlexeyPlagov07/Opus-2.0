import { NextResponse } from "next/server";
import { sql } from "@/lib/neon";

// This endpoint initializes the database schema
// Run once on deployment or when setting up the app
export async function POST(req: Request) {
    try {
        // Create the saved_recordings table if it doesn't exist
        await sql`
            CREATE TABLE IF NOT EXISTS saved_recordings (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                song_id UUID NOT NULL,
                audio_data BYTEA NOT NULL,
                analysis_json JSONB NOT NULL,
                duration_seconds INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create indexes for optimal performance
        await sql`CREATE INDEX IF NOT EXISTS idx_saved_recordings_user_id ON saved_recordings(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_saved_recordings_created_at ON saved_recordings(created_at DESC)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_saved_recordings_song_user ON saved_recordings(song_id, user_id)`;

        return NextResponse.json({ message: "Database initialized successfully" });
    } catch (error) {
        console.error("Database initialization error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Database initialization failed" },
            { status: 500 }
        );
    }
}
