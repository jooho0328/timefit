import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "@prisma/adapter-libsql",
    "@libsql/client",
    "better-sqlite3",
  ],
};

export default nextConfig;
