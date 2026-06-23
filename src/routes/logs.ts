import { Elysia } from "elysia";
import { getDb } from "../db";
import { requireAuth } from "../middleware/auth";

export const logsRoutes = new Elysia({ prefix: "/api/logs" })
  .get("/", ({ query, headers }) => {
    const result = requireAuth(headers["authorization"] ?? null);
    if (result instanceof Response) return result;

    const db = getDb();
    const { provider, status, limit } = query as {
      provider?: string;
      status?: string;
      limit?: string;
    };

    let sql = "SELECT rl.* FROM request_logs rl";
    const params: unknown[] = [];

    if (result.user.role !== "admin") {
      // Non-admins see only logs tied to their sessions
      sql +=
        " INNER JOIN sessions s ON rl.session_id = s.id AND s.user_id = ?";
      params.push(result.user.id);
      sql += " WHERE 1=1";
    } else {
      sql += " WHERE 1=1";
    }

    if (provider && provider !== "全部供应商") {
      sql += " AND rl.provider = ?";
      params.push(provider);
    }
    if (status) {
      if (status === "2xx") {
        sql += " AND rl.status_code >= 200 AND rl.status_code < 300";
      } else if (status === "4xx") {
        sql += " AND rl.status_code >= 400 AND rl.status_code < 500";
      } else if (status === "5xx") {
        sql += " AND rl.status_code >= 500 AND rl.status_code < 600";
      }
    }
    sql += " ORDER BY rl.created_at DESC";
    sql += ` LIMIT ${limit ? parseInt(limit) : 100}`;

    return db.query(sql).all(...params);
  });
