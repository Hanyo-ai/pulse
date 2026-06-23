import { Elysia } from "elysia";
import { getDb } from "../db";

export const usageRoutes = new Elysia({ prefix: "/api/usage" })
  .get("/stats", ({ query }) => {
    const db = getDb();
    const { period } = query as { period?: string };

    const totalTokens = (db.query("SELECT COALESCE(SUM(tokens), 0) as val FROM request_logs").get() as { val: number }).val;
    const totalRequests = (db.query("SELECT COUNT(*) as val FROM request_logs").get() as { val: number }).val;
    const avgLatency = (db.query("SELECT COALESCE(AVG(latency_ms), 0) as val FROM request_logs").get() as { val: number }).val;

    // Calculate cost from request_logs (cost stored as "$0.018" format)
    const rows = db.query("SELECT cost FROM request_logs WHERE cost IS NOT NULL AND cost != '—'").all() as { cost: string }[];
    let totalCost = 0;
    for (const r of rows) {
      const num = parseFloat(r.cost.replace(/[^0-9.]/g, ""));
      if (!isNaN(num)) totalCost += num;
    }

    return {
      totalTokens: totalTokens.toLocaleString(),
      totalRequests: totalRequests.toLocaleString(),
      avgLatency: `${Math.round(avgLatency)}ms`,
      estimatedCost: totalCost > 0 ? `$${totalCost.toFixed(2)}` : "$0.00",
    };
  })
  .get("/by-model", () => {
    const db = getDb();
    return db.query(`
      SELECT model, provider, COUNT(*) as requests, COALESCE(SUM(tokens), 0) as tokens,
             COALESCE(AVG(latency_ms), 0) as avg_latency,
             cost
      FROM request_logs
      GROUP BY model, provider
      ORDER BY tokens DESC
    `).all();
  })
  .get("/trend", () => {
    const db = getDb();
    // Daily trend for the last 7 days
    return db.query(`
      SELECT date(created_at) as day, provider, COALESCE(SUM(tokens), 0) as tokens
      FROM request_logs
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY date(created_at), provider
      ORDER BY day ASC
    `).all();
  });
