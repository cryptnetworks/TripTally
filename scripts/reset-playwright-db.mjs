import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

function sqlitePathFromDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL || "file:./playwright.db";
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Playwright database reset expects a SQLite DATABASE_URL.");
  }

  const rawPath = databaseUrl.slice("file:".length);
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(rawPath);
}

const dbPath = sqlitePathFromDatabaseUrl();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.rmSync(dbPath, { force: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = OFF;");

const migrationsDir = path.resolve("prisma/migrations");
for (const entry of fs.readdirSync(migrationsDir).sort()) {
  const migrationPath = path.join(migrationsDir, entry, "migration.sql");
  if (!fs.existsSync(migrationPath)) continue;
  db.exec(fs.readFileSync(migrationPath, "utf8"));
}

db.exec("PRAGMA foreign_keys = ON;");
db.close();
