import type { ServerWebSocket } from "bun";

// Track connected dashboard clients
const clients = new Set<ServerWebSocket<{ kind: string }>>();

export function wsRegister(ws: ServerWebSocket<{ kind: string }>) {
  clients.add(ws);
}

export function wsUnregister(ws: ServerWebSocket<{ kind: string }>) {
  clients.delete(ws);
}

function broadcast(data: object) {
  const msg = JSON.stringify(data);
  for (const ws of clients) {
    try {
      if (ws.readyState === 1) ws.send(msg);
    } catch {
      clients.delete(ws);
    }
  }
}

/** Called after any session is created or updated */
export function notifySessionsChanged() {
  broadcast({ type: "sessions_updated" });
}

/** Called after messages are appended to a session */
export function notifyMessagesChanged(sessionId: string) {
  broadcast({ type: "messages_updated", sessionId });
}
