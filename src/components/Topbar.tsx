import { useState, useEffect } from "react";
import type { Section } from "../types";
import { useTranslation } from "../i18n";

interface TopbarProps {
  activeSection: Section;
  onNavigate: (section: Section) => void;
  onToggleSidebar: () => void;
  activeSessions: number;
  onLogout: () => void;
  token: string;
}

export function Topbar({ activeSection, onNavigate, onToggleSidebar, activeSessions, onLogout, token }: TopbarProps) {
  const { t } = useTranslation();
  const [totalRequests, setTotalRequests] = useState("—");
  const [monthlyCost, setMonthlyCost] = useState("—");

  const sectionTitle = (() => {
    switch (activeSection) {
      case "session-monitor": return t("topbar.sessionMonitor");
      case "logs": return t("topbar.auditLogs");
      case "endpoints": return t("topbar.endpoints");
      case "usage": return t("topbar.usage");
      case "users": return t("topbar.users");
      case "login": return t("topbar.login");
    }
  })();

  useEffect(() => {
    fetch("/api/usage/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setTotalRequests(data.totalRequests || "0");
        setMonthlyCost(data.estimatedCost || "$0.00");
      })
      .catch(console.error);
  }, [token]);

  return (
    <div className="topbar">
      <button className="hamburger" onClick={onToggleSidebar} aria-label="Menu">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="3" y1="5" x2="17" y2="5" />
          <line x1="3" y1="10" x2="17" y2="10" />
          <line x1="3" y1="15" x2="17" y2="15" />
        </svg>
      </button>
      {activeSection === "session-monitor" && <div className="live-dot" />}
      <h2>{sectionTitle}</h2>
      <div style={{ flex: 1 }} />
      <div className="metrics-strip">
        <a
          href="https://github.com/Bryxen-ai/pulse"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
          title="GitHub"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="18" height="18">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
        <div className="met">
          <span className="val">{activeSessions}</span>
          <span className="lbl">{t("topbar.active")}</span>
        </div>
        <div className="met">
          <span className="val">{totalRequests}</span>
          <span className="lbl">{t("topbar.requests")}</span>
        </div>
        <div className="met">
          <span className="val">{monthlyCost}</span>
          <span className="lbl">{t("topbar.monthlyCost")}</span>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            cursor: "pointer",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            background: "var(--bg)",
            color: "var(--fg)",
          }}
        >
          {t("topbar.logout")}
        </button>
      </div>
    </div>
  );
}
