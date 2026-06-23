import { useState, useEffect } from "react";
import type { Section } from "../types";

interface TopbarProps {
  activeSection: Section;
  onNavigate: (section: Section) => void;
  onToggleSidebar: () => void;
  activeSessions: number;
}

const SECTION_TITLES: Record<Section, string> = {
  "session-monitor": "Session 实时监控",
  logs: "审计日志",
  endpoints: "Endpoints",
  usage: "Usage 用量分析",
  login: "登录",
};

export function Topbar({ activeSection, onNavigate, onToggleSidebar, activeSessions }: TopbarProps) {
  const [totalRequests, setTotalRequests] = useState("—");
  const [monthlyCost, setMonthlyCost] = useState("—");

  useEffect(() => {
    fetch("/api/usage/stats")
      .then((r) => r.json())
      .then((data) => {
        setTotalRequests(data.totalRequests || "0");
        setMonthlyCost(data.estimatedCost || "$0.00");
      })
      .catch(console.error);
  }, []);

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
      <h2>{SECTION_TITLES[activeSection]}</h2>
      <div className="metrics-strip">
        <div className="met">
          <span className="val">{activeSessions}</span>
          <span className="lbl">活跃</span>
        </div>
        <div className="met">
          <span className="val">{totalRequests}</span>
          <span className="lbl">请求</span>
        </div>
        <div className="met">
          <span className="val">{monthlyCost}</span>
          <span className="lbl">月成本</span>
        </div>
      </div>
    </div>
  );
}
