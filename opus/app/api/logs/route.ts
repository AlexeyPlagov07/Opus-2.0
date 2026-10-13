import { NextResponse } from "next/server";
import { getFirebaseAuth } from "@/lib/firebase-admin";
import { sql } from "@/lib/neon";

export async function POST(req: Request) {
    try {
        const { idToken, songId, durationMinutes, notes } = await req.json();

        const duration = Number(durationMinutes);

        if (!Number.isInteger(duration)) {
            return NextResponse.json(
                { error: "Practice duration must be a whole number." },
                { status: 400 }
            );
        }

        if (!idToken || !songId || !durationMinutes) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const decoded = await getFirebaseAuth().verifyIdToken(idToken);
        const userId = decoded.uid;

        const ownedSong = await sql`
            select id
            from songs
            where id = ${songId}
              and user_id = ${userId}
            limit 1
        `;

        if (ownedSong.length === 0) {
            return NextResponse.json({ error: "Song not found" }, { status: 404 });
        }

        await sql`
            insert into practice_logs (user_id, song_id, duration_minutes, notes)
            values (${userId}, ${songId}, ${durationMinutes}, ${notes || null})
        `;

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Unauthorized or invalid request" },
            { status: 401 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");

        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing token" }, { status: 401 });
        }

        const idToken = authHeader.slice(7);
        const decoded = await getFirebaseAuth().verifyIdToken(idToken);
        const userId = decoded.uid;

        // Ensure notes column exists (idempotent)
        try {
            await sql`ALTER TABLE practice_logs ADD COLUMN IF NOT EXISTS notes TEXT`;
        } catch (migrationError) {
            // Column might already exist - continue anyway
            console.debug("Schema migration note: notes column check complete");
        }

        // Try to select with notes column, fall back if it doesn't exist
        let logs;
        try {
            logs = await sql`
                select
                    pl.id,
                    pl.user_id,
                    pl.song_id,
                    s.song_title,
                    s.artist,
                    pl.duration_minutes,
                    COALESCE(pl.notes, '') as notes,
                    pl.created_at
                from practice_logs pl
                join songs s on s.id = pl.song_id
                where pl.user_id = ${userId}
                order by pl.created_at desc
            `;
        } catch (queryError) {
            // If notes column doesn't exist yet, select without it
            console.debug("Notes column not available yet, querying without it");
            logs = await sql`
                select
                    pl.id,
                    pl.user_id,
                    pl.song_id,
                    s.song_title,
                    s.artist,
                    pl.duration_minutes,
                    '' as notes,
                    pl.created_at
                from practice_logs pl
                join songs s on s.id = pl.song_id
                where pl.user_id = ${userId}
                order by pl.created_at desc
            `;
        }

        return NextResponse.json({ logs });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
