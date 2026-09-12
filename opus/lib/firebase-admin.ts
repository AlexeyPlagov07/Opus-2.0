// Server-side Firebase Admin client (lazy singleton).
// Initialization is deferred to first use so a missing/malformed
// FIREBASE_SERVICE_ACCOUNT_KEY throws inside a route handler's try/catch
// instead of crashing the serverless function at module load time.
import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let app: App | undefined;

function getFirebaseAdminApp(): App {
    if (app) return app;

    if (getApps().length) {
        app = getApp();
        return app;
    }

    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!rawKey) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set");
    }

    let serviceAccount: Record<string, unknown>;
    try {
        serviceAccount = JSON.parse(rawKey);
    } catch {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON");
    }

    app = initializeApp({ credential: cert(serviceAccount) });
    return app;
}

export function getFirebaseAuth(): Auth {
    return getAuth(getFirebaseAdminApp());
}
