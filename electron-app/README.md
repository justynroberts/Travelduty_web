# Git Deploy Scheduler - Electron App

Native desktop application for Git Deploy Scheduler with system tray integration.

## Features

- 🖥️ **Native Desktop App**: Runs as a native macOS/Windows/Linux application
- 🔔 **System Tray**: Minimize to system tray, stays running in background
- 🎯 **Quick Actions**: Pause/resume/trigger from system tray menu
- 🚀 **Auto-Start**: Option to start on system boot
- 📊 **Full Dashboard**: Complete web UI embedded in native window
- 🔒 **Local Only**: Python backend runs locally, no external connections

## Quick Start

### 1. Install Dependencies

```bash
cd electron-app
npm install
```

### 2. Run Development Mode

```bash
npm run dev
```

### 3. Build for Production

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

## Architecture

```
┌─────────────────────────────────────────┐
│     Electron Main Process               │
│  - Window management                    │
│  - System tray                          │
│  - Python backend spawn                 │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│     Python Backend (FastAPI)            │
│  - Scheduler logic                      │
│  - Git operations                       │
│  - Ollama integration                   │
│  - SQLite database                      │
│  - HTTP API on localhost:5000           │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│     Renderer Process (Web UI)           │
│  - Dashboard HTML/CSS/JS                │
│  - Loads from Python HTTP server        │
│  - Same UI as web version               │
└─────────────────────────────────────────┘
```

## System Tray Features

Right-click tray icon for:
- **Show App**: Open main window
- **Dashboard**: Navigate to main view
- **Pause Scheduler**: Stop automatic commits
- **Resume Scheduler**: Restart automatic commits
- **Trigger Commit Now**: Force immediate commit
- **Quit**: Exit application completely

## Building

### macOS (.dmg, .app)

```bash
npm run build:mac
```

Output: `dist/Git Deploy Scheduler-1.0.0.dmg`

### Windows (.exe)

```bash
npm run build:win
```

Output: `dist/Git Deploy Scheduler Setup 1.0.0.exe`

### Linux (.AppImage, .deb)

```bash
npm run build:linux
```

Output:
- `dist/git-deploy-scheduler-1.0.0.AppImage`
- `dist/git-deploy-scheduler_1.0.0_amd64.deb`

## Configuration

The Electron app uses the same configuration as the standalone version:

- `config/config.yaml` - Main configuration
- `.env` - Environment overrides
- `database/scheduler.db` - SQLite database

## Development

### Run with DevTools

```bash
npm run dev
```

This opens the app with Chrome DevTools for debugging.

### File Structure

```
electron-app/
├── package.json          # Electron app config
├── src/
│   ├── main.js          # Electron main process
│   └── preload.js       # Preload script for security
├── assets/
│   ├── icon.png         # App icon
│   ├── icon.icns        # macOS icon
│   ├── icon.ico         # Windows icon
│   └── tray-icon.png    # System tray icon
└── README.md
```

## Platform-Specific Notes

### macOS
- App appears in Applications folder
- Can be added to Login Items for auto-start
- System tray icon in menu bar

### Windows
- Installer includes auto-start option
- System tray icon in taskbar notification area
- Can run in background without window

### Linux
- AppImage: Portable, no installation required
- .deb: Install via `sudo dpkg -i *.deb`
- System tray in panel

## Troubleshooting

### Python Not Found

The app looks for `python3` (macOS/Linux) or `python` (Windows).

Ensure Python 3.9+ is installed and in PATH:
```bash
python3 --version  # macOS/Linux
python --version   # Windows
```

### Port Already in Use

If port 5000 is in use, the app will fail to start.

Kill existing processes:
```bash
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows
```

### Tray Icon Not Showing

Add icon files to `electron-app/assets/`:
- `icon.png` (512x512)
- `tray-icon.png` (48x48)
- `icon.icns` (macOS, 512x512)
- `icon.ico` (Windows, 256x256)

### Build Fails

Ensure all dependencies are installed:
```bash
cd electron-app
rm -rf node_modules
npm install
npm run build
```

## Security

- **No Remote Code**: All code runs locally
- **Context Isolation**: Renderer process is sandboxed
- **No Node Integration**: Web content can't access Node APIs directly
- **Local API Only**: Python backend binds to 127.0.0.1 only

## Auto-Start on Boot

### macOS
System Preferences → Users & Groups → Login Items → Add app

### Windows
Settings → Apps → Startup → Enable app

### Linux (systemd)
```bash
mkdir -p ~/.config/systemd/user/
cat > ~/.config/systemd/user/git-scheduler.service << EOF
[Unit]
Description=Git Deploy Scheduler

[Service]
ExecStart=/path/to/git-deploy-scheduler.AppImage

[Install]
WantedBy=default.target
EOF

systemctl --user enable git-scheduler
systemctl --user start git-scheduler
```

## Distribution

Built apps can be distributed:
- **macOS**: Share .dmg file
- **Windows**: Share installer .exe
- **Linux**: Share .AppImage (no install needed) or .deb

Users don't need to install Python or dependencies - everything is bundled!

## Updates

To update the app:
1. Make changes to Python code or UI
2. Bump version in `package.json`
3. Rebuild: `npm run build`
4. Distribute new installer

## Support

For issues, check:
1. Console logs: `npm run dev` shows all logs
2. Python logs: `logs/scheduler.log`
3. Electron logs: `~/.config/git-deploy-scheduler/logs/`

Enjoy your native desktop Git Deploy Scheduler! 🚀
