import { useState, useEffect, useCallback } from "react";
import "./index.css";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { SessionMonitor } from "./components/SessionMonitor";
import { AuditLogs } from "./components/AuditLogs";
import { Endpoints } from "./components/Endpoints";
import { Usage } from "./components/Usage";
import { LoginPage } from "./components/LoginPage";
import type { Section, Session, Message, User } from "./types";

export function App() {
  const [section, setSection] = useState<Section>("session-monitor");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Session monitor state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);

  // Fetch sessions on mount
  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data: Session[]) => {
        setSessions(data);
        if (data.length > 0) {
          setActiveSessionId(data[0]!.id);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch messages when session changes
  const fetchMessages = useCallback((sessionId: string) => {
    fetch(`/api/sessions/${sessionId}/messages`)
      .then((r) => r.json())
      .then(setMessages)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
    }
  }, [activeSessionId, fetchMessages]);

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    fetchMessages(id);
  };

  const navigate = (s: Section) => {
    setSection(s);
    setSidebarOpen(false);
  };

  const activeCount = sessions.filter((s) => s.status === "live").length;

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <>
      <Sidebar
        activeSection={section}
        onNavigate={navigate}
        sessionCount={activeCount}
        user={user}
        open={sidebarOpen}
      />

      <main className="main">
        <Topbar
          activeSection={section}
          onNavigate={navigate}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeSessions={activeCount}
        />

        <div className="content">
          {section === "session-monitor" && (
            <SessionMonitor
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              messages={messages}
            />
          )}
          {section === "logs" && <AuditLogs />}
          {section === "endpoints" && <Endpoints />}
          {section === "usage" && <Usage />}
        </div>
      </main>

      <nav className="mobile-nav">
        <button
          className={section === "session-monitor" ? "active" : ""}
          onClick={() => navigate("session-monitor")}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="1" y="1" width="18" height="18" rx="3" />
            <circle cx="10" cy="10" r="2.5" />
          </svg>
          会话
        </button>
        <button
          className={section === "endpoints" ? "active" : ""}
          onClick={() => navigate("endpoints")}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="10" cy="10" r="3.5" />
            <path d="M10 1.5v3m0 11v3M1.5 10h3m11 0h3" />
          </svg>
          端点
        </button>
        <button
          className={section === "usage" ? "active" : ""}
          onClick={() => navigate("usage")}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="11" width="3" height="7" rx="0.5" />
            <rect x="8.5" y="6" width="3" height="12" rx="0.5" />
          </svg>
          用量
        </button>
      </nav>
    </>
  );
}

export default App;
