# Web UI - Quick Start Guide

## Overview

The web UI provides a real-time dashboard to monitor and control the git-deploy-schedule system.

## Features

✅ **Live Dashboard**
- Real-time commit feed
- Statistics (total commits, success rate, AI usage)
- Next commit countdown
- Ollama status

✅ **Controls**
- Pause/Resume scheduler
- Trigger immediate commit
- Refresh data

✅ **History**
- Last 20 commits
- Commit type badges
- File change counts
- Ollama vs template indicators

## Quick Start

### 1. Start the Web UI

```bash
python3 main_web.py
```

### 2. Access the Dashboard

Open your browser to: **http://localhost:5000**

That's it! The UI will auto-refresh every 5 seconds.

## Configuration

### Change Port

```bash
python3 main_web.py --port 8080
```

### Run API Only (No Scheduler)

```bash
python3 main_web.py --no-scheduler
```

Useful for development or if you want to run the scheduler separately.

## API Endpoints

The web UI consumes these REST endpoints:

- `GET /api/status` - Current scheduler status
- `GET /api/history?limit=50` - Commit history
- `GET /api/stats` - Statistics
- `POST /api/control` - Control actions (pause/resume/trigger)
- `GET /api/config` - Current configuration
- `GET /api/logs?lines=100` - Recent log entries

## Features in Detail

### Dashboard Cards

1. **Total Commits**: All-time commit count
2. **Success Rate**: Percentage of successful commits
3. **AI Usage**: Percentage using Ollama vs templates
4. **Next Commit**: Countdown to next scheduled commit

### Commit Feed

Shows last 20 commits with:
- 🤖 AI-generated (Ollama)
- ✅ Template-generated
- ❌ Failed commit
- Commit type badge (feat, fix, chore, etc.)
- Time ago, file count, hash
- Theme tag (if applicable)

### Controls

- **⏸ Pause**: Pause the scheduler (commits stop)
- **▶ Resume**: Resume the scheduler
- **🚀 Trigger Now**: Force an immediate commit
- **🔄 Refresh**: Manually refresh all data

### System Info

- Ollama availability status
- Commits in last 24 hours
- Database connection status

## Architecture

```
┌─────────────────────────────────────┐
│   Browser (http://localhost:5000)  │
│   Single-page HTML/CSS/JS           │
└──────────────┬──────────────────────┘
               │ HTTP REST API
┌──────────────▼──────────────────────┐
│   FastAPI Server (Port 5000)        │
│   - Serves UI                       │
│   - REST endpoints                  │
│   - Accesses scheduler directly     │
└──────────────┬──────────────────────┘
               │ In-process
┌──────────────▼──────────────────────┐
│   Python Scheduler (Background)     │
│   - Runs in daemon thread           │
│   - Makes commits                   │
│   - Tracks to SQLite                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   SQLite Database                   │
│   database/scheduler.db             │
└─────────────────────────────────────┘
```

## Files

```
web/
├── frontend/
│   ├── index.html          # Single-page UI
│   └── js/
│       └── app.js          # Frontend logic
src/
├── api.py                  # FastAPI server
└── database.py             # SQLite tracking
main_web.py                 # Web UI launcher
```

## Troubleshooting

### Port Already in Use

```bash
# Use a different port
python3 main_web.py --port 8080
```

### Can't Access UI

- Check firewall settings
- Try `http://127.0.0.1:5000` instead of localhost
- Check logs for errors

### Data Not Updating

- Check browser console for errors
- Verify API is responding: `curl http://localhost:5000/api/status`
- Refresh the page

### Database Errors

```bash
# Delete and recreate database
rm database/scheduler.db
python3 main_web.py
```

## Development

### Run in API-Only Mode

```bash
# Terminal 1: Run API only
python3 main_web.py --no-scheduler

# Terminal 2: Run scheduler separately
python3 main.py
```

### View API Documentation

FastAPI provides automatic API docs:
- Swagger UI: http://localhost:5000/docs
- ReDoc: http://localhost:5000/redoc

## Docker Deployment

```yaml
# docker-compose-web.yml
version: '3.8'

services:
  scheduler-web:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./config:/app/config
      - ./database:/app/database
      - ./logs:/app/logs
      - ${HOME}/.ssh:/root/.ssh:ro
    command: python3 main_web.py --host 0.0.0.0
    restart: unless-stopped
```

```bash
docker-compose -f docker-compose-web.yml up -d
```

## Security Notes

- **Local Only**: By default, binds to 0.0.0.0 (all interfaces)
- **No Authentication**: No auth by default (add nginx with auth if exposing publicly)
- **CORS Enabled**: Allows any origin (restrict in production)

## Tips

1. **Keep Browser Tab Open**: Auto-refresh works when tab is visible
2. **Trigger Commits**: Use "Trigger Now" to test without waiting
3. **Pause for Maintenance**: Pause before making config changes
4. **Monitor Ollama**: Check AI usage rate to ensure Ollama is working

## Next Steps

- Add authentication (nginx basic auth, OAuth, etc.)
- Add WebSocket for true real-time updates
- Add charts with Chart.js
- Export data to CSV
- Add configuration editor

Enjoy your real-time git commit dashboard! 🚀
