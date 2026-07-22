import { useState } from "react";
import type { Section, User } from "../types";
import { useTranslation } from "../i18n";

const VERSION = "0.1.10";

interface SidebarProps {
  activeSection: Section;
  onNavigate: (section: Section) => void;
  sessionCount: number;
  user: User | null;
  open?: boolean;
  token: string;
}

export function Sidebar({ activeSection, onNavigate, sessionCount, user, open, token }: SidebarProps) {
  const { t, lang, setLang } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"lang" | "password" | "theme">("lang");
  const [theme, setTheme] = useState<string>(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") || "system";
    }
    return "system";
  });
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const isAdmin = user?.role === "admin";

  const applyTheme = (t: string) => {
    setTheme(t);
    if (t === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", t);
    }
    try { localStorage.setItem("pulse_theme", t); } catch { /* */ }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (newPw !== confirmPw) {
      setPwError(t("settings.passwordMismatch"));
      return;
    }
    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || t("settings.passwordFailed"));
      } else {
        setPwSuccess(t("settings.passwordChanged"));
        setOldPw("");
        setNewPw("");
        setConfirmPw("");
      }
    } catch {
      setPwError(t("settings.passwordFailed"));
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <aside className={`sidebar${open ? " open" : ""}`} id="sidebar">
      <div className="sidebar-brand">
        <div className="logo-mark">⚡</div>
        <span className="logo-text">PULSE</span>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">{t("nav.monitor")}</div>
        <button
          className={activeSection === "session-monitor" ? "active" : ""}
          onClick={() => onNavigate("session-monitor")}
        >
          <svg className="nav-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="1" y="1" width="16" height="16" rx="3" />
            <circle cx="9" cy="9" r="2" />
            <line x1="9" y1="4" x2="9" y2="7" />
          </svg>
          {t("nav.sessionMonitor")}
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
          {t("nav.auditLogs")}
        </button>
        <div className="nav-section">{t("nav.manage")}</div>
        {isAdmin && (
          <button
            className={activeSection === "endpoints" ? "active" : ""}
            onClick={() => onNavigate("endpoints")}
          >
            <svg className="nav-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="9" cy="9" r="3" />
              <path d="M9 1v3m0 10v3M1 9h3m10 0h3" />
            </svg>
            {t("nav.endpoints")}
          </button>
        )}
        {isAdmin && (
          <button
            className={activeSection === "keys" ? "active" : ""}
            onClick={() => onNavigate("keys")}
          >
            <svg className="nav-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="6" cy="9" r="3.5" />
              <path d="M9.5 9H17m-2.5 0v3m-3-3v2" />
            </svg>
            {t("nav.keys")}
          </button>
        )}
        <button
          className={activeSection === "usage" ? "active" : ""}
          onClick={() => onNavigate("usage")}
        >
          <svg className="nav-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="2" y="10" width="3" height="6" rx="0.5" />
            <rect x="7.5" y="5" width="3" height="11" rx="0.5" />
          </svg>
          {t("nav.usage")}
        </button>
        {isAdmin && (
          <button
            className={activeSection === "users" ? "active" : ""}
            onClick={() => onNavigate("users")}
          >
            <svg className="nav-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="6" cy="5" r="2.5" />
              <circle cx="12" cy="5" r="2.5" />
              <path d="M1 15c0-2.5 2-4 5-4s5 1.5 5 4M11 15c0-2.5 2-4 5-4s5 1.5 5 4" />
            </svg>
            {t("nav.users")}
          </button>
        )}
      </nav>
      <div className="sidebar-footer">
        <div className="avatar" onClick={() => setSettingsOpen(true)} style={{ cursor: "pointer" }}>{user?.display_name?.[0] || "A"}</div>
        <div style={{ flex: 1 }}>
          <strong>{user?.display_name || "Admin"}</strong>
          <br />
          <span style={{ fontSize: "0.85em", opacity: 0.7 }}>
            {isAdmin ? t("role.admin") : t("role.user")}
          </span>
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="settings-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            {/* Left sidebar */}
            <div className="settings-sidebar">
              <div className="settings-sidebar-header">
                <h3>{t("settings.title")}</h3>
              </div>
              <nav className="settings-nav">
                <button
                  className={`settings-nav-item${settingsTab === "lang" ? " active" : ""}`}
                  onClick={() => setSettingsTab("lang")}
                >
                  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                    <circle cx="9" cy="9" r="7" />
                    <path d="M1 9h16M9 1c1.8 2.2 2.8 5 2.8 8s-1 5.8-2.8 8M9 1c-1.8 2.2-2.8 5-2.8 8s1 5.8 2.8 8" />
                  </svg>
                  {t("settings.language")}
                </button>
                <button
                  className={`settings-nav-item${settingsTab === "theme" ? " active" : ""}`}
                  onClick={() => setSettingsTab("theme")}
                >
                  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                    <circle cx="9" cy="9" r="4" />
                    <path d="M9 1v2m0 12v2M1 9h2m12 0h2" />
                  </svg>
                  Theme
                </button>
                <button
                  className={`settings-nav-item${settingsTab === "password" ? " active" : ""}`}
                  onClick={() => setSettingsTab("password")}
                >
                  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                    <rect x="3" y="7" width="12" height="9" rx="1.5" />
                    <path d="M6 7V5a3 3 0 016 0v2" />
                    <circle cx="9" cy="11" r="1" fill="currentColor" />
                  </svg>
                  {t("settings.changePassword")}
                </button>
              </nav>
              <div className="settings-sidebar-footer">
                PULSE v{VERSION}
              </div>
            </div>

            {/* Right content */}
            <div className="settings-content">
              <div className="settings-content-header">
                <h3>{settingsTab === "lang" ? t("settings.language") : settingsTab === "theme" ? "Theme" : t("settings.changePassword")}</h3>
                <button className="settings-modal-close" onClick={() => setSettingsOpen(false)}>×</button>
              </div>
              <div className="settings-content-body">
                {settingsTab === "lang" && (
                  <div className="field">
                    <label className="field-label">{t("settings.language")}</label>
                    <select value={lang} onChange={(e) => setLang(e.target.value as "en" | "zh")} className="input settings-select">
                      <option value="en">English</option>
                      <option value="zh">中文</option>
                    </select>
                  </div>
                )}

                {settingsTab === "theme" && (
                  <div className="field">
                    <label className="field-label">Theme</label>
                    <select value={theme} onChange={(e) => applyTheme(e.target.value)} className="input settings-select">
                      <option value="system">🖥 System</option>
                      <option value="light">☀ Light</option>
                      <option value="dark">🌙 Dark</option>
                    </select>
                  </div>
                )}

                {settingsTab === "password" && (
                  <form onSubmit={handleChangePassword}>
                    {pwError && <div className="settings-msg error">{pwError}</div>}
                    {pwSuccess && <div className="settings-msg success">{pwSuccess}</div>}
                    <div className="field">
                      <label className="field-label">{t("settings.oldPassword")}</label>
                      <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} required />
                    </div>
                    <div className="field">
                      <label className="field-label">{t("settings.newPassword")}</label>
                      <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} />
                    </div>
                    <div className="field">
                      <label className="field-label">{t("settings.confirmPassword")}</label>
                      <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={pwLoading} style={{ width: "100%", justifyContent: "center" }}>
                      {pwLoading ? "…" : t("settings.save")}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
