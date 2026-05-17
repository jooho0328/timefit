import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../dev.db");

const adapter = new PrismaBetterSqlite3({ url: dbPath });
const db = new PrismaClient({ adapter });

const result = await db.user.updateMany({ data: { cash: 50000 } });
console.log(`✅ ${result.count}명에게 50,000 캐시 지급 완료!`);

const users = await db.user.findMany({ select: { name: true, email: true, cash: true } });
users.forEach(u => console.log(`  - ${u.name} (${u.email}): ${u.cash} 캐시`));

await db.$disconnect();
