#!/usr/bin/env bun
/**
 * Direct database cleanup for stuck "live" sessions
 * Run this when the server is not running
 */

import { Database } from "bun:sqlite";
import path from "path";

const dbPath = process.env.DB_PATH || path.join(import.meta.dir, "../pulse.db");

try {
  const db = new Database(dbPath);

  console.log(`🔍 Checking database at: ${dbPath}\n`);

  // Check for stale sessions
  const staleSessions = db.query(
    "SELECT id, title, status, updated_at FROM sessions WHERE status = 'live'"
  ).all() as Array<{ id: string; title: string; status: string; updated_at: string }>;

  if (staleSessions.length === 0) {
    console.log("✨ No live sessions found");
    process.exit(0);
  }

  console.log(`Found ${staleSessions.length} live session(s):\n`);
  staleSessions.forEach((s) => {
    console.log(`  - ${s.id}`);
    console.log(`    Title: ${s.title}`);
    console.log(`    Last updated: ${s.updated_at}\n`);
  });

  // Update all live sessions to idle
  const result = db.run(
    "UPDATE sessions SET status = 'idle' WHERE status = 'live'"
  );

  console.log(`✅ Cleaned up ${result.changes} session(s)`);
  console.log(`\n🔄 Restart your server and refresh your browser`);

  db.close();
} catch (error) {
  console.error(`❌ Error:`, error);
  process.exit(1);
}
