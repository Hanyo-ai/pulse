import { Elysia } from "elysia";
import { getDb } from "../db";

interface RequestLog {
  id: number;
  request_id: string;
  session_id: string;
  provider: string;
  model: string;
  status_code: number;
  latency_ms: number;
  tokens: number;
  cost: string;
  created_at: string;
}

export const logsRoutes = new Elysia({ prefix: "/api/logs" })
  .get("/", ({ query }) => {
    const db = getDb();
    const { provider, status, limit } = query as { provider?: string; status?: string; limit?: string };
    let sql = "SELECT * FROM request_logs WHERE 1=1";
    const params: unknown[] = [];

    if (provider && provider !== "全部供应商") {
      sql += " AND provider = ?";
      params.push(provider);
    }
    if (status) {
      if (status === "2xx") {
        sql += " AND status_code >= 200 AND status_code < 300";
      } else if (status === "4xx") {
        sql += " AND status_code >= 400 AND status_code < 500";
      } else if (status === "5xx") {
        sql += " AND status_code >= 500 AND status_code < 600";
      }
    }
    sql += " ORDER BY created_at DESC";
    if (limit) {
      sql += ` LIMIT ${parseInt(limit)}`;
    } else {
      sql += " LIMIT 100";
    }

    return db.query(sql).all(...params) as RequestLog[];
  });
