import { useState, useEffect } from "react";
import type { UsageStats } from "../types";

interface ModelBreakdown {
  model: string;
  provider: string;
  requests: number;
  tokens: number;
  avg_latency: number;
  cost: string;
}

interface TrendPoint {
  day: string;
  provider: string;
  tokens: number;
}

const CHART_W = 780;
const CHART_H = 200;
const CHART_L = 50; // left padding

const providerColors: Record<string, string> = {
  OpenAI: "oklch(58% 0.18 255)",
  Anthropic: "oklch(56% 0.12 170)",
};

function renderChart(trend: TrendPoint[]) {
  if (trend.length === 0) return null;

  // Group by day
  const dayMap = new Map<string, Record<string, number>>();
  const providers = new Set<string>();
  for (const p of trend) {
    providers.add(p.provider);
    if (!dayMap.has(p.day)) dayMap.set(p.day, {});
    dayMap.get(p.day)![p.provider] = p.tokens;
  }
  const days = [...dayMap.keys()].sort();
  const providerList = [...providers];

  // Find max tokens for scaling
  let maxTokens = 0;
  for (const p of trend) {
    if (p.tokens > maxTokens) maxTokens = p.tokens;
  }
  if (maxTokens === 0) maxTokens = 1;

  const scaleY = (v: number) => CHART_H - (v / maxTokens) * (CHART_H - 20);
  const stepX = days.length > 1 ? (CHART_W - CHART_L) / (days.length - 1) : 0;

  // Y-axis labels
  const yLabels = [0, Math.round(maxTokens * 0.5), maxTokens];
  const formatY = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`;

  const dayLabels = days.map((d) => {
    const date = new Date(d + "T00:00:00");
    return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
  });

  return (
    <svg className="chart-area" viewBox={`0 0 ${CHART_W} 240`} preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {yLabels.map((v, i) => {
        const y = scaleY(v);
        return (
          <g key={i}>
            <line x1={CHART_L} y1={y} x2={CHART_W} y2={y} stroke="oklch(94% 0.004 250)" strokeWidth="1" strokeDasharray={i === 0 ? "" : "4 4"} />
            <text x={CHART_L - 6} y={y + 4} fontSize="10" fill="oklch(54% 0.012 250)" textAnchor="end">{formatY(v)}</text>
          </g>
        );
      })}

      {/* Lines per provider */}
      {providerList.map((provider, pi) => {
        const points = days.map((day, di) => {
          const v = dayMap.get(day)?.[provider] || 0;
          return `${CHART_L + di * stepX},${scaleY(v)}`;
        });
        const color = providerColors[provider] || "oklch(58% 0.18 255)";
        const legendX = CHART_W - (providerList.length - pi) * 90;
        return (
          <g key={provider}>
            <polygon points={`${CHART_L},${CHART_H} ${points.join(" ")} ${CHART_L + (days.length - 1) * stepX},${CHART_H}`} fill={`${color} / 0.12`} />
            <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth="2" />
            <text x={legendX} y={scaleY(dayMap.get(days[days.length - 1])?.[provider] || 0) - 6} fontSize="11" fill={color} textAnchor="end" fontWeight="600">{provider}</text>
          </g>
        );
      })}

      {/* Day labels */}
      {days.map((day, di) => (
        <text key={day} x={CHART_L + di * stepX} y={218} fontSize="10" fill="oklch(54% 0.012 250)" textAnchor="middle">{dayLabels[di]}</text>
      ))}
    </svg>
  );
}

export function Usage() {
  const [stats, setStats] = useState<UsageStats>({
    totalTokens: "—",
    totalRequests: "—",
    avgLatency: "—",
    estimatedCost: "—",
  });
  const [breakdown, setBreakdown] = useState<ModelBreakdown[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);

  useEffect(() => {
    fetch("/api/usage/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);

    fetch("/api/usage/by-model")
      .then((r) => r.json())
      .then(setBreakdown)
      .catch(console.error);

    fetch("/api/usage/trend")
      .then((r) => r.json())
      .then(setTrend)
      .catch(console.error);
  }, []);

  return (
    <section className="section active" style={{ overflowY: "auto", padding: "24px" }}>
      <div className="filter-bar">
        <select>
          <option>最近 7 天</option>
          <option>最近 24 小时</option>
          <option>最近 30 天</option>
        </select>
        <select>
          <option>全部供应商</option>
          <option>OpenAI</option>
          <option>Anthropic</option>
        </select>
        <select>
          <option>全部模型</option>
          <option>gpt-4o</option>
          <option>gpt-4o-mini</option>
          <option>claude-sonnet-4</option>
          <option>claude-3-5-haiku</option>
        </select>
      </div>

      <div className="grid-4" style={{ marginBottom: "18px" }}>
        <div className="stat-card">
          <div className="stat-label">总 Token 用量</div>
          <div className="stat-value">{stats.totalTokens}</div>
          <div className="stat-sub" style={{ color: "var(--green)" }}>
            &nbsp;
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">总请求数</div>
          <div className="stat-value">{stats.totalRequests}</div>
          <div className="stat-sub">&nbsp;</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">平均延迟</div>
          <div className="stat-value">{stats.avgLatency}</div>
          <div className="stat-sub" style={{ color: "var(--green)" }}>
            &nbsp;
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">预估成本</div>
          <div className="stat-value">{stats.estimatedCost}</div>
          <div className="stat-sub">&nbsp;</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "18px" }}>
        <div className="card-header">
          <h3>Token 用量趋势</h3>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>单位：tokens</span>
        </div>
        {trend.length > 0 ? (
          renderChart(trend)
        ) : (
          <div style={{ height: "240px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "13px" }}>
            暂无数据
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>按模型拆分</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>模型</th>
                <th>供应商</th>
                <th>请求数</th>
                <th>Token 用量</th>
                <th>平均延迟</th>
                <th>成本</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.length > 0
                ? breakdown.map((b, i) => (
                    <tr key={i}>
                      <td className="mono">{b.model}</td>
                      <td>{b.provider}</td>
                      <td className="mono">{b.requests.toLocaleString()}</td>
                      <td className="mono">{(b.tokens / 1_000_000).toFixed(1)}M</td>
                      <td className="mono">{Math.round(b.avg_latency)}ms</td>
                      <td className="mono">{b.cost || `$${(b.tokens * 0.000015).toFixed(0)}`}</td>
                    </tr>
                  ))
                : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: "24px" }}>暂无数据</td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
