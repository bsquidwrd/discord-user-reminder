import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { CONFIG } from './config.js';

// Ensure the database directory exists
const dbPath = CONFIG.databaseUrl.replace('file:', '');
const dbDir = dirname(dbPath);

try {
  mkdirSync(dbDir, { recursive: true });
} catch (error) {
  // Directory might already exist, ignore error
}

// Use the file path directly instead of the file:// URL
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  timezone TEXT
);

CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  source_guild_id TEXT,
  source_channel_id TEXT,
  source_message_id TEXT,
  message_link TEXT,
  message_excerpt TEXT,
  due_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | sending | sent | canceled | failed
  error_message TEXT -- stores error details when delivery fails
);

CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_at);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
`);

// Add error_message column if it doesn't exist (for existing databases)
try {
  db.exec(`ALTER TABLE reminders ADD COLUMN error_message TEXT`);
} catch (error) {
  // Column might already exist, ignore error
}

export type Reminder = {
  id: number;
  user_id: string;
  source_guild_id?: string | null;
  source_channel_id?: string | null;
  source_message_id?: string | null;
  message_link?: string | null;
  message_excerpt?: string | null;
  due_at: number;
  created_at: number;
  status: 'scheduled' | 'sending' | 'sent' | 'canceled' | 'failed';
  error_message?: string | null;
};

export function insertReminder(data: Omit<Reminder, 'id' | 'created_at' | 'status'>) {
  const stmt = db.prepare(`INSERT INTO reminders (
    user_id, source_guild_id, source_channel_id, source_message_id,
    message_link, message_excerpt, due_at, created_at, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`);
  const now = Math.floor(Date.now() / 1000);
  const info = stmt.run(
    data.user_id,
    data.source_guild_id ?? null,
    data.source_channel_id ?? null,
    data.source_message_id ?? null,
    data.message_link ?? null,
    data.message_excerpt ?? null,
    data.due_at,
    now,
  );
  return info.lastInsertRowid as number;
}

export function getDueReminders(nowEpoch: number, limit: number): Reminder[] {
  const rows = db
    .prepare(
      `SELECT * FROM reminders WHERE status = 'scheduled' AND due_at <= ? ORDER BY due_at ASC LIMIT ?`
    )
    .all(nowEpoch, limit);
  return rows as Reminder[];
}

export function claimReminder(id: number): boolean {
  const res = db.prepare(`UPDATE reminders SET status='sending' WHERE id=? AND status='scheduled'`).run(id);
  return res.changes === 1;
}

export function markReminderStatus(id: number, status: Reminder['status'], errorMessage?: string) {
  if (errorMessage) {
    db.prepare(`UPDATE reminders SET status = ?, error_message = ? WHERE id = ?`).run(status, errorMessage, id);
  } else {
    db.prepare(`UPDATE reminders SET status = ?, error_message = NULL WHERE id = ?`).run(status, id);
  }
}

export function deleteReminder(id: number) {
  db.prepare(`DELETE FROM reminders WHERE id = ?`).run(id);
}

export function getUserReminders(userId: string, opts?: { limit?: number }) {
  return db.prepare(
    `SELECT * FROM reminders WHERE user_id = ? AND status = 'scheduled' ORDER BY due_at ASC LIMIT ?`
  ).all(userId, opts?.limit ?? 25) as Reminder[];
}

export function cancelReminder(id: number) {
  db.prepare(`UPDATE reminders SET status = 'canceled' WHERE id = ?`).run(id);
}

export function rescheduleReminder(id: number, newEpoch: number) {
  db.prepare(`UPDATE reminders SET due_at = ?, status = 'scheduled' WHERE id = ?`).run(newEpoch, id);
}

export function getUserTimezone(userId: string): string | null {
  const row = db.prepare(`SELECT timezone FROM user_settings WHERE user_id = ?`).get(userId) as { timezone?: string } | undefined;
  return row?.timezone ?? null;
}

export function setUserTimezone(userId: string, tz: string) {
  db.prepare(`INSERT INTO user_settings(user_id, timezone) VALUES(?, ?) ON CONFLICT(user_id) DO UPDATE SET timezone=excluded.timezone`).run(userId, tz);
}
