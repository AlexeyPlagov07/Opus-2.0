import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { sql } from "@/lib/neon";

if (!getApps().length) {
    initializeApp({
        credential: cert(
            JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string)
        ),
    });
}

const auth = getAuth();

export async function POST(req: Request) {
    try {
        const { idToken, song, artist } = await req.json();

        if (!idToken || !song || !artist) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const decoded = await auth.verifyIdToken(idToken);
        const userId = decoded.uid;

        await sql`
      insert into songs (user_id, song_title, artist)
      values (${userId}, ${song}, ${artist})
    `;

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error(error);

        if (error?.code === "22P02") {
            return NextResponse.json(
                { error: "Practice duration must be a whole number." },
                { status: 400 }
            );
        }

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
        const decoded = await auth.verifyIdToken(idToken);
        const userId = decoded.uid;

        const songs = await sql`
      select id, user_id, song_title, artist, status, created_at
      from songs
      where user_id = ${userId}
      order by created_at desc
    `;

        return NextResponse.json({ songs });
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { idToken, songId } = await req.json();

        if (!idToken || !songId) {
            return NextResponse.json(
                { error: "Missing required field" },
                { status: 400 }
            );
        }

        const decoded = await auth.verifyIdToken(idToken);
        const userId = decoded.uid;

        await sql`
            delete from songs
            where id = ${songId}
            and user_id = ${userId}
        `;

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "UnAuthorizaed or invalid request" },
            { status: 401 }
        );
    }
}