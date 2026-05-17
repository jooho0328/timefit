import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";

type PrismaCtorOptions = ConstructorParameters<typeof PrismaClient>[0];

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildAdapter() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";

  if (/^(libsql|https?):\/\//.test(url)) {
    return new PrismaLibSql({
      url,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }

  const filePath = url.startsWith("file:") ? url.slice("file:".length) : "dev.db";
  return new PrismaBetterSqlite3({ url: filePath });
}

function createPrisma() {
  return new PrismaClient({ adapter: buildAdapter() } as PrismaCtorOptions);
}

export const db = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
