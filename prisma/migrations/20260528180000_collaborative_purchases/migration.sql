CREATE TABLE "trip_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "trip_members_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "trip_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "trip_members" ("id", "role", "createdAt", "updatedAt", "tripId", "userId")
SELECT 'tm_' || "id" || '_' || "ownerId", 'owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "id", "ownerId"
FROM "trips";

ALTER TABLE "participants" ADD COLUMN "userId" TEXT;

UPDATE "participants"
SET "userId" = (
  SELECT "users"."id"
  FROM "users"
  WHERE LOWER("users"."email") = LOWER("participants"."email")
  LIMIT 1
)
WHERE "email" IS NOT NULL;

INSERT OR IGNORE INTO "trip_members" ("id", "role", "createdAt", "updatedAt", "tripId", "userId")
SELECT 'tm_' || "participants"."tripId" || '_' || "participants"."userId", 'member', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "participants"."tripId", "participants"."userId"
FROM "participants"
WHERE "participants"."userId" IS NOT NULL;

ALTER TABLE "expenses" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'submitted';
ALTER TABLE "expenses" ADD COLUMN "createdByUserId" TEXT;
ALTER TABLE "expenses" ADD COLUMN "paidByUserId" TEXT;
ALTER TABLE "expenses" ADD COLUMN "updatedByUserId" TEXT;

UPDATE "expenses"
SET
  "createdByUserId" = (SELECT "trips"."ownerId" FROM "trips" WHERE "trips"."id" = "expenses"."tripId"),
  "updatedByUserId" = (SELECT "trips"."ownerId" FROM "trips" WHERE "trips"."id" = "expenses"."tripId"),
  "paidByUserId" = (
    SELECT "participants"."userId"
    FROM "participants"
    WHERE "participants"."id" = "expenses"."payerId"
    LIMIT 1
  );

ALTER TABLE "audit_logs" ADD COLUMN "tripId" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "entityType" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "entityId" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "beforeJson" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "afterJson" TEXT;

CREATE UNIQUE INDEX "trip_members_tripId_userId_key" ON "trip_members"("tripId", "userId");
CREATE INDEX "trip_members_userId_idx" ON "trip_members"("userId");
CREATE INDEX "trip_members_tripId_role_idx" ON "trip_members"("tripId", "role");
CREATE INDEX "participants_userId_idx" ON "participants"("userId");
CREATE INDEX "expenses_createdByUserId_idx" ON "expenses"("createdByUserId");
CREATE INDEX "expenses_paidByUserId_idx" ON "expenses"("paidByUserId");
CREATE INDEX "expenses_updatedByUserId_idx" ON "expenses"("updatedByUserId");
CREATE INDEX "expenses_tripId_status_idx" ON "expenses"("tripId", "status");
CREATE INDEX "audit_logs_tripId_idx" ON "audit_logs"("tripId");
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
