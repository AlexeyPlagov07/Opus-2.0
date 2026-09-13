import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin pulls in jwks-rsa -> jose (pure ESM), which breaks when
  // Turbopack tries to bundle it into the serverless function (ERR_REQUIRE_ESM).
  // Keeping it external makes Node load it via native require() at runtime instead.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
