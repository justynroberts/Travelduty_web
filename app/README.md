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

## 📡 API Documentation

All endpoints return JSON responses. Base URL: `http://localhost:3001/api`

### Status & Monitoring

#### `GET /api/status`
Get current scheduler status and configuration.

**Response:**
```json
{
  "running": true,
  "paused": false,
  "nextRun": "2025-10-23T15:16:20.563Z",
  "config": {
    "git": {
      "repo_path": "/path/to/repo",
      "push_enabled": true,
      "retry_attempts": 3,
      "retry_delay": 5000
    },
    "schedule": {
      "base_interval": 600,
      "jitter_range": 50,
      "enabled": true
    },
    "ollama": {
      "enabled": true,
      "url": "http://localhost:11434",
      "model": "llama3.1:8b",
      "theme": "kubernetes",
      "timeout": 30000
    },
    "server": {
      "host": "0.0.0.0",
      "port": 3001
    }
  }
}
```

#### `GET /api/history?limit=10`
Get recent commit history.

**Query Parameters:**
- `limit` (optional, default: 10) - Number of commits to return

**Response:**
```json
{
  "commits": [
    {
      "id": 1,
      "commit_hash": "c4ba5c1...",
      "message": "Refactor implementation: config/config.yaml",
      "files_changed": 2,
      "timestamp": "2025-10-23 15:06:22",
      "success": 1,
      "used_ollama": 0,
      "theme": "kubernetes",
      "push_success": 0,
      "error_message": null
    }
  ]
}
```

#### `GET /api/stats`
Get commit statistics.

**Response:**
```json
{
  "id": 1,
  "total_commits": 42,
  "successful_commits": 40,
  "failed_commits": 2,
  "total_files_changed": 156,
  "ollama_usage_count": 38,
  "last_commit_time": "2025-10-23 15:06:22",
  "updated_at": "2025-10-23 15:06:22",
  "next_scheduled_commit": "2025-10-23T15:16:20.563Z"
}
```

### Scheduler Controls

#### `POST /api/control`
Control scheduler operations.

**Request Body:**
```json
{
  "action": "pause" | "resume" | "trigger" | "start" | "stop"
}
```

**Actions:**
- `pause` - Pause the scheduler (stops scheduling new commits, but keeps running)
- `resume` - Resume a paused scheduler
- `trigger` - Trigger an immediate commit (bypasses scheduling)
- `start` - Start the scheduler
- `stop` - Stop the scheduler completely

**Response:**
```json
{
  "success": true,
  "message": "Scheduler paused"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/control \
  -H "Content-Type: application/json" \
  -d '{"action":"pause"}'
```

### Settings Management

#### `GET /api/settings/credentials`
Check if credentials are stored in keychain.

**Response:**
```json
{
  "hasCredentials": true,
  "hasPatToken": true,
  "hasUsername": true,
  "hasEmail": true
}
```

#### `POST /api/settings/credentials`
Save Git credentials to secure keychain.

**Request Body:**
```json
{
  "pat_token": "ghp_xxxxxxxxxxxxxxxxxxxxx",
  "git_username": "your-github-username",
  "git_email": "you@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Credentials saved successfully"
}
```

#### `DELETE /api/settings/credentials`
Delete stored credentials from keychain.

**Response:**
```json
{
  "success": true,
  "message": "Credentials deleted"
}
```

#### `GET /api/settings/config`
Get current configuration (same as config in `/api/status`).

#### `PATCH /api/settings/config`
Update configuration dynamically. Changes are written to `config.yaml`.

**Request Body (partial updates supported):**
```json
{
  "schedule": {
    "base_interval": 1200
  },
  "ollama": {
    "theme": "docker"
  }
}
```

**Response:**
```json
{
  "success": true,
  "config": { /* updated config */ }
}
```

## 🖥️ Dashboard UI

The web dashboard provides a complete interface for managing the scheduler:

### Dashboard Tab
- **Real-time Status Card**
  - Scheduler running/paused state with visual indicators
  - Next scheduled commit time countdown
  - Config-at-a-glance (interval, jitter, theme, push enabled)

- **Control Buttons**
  - Pause/Resume scheduler
  - Trigger immediate commit
  - Stop scheduler

- **Statistics Card**
  - Total commits (successful/failed)
  - Files changed count
  - AI usage percentage
  - Last commit timestamp

- **Recent Commits Table**
  - Commit hash (first 7 chars)
  - Full commit message
  - Files changed count
  - Timestamp
  - Success/failure status
  - AI-generated indicator

### Settings Tab

**Git Credentials Section:**
- Visual indicator showing credential status (stored/not stored)
- PAT token input (password field)
- Git username input
- Git email input
- Save/Delete credential buttons
- All credentials saved to OS-level keychain (never in config files)

**Scheduler Configuration Section:**
- Base interval slider (60-3600 seconds)
- Jitter range slider (0-300 seconds)
- AI commit theme dropdown (kubernetes, docker, terraform, general)
- Push enabled toggle
- Save configuration button (updates `config.yaml`)

**UI Features:**
- Auto-refresh every 5 seconds
- Material Design with Material Icons
- Google Fonts (Inter)
- Gradient purple color scheme
- Responsive layout
- Real-time validation
- Success/error toast notifications

## 🤖 Commit Message Generation

The app supports two modes for generating commit messages:

