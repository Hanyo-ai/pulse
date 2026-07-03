#!/usr/bin/env bun
/**
 * Migration script: Add system messages to existing sessions from request logs
 * Run this to retroactively add system prompts to old sessions
 */

import { Database } from "bun:sqlite";
import path from "path";

const dbPath = process.env.DB_PATH || path.join(import.meta.dir, "../pulse.db");

try {
  const db = new Database(dbPath);

  console.log(`🔍 Checking database at: ${dbPath}\n`);

  // Find all sessions that don't have a system message but have request logs with system field
  const sessions = db.query(`
    SELECT DISTINCT s.id, s.title, rl.request_body
    FROM sessions s
    JOIN request_logs rl ON rl.session_id = s.id
    WHERE NOT EXISTS (
      SELECT 1 FROM messages m
      WHERE m.session_id = s.id AND m.role = 'system'
    )
    AND rl.request_body LIKE '%"system":%'
    ORDER BY s.created_at DESC
  `).all() as Array<{ id: string; title: string; request_body: string }>;

  if (sessions.length === 0) {
    console.log("✨ No sessions need system message migration");
    process.exit(0);
  }

  console.log(`Found ${sessions.length} session(s) with system prompts:\n`);

  let migrated = 0;
  for (const session of sessions) {
    try {
      const body = JSON.parse(session.request_body);
      const systemPrompt = body.system;

      if (systemPrompt && typeof systemPrompt === "string") {
        // Insert system message as the first message
        db.run(
          `INSERT INTO messages (session_id, role, content, tokens, latency, created_at)
           SELECT ?, 'system', ?, 0, '—', MIN(created_at)
           FROM messages WHERE session_id = ?`,
          [session.id, systemPrompt, session.id]
        );

        console.log(`  ✅ ${session.id} - ${session.title}`);
        migrated++;
      }
    } catch (error) {
      console.log(`  ⚠️  ${session.id} - Failed to parse: ${error}`);
    }
  }

  console.log(`\n✅ Migrated ${migrated} session(s)`);
  console.log(`\n🔄 Refresh your browser to see the system messages`);

  db.close();
} catch (error) {
  console.error(`❌ Error:`, error);
  process.exit(1);
}
