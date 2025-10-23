# Git Deploy Scheduler - Node.js/TypeScript Edition

Complete rewrite of the Git Deploy Scheduler in Node.js/TypeScript with secure credential storage and modern settings UI.

## Features

✅ **Full TypeScript Implementation**
- Type-safe codebase
- Express.js backend
- SQLite database
- Simple-git for Git operations

✅ **Secure Credential Storage**
- Uses `keytar` for system keychain integration
- PAT tokens stored securely (Keychain on macOS, Credential Manager on Windows, libsecret on Linux)
- No credentials in config files

✅ **Modern Settings UI**
- Beautiful single-page dashboard
- Settings tab for PAT token management
- Real-time stats and commit history
- Material Icons and Google Fonts (Inter)
- Gradient purple design

✅ **AI-Powered Commits**
- Ollama integration for contextual commit messages
- Theme support (Kubernetes, Docker, Terraform, etc.)
- Fallback to template messages if Ollama unavailable

✅ **Scheduler**
- Configurable base interval + random jitter
- Pause/resume/trigger controls
- Auto-start on launch

## Quick Start

### 1. Install Dependencies

```bash
cd app
npm install
```

### 2. Run Development Mode

```bash
npm run dev
```

### 3. Build for Production

```bash
npm run build
npm start
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
