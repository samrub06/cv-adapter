import "server-only";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { DEFAULT_CV_MARKDOWN, markdownToCv } from "@/lib/cv/markdown";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "cv-adapter.db");

function createConnection() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT,
      raw_text TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      contract TEXT NOT NULL DEFAULT '',
      requirements_json TEXT NOT NULL DEFAULT '[]',
      keywords_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      error TEXT,
      fetched_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS master_cv (
      id INTEGER PRIMARY KEY,
      markdown TEXT NOT NULL,
      parsed_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS adapted_cvs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id),
      cv_json TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS outreach_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id),
      recruiter_name TEXT NOT NULL DEFAULT '',
      recruiter_email TEXT NOT NULL DEFAULT '',
      hook_json TEXT NOT NULL DEFAULT '{}',
      subject TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      brevo_message_id TEXT,
      error TEXT,
      created_at INTEGER NOT NULL,
      sent_at INTEGER
    );
  `);
  return drizzle(sqlite, { schema });
}

const globalForDb = globalThis as unknown as {
  db?: ReturnType<typeof createConnection>;
  sqlite?: Database;
  outreachReady?: boolean;
};

export function getDb() {
  if (!globalForDb.db) {
    globalForDb.db = createConnection();
    seedMasterCv(globalForDb.db);
    globalForDb.outreachReady = true;
  } else if (!globalForDb.outreachReady) {
    const sqlite = new Database(DB_PATH);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS outreach_emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL REFERENCES jobs(id),
        recruiter_name TEXT NOT NULL DEFAULT '',
        recruiter_email TEXT NOT NULL DEFAULT '',
        hook_json TEXT NOT NULL DEFAULT '{}',
        subject TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft',
        brevo_message_id TEXT,
        error TEXT,
        created_at INTEGER NOT NULL,
        sent_at INTEGER
      );
    `);
    sqlite.close();
    globalForDb.outreachReady = true;
  }
  return globalForDb.db;
}

function seedMasterCv(db: ReturnType<typeof createConnection>) {
  const existing = db.select().from(schema.masterCv).where(eq(schema.masterCv.id, 1)).all();
  if (existing.length > 0) return;
  const parsed = markdownToCv(DEFAULT_CV_MARKDOWN);
  db.insert(schema.masterCv)
    .values({
      id: 1,
      markdown: DEFAULT_CV_MARKDOWN,
      parsedJson: JSON.stringify(parsed),
      updatedAt: Date.now(),
    })
    .run();
}
