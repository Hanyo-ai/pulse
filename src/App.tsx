import { useState, useEffect, useCallback } from "react";
import "./index.css";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { SessionMonitor } from "./components/SessionMonitor";
import { AuditLogs } from "./components/AuditLogs";
import { Endpoints } from "./components/Endpoints";
import { Usage } from "./components/Usage";
import { LoginPage } from "./components/LoginPage";
import UserManagement from "./components/UserManagement";
import type { Section, Session, Message, User } from "./types";

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export function App() {
  const [section, setSection] = useState<Section>("session-monitor");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");

  // Session monitor state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        setToken(savedToken);
        setUser(parsedUser);
        // Validate token is still valid
        fetch("/api/auth/me", { headers: authHeaders(savedToken) }).then((res) => {
          if (!res.ok) {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user");
            setUser(null);
            setToken("");
          }
        });
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Fetch sessions when user is logged in
  useEffect(() => {
    if (!token) return;
    fetch("/api/sessions", { headers: authHeaders(token) })
      .then((r) => {
        if (r.status === 401) {
          handleLogout();
          return null;
        }
        return r.json();
      })
      .then((data: Session[] | null) => {
        if (!data) return;
        setSessions(data);
        if (data.length > 0) setActiveSessionId(data[0]!.id);
      })
      .catch(console.error);
  }, [token]);

  const fetchMessages = useCallback(
    (sessionId: string) => {
      if (!token) return;
      fetch(`/api/sessions/${sessionId}/messages`, { headers: authHeaders(token) })
        .then((r) => r.json())
        .then(setMessages)
        .catch(console.error);
    },
    [token]
  );

  useEffect(() => {
    if (activeSessionId) fetchMessages(activeSessionId);
  }, [activeSessionId, fetchMessages]);

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    fetchMessages(id);
  };

  const handleLogin = (loggedInUser: User, authToken: string) => {
    setUser(loggedInUser);
    setToken(authToken);
  };

  const handleLogout = async () => {
    if (token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: authHeaders(token),
      }).catch(() => {});
    }
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setUser(null);
    setToken("");
    setSessions([]);
    setMessages([]);
  };

  const navigate = (s: Section) => {
    setSection(s);
    setSidebarOpen(false);
  };

  const activeCount = sessions.filter((s) => s.status === "live").length;

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const isAdmin = user.role === "admin";

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
          onLogout={handleLogout}
          token={token}
        />

        <div className="content">
          {section === "session-monitor" && (
            <SessionMonitor
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              messages={messages}
              token={token}
            />
          )}
          {section === "logs" && <AuditLogs token={token} />}
          {isAdmin && section === "endpoints" && <Endpoints token={token} />}
          {section === "usage" && <Usage token={token} />}
          {isAdmin && section === "users" && (
            <UserManagement token={token} currentUser={user} />
          )}
          {!isAdmin && (section === "endpoints" || section === "users") && (
            <div style={{ padding: "2rem", color: "var(--muted)" }}>无权访问</div>
          )}
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
        {isAdmin && (
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
        )}
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
