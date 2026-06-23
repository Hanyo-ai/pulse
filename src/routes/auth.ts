import { Elysia, t } from "elysia";
import { getDb } from "../db";

interface User {
  id: number;
  username: string;
  display_name: string;
  role: string;
}

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .post("/login", async ({ body }) => {
    const db = getDb();
    const { username, password } = body as { username: string; password: string };

    const user = db.query("SELECT * FROM users WHERE username = ?").get(username) as Record<string, unknown> | null;
    if (!user) {
      return new Response(JSON.stringify({ error: "用户名或密码错误" }), { status: 401 });
    }

    const valid = Bun.password.verifySync(password, user.password_hash as string);
    if (!valid) {
      return new Response(JSON.stringify({ error: "用户名或密码错误" }), { status: 401 });
    }

    const token = await Bun.password.hash(`${user.username}:${Date.now()}`, "bcrypt");
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role,
      } as User,
    };
  })
  .post("/register", async ({ body }) => {
    const db = getDb();
    const { username, password, display_name } = body as { username: string; password: string; display_name?: string };

    const existing = db.query("SELECT id FROM users WHERE username = ?").get(username);
    if (existing) {
      return new Response(JSON.stringify({ error: "用户名已存在" }), { status: 409 });
    }

    const passwordHash = Bun.password.hashSync(password, "bcrypt");
    db.run("INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)",
      [username, passwordHash, display_name || username]);

    return { success: true, message: "注册成功" };
  })
  .get("/users", () => {
    const db = getDb();
    return db.query("SELECT id, username, display_name, role, created_at FROM users ORDER BY id ASC").all();
  })
  .get("/me", ({ headers }) => {
    // Simple token-based auth check
    const auth = headers["authorization"];
    if (!auth) return new Response(JSON.stringify({ error: "未登录" }), { status: 401 });

    const db = getDb();
    const user = db.query("SELECT id, username, display_name, role FROM users LIMIT 1").get() as User;
    return user;
  });
