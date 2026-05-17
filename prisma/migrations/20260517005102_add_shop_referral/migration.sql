-- CreateTable
CREATE TABLE "UserPurchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "purchasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cash" INTEGER NOT NULL DEFAULT 0,
    "referralCode" TEXT NOT NULL DEFAULT '',
    "referredBy" TEXT,
    "badge" TEXT,
    "activeTheme" TEXT
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password")
SELECT "createdAt", "email", "id", "name", "password" FROM "User";
-- 기존 유저에게 id 앞 8자리로 임시 추천인 코드 발급
UPDATE "new_User" SET "referralCode" = UPPER(SUBSTR("id", 1, 8)) WHERE "referralCode" = '';
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UserPurchase_userId_itemId_key" ON "UserPurchase"("userId", "itemId");
