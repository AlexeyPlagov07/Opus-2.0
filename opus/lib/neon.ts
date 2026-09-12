// server-side Neon client (lazy singleton, mirrors lib/firebase-admin.ts).
// Deferring the neon() call until first query keeps a missing/malformed
// DATABASE_URL from throwing at module load, which would crash the route
// before its try/catch could turn the failure into a JSON error response.
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type SqlFn = NeonQueryFunction<false, false>;

let client: SqlFn | undefined;

function getClient(): SqlFn {
    if (client) return client;

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    client = neon(databaseUrl);
    return client;
}

export const sql: SqlFn = ((...args: Parameters<SqlFn>) =>
    getClient()(...args)) as SqlFn;