import { Elysia, t } from "elysia";
import { getDb } from "../db";

interface Session {
  id: string;
  title: string;
  provider: string;
  model: string;
  status: string;
  tokens: number;
  latency: string;
  cost: string;
  created_at: string;
}

interface Message {
  id: number;
  session_id: string;
  role: string;
  content: string;
  tokens: number;
  latency: string;
  created_at: string;
}

export const sessionsRoutes = new Elysia({ prefix: "/api/sessions" })
  .get("/", () => {
    const db = getDb();
    return db.query("SELECT * FROM sessions ORDER BY updated_at DESC").all() as Session[];
  })
  .get("/:id", ({ params: { id } }) => {
    const db = getDb();
    const session = db.query("SELECT * FROM sessions WHERE id = ?").get(id) as Session | null;
    if (!session) return new Response("Not found", { status: 404 });
    const messages = db.query("SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC").all(id) as Message[];
    return { ...session, messages };
  })
  .get("/:id/messages", ({ params: { id } }) => {
    const db = getDb();
    return db.query("SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC").all(id) as Message[];
  })
  .post("/", ({ body }) => {
    const db = getDb();
    const { title, provider, model } = body as { title: string; provider: string; model: string };
    const id = `sess_${Date.now().toString(36)}`;
    db.run("INSERT INTO sessions (id, title, provider, model) VALUES (?, ?, ?, ?)", [id, title, provider, model]);
    return db.query("SELECT * FROM sessions WHERE id = ?").get(id);
  })
  .put("/:id", ({ params: { id }, body }) => {
    const db = getDb();
    const { title, provider, model, status } = body as Record<string, string>;
    const fields: string[] = [];
    const values: unknown[] = [];
    if (title) { fields.push("title = ?"); values.push(title); }
    if (provider) { fields.push("provider = ?"); values.push(provider); }
    if (model) { fields.push("model = ?"); values.push(model); }
    if (status) { fields.push("status = ?"); values.push(status); }
    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);
      db.run(`UPDATE sessions SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    return db.query("SELECT * FROM sessions WHERE id = ?").get(id);
  })
  .delete("/:id", ({ params: { id } }) => {
    const db = getDb();
    db.run("DELETE FROM sessions WHERE id = ?", [id]);
    return { success: true };
  })
  .post("/:id/messages", ({ params: { id }, body }) => {
    const db = getDb();
    const { role, content, tokens, latency } = body as { role: string; content: string; tokens?: number; latency?: string };
    db.run("INSERT INTO messages (session_id, role, content, tokens, latency) VALUES (?, ?, ?, ?, ?)",
      [id, role, content, tokens || 0, latency || "—"]);
    db.run("UPDATE sessions SET updated_at = datetime('now') WHERE id = ?", [id]);
    const msgs = db.query("SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC").all(id);
    return msgs;
  });
