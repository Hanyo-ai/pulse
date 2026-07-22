import { useState, useEffect, useRef, useCallback } from "react";
import { t, useTranslation } from "../i18n";
import type { GatewayKey } from "../types";

const COL_MIN_WIDTH = 40;

function useColumnResize(initialWidths: number[]) {
  const [widths, setWidths] = useState<number[]>(initialWidths);
  const resizing = useRef<{ idx: number; startX: number; startW: number } | null>(null);

  const onMouseDown = useCallback((idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = { idx, startX: e.clientX, startW: widths[idx]! };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [widths]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizing.current) return;
      const { idx, startX, startW } = resizing.current;
      const newW = Math.max(COL_MIN_WIDTH, startW + (e.clientX - startX));
      setWidths((prev) => {
        const next = [...prev];
        next[idx] = newW;
        return next;
      });
    };
    const onMouseUp = () => {
      if (resizing.current) {
        resizing.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return { widths, onMouseDown, resizingRef: resizing };
}

function parseModels(modelsJson: string): string[] {
  try {
    const arr = JSON.parse(modelsJson || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

interface EditState {
  id: number;
  name: string;
  models: string[]; // empty = all
  modelInput: string;
}

export function Keys({ token }: { token: string }) {
  useTranslation();
  const [keys, setKeys] = useState<GatewayKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<number | "new" | null>(null);

  const copyKey = (id: number | "new", text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newModels, setNewModels] = useState<string[]>([]);
  const [newModelInput, setNewModelInput] = useState("");
  const [createdKey, setCreatedKey] = useState<GatewayKey | null>(null);

  // Edit state
  const [edit, setEdit] = useState<EditState | null>(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = async () => {
    try {
      const res = await fetch("/api/keys", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setKeys(await res.json());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createKey = async () => {
    const res = await fetch("/api/keys", {
      method: "POST", headers,
      body: JSON.stringify({ name: newName || "key", models: newModels }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "create failed"); return; }
    setCreatedKey(data);
    setNewName(""); setNewModels([]); setNewModelInput(""); setShowCreate(false);
    load();
  };

  const saveEdit = async () => {
    if (!edit) return;
    const res = await fetch(`/api/keys/${edit.id}`, {
      method: "PUT", headers,
      body: JSON.stringify({ name: edit.name, models: edit.models }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "save failed"); return; }
    setEdit(null);
    load();
  };

  const deleteKey = async (k: GatewayKey) => {
    if (!confirm(t("keys.confirmDelete", { name: k.name || k.key_masked }))) return;
    await fetch(`/api/keys/${k.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const addModelTo = (list: string[], input: string, setList: (v: string[]) => void, setInput: (v: string) => void) => {
    const m = input.trim();
    if (m && !list.includes(m)) setList([...list, m]);
    setInput("");
  };

  const modelChips = (models: string[], onRemove?: (m: string) => void) => (
    <div className="chips">
      {models.map((m) => (
        <span key={m} className="chip">
          {m}
          {onRemove && (
            <button className="chip-x" onClick={() => onRemove(m)}>×</button>
          )}
        </span>
      ))}
      {models.length === 0 && (
        <span className="chips-empty">{t("keys.allModels")}</span>
      )}
    </div>
  );

  // Column widths — align with Endpoints table
  const { widths, onMouseDown, resizingRef } = useColumnResize([
    160,  // Name
    260,  // Key
    320,  // Allowed Models
    160,  // Actions
  ]);

  if (loading) return <div className="empty-state">{t("loading")}</div>;

  return (
    <section className="section active page">
      <div className="page-header">
        <div className="page-title">
          <h2>{t("keys.title")}</h2>
          <p>{t("keys.subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? t("cancel") : t("keys.create")}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

      {/* Created key reveal (shown once) */}
      {createdKey && (
        <div className="alert alert-success" style={{ padding: "14px 16px", marginBottom: 16, borderRadius: "var(--radius)", border: "1px solid var(--green-bg)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{t("keys.createdTitle")}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code
              className="copy-row"
              style={{ fontSize: 13, cursor: "pointer" }}
              title={t("keys.copyFullKey")}
              onClick={() => copyKey("new", createdKey.key || "")}
            >
              {copiedId === "new" ? "✓ " + t("keys.copied") : createdKey.key}
            </code>
            <button className="btn btn-sm" onClick={() => setCreatedKey(null)}>{t("keys.dismiss")}</button>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, fontWeight: 400 }}>{t("keys.createdHint")}</div>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label className="field-label">{t("keys.name")}</label>
              <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. dev-laptop" />
            </div>
            <div>
              <label className="field-label">{t("keys.allowedModels")}</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input" value={newModelInput} onChange={(e) => setNewModelInput(e.target.value)}
                  placeholder={t("keys.modelPlaceholder")}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addModelTo(newModels, newModelInput, setNewModels, setNewModelInput); } }} />
                <button className="btn" onClick={() => addModelTo(newModels, newModelInput, setNewModels, setNewModelInput)}>{t("keys.addModel")}</button>
              </div>
              {modelChips(newModels, (m) => setNewModels(newModels.filter((x) => x !== m)))}
            </div>
            <div>
              <button className="btn btn-primary" onClick={createKey}>{t("keys.createSubmit")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Keys table */}
      <div className="table-wrap">
        <table>
          <colgroup>
            {widths.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {[
                t("keys.name"),
                t("keys.key"),
                t("keys.allowedModels"),
                t("keys.actions"),
              ].map((label, idx) => (
                <th key={idx}>
                  {label}
                  <div
                    className={`col-resize-handle${resizingRef.current?.idx === idx ? " active" : ""}`}
                    onMouseDown={(e) => onMouseDown(idx, e)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => {
              const models = parseModels(k.models);
              const isEditing = edit?.id === k.id;
              return (
                <tr key={k.id} className="table-row-interactive">
                  <td>
                    {isEditing
                      ? <input className="input" style={{ padding: "4px 8px" }} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                      : (k.name || "—")}
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    <span
                      className="clickable-key"
                      title={t("keys.copyFullKey")}
                      onClick={() => copyKey(k.id, k.key || k.key_masked)}
                    >
                      {copiedId === k.id ? "✓ " + t("keys.copied") : k.key_masked}
                    </span>
                  </td>
                  <td>
                    {isEditing ? (
                      <div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <input className="input" style={{ padding: "4px 8px" }} value={edit.modelInput}
                            onChange={(e) => setEdit({ ...edit, modelInput: e.target.value })}
                            placeholder={t("keys.modelPlaceholder")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addModelTo(
                                  edit.models,
                                  edit.modelInput,
                                  (v) => setEdit({ ...edit, models: v }),
                                  (v) => setEdit({ ...edit, modelInput: v })
                                );
                              }
                            }} />
                        </div>
                        {modelChips(edit.models, (m) => setEdit({ ...edit, models: edit.models.filter((x) => x !== m) }))}
                      </div>
                    ) : (
                      modelChips(models)
                    )}
                  </td>
                  <td style={{ overflow: "visible", whiteSpace: "normal" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {isEditing ? (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={saveEdit}>{t("save")}</button>
                          <button className="btn btn-sm" onClick={() => setEdit(null)}>{t("cancel")}</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-sm"
                            onClick={() => setEdit({ id: k.id, name: k.name, models, modelInput: "" })}>{t("edit")}</button>
                          <button className="btn btn-sm btn-danger" onClick={() => deleteKey(k)}>{t("delete")}</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {keys.length === 0 && (
              <tr><td colSpan={4} className="empty-state">{t("keys.empty")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
