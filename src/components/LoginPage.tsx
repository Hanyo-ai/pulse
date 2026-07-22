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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section active login-page">
      <div className="card login-card">
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="logo-mark">⚡</div>
          <h2 style={{ fontSize: 20, fontWeight: 650, letterSpacing: "-0.01em" }}>PULSE AI Gateway</h2>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            {t("login.title")}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {error && <div className="alert alert-error">{error}</div>}

          <div>
            <label className="field-label">{t("login.username")}</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="field-label">{t("login.password")}</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: 10 }}
          >
            {loading ? "…" : t("login.submit")}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
          {t("login.needRegister")}
        </p>
      </div>
    </section>
  );
}
