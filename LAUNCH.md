# 🚀 Launch Guide - Git Deploy Scheduler with Web UI

## Quick Start (3 Steps)

### 1. Start the Web UI

```bash
python3 main_web.py
```

### 2. Open Browser

Navigate to: **http://localhost:5000**

### 3. Watch It Work!

The dashboard shows:
- ✅ Live commit feed
- 📊 Real-time statistics
- ⏱️ Next commit countdown
- 🎮 Control buttons (pause/resume/trigger)

## What You'll See

```
┌────────────────────────────────────────────────────┐
│ Git Deploy Scheduler              Status: ● Running │
├────────────────────────────────────────────────────┤
│                                                     │
│  📊 Total: 150    ✅ 98.5%    🤖 95%    ⏰ 9m 42s  │
│                                                     │
│  Recent Commits          │  Controls               │
│  ────────────────────    │  ─────────              │
│  🤖 feat: k8s support    │  [⏸ Pause] [🚀 Now]   │
│     2m ago · 3 files     │                         │
│                          │  Theme: kubernetes      │
│  🤖 fix: resolve issue   │  Ollama: ✅ Available  │
│     12m ago · 1 file     │                         │
└────────────────────────────────────────────────────┘
```

## Features

### 📊 Dashboard
- **Total Commits**: All-time count
- **Success Rate**: % successful
- **AI Usage**: Ollama vs templates
- **Next Commit**: Live countdown

### 📝 Commit Feed
- Last 20 commits in real-time
- Type badges (feat, fix, chore)
- AI indicator (🤖 = Ollama, ✅ = template)
- File counts & timestamps

### 🎮 Controls
- **Pause**: Stop scheduler
- **Resume**: Restart scheduler
- **Trigger Now**: Force immediate commit
- **Refresh**: Update dashboard

### 💾 Data Tracking
Everything tracked in SQLite:
- Commit history
- Success/failure rates
- Ollama usage statistics
- Daily aggregations

## Configuration

### Change Port

```bash
python3 main_web.py --port 8080
```

### Run Without Scheduler (API Only)

```bash
python3 main_web.py --no-scheduler
```

## API Endpoints

Test the API:

```bash
# Status
curl http://localhost:5000/api/status

# Stats
curl http://localhost:5000/api/stats

# History
curl http://localhost:5000/api/history?limit=10

# Control (pause)
curl -X POST http://localhost:5000/api/control \
  -H "Content-Type: application/json" \
  -d '{"action":"pause"}'
```

## Files & Structure

```
git-deploy-schedule/
├── main_web.py                 # 🎯 Start here!
├── main.py                     # CLI version
│
├── src/
│   ├── api.py                 # FastAPI server
│   ├── database.py            # SQLite tracking
│   ├── scheduler.py           # Core logic
│   └── ...
│
├── web/frontend/
│   ├── index.html             # Single-page UI
│   └── js/app.js              # Frontend logic
│
├── database/
│   └── scheduler.db           # SQLite database
│
└── config/
    └── config.yaml            # Configuration
```

## Common Tasks

### View Logs

```bash
tail -f logs/scheduler.log
```

### Check Database

```bash
sqlite3 database/scheduler.db "SELECT * FROM commits ORDER BY timestamp DESC LIMIT 5;"
```

### Reset Database

```bash
rm database/scheduler.db
python3 main_web.py  # Will recreate
```

### Use Different Config

```bash
python3 main_web.py --config /path/to/config.yaml
```

## Troubleshooting

### Port In Use

```bash
# Kill existing process
lsof -ti:5000 | xargs kill -9

# Or use different port
python3 main_web.py --port 8080
```

### Can't Connect

- Try `http://127.0.0.1:5000` instead of localhost
- Check firewall settings
- Verify no errors in terminal output

### No Commits Showing

- Make some file changes first
- Click "Trigger Now" to force a commit
- Check scheduler is running (not paused)

### Database Errors

```bash
rm database/scheduler.db
python3 main_web.py
```

## Production Deployment

### Option 1: Systemd (Linux)

```ini
# /etc/systemd/system/git-scheduler.service
[Unit]
Description=Git Deploy Scheduler Web UI
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/git-deploy-schedule
ExecStart=/usr/bin/python3 main_web.py --host 0.0.0.0
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable git-scheduler
sudo systemctl start git-scheduler
```

### Option 2: Docker

```bash
docker build -t git-scheduler .
docker run -d -p 5000:5000 \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/database:/app/database \
  -v ~/.ssh:/root/.ssh:ro \
  git-scheduler python3 main_web.py --host 0.0.0.0
```

### Option 3: Screen (Simple)

```bash
screen -dmS scheduler python3 main_web.py
# Reattach: screen -r scheduler
# Detach: Ctrl+A, D
```

## Architecture

```
Browser ──HTTP──> FastAPI Server ──In-Process──> Scheduler
                      │                              │
                      └─────────────────────────────┐
                                                    │
                                              SQLite DB
```

- **Single Python Process**: API + Scheduler in one
- **FastAPI**: HTTP REST endpoints
- **SQLite**: Persistent storage
- **Auto-refresh**: Frontend polls every 5 seconds

## Next Steps

✅ Working now:
- Real-time dashboard
- Full API
- Database tracking
- Pause/resume/trigger
- Ollama theme support

🔮 Future enhancements:
- WebSocket for instant updates
- Charts (Chart.js)
- CSV export
- Configuration editor
- Authentication
- Multi-repo support

## Need Help?

- **Web UI Guide**: [WEB_UI_README.md](WEB_UI_README.md)
- **Main README**: [README.md](README.md)
- **Themes**: [THEMES.md](THEMES.md)
- **Git Auth**: [GIT_AUTH.md](GIT_AUTH.md)

Enjoy your automated git commits with a beautiful dashboard! 🎉
