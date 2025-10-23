# Git Deploy Scheduler - Node.js/TypeScript Edition

A production-ready automated Git commit scheduler with AI-powered commit messages, secure credential storage, and a beautiful web-based dashboard. Perfect for maintaining commit streaks, simulating development activity, or automating routine repository updates.

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Dashboard UI](#dashboard-ui)
- [Commit Message Generation](#commit-message-generation)
- [Security](#security)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)
- [Technology Stack](#technology-stack)

## ✨ Features

### **Full TypeScript Implementation**
- Type-safe codebase with comprehensive interfaces
- Express.js REST API backend
- SQLite database for commit tracking and statistics
- simple-git library for reliable Git operations
- Automatic TypeScript compilation and hot-reload during development

### **Secure Credential Storage**
- Uses `keytar` for OS-level keychain integration
- PAT (Personal Access Token) tokens stored securely:
  - **macOS**: Keychain Access
  - **Windows**: Credential Manager
  - **Linux**: libsecret (GNOME Keyring, KWallet)
- Zero credentials in config files or environment variables
- Secure API for credential management

### **Modern Web Dashboard**
- Single-page application with tabbed interface
- Real-time scheduler status and statistics
- Commit history with detailed metadata
- Settings management UI
- Material Icons and Google Fonts (Inter)
- Responsive gradient purple design
- Auto-refresh every 5 seconds

### **AI-Powered Commit Messages**
- Ollama integration for contextual, intelligent commit messages
- Theme support for domain-specific messages:
  - `kubernetes` - K8s-related terminology
  - `docker` - Container and Docker contexts
  - `terraform` - Infrastructure as Code themes
  - `general` - Standard software development
- Automatic fallback to template-based messages if Ollama unavailable
- Analyzes actual file changes for contextual messages

### **Intelligent Scheduler**
- Configurable base interval with random jitter for human-like patterns
- Prevents detection of automated commits
- Pause/resume/trigger controls via API and UI
- Auto-start capability on application launch
- Precise setTimeout-based scheduling (more reliable than cron)
- Next commit time tracking and display

### **Comprehensive Commit Tracking**
- SQLite database records every commit attempt
- Tracks: commit hash, message, files changed, timestamp, success/failure
- Records Ollama usage and AI theme
- Push success tracking
- Error message storage for debugging
- Statistics: total commits, success rate, files changed, AI usage

### **Retry Logic & Error Handling**
- Configurable retry attempts for push operations
- Exponential backoff between retries
- Detailed error logging and user feedback
- Graceful degradation when services unavailable

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm
- **Git** installed and configured
- **Git repository** initialized (the app will commit to the repo specified in config)
- **(Optional)** Ollama running locally for AI commit messages

### 1. Install Dependencies

```bash
cd app
npm install
```

**Note**: On macOS, if `keytar` fails to install, ensure Xcode Command Line Tools are installed:
```bash
xcode-select --install
```

### 2. Configure the Application

Edit `../config/config.yaml`:

```yaml
git:
  repo_path: "/absolute/path/to/your/repo"  # REQUIRED: Path to your Git repository
  push_enabled: true                         # Enable/disable push after commit
  retry_attempts: 3                          # Number of push retry attempts
  retry_delay: 5000                          # Delay between retries (ms)

schedule:
  base_interval: 600      # Base time between commits (seconds) - 10 minutes
  jitter_range: 50        # Random variation (±seconds) for human-like timing
  enabled: true           # Auto-start scheduler on launch

ollama:
  enabled: true                           # Enable AI-powered commit messages
  url: "http://localhost:11434"           # Ollama API endpoint
  model: "llama3.1:8b"                    # Model to use (llama3.1, mistral, etc.)
  theme: "kubernetes"                     # Message theme (kubernetes, docker, terraform, general)
  timeout: 30000                          # API timeout (ms)

server:
  host: "0.0.0.0"         # Listen on all interfaces (use "localhost" for local only)
  port: 3001              # HTTP port for dashboard and API
```

### 3. Set Up Git Credentials (First Time)

The app needs Git credentials to push commits. You have two options:

**Option A: Use the Web UI (Recommended)**
1. Start the app (see step 4)
2. Open http://localhost:3001 in your browser
3. Click the "Settings" tab
4. Enter your GitHub Personal Access Token, username, and email
5. Click "Save Credentials"

**Option B: Use the API**
```bash
curl -X POST http://localhost:3001/api/settings/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "pat_token": "ghp_your_github_token_here",
    "git_username": "your-github-username",
    "git_email": "you@example.com"
  }'
```

**Creating a GitHub PAT Token:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control of private repositories)
4. Generate and copy the token (starts with `ghp_`)

### 4. Run the Application

**Development Mode** (with auto-restart on file changes):
```bash
npm run dev
```

**Production Mode**:
```bash
npm run build
npm start
```

### 5. Access the Dashboard

Open your browser to:
```
http://localhost:3001
```

You should see:
- **Dashboard Tab**: Real-time scheduler status, statistics, commit history, and controls
- **Settings Tab**: Credential management and configuration updates

### 6. Control the Scheduler

Via the dashboard UI:
- **Pause** - Temporarily stop scheduling commits
- **Resume** - Resume scheduling
- **Trigger Now** - Immediately create a commit
- **Stop** - Stop the scheduler completely

Or via API:
```bash
# Pause
curl -X POST http://localhost:3001/api/control -H "Content-Type: application/json" -d '{"action":"pause"}'

# Resume
curl -X POST http://localhost:3001/api/control -H "Content-Type: application/json" -d '{"action":"resume"}'

# Trigger immediate commit
curl -X POST http://localhost:3001/api/control -H "Content-Type: application/json" -d '{"action":"trigger"}'
```

## Architecture

```
app/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── types/index.ts           # TypeScript interfaces
│   ├── services/
│   │   ├── config.ts            # YAML config loader
│   │   ├── credentials.ts       # Secure keychain storage
│   │   ├── database.ts          # SQLite operations
│   │   ├── git.ts               # Git operations
│   │   ├── ollama.ts            # Ollama API client
│   │   ├── messageGenerator.ts  # Commit message generation
│   │   └── scheduler.ts         # Scheduler logic
│   └── routes/
│       └── api.ts               # Express API routes
├── public/
│   ├── index.html               # Main dashboard
│   ├── css/styles.css           # Modern gradient design
│   └── js/app.js                # Frontend logic
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

### Status & History
- `GET /api/status` - Get scheduler status
- `GET /api/history?limit=10` - Get recent commits
- `GET /api/stats` - Get statistics

### Controls
- `POST /api/control` - Control scheduler
  - `{ "action": "pause" }` - Pause scheduler
  - `{ "action": "resume" }` - Resume scheduler
  - `{ "action": "trigger" }` - Trigger commit now
  - `{ "action": "start" }` - Start scheduler
  - `{ "action": "stop" }` - Stop scheduler

### Settings
- `GET /api/settings/credentials` - Check if credentials exist
- `POST /api/settings/credentials` - Save credentials
  ```json
  {
    "pat_token": "ghp_xxxxx",
    "git_username": "your-username",
    "git_email": "you@example.com"
  }
  ```
- `DELETE /api/settings/credentials` - Delete credentials
- `GET /api/settings/config` - Get configuration
- `PATCH /api/settings/config` - Update configuration

## Settings UI

The settings page allows you to:

1. **Manage Git Credentials**
   - Save PAT token securely in system keychain
   - Configure git username and email
   - Delete stored credentials

2. **Configure Scheduler**
   - Set base interval (seconds)
   - Set jitter range (±seconds)
   - Choose AI commit theme
   - Enable/disable auto-push

## Security

- **Keytar Integration**: Credentials stored in OS keychain/credential manager
- **No Hardcoded Secrets**: All sensitive data in secure storage
- **CORS Enabled**: For development
- **Context Isolation**: TypeScript types prevent errors

## Configuration

The app reads from `../config/config.yaml`:

```yaml
git:
  repo_path: "/path/to/repo"
  push_enabled: true
  retry_attempts: 3
  retry_delay: 5000

schedule:
  base_interval: 600  # 10 minutes
  jitter_range: 50    # ±50 seconds
  enabled: true

ollama:
  enabled: true
  url: "http://oracle.local:11434"
  model: "llama3.1:8b"
  theme: "kubernetes"
  timeout: 30000

server:
  host: "0.0.0.0"
  port: 5000
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode (auto-restart on changes)
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

## Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.3+
- **Backend**: Express.js
- **Database**: SQLite3
- **Git**: simple-git
- **Credentials**: keytar (system keychain)
- **Config**: js-yaml, dotenv
- **HTTP**: axios
- **Frontend**: Vanilla JS, Material Icons, Google Fonts

## Differences from Python Version

| Feature | Python Version | Node.js Version |
|---------|---------------|-----------------|
| Language | Python 3.9+ | TypeScript 5.3+ |
| Backend | FastAPI | Express.js |
| Credentials | .env file | System keychain (keytar) |
| Settings UI | Basic | Advanced with secure storage |
| Types | Optional (hints) | Full TypeScript |
| Scheduler | threading | setTimeout |

## Benefits of TypeScript Version

1. **Type Safety**: Catch errors at compile time
2. **Secure Credentials**: OS-level keychain integration
3. **Modern UI**: Material Design with Google Fonts
4. **Better IDE Support**: IntelliSense, autocomplete
5. **Single Ecosystem**: Node.js for everything
6. **Easy Deployment**: `npm install` and go

## Next Steps

1. Test with your repository
2. Configure Ollama (optional)
3. Save your PAT token in Settings
4. Start scheduler and monitor commits

## Troubleshooting

### Config File Not Found
- Ensure you run from the `app/` directory
- Config should be at `../config/config.yaml`

### Keytar Installation Fails
- Requires native build tools
- macOS: Install Xcode Command Line Tools
- Windows: Install windows-build-tools
- Linux: Install libsecret-1-dev

### Port Already in Use
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

## License

MIT

---

**Built with ❤️ using Node.js, TypeScript, and modern web technologies**
