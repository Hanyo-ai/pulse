<div align="center">

# ⚡ PULSE

**See inside every AI agent. Real-time session visualization, debugging & observability.**

Watch agent conversations unfold live — `system` prompts, `user` messages, `assistant` responses, `tool_result` returns — elegantly visualized in a single dashboard. A self-hosted AI gateway powered by Bun, OpenAI & Anthropic compatible, with cost tracking and audit logs built in.

[![Powered by Bun](https://img.shields.io/badge/Powered%20by-Bun-black?logo=bun)](https://bun.sh)
[![Built with Elysia](https://img.shields.io/badge/Built%20with-Elysia-blue)](https://elysiajs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)

[中文](./README.zh-CN.md) · [Demo](#-demo) · [Quick Start](#-quick-start) · [API](#-api-reference) · [Deploy](#-deployment)

</div>

---

## 🎬 Demo

<div align="center">

![PULSE demo](./assets/demo.gif)

</div>

---

## ✨ Why PULSE

---

## 🚀 Quick Start

Requires [Bun](https://bun.sh) **>= 1.2**.

### Install from npm (single-user / local)

```bash
bun install -g @hanyo_ai/pulse
pulse run
```

Opens on `http://127.0.0.1:3000` with no login — data lives at `~/.pulse/pulse.db`. Use `pulse run --help` for flags (`--port`, `--host`, `--db-path`, `--auth` to enable the login page).

Update to the latest version anytime:

```bash
pulse update
```

### From source (development)

```bash
git clone <your-repo-url>
cd pulse
bun install
bun run dev          # http://localhost:3000 (HMR)
```

Login with **admin / admin123**, then change the password immediately.

### Production (self-hosted, multi-user)

```bash
bun run build        # bundles frontend → ./dist
bun run start        # serves dist/ + API on $PORT (default 3000)
```

> `bun run start` needs `dist/` to exist. Rebuild after any frontend change — the production branch serves the bundled assets, not `src/`.

---

## 🔌 API Reference

PULSE exposes two surfaces: **gateway proxies** for upstream LLM calls, and **management APIs** for the dashboard.

### Gateway proxy (external)

OpenAI-compatible:

```bash
POST /v1/chat/completions
Authorization: Bearer <gateway_key>

{
  "model": "gpt-4o",
  "messages": [{"role": "user", "content": "Hello!"}],
  "stream": true
}
```

Anthropic-compatible:

```bash
POST /anthropic/v1/messages
x-api-key: <gateway_key>

{
  "model": "claude-sonnet-4-6",
  "messages": [{"role": "user", "content": "Hello!"}],
  "stream": true
}
```

### Management API (internal)

<details>
<summary><strong>All endpoints</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` · `logout` · `register` · `change-password` | Auth flow |
| GET | `/api/auth/me` | Current user |
| GET / POST / PUT / DELETE | `/api/auth/users[/:id]` | User management (admin) |
| GET / POST / PUT / DELETE | `/api/sessions[/:id]` | Session CRUD |
| GET | `/api/sessions/:id/messages` | Session messages |
| GET / POST / PUT / DELETE | `/api/endpoints[/:id]` | Provider endpoint CRUD |
| POST | `/api/endpoints/test` | Test an endpoint config without saving |
| GET | `/api/logs?provider=…&status=…` | Query audit logs with filters |
| GET | `/api/usage/stats` · `by-model` · `trend` | Usage analytics |
| GET | `/api/health` | Service health |

</details>

---

## 🏗️ Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Runtime    | [Bun](https://bun.sh) 1.2+    |
| Framework  | [Elysia](https://elysiajs.com)|
| Database   | SQLite (`bun:sqlite`)         |
| Frontend   | React 19 + TypeScript         |
| Auth       | bcrypt + JWT                  |

---

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | — | Set to `production` for production mode |
| `PORT` | `3000` | Server listening port |
| `HOST` | `0.0.0.0` | Bind address (`pulse run` defaults to `127.0.0.1`) |
| `DB_PATH` | `pulse.db` | SQLite database file path |
| `PULSE_NO_AUTH` | — | Set to `1` to disable login (single-user / local installs) |

Configure upstream providers in the dashboard's **Endpoints** tab: upstream URL, upstream API key, gateway key (what clients send), default model, and per-million-token pricing.

> ⚠️ **Don't put `process.env.NODE_ENV` in `bunfig.toml`'s `[define]` table.** Bun applies `[define]` at runtime as well as during bundling, so a line like `"process.env.NODE_ENV" = "\"development\""` silently overrides `NODE_ENV=production` from systemd / your shell, leaving the server in dev mode. If you need to force dev for bundling only, pass `--define` on the `bun build` command line.

---
