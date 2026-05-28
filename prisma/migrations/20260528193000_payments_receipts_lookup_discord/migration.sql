CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "label" TEXT,
    "handle" TEXT,
    "url" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'trip_members',
    "notes" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "receipts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalFilename" TEXT NOT NULL,
    "storedFilename" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "merchant" TEXT,
    "receiptDate" DATETIME,
    "subtotal" DECIMAL,
    "tax" DECIMAL,
    "tip" DECIMAL,
    "total" DECIMAL,
    "parserProvider" TEXT NOT NULL DEFAULT 'local-heuristic',
    "parserConfidence" REAL NOT NULL DEFAULT 0,
    "rawText" TEXT,
    "parsedJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'needs_review',
    "splitMode" TEXT NOT NULL DEFAULT 'simple',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tripId" TEXT NOT NULL,
    "expenseId" TEXT,
    "uploaderUserId" TEXT NOT NULL,
    CONSTRAINT "receipts_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "receipts_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "receipts_uploaderUserId_fkey" FOREIGN KEY ("uploaderUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "receipt_line_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL,
    "totalPrice" DECIMAL NOT NULL,
    "category" TEXT,
    "notes" TEXT,
    "splitMethod" TEXT NOT NULL DEFAULT 'equal',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "receiptId" TEXT NOT NULL,
    CONSTRAINT "receipt_line_items_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "receipt_line_item_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    CONSTRAINT "receipt_line_item_participants_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "receipt_line_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "receipt_line_item_participants_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "retailer_lookup_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "externalId" TEXT,
    "resultJson" TEXT NOT NULL,
    "error" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "discord_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discordUserId" TEXT NOT NULL,
    "discordUsername" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "discord_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "discord_link_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "discordUserId" TEXT NOT NULL,
    "discordUsername" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "discord_link_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "payment_methods_userId_idx" ON "payment_methods"("userId");
CREATE INDEX "payment_methods_provider_idx" ON "payment_methods"("provider");
CREATE INDEX "receipts_tripId_idx" ON "receipts"("tripId");
CREATE INDEX "receipts_expenseId_idx" ON "receipts"("expenseId");
CREATE INDEX "receipts_uploaderUserId_idx" ON "receipts"("uploaderUserId");
CREATE INDEX "receipts_tripId_status_idx" ON "receipts"("tripId", "status");
CREATE INDEX "receipt_line_items_receiptId_idx" ON "receipt_line_items"("receiptId");
CREATE UNIQUE INDEX "receipt_line_item_participants_lineItemId_participantId_role_key" ON "receipt_line_item_participants"("lineItemId", "participantId", "role");
CREATE INDEX "receipt_line_item_participants_participantId_idx" ON "receipt_line_item_participants"("participantId");
CREATE UNIQUE INDEX "retailer_lookup_cache_provider_query_externalId_key" ON "retailer_lookup_cache"("provider", "query", "externalId");
CREATE INDEX "retailer_lookup_cache_expiresAt_idx" ON "retailer_lookup_cache"("expiresAt");
CREATE UNIQUE INDEX "discord_accounts_discordUserId_key" ON "discord_accounts"("discordUserId");
CREATE UNIQUE INDEX "discord_accounts_userId_key" ON "discord_accounts"("userId");
CREATE INDEX "discord_accounts_userId_idx" ON "discord_accounts"("userId");
CREATE UNIQUE INDEX "discord_link_tokens_tokenHash_key" ON "discord_link_tokens"("tokenHash");
CREATE INDEX "discord_link_tokens_discordUserId_idx" ON "discord_link_tokens"("discordUserId");
CREATE INDEX "discord_link_tokens_expiresAt_idx" ON "discord_link_tokens"("expiresAt");
