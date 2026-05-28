ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
ALTER TABLE "users" ADD COLUMN "disabledAt" DATETIME;
ALTER TABLE "users" ADD COLUMN "lastLoginAt" DATETIME;

UPDATE "users"
SET "role" = 'admin'
WHERE "id" = (
  SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1
);

CREATE TABLE "user_auth_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_auth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "auth_provider_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT,
    "encryptedClientSecret" TEXT,
    "scopesJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "oauth_login_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "oauth_login_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadataJson" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "user_auth_accounts_providerId_providerAccountId_key" ON "user_auth_accounts"("providerId", "providerAccountId");
CREATE UNIQUE INDEX "user_auth_accounts_userId_providerId_key" ON "user_auth_accounts"("userId", "providerId");
CREATE INDEX "user_auth_accounts_userId_idx" ON "user_auth_accounts"("userId");
CREATE UNIQUE INDEX "oauth_login_tokens_tokenHash_key" ON "oauth_login_tokens"("tokenHash");
CREATE INDEX "oauth_login_tokens_userId_idx" ON "oauth_login_tokens"("userId");
CREATE INDEX "oauth_login_tokens_expiresAt_idx" ON "oauth_login_tokens"("expiresAt");
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_disabledAt_idx" ON "users"("disabledAt");

INSERT INTO "auth_provider_configs" ("id", "name", "enabled", "clientId", "encryptedClientSecret", "scopesJson", "updatedAt") VALUES
  ('google', 'Google', false, NULL, NULL, '["openid","email","profile"]', CURRENT_TIMESTAMP),
  ('github', 'GitHub', false, NULL, NULL, '["read:user","user:email"]', CURRENT_TIMESTAMP),
  ('discord', 'Discord', false, NULL, NULL, '["identify","email"]', CURRENT_TIMESTAMP),
  ('facebook', 'Facebook', false, NULL, NULL, '["email","public_profile"]', CURRENT_TIMESTAMP);

INSERT INTO "app_settings" ("key", "value", "updatedAt") VALUES
  ('localAuthEnabled', 'true', CURRENT_TIMESTAMP),
  ('publicRegistrationEnabled', 'true', CURRENT_TIMESTAMP),
  ('requireEmailVerification', 'true', CURRENT_TIMESTAMP),
  ('allowedEmailDomains', '', CURRENT_TIMESTAMP),
  ('defaultUserRole', 'user', CURRENT_TIMESTAMP);
