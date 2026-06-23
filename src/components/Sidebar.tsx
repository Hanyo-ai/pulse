import type { Section, User } from "../types";

interface SidebarProps {
  activeSection: Section;
  onNavigate: (section: Section) => void;
  sessionCount: number;
  user: User | null;
  open?: boolean;
}

export function Sidebar({ activeSection, onNavigate, sessionCount, user, open }: SidebarProps) {
  return (
    <aside className={`sidebar${open ? " open" : ""}`} id="sidebar">
      <div className="sidebar-brand">
        <div className="logo-mark">S</div>
        <span className="logo-text">SYLVOR</span>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">监控</div>
        <button
          className={activeSection === "session-monitor" ? "active" : ""}
          onClick={() => onNavigate("session-monitor")}
        >
          <svg className="nav-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="1" y="1" width="16" height="16" rx="3" />
            <circle cx="9" cy="9" r="2" />
            <line x1="9" y1="4" x2="9" y2="7" />
          </svg>
          Session 监控
          <span className="nav-badge">{sessionCount}</span>
        </button>
        <button
          className={activeSection === "logs" ? "active" : ""}
          onClick={() => onNavigate("logs")}
        >
          <svg className="nav-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="2" y="2" width="14" height="14" rx="2" />
            <line x1="6" y1="6" x2="12" y2="6" />
            <line x1="6" y1="9" x2="12" y2="9" />
          </svg>
          审计日志
        </button>
        <div className="nav-section">管理</div>
        <button
          className={activeSection === "endpoints" ? "active" : ""}
          onClick={() => onNavigate("endpoints")}
        >
          <svg className="nav-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="9" cy="9" r="3" />
            <path d="M9 1v3m0 10v3M1 9h3m10 0h3" />
          </svg>
          Endpoints
        </button>
        <button
          className={activeSection === "usage" ? "active" : ""}
          onClick={() => onNavigate("usage")}
        >
          <svg className="nav-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="2" y="10" width="3" height="6" rx="0.5" />
            <rect x="7.5" y="5" width="3" height="11" rx="0.5" />
          </svg>
          Usage
        </button>
      </nav>
      <div className="sidebar-footer">
        <div className="avatar">{user?.display_name?.[0] || "A"}</div>
        <div>
          <strong>{user?.display_name || "Admin"}</strong>
          <br />
          sylvor-prod
        </div>
      </div>
    </aside>
  );
}
