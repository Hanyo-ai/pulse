import { useState, useEffect } from "react";
import type { RequestLog } from "../types";

interface AuditLogsProps {
  token: string;
}

function formatJson(raw: string): string {
  if (!raw) return "(空响应)";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function AuditLogs({ token }: AuditLogsProps) {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("全部供应商");
  const [status, setStatus] = useState("全部状态");
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);

  useEffect(() => {
    fetch("/api/logs", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLogs(data);
      })
      .catch(console.error);
  }, [token]);

  const filtered = logs.filter((l) => {
    if (provider !== "全部供应商" && l.provider !== provider) return false;
    if (search && !l.request_id.toLowerCase().includes(search.toLowerCase())) return false;
    if (status === "2xx" && (l.status_code < 200 || l.status_code >= 300)) return false;
    if (status === "4xx" && (l.status_code < 400 || l.status_code >= 500)) return false;
    if (status === "5xx" && (l.status_code < 500 || l.status_code >= 600)) return false;
    return true;
  });

  const statusClass = (code: number) => {
    if (code >= 200 && code < 300) return "ok";
    if (code >= 400 && code < 500) return "err";
    if (code >= 500) return "warn";
    return "";
  };

  return (
    <section className="section active" style={{ overflowY: "auto", padding: "24px" }}>
      <div className="filter-bar">
        <input
          type="text"
          placeholder="搜索请求 ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option>全部供应商</option>
          <option>OpenAI</option>
          <option>Anthropic</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>全部状态</option>
          <option>2xx</option>
          <option>4xx</option>
          <option>5xx</option>
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>请求 ID</th>
              <th>Session</th>
              <th>供应商</th>
              <th>模型</th>
              <th>状态</th>
              <th>延迟</th>
              <th>Tokens</th>
              <th>成本</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr
                key={l.id}
                className="log-row"
                style={{ cursor: (l.response_body || l.request_body) ? "pointer" : "default" }}
                onClick={() => (l.response_body || l.request_body) && setSelectedLog(l)}
                title={l.response_body || l.request_body ? "点击查看请求/响应" : ""}
              >
                <td className="mono">
                  {new Date(l.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </td>
                <td className="mono">{l.request_id}</td>
                <td className="mono">{l.session_id}</td>
                <td>{l.provider}</td>
                <td className="mono">{l.model}</td>
                <td>
                  <span className={`cell-status ${statusClass(l.status_code)}`}>{l.status_code}</span>
                </td>
                <td className="mono">{l.latency_ms}ms</td>
                <td className="mono">{l.tokens > 0 ? l.tokens.toLocaleString() : "—"}</td>
                <td className="mono">{l.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <div
          className="log-modal-overlay"
          onClick={() => setSelectedLog(null)}
        >
          <div className="log-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="log-modal-header">
              <div>
                <h3>请求详情</h3>
                <div className="log-modal-meta">
                  <span className="mono">{selectedLog.request_id}</span>
                  <span>·</span>
                  <span>{selectedLog.provider}</span>
                  <span>·</span>
                  <span>{selectedLog.model}</span>
                  <span>·</span>
                  <span className={`cell-status ${statusClass(selectedLog.status_code)}`}>{selectedLog.status_code}</span>
                </div>
              </div>
              <button
                className="log-modal-close"
                onClick={() => setSelectedLog(null)}
              >
                ×
              </button>
            </div>
            <div className="log-modal-sections">
              {selectedLog.request_body && (
                <div className="log-modal-section">
                  <div className="log-modal-section-label">Request</div>
                  <pre className="log-modal-body"><code>{formatJson(selectedLog.request_body)}</code></pre>
                </div>
              )}
              {selectedLog.response_body && (
                <div className="log-modal-section">
                  <div className="log-modal-section-label">Response</div>
                  <pre className="log-modal-body"><code>{formatJson(selectedLog.response_body)}</code></pre>
                </div>
              )}
              {!selectedLog.request_body && !selectedLog.response_body && (
                <div style={{ textAlign: "center", color: "var(--muted)", padding: "24px" }}>无请求/响应数据</div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
