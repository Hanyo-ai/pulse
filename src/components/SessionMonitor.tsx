import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "../i18n";
import type { Session, Message, AssistantResponse } from "../types";

// ====================== SessionBar ======================
interface SessionBarProps {
  sessions: Session[];
  activeSessionId: string;
  onSelect: (id: string) => void;
}

function SessionBar({ sessions, activeSessionId, onSelect }: SessionBarProps) {
  const { t } = useTranslation();
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
          <span className="si-name">{active?.title || t("session.selectSession")}</span>
          <span className="si-provider">{active?.provider || ""}</span>
          <span className="si-chevron">▾</span>
        </button>
        <div className={`sb-dropdown${open ? " open" : ""}`}>
          <div className="sb-search">
            <input
              type="text"
              placeholder={t("session.searchPlaceholder")}
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
          <div className="ss-lbl">{t("usage.avgLatency")}</div>
        </div>
        <div className="ss-item">
          <div className="ss-val">{active?.cost || "—"}</div>
          <div className="ss-lbl">{t("logs.cost")}</div>
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

function parseContent(content: string): AssistantResponse | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed.text === "string") return parsed as AssistantResponse;
  } catch { /* not JSON, plain text */ }
  return null;
}

function ThinkingBlock({ text }: { text: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div className="msg-thinking">
      <button className="msg-thinking-header" onClick={() => setOpen(!open)}>
        <span className="msg-thinking-arrow">{open ? "▾" : "▸"}</span>
        <span>{t("session.thinking")}</span>
      </button>
      {open && <div className="msg-thinking-content">{text}</div>}
    </div>
  );
}

function UsageFooter({ usage, model, stopReason }: { usage?: AssistantResponse["usage"]; model?: string; stopReason?: string }) {
  const { t } = useTranslation();
  if (!usage && !model && !stopReason) return null;
  return (
    <div className="msg-footer">
      {model && <span className="msg-footer-item msg-model-badge">{model}</span>}
      {usage && (
        <>
          <span className="msg-footer-item">{t("session.input")} {usage.input_tokens.toLocaleString()}</span>
          <span className="msg-footer-item">{t("session.output")} {usage.output_tokens.toLocaleString()}</span>
          {(usage.cache_read_input_tokens ?? 0) > 0 && (
            <span className="msg-footer-item msg-cache-hit">{t("session.cacheHit")} {usage.cache_read_input_tokens!.toLocaleString()}</span>
          )}
          {(usage.cache_creation_input_tokens ?? 0) > 0 && (
            <span className="msg-footer-item msg-cache-miss">{t("session.cacheWrite")} {usage.cache_creation_input_tokens!.toLocaleString()}</span>
          )}
        </>
      )}
      {stopReason && <span className="msg-footer-item msg-stop-reason">{stopReason}</span>}
    </div>
  );
}

function ChatPanel({ messages, session }: ChatPanelProps) {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!session) {
    return (
      <div className="chat-panel">
        <div className="chat-empty">{t("session.emptyHint1")}<br />{t("session.emptyHint2")}</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="chat-panel">
        <div className="chat-empty">{t("session.noMessages")}</div>
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
          const structured = isAssistant ? parseContent(msg.content) : null;

          return (
            <div key={msg.id} className={`msg-row ${msg.role}`}>
              <div
                className={`msg-avatar ${msg.role === "user" ? "user" : msg.role === "assistant" ? `assistant ${providerClass}` : "system"}`}
              >
                {msg.role === "user" ? "U" : msg.role === "assistant" ? providerAbbr : "SYS"}
              </div>
              <div>
                {structured ? (
                  <>
                    {structured.thinking && <ThinkingBlock text={structured.thinking} />}
                    <div className="msg-bubble">{structured.text}</div>
                    <UsageFooter usage={structured.usage} model={structured.model} stopReason={structured.stop_reason} />
                    <div className="msg-meta">
                      <span className="msg-tokens">{msg.tokens} tokens</span>
                      <span className="msg-latency">{msg.latency}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="msg-bubble">{msg.content}</div>
                    {hasData && (
                      <div className="msg-meta">
                        <span className="msg-tokens">{msg.tokens} tokens</span>
                        <span className="msg-latency">{msg.latency}</span>
                      </div>
                    )}
                  </>
                )}
                {isBlocked && (
                  <div className="msg-meta">
                    <span className="msg-error">{t("session.blocked")}</span>
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
  token: string;
}

export function SessionMonitor({ sessions, activeSessionId, onSelectSession, messages, token }: SessionMonitorProps) {
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
