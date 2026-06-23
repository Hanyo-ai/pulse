import { useState, useEffect } from "react";
import type { RequestLog } from "../types";

export function AuditLogs() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("全部供应商");
  const [status, setStatus] = useState("全部状态");

  useEffect(() => {
    fetch("/api/logs")
      .then((r) => r.json())
      .then(setLogs)
      .catch(console.error);
  }, []);

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
              <tr key={l.id}>
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
    </section>
  );
}
