import { useState } from "react";
import type { User } from "../types";
import { useTranslation } from "../i18n";

interface LoginPageProps {
  onLogin: (user: User, token: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || t("login.error"));
      return;
    }

    // Store token and user in localStorage
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    onLogin(data.user, data.token);
  };

  return (
    <section className="section active" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{ width: "380px", maxWidth: "90%" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            className="logo-mark"
            style={{ width: "48px", height: "48px", margin: "0 auto 12px", fontSize: "22px" }}
          >
            S
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 650 }}>PULSE AI Gateway</h2>
          <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "4px" }}>
            {t("login.title")}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {error && (
            <div style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", background: "oklch(95% 0.04 25)", color: "var(--red)", fontSize: "13px" }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "4px" }}>
              {t("login.username")}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                font: "13px var(--font)",
                background: "var(--bg)",
                color: "var(--fg)",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "4px" }}>
              {t("login.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                font: "13px var(--font)",
                background: "var(--bg)",
                color: "var(--fg)",
                outline: "none",
              }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "10px" }}>
            {t("login.submit")}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "var(--muted)" }}>
          {t("login.needRegister")}
        </p>
      </div>
    </section>
  );
}
