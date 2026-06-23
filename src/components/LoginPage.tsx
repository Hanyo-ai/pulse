import { useState } from "react";
import type { User } from "../types";

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const body = isRegister
      ? { username, password, display_name: displayName }
      : { username, password };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "操作失败");
      return;
    }

    if (isRegister) {
      setIsRegister(false);
      setError("");
      setPassword("");
      return;
    }

    onLogin(data.user);
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
          <h2 style={{ fontSize: "20px", fontWeight: 650 }}>SYLVOR AI Gateway</h2>
          <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "4px" }}>
            {isRegister ? "创建新账户" : "登录管理面板"}
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
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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

          {isRegister && (
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "4px" }}>
                显示名称
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
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
          )}

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "4px" }}>
              密码
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
            {isRegister ? "注册" : "登录"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "var(--muted)" }}>
          {isRegister ? "已有账户？" : "没有账户？"}{" "}
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", font: "inherit" }}
          >
            {isRegister ? "去登录" : "去注册"}
          </button>
        </p>
      </div>
    </section>
  );
}
