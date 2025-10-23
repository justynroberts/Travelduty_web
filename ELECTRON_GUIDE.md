# Electron Desktop App - Complete Guide

## Overview

The Git Deploy Scheduler now has a native desktop application built with Electron!

### Features

✅ **Native Desktop App**
- Runs as a native application on macOS/Windows/Linux
- No browser required
- Professional app icon and branding

✅ **System Tray Integration**
- Minimize to system tray
- Stays running in background
- Quick actions from tray menu

✅ **Embedded Python Backend**
- Automatically starts Python scheduler
- All features from web version
- Local-only, secure

✅ **Cross-Platform**
- macOS (.dmg, .app)
- Windows (.exe installer)
- Linux (.AppImage, .deb)

## Quick Start

### 1. Install Node.js Dependencies

```bash
cd electron-app
npm install
```

### 2. Run in Development Mode

```bash
npm run dev
```

This will:
1. Start the Python backend automatically
2. Open the Electron app with DevTools
3. Load the dashboard UI

### 3. Build for Production

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

## What You Get

### macOS
- `Git Deploy Scheduler.app` - Native macOS application
- `.dmg` installer for distribution
- Menu bar system tray integration
- Can add to Login Items for auto-start

### Windows
- `Git Deploy Scheduler Setup.exe` - NSIS installer
- System tray in taskbar notification area
- Auto-start option during install
- Start menu integration

### Linux
- `.AppImage` - Portable, no installation required
- `.deb` package for Debian/Ubuntu
- System tray in panel
- Can be added to systemd for auto-start

## Architecture

```
┌────────────────────────────────────────────┐
│  Electron App (Native Window)              │
│  ┌──────────────────────────────────────┐ │
│  │  Web UI (React/HTML/CSS/JS)          │ │
│  │  - Dashboard                         │ │
│  │  - Commit feed                       │ │
│  │  - Statistics                        │ │
│  │  - Controls                          │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Electron Main Process               │ │
│  │  - Window management                 │ │
│  │  - System tray                       │ │
│  │  - Python process spawn              │ │
│  │  - IPC communication                 │ │
│  └──────────────────────────────────────┘ │
└────────────────────────────────────────────┘
                   │
                   │ HTTP localhost:5000
                   │
┌────────────────────────────────────────────┐
│  Python Backend (main_web.py)              │
│  - Scheduler logic                         │
│  - FastAPI HTTP server                     │
│  - SQLite database                         │
│  - Ollama integration                      │
│  - Git operations                          │
└────────────────────────────────────────────┘
```

## System Tray Features

Right-click the tray icon to access:

- **Show App** - Restore main window
- **Dashboard** - Navigate to main view
- **Pause Scheduler** - Stop automatic commits
- **Resume Scheduler** - Restart commits
- **Trigger Commit Now** - Force immediate commit
- **Quit** - Exit application

The app continues running in the background even when the window is closed!

## Configuration

The Electron app uses the same configuration files:

- `config/config.yaml` - Main configuration
- `.env` - Environment overrides
- `database/scheduler.db` - SQLite database
- `logs/scheduler.log` - Application logs

All settings from the web version work in the desktop app!

## Development Workflow

### 1. Run with Hot Reload

```bash
cd electron-app
npm run dev
```

Changes to Python code require restarting the app.

### 2. Debug

- **DevTools**: Automatically open with `npm run dev`
- **Python Logs**: Check console output
- **Network**: Inspect API calls in Network tab

### 3. Test

Make changes, restart, test:
```bash
npm run dev
```

## Building & Distribution

### Build All Platforms (requires each OS)

```bash
# On macOS - builds macOS version
npm run build:mac

# On Windows - builds Windows version
npm run build:win

# On Linux - builds Linux version
npm run build:linux
```

### Build Output

```
dist/
├── mac/
│   └── Git Deploy Scheduler.app
├── Git Deploy Scheduler-1.0.0.dmg
├── Git Deploy Scheduler Setup 1.0.0.exe
├── git-deploy-scheduler-1.0.0.AppImage
└── git-deploy-scheduler_1.0.0_amd64.deb
```

### Code Signing (Optional)

For production distribution:

**macOS:**
```bash
# Requires Apple Developer account
export CSC_IDENTITY_AUTO_DISCOVERY=true
npm run build:mac
```

**Windows:**
```bash
# Requires code signing certificate
export CSC_LINK=/path/to/cert.p12
export CSC_KEY_PASSWORD=password
npm run build:win
```

## Installation

### macOS
1. Open the `.dmg` file
2. Drag app to Applications folder
3. Double-click to launch
4. Allow in System Preferences → Security if needed

### Windows
1. Run `Git Deploy Scheduler Setup.exe`
2. Follow installer prompts
3. Choose auto-start option
4. App appears in Start Menu

### Linux

**AppImage** (no install):
```bash
chmod +x git-deploy-scheduler-*.AppImage
./git-deploy-scheduler-*.AppImage
```

**Debian/Ubuntu**:
```bash
sudo dpkg -i git-deploy-scheduler_*.deb
git-deploy-scheduler
```

## Auto-Start on Boot

### macOS
1. Open System Preferences
2. Users & Groups → Login Items
3. Click `+` and add Git Deploy Scheduler

### Windows
- Auto-start option in installer
- Or: Settings → Apps → Startup

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

## Troubleshooting

### App Won't Start

**Check Python**:
```bash
python3 --version  # Should be 3.9+
```

**Check Port 5000**:
```bash
lsof -ti:5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows
```

### Tray Icon Missing

Ensure icon files exist:
```
electron-app/assets/
├── icon.png (512x512)
├── tray-icon.png (48x48)
├── icon.icns (macOS)
└── icon.ico (Windows)
```

### Build Fails

```bash
cd electron-app
rm -rf node_modules dist
npm install
npm run build
```

### Python Dependencies Missing

```bash
cd ..
pip3 install -r requirements.txt
```

## Security

The Electron app is secure:

✅ **Context Isolation** - Renderer process is sandboxed
✅ **No Node Integration** - Web content can't access Node APIs
✅ **Local Only** - Backend binds to 127.0.0.1 only
✅ **No Remote Code** - Everything runs locally

## File Structure

```
electron-app/
├── package.json              # Electron config
├── src/
│   ├── main.js              # Main process (Node.js)
│   └── preload.js           # Preload script
├── assets/
│   ├── icon.png             # App icon
│   ├── tray-icon.png        # Tray icon
│   ├── icon.icns            # macOS icon
│   └── icon.ico             # Windows icon
└── README.md
```

## Comparison: Web vs Desktop

| Feature | Web Version | Desktop App |
|---------|-------------|-------------|
| Installation | Python + pip | One-click installer |
| Browser Required | ✅ Yes | ❌ No |
| System Tray | ❌ No | ✅ Yes |
| Auto-Start | Manual | Built-in option |
| Distribution | Python script | Native installer |
| Updates | Git pull | New installer |
| Platform | Any with Python | Native per OS |

## Next Steps

1. **Try it**: `npm run dev`
2. **Customize**: Edit icons in `assets/`
3. **Build**: `npm run build:mac`
4. **Distribute**: Share the installer!

The desktop app provides a professional, native experience for Git Deploy Scheduler. Users don't need Python or any technical setup - just install and run! 🚀

## Support

- Electron docs: https://electronjs.org/docs
- Issues: Check console logs and Python logs
- Help: See electron-app/README.md
