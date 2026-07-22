import { useEffect, useRef, useCallback } from "react";

type WSEvent =
  | { type: "sessions_updated" }
  | { type: "messages_updated"; sessionId: string };

export function useWebSocket(onEvent: (event: WSEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${location.host}/ws`);

    ws.onopen = () => {
      // Connection established — ready to receive events
    };

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as WSEvent;
        onEventRef.current(event);
      } catch { /* ignore malformed messages */ }
    };

    ws.onclose = () => {
      // Reconnect after 2s
      setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      ws.close(); // triggers onclose → reconnect
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return wsRef;
}
