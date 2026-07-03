#!/usr/bin/env bun
/**
 * Cleanup script for stuck "live" sessions
 * Run this if you have sessions stuck in "thinking" state
 */

const PORT = process.env.PORT || "3000";
const API_URL = `http://localhost:${PORT}`;

async function cleanupStaleSessions() {
  try {
    // Try with auth token from env or localStorage simulation
    const token = process.env.AUTH_TOKEN || "local";

    const response = await fetch(`${API_URL}/api/sessions/cleanup-stale`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`❌ Failed: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(text);
      process.exit(1);
    }

    const result = await response.json();
    console.log(`✅ ${result.message}`);

    if (result.cleaned > 0) {
      console.log(`\n🔄 Refresh your browser to see the changes`);
    } else {
      console.log(`\n✨ No stale sessions found`);
    }
  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  }
}

console.log(`🧹 Cleaning up stale sessions from ${API_URL}...\n`);
cleanupStaleSessions();
