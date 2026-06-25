<div align="center">

# ⚡ PULSE

**A lightweight AI Gateway for managing multiple AI providers**

Unified API gateway for OpenAI, Anthropic, and more — with real-time monitoring, audit logs, and cost tracking.

[![Powered by Bun](https://img.shields.io/badge/Powered%20by-Bun-black?logo=bun)](https://bun.sh)
[![Built with Elysia](https://img.shields.io/badge/Built%20with-Elysia-blue)](https://elysiajs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)

[Features](#-features) · [Quick Start](#-quick-start) · [API Docs](#-api-reference) · [Deploy](#-deployment)

</div>

---

## ✨ Features

- 🎯 **Multi-Provider Gateway** — Unified interface for OpenAI, Anthropic, and custom endpoints
- 🌊 **Streaming Support** — Full SSE streaming with real-time token forwarding
- 📊 **Session Tracking** — Automatic conversation management with message history
- 💰 **Cost Analytics** — Per-token pricing calculation across providers and models
- 🔍 **Audit Logs** — Complete request logging with filtering and search
- 📈 **Usage Statistics** — Visual dashboards for token consumption and trends
- 🔐 **Authentication** — Secure API key management with bcrypt hashing
- ⚡ **Fast & Lightweight** — Powered by Bun runtime with SQLite storage

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.0

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd pulse

# Install dependencies
bun install

# Start development server with HMR
bun dev
```

Visit `http://localhost:3000` and login with:
- **Username:** `admin`
- **Password:** `admin123`

> ⚠️ Change the default password immediately after first login!

### Production Build

```bash
# Build for production
bun run build

# Start production server
bun start
```

---

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
│  (Your App) │
└──────┬──────┘
       │ POST /v1/chat/completions
       │ Authorization: Bearer <gateway_key>
       ↓
┌──────────────────────────────────┐
│         PULSE Gateway            │
│  ┌────────────────────────────┐  │
│  │  Auth & Key Validation     │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  Request Logging & Audit   │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  Provider Router           │  │
│  └────────────────────────────┘  │
└──────────┬───────────────────────┘
           │
    ┌──────┴──────┐
    ↓             ↓
┌─────────┐  ┌──────────┐
│ OpenAI  │  │ Anthropic│
└─────────┘  └──────────┘
```

### Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Runtime    | [Bun](https://bun.sh)        |
| Framework  | [Elysia](https://elysiajs.com)|
| Database   | SQLite (`bun:sqlite`)        |
| Frontend   | React 19 + TypeScript        |
| Auth       | bcrypt + JWT                 |

---

## 📁 Project Structure

```
src/
├── index.ts              # Main server entry (Elysia + Bun.serve)
├── db.ts                 # Database schema & initialization
├── types.ts              # TypeScript type definitions
│
├── routes/
│   ├── auth.ts           # Authentication endpoints
│   ├── sessions.ts       # Session management
│   ├── logs.ts           # Audit log queries
│   ├── endpoints.ts      # Provider endpoint CRUD
│   └── usage.ts          # Usage statistics & analytics
│
├── components/
│   ├── LoginPage.tsx     # Login/register UI
│   ├── Sidebar.tsx       # Navigation sidebar
│   ├── SessionMonitor.tsx# Real-time session dashboard
│   ├── AuditLogs.tsx     # Request log viewer
│   ├── Endpoints.tsx     # Provider management
│   └── Usage.tsx         # Analytics dashboard
│
├── index.html            # Frontend entry point
├── frontend.tsx          # React root
├── App.tsx               # Main React component
└── index.css             # Global styles
```

---

## 🔌 API Reference

### Gateway Proxy APIs (External)

Route external requests through PULSE using configured gateway keys.

#### OpenAI-Compatible

```bash
POST /v1/chat/completions
Authorization: Bearer <gateway_key>

{
  "model": "gpt-4",
  "messages": [{"role": "user", "content": "Hello!"}],
  "stream": true
}
```

#### Anthropic-Compatible

```bash
POST /anthropic/v1/messages
x-api-key: <gateway_key>

{
  "model": "claude-3-opus-20240229",
  "messages": [{"role": "user", "content": "Hello!"}],
  "stream": true
}
```

### Management APIs (Internal)

These APIs are used by the admin dashboard.

<details>
<summary><strong>Authentication</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and get user info |
| POST | `/api/auth/register` | Register new user |

</details>

<details>
<summary><strong>Sessions</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | List all sessions |
| GET | `/api/sessions/:id` | Get session details |
| GET | `/api/sessions/:id/messages` | Get session messages |
| POST | `/api/sessions` | Create new session |
| PUT | `/api/sessions/:id` | Update session |
| DELETE | `/api/sessions/:id` | Delete session |

</details>

<details>
<summary><strong>Endpoints</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/endpoints` | List all provider endpoints |
| GET | `/api/endpoints/:id` | Get endpoint details |
| POST | `/api/endpoints` | Create endpoint |
| PUT | `/api/endpoints/:id` | Update endpoint |
| DELETE | `/api/endpoints/:id` | Delete endpoint |

</details>

<details>
<summary><strong>Audit Logs</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logs?provider=openai&status=200` | Query logs with filters |

</details>

<details>
<summary><strong>Usage Analytics</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/usage/stats` | Overall usage statistics |
| GET | `/api/usage/by-model` | Usage grouped by model |
| GET | `/api/usage/trend` | Historical usage trends |

</details>

<details>
<summary><strong>Health Check</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service health status |

</details>

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | — | Set to `production` for production mode |
| `PORT` | `3000` | Server listening port |
| `DB_PATH` | `pulse.db` | SQLite database file path |

### Endpoint Configuration

Configure upstream AI providers in the admin dashboard under **Endpoints**:

| Field | Description |
|-------|-------------|
| Provider Name | Display name for this endpoint |
| Endpoint URL | Upstream API base URL |
| API Key | Provider's API key (stored securely) |
| Gateway Key | Key your clients use to access this endpoint |
| Model Name | Default model identifier |
| Pricing | Input/output/cache token prices (per million tokens) |

---

## 🚀 Deployment

### Option 1: systemd Service (Recommended)

Create `/etc/systemd/system/pulse.service`:

```ini
[Unit]
Description=Pulse AI Gateway
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/pulse
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DB_PATH=/data/pulse/pulse.db
ExecStart=/root/.bun/bin/bun run /opt/pulse/src/index.ts
Restart=always
RestartSec=5

# Security hardening
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/data/pulse

[Install]
WantedBy=multi-user.target
```

```bash
# Setup and start
mkdir -p /data/pulse
chown www-data:www-data /data/pulse
systemctl daemon-reload
systemctl enable --now pulse

# Monitor logs
journalctl -u pulse -f
```

### Option 2: Docker (Coming Soon)

Docker support is planned for a future release.

### Reverse Proxy Setup

#### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name pulse.your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/pulse.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pulse.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSE streaming support
    location ~ ^/(api|v1|anthropic)/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
    }
}
```

#### Caddy (Simpler Alternative)

```caddyfile
pulse.your-domain.com {
    reverse_proxy localhost:3000
}
```

Caddy automatically handles HTTPS certificates.

---

## 🔒 Security

- 🔐 All passwords are hashed using bcrypt
- 🛡️ API keys displayed with masking (first/last 4 chars only)
- 📝 Complete audit trail of all requests
- 🚫 No sensitive data logged in production
- 🔑 Separate gateway keys per provider endpoint

### Security Checklist

- [ ] Change default admin password
- [ ] Configure firewall rules (allow only HTTPS)
- [ ] Enable systemd security features
- [ ] Set up automated database backups
- [ ] Monitor audit logs regularly
- [ ] Rotate API keys periodically

---

## 🗄️ Database

PULSE uses SQLite with WAL mode for concurrent access:

```bash
# Backup database
cp /data/pulse/pulse.db /backup/pulse_$(date +%Y%m%d).db

# Automated daily backup (crontab)
0 3 * * * cp /data/pulse/pulse.db /backup/pulse_$(date +\%Y\%m\%d).db
```

Database schema is automatically initialized on first run with a default admin user.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is private and proprietary.

---

<div align="center">

**Built with ⚡ [Bun](https://bun.sh) and 💙 [Elysia](https://elysiajs.com)**

</div>
