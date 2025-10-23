# Web UI Design Document

## Overview
Add a lightweight web UI to monitor and control the git-deploy-schedule system.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         React/Vue Frontend (Port 3000)               │  │
│  │  - Dashboard with stats                              │  │
│  │  - Live commit feed                                  │  │
│  │  │  - Configuration editor                            │  │
│  │  - Controls (pause/resume/trigger)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│              Node.js/Express API (Port 3001)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  REST API + WebSocket                                │  │
│  │  - /api/status                                       │  │
│  │  - /api/history                                      │  │
│  │  - /api/stats                                        │  │
│  │  - /api/control (pause/resume/trigger)              │  │
│  │  - WebSocket for live updates                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │ IPC/HTTP
┌─────────────────────────────────────────────────────────────┐
│           Python Scheduler (Existing)                        │
│  - Exposes HTTP API for control                             │
│  - Writes stats to SQLite/JSON                              │
│  - Emits events via WebSocket                               │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Dashboard Page
- **Stats Cards**:
  - Total commits made
  - Success rate
  - Next scheduled commit (countdown)
  - Current status (running/paused)
  - Ollama status (available/unavailable)

- **Live Commit Feed**:
  - Real-time list of commits as they happen
  - Commit message, timestamp, status
  - File changes count
  - Link to GitHub/GitLab

- **Charts**:
  - Commits per day (last 7 days)
  - Success vs failure rate
  - Ollama vs template message ratio

### Configuration Page
- Edit config.yaml via web form
- Enable/disable push
- Change interval and jitter
- Update Ollama settings
- Change theme

### Controls
- **Pause/Resume** button
- **Trigger Now** button (force immediate commit)
- **View Logs** modal

### History Page
- Searchable table of all commits
- Filter by date, status, type
- Export to CSV

## Technology Stack

### Backend
- **Node.js + Express** - API server
- **Socket.io** - WebSocket for real-time updates
- **SQLite** - Store commit history
- **YAML parser** - Read/write config

### Frontend
- **Plain HTML/CSS/JS** or **React** (lightweight)
- **Chart.js** - Graphs and charts
- **Tailwind CSS** - Styling
- **Socket.io-client** - Real-time updates

### Python Integration
- **Flask/FastAPI** - Add lightweight HTTP API to Python scheduler
- **SQLite** - Shared database for stats
- **WebSocket client** - Emit events to Node.js

## API Endpoints

### GET /api/status
```json
{
  "running": true,
  "paused": false,
  "next_commit_in": 487,
  "last_commit": {
    "hash": "abc123",
    "message": "feat: add kubernetes support",
    "timestamp": "2025-10-23T14:30:05Z",
    "files_changed": 3,
    "success": true
  },
  "ollama_available": true,
  "current_theme": "kubernetes"
}
```

### GET /api/history?limit=50
```json
{
  "commits": [
    {
      "id": 1,
      "hash": "abc123",
      "message": "feat: add kubernetes support",
      "timestamp": "2025-10-23T14:30:05Z",
      "files_changed": 3,
      "success": true,
      "used_ollama": true,
      "theme": "kubernetes"
    }
  ],
  "total": 150
}
```

### GET /api/stats
```json
{
  "total_commits": 150,
  "success_rate": 98.5,
  "ollama_usage_rate": 95.0,
  "commits_last_24h": 144,
  "commits_by_day": [12, 15, 18, 14, 16, 15, 14],
  "commit_types": {
    "feat": 45,
    "fix": 30,
    "chore": 50,
    "refactor": 25
  }
}
```

### POST /api/control
```json
{
  "action": "pause" | "resume" | "trigger"
}
```

### GET /api/config
```json
{
  "config": { /* current config.yaml */ }
}
```

### PUT /api/config
```json
{
  "config": { /* updated config */ }
}
```

### WebSocket Events

**Client → Server:**
- `subscribe` - Subscribe to live updates

**Server → Client:**
- `commit_created` - New commit made
- `status_changed` - Status updated (paused/resumed)
- `next_commit_update` - Countdown update

## Database Schema

### commits table
```sql
CREATE TABLE commits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hash TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  files_changed INTEGER,
  success BOOLEAN DEFAULT 1,
  used_ollama BOOLEAN DEFAULT 0,
  theme TEXT,
  error_message TEXT
);
```

### stats table
```sql
CREATE TABLE stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  total_commits INTEGER DEFAULT 0,
  successful_commits INTEGER DEFAULT 0,
  ollama_used INTEGER DEFAULT 0,
  template_used INTEGER DEFAULT 0
);
```

## UI Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│  Git Deploy Schedule                          Status: ● ON    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Total    │  │ Success  │  │ Ollama   │  │ Next In  │    │
│  │ Commits  │  │ Rate     │  │ Usage    │  │          │    │
│  │   150    │  │  98.5%   │  │  95.0%   │  │  8m 47s  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │  Recent Commits         │  │  Commits Last 7 Days     │  │
│  ├─────────────────────────┤  │  ┌──────────────────┐   │  │
│  │ ● feat: add k8s support │  │  │    ▅▆▇█▇▆▅        │   │  │
│  │   2 mins ago · 3 files  │  │  │ ┌─┬─┬─┬─┬─┬─┬─┐   │   │  │
│  │                         │  │  └─┴─┴─┴─┴─┴─┴─┘   │   │  │
│  │ ● fix: resolve issue    │  │                      │   │  │
│  │   12 mins ago · 1 file  │  │  Mon Tue Wed Thu Fri │   │  │
│  │                         │  └──────────────────────────┘  │
│  │ ● chore: update deps    │                               │
│  │   22 mins ago · 5 files │  [Pause] [Trigger Now]        │
│  └─────────────────────────┘                               │
│                                                               │
│  Theme: kubernetes  ▼       [View Logs] [Configuration]     │
└──────────────────────────────────────────────────────────────┘
```

## Implementation Plan

1. Add FastAPI to Python scheduler for HTTP API
2. Create SQLite database and stats tracking
3. Build Node.js Express backend
4. Create simple HTML/CSS/JS frontend (no build step)
5. Add WebSocket support for live updates
6. Create Docker Compose setup with all services
7. Add authentication (optional)

## File Structure

```
git-deploy-schedule/
├── src/                      # Python scheduler (existing)
├── web/
│   ├── backend/
│   │   ├── package.json
│   │   ├── server.js         # Express + Socket.io
│   │   ├── routes/
│   │   │   ├── api.js
│   │   │   └── control.js
│   │   └── db.js             # SQLite access
│   └── frontend/
│       ├── index.html
│       ├── css/
│       │   └── style.css
│       └── js/
│           ├── app.js
│           ├── dashboard.js
│           └── websocket.js
├── database/
│   └── scheduler.db          # SQLite database
└── docker-compose-web.yml    # Full stack deployment
```

## Security Considerations

- API authentication (optional JWT)
- CORS configuration
- Rate limiting on API endpoints
- Input validation on config updates
- Read-only mode option

## Next Steps

1. Add FastAPI to Python scheduler
2. Implement database and stats tracking
3. Build Node.js backend
4. Create frontend UI
5. Integrate everything
6. Docker Compose setup