### AI-Powered Mode (Ollama)

When Ollama is enabled and reachable, the app:

1. **Analyzes Changed Files**: Reads `git diff` to understand what changed
2. **Sends Context to Ollama**: Provides file changes and selected theme
3. **Receives AI-Generated Message**: Contextual, domain-specific commit message
4. **Records Usage**: Tracks AI-generated commits in database

**Supported Themes:**
- `kubernetes` - Messages like "Optimize pod scheduling", "Update ingress configuration"
- `docker` - Messages like "Refactor container build", "Update Dockerfile layers"
- `terraform` - Messages like "Update infrastructure state", "Refactor resource definitions"
- `general` - Standard software development messages

**Example AI-Generated Messages:**
```
Kubernetes theme:
- "Scale replica count for high availability"
- "Update ConfigMap for production environment"
- "Optimize resource limits and requests"

Docker theme:
- "Refactor multi-stage build process"
- "Update base image to alpine:latest"
- "Optimize layer caching strategy"

Terraform theme:
- "Update AWS provider configuration"
- "Refactor module variables structure"
- "Add lifecycle policies to resources"
```

### Fallback Mode (Template-Based)

When Ollama is disabled or unreachable:

1. **Template Selection**: Randomly selects from theme-specific templates
2. **File Injection**: Includes actual changed filenames
3. **Commit**: Creates commit with template message

**Template Examples:**
```
- "Refactor implementation: config.yaml, database.db"
- "Update configuration: src/index.ts"
- "Optimize deployment: Dockerfile, k8s/deployment.yaml"
```

### Commit Message Configuration

In `src/services/messageGenerator.ts`:
- Customize AI prompts for each theme
- Add new themes
- Adjust template messages
- Configure Ollama timeout and retry logic

## 🔒 Security

### Credential Storage
- **Keytar Library**: Native Node.js bindings to OS keychains
- **macOS**: Credentials stored in Keychain Access (same as Safari, Chrome passwords)
- **Windows**: Windows Credential Manager (same as Windows Login credentials)
- **Linux**: libsecret (GNOME Keyring, KWallet)
- **Zero Plain-Text Storage**: PAT tokens never written to disk or config files
- **Per-User Isolation**: Credentials scoped to current OS user

### Code Security
- **TypeScript**: Type safety prevents common errors
- **Express.js**: Industry-standard backend framework
- **CORS**: Configurable cross-origin restrictions
- **Input Validation**: All API inputs validated
- **Error Handling**: Graceful degradation, no sensitive data in error messages

### Best Practices
- PAT tokens should have minimal scopes (only `repo`)
- Use dedicated PAT for this app (not your main GitHub token)
- Rotate tokens periodically
- Run on `localhost` only (unless deploying to private network)
- Use HTTPS reverse proxy for remote access

## ⚙️ Configuration Deep Dive

Configuration file: `../config/config.yaml` (relative to `app/` directory)

### Git Configuration

```yaml
git:
  repo_path: "/absolute/path/to/repo"  # MUST be absolute path
  push_enabled: true                   # Set false to commit locally only
  retry_attempts: 3                    # Number of push retries on failure
  retry_delay: 5000                    # Milliseconds between retries
```

**Key Points:**
- `repo_path` MUST be an absolute path to an initialized Git repository
- `push_enabled: false` useful for testing or local-only commits
- Retry logic uses exponential backoff

### Schedule Configuration

```yaml
schedule:
  base_interval: 600     # Seconds between commits (600 = 10 minutes)
  jitter_range: 50       # Random variation: ±50 seconds
  enabled: true          # Auto-start scheduler on app launch
```

**How Jitter Works:**
- Base interval: 600 seconds (10 minutes)
- Jitter range: ±50 seconds
- Actual interval: Random between 550-650 seconds
- **Why?** Makes commits appear human-like, not automated

**Interval Guidelines:**
- Minimum: 60 seconds (avoid spam)
- Recommended: 300-1800 seconds (5-30 minutes)
- Maximum: 3600 seconds (1 hour)

### Ollama Configuration

```yaml
ollama:
  enabled: true                        # Enable AI commit messages
  url: "http://localhost:11434"        # Ollama API endpoint
  model: "llama3.1:8b"                 # Model name (llama3.1, mistral, etc.)
  theme: "kubernetes"                  # Message theme
  timeout: 30000                       # API timeout in milliseconds
```

**Supported Models:**
- `llama3.1:8b` (recommended) - Fast, high-quality
- `llama3.1:70b` - Slower, more detailed
- `mistral:7b` - Alternative, good quality
- Any Ollama-compatible model

**Themes:**
- `kubernetes` - K8s/cloud-native terminology
- `docker` - Container/Docker contexts
- `terraform` - IaC/cloud infrastructure
- `general` - Standard software dev

### Server Configuration

```yaml
server:
  host: "0.0.0.0"      # Listen on all interfaces (or "localhost" for local only)
  port: 3001           # HTTP port
```

**Host Options:**
- `0.0.0.0` - Listen on all network interfaces (LAN access)
- `localhost` / `127.0.0.1` - Local access only (more secure)

**Port Considerations:**
- Default: 3001 (avoid conflicts with common ports)
- Must be available (check with `lsof -ti:3001`)
- Use reverse proxy (nginx/caddy) for HTTPS in production

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
