import { useState, useEffect, useRef, useCallback } from "react";
import type { Session, Message } from "../types";

// ====================== SessionBar ======================
interface SessionBarProps {
  sessions: Session[];
  activeSessionId: string;
  onSelect: (id: string) => void;
}

function SessionBar({ sessions, activeSessionId, onSelect }: SessionBarProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const active = sessions.find((s) => s.id === activeSessionId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const filtered = sessions.filter(
    (s) =>
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.title.toLowerCase().includes(search.toLowerCase())
  );

  const dotClass = (status: string) => {
    if (status === "live") return "live";
    if (status === "error") return "error";
    return "idle";
  };

  return (
    <div className="session-bar">
      <span className="sb-label">Session</span>
      <div className="sb-select" ref={ref}>
        <button
          className={`sb-trigger${open ? " open" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          <span className={`si-dot ${active ? dotClass(active.status) : "live"}`} />
          <span className="si-name">{active?.title || "选择会话"}</span>
          <span className="si-provider">{active?.provider || ""}</span>
          <span className="si-chevron">▾</span>
        </button>
        <div className={`sb-dropdown${open ? " open" : ""}`}>
          <div className="sb-search">
            <input
              type="text"
              placeholder="搜索会话…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div>
            {filtered.map((s) => (
              <div
                key={s.id}
                className={`sb-item${s.id === activeSessionId ? " active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(s.id);
                  setOpen(false);
                }}
              >
                <span className={`si-dot ${dotClass(s.status)}`} />
                <div className="si-info">
                  <div className="si-title">{s.title}</div>
                  <div className="si-sub">
                    {s.provider} · {s.model}
                  </div>
                </div>
                <span className="si-time">
                  {s.updated_at
                    ? new Date(s.updated_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="session-stats">
        <div className="ss-item">
          <div className="ss-val">{active?.tokens?.toLocaleString() || "—"}</div>
          <div className="ss-lbl">Tokens</div>
        </div>
        <div className="ss-item">
          <div className="ss-val">{active?.latency || "—"}</div>
          <div className="ss-lbl">延迟</div>
        </div>
        <div className="ss-item">
          <div className="ss-val">{active?.cost || "—"}</div>
          <div className="ss-lbl">成本</div>
        </div>
      </div>
    </div>
  );
}

// ====================== ChatPanel ======================
interface ChatPanelProps {
  messages: Message[];
  session: Session | null;
}

function ChatPanel({ messages, session }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!session) {
    return (
      <div className="chat-panel">
        <div className="chat-empty">← 从上方下拉菜单中选择一个 Session<br />即可查看实时对话流</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="chat-panel">
        <div className="chat-empty">该会话暂无消息记录</div>
      </div>
    );
  }

  const providerClass = session.provider === "OpenAI" ? "openai" : "anthropic";
  const providerAbbr = session.provider === "OpenAI" ? "OA" : "AN";

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((msg) => {
          const isAssistant = msg.role === "assistant";
          const hasData = isAssistant && msg.tokens > 0;
          const isBlocked = isAssistant && msg.tokens === 0;

          return (
            <div key={msg.id} className={`msg-row ${msg.role}`}>
              <div
                className={`msg-avatar ${msg.role === "user" ? "user" : msg.role === "assistant" ? `assistant ${providerClass}` : "system"}`}
              >
                {msg.role === "user" ? "U" : msg.role === "assistant" ? providerAbbr : "SYS"}
              </div>
              <div>
                <div className="msg-bubble">{msg.content}</div>
                {hasData && (
                  <div className="msg-meta">
                    <span className="msg-tokens">{msg.tokens} tokens</span>
                    <span className="msg-latency">{msg.latency}</span>
                  </div>
                )}
                {isBlocked && (
                  <div className="msg-meta">
                    <span className="msg-error">请求被拦截</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {session.status === "live" && (
          <div className="msg-row assistant">
            <div className={`msg-avatar assistant ${providerClass}`}>{providerAbbr}</div>
            <div className="msg-bubble" style={{ padding: "10px 14px" }}>
              <div className="typing-indicator">
                <div className="dot" />
                <div className="dot" />
                <div className="dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ====================== SessionMonitor ======================
interface SessionMonitorProps {
  sessions: Session[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  messages: Message[];
}

export function SessionMonitor({ sessions, activeSessionId, onSelectSession, messages }: SessionMonitorProps) {
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <section className="section active" style={{ display: "flex", flexDirection: "column" }}>
      <div className="session-monitor">
        <SessionBar sessions={sessions} activeSessionId={activeSessionId} onSelect={onSelectSession} />
        <ChatPanel messages={messages} session={activeSession} />
      </div>
    </section>
  );
}
