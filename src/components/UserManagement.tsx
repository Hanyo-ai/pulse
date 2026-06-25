import React, { useState, useEffect } from "react";
import { useTranslation } from "../i18n";
import type { User } from "../types";

interface UserManagementProps {
  token: string;
  currentUser: User;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  font: "13px var(--font)",
  background: "var(--bg)",
  color: "var(--fg)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--muted)",
  display: "block",
  marginBottom: "4px",
};

export default function UserManagement({ token, currentUser }: UserManagementProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    display_name: "",
    role: "user" as "admin" | "user",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const res = await fetch("/api/auth/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setError("");
    setFormData({ username: "", password: "", display_name: "", role: "user" });
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setError("");
    setFormData({
      username: user.username,
      password: "",
      display_name: user.display_name || "",
      role: user.role,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (editingUser) {
      const updateData: Record<string, unknown> = {};
      if (formData.display_name !== editingUser.display_name) {
        updateData.display_name = formData.display_name;
      }
      if (formData.role !== editingUser.role) {
        updateData.role = formData.role;
      }
      if (formData.password) {
        updateData.password = formData.password;
      }

      const res = await fetch(`/api/auth/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        await loadUsers();
        setShowModal(false);
      } else {
        const data = await res.json();
        setError(data.error || t("users.updateFailed"));
      }
    } else {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await loadUsers();
        setShowModal(false);
      } else {
        const data = await res.json();
        setError(data.error || t("users.createFailed"));
      }
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(t("users.deleteConfirm", { username: user.username }))) return;
    const res = await fetch(`/api/auth/users/${user.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await loadUsers();
    } else {
      const data = await res.json();
      alert(data.error || t("users.deleteFailed"));
    }
  };

  const roleBadgeStyle = (role: string): React.CSSProperties => ({
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "var(--radius-sm)",
    fontSize: "12px",
    fontWeight: 600,
    background: role === "admin" ? "var(--amber)" : "var(--accent-subtle)",
    color: role === "admin" ? "#fff" : "var(--accent)",
  });

  return (
    <section className="section active" style={{ overflowY: "auto", padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <p style={{ color: "var(--muted)", fontSize: "13px" }}>{t("users.title")}</p>
        <button className="btn btn-primary btn-sm" onClick={handleCreate}>{t("users.add")}</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("users.colUsername")}</th>
              <th>{t("users.colDisplayName")}</th>
              <th>{t("users.colRole")}</th>
              <th>{t("users.colCreated")}</th>
              <th style={{ width: "160px" }}>{t("users.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: "24px" }}>{t("users.noUsers")}</td>
              </tr>
            ) : users.map((user) => (
              <tr key={user.id}>
                <td className="mono">{user.username}</td>
                <td>{user.display_name || "—"}</td>
                <td>
                  <span style={roleBadgeStyle(user.role)}>
                    {user.role === "admin" ? t("role.admin") : t("role.user")}
                  </span>
                </td>
                <td className="mono">{user.created_at ? new Date(user.created_at).toLocaleDateString("zh-CN") : "—"}</td>
                <td>
                  <button className="btn btn-sm" style={{ marginRight: "6px" }} onClick={() => handleEdit(user)}>
                    {t("users.edit")}
                  </button>
                  {user.id !== currentUser.id && (
                    <button
                      className="btn btn-sm"
                      style={{ color: "var(--red)", borderColor: "var(--red)" }}
                      onClick={() => handleDelete(user)}
                    >
                      {t("users.delete")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 500,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="card"
            style={{ width: "420px", maxWidth: "92%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 650 }}>{editingUser ? t("users.editUser") : t("users.newUser")}</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "18px", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: "var(--radius-sm)",
                background: "oklch(95% 0.04 25)", color: "var(--red)",
                fontSize: "13px", marginBottom: "16px",
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>{t("users.colUsername")}</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!!editingUser}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>
                  {t("users.password")} {editingUser ? t("users.passwordHint") : ""}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>{t("users.colDisplayName")}</label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>{t("users.colRole")}</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "user" })}
                  style={inputStyle}
                >
                  <option value="user">{t("role.user")}</option>
                  <option value="admin">{t("role.admin")}</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "6px" }}>
                <button type="button" className="btn" style={{ border: "1px solid var(--border)" }} onClick={() => setShowModal(false)}>
                  {t("users.cancel")}
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? t("users.update") : t("users.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
