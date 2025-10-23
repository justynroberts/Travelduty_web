# Product Requirements Document: Scheduled Git Update System

## Overview
A system that automatically commits and pushes updates to a git repository at randomized 10-minute intervals (±50 seconds) to simulate realistic development activity.

## Objectives
- Automate git commits at regular intervals with random jitter
- Provide configurable commit messages
- Support multiple repositories
- Run as a background service/daemon
- Handle git authentication and error scenarios

## Technical Requirements

### Core Functionality
1. **Timing Engine**
   - Base interval: 10 minutes (600 seconds)
   - Random jitter: ±50 seconds (550-650 second range)
   - Configurable via environment variables

2. **Git Operations**
   - Stage all changes (`git add .`)
   - Commit with customizable message template
   - Push to remote repository
   - Handle merge conflicts and push failures gracefully

3. **Commit Message Format**
   - **Ollama Integration** (Primary): Generate realistic, context-aware commit messages
     - Use local Ollama instance to create varied, natural commit messages
     - Provide file diff context to LLM for meaningful messages
     - Fallback to templates if Ollama unavailable
   - **Template-based** (Fallback): Support templated messages with variables:
     - Timestamp
     - Random activity type (e.g., "update", "fix", "refactor")
     - Incremental counter
   - Example (Ollama): `"refactor: optimize database query performance in user service"`
   - Example (Template): `"chore: automated update - 2025-10-23 14:23:45"`

4. **Configuration**
   - Repository path(s)
   - Remote branch name
   - Commit message template
   - Interval timing (base + jitter range)
   - Enable/disable push to remote

### Non-Functional Requirements
1. **Reliability**
   - Graceful error handling for git failures
   - Logging of all operations
   - Retry logic for network failures

2. **Security**
   - Support SSH key authentication
   - Support HTTPS with credential storage
   - No hardcoded credentials

3. **Monitoring**
   - Log file with timestamps
   - Success/failure metrics
   - Last commit timestamp tracking

## Implementation Approach

### Technology Stack
- **Language**: Python or Node.js (for cross-platform compatibility)
- **LLM Integration**: Ollama API for commit message generation
- **Scheduler**: Custom timer with random jitter
- **Git Integration**: GitPython or simple-git library
- **Deployment**: Systemd service (Linux) or launchd (macOS)

### File Structure
```
git-deploy-schedule/
├── src/
│   ├── scheduler.py/js          # Main scheduling logic
│   ├── git_operations.py/js     # Git command wrapper
│   ├── ollama_client.py/js      # Ollama API integration
│   ├── message_generator.py/js  # Commit message generation logic
│   └── config.py/js             # Configuration loader
├── config/
│   └── config.yaml              # User configuration
├── logs/
│   └── scheduler.log            # Operation logs
├── .env.example                 # Environment variables template
├── requirements.txt / package.json
├── README.md
└── docker-compose.yml           # Containerized deployment
```

## Sample Configuration

```yaml
repositories:
  - path: /path/to/repo
    branch: main
    enabled: true

schedule:
  base_interval: 600              # seconds (10 minutes)
  jitter_range: 50                # seconds (±50s)

ollama:
  enabled: true
  url: http://oracle.local:11434
  model: llama3.2:latest          # or codellama, mistral, etc.
  timeout: 30                     # seconds
  max_tokens: 100
  system_prompt: |
    Generate a concise, realistic git commit message based on the provided file changes.
    Follow conventional commit format (type: description).
    Types: feat, fix, refactor, docs, style, test, chore.
    Be specific but brief.

commit:
  use_ollama: true                # Use Ollama if available, fallback to template
  message_template: "chore: automated update - {timestamp}"
  author_name: "Auto Deploy Bot"
  author_email: "bot@example.com"
  include_diff_context: true      # Send git diff to Ollama for context

push:
  enabled: true
  retry_attempts: 3
  retry_delay: 30                 # seconds

logging:
  level: INFO
  file: logs/scheduler.log
```

## Sample Commit Messages

### Ollama-Generated (Primary)
Based on actual file changes, Ollama generates contextual messages:
1. `"refactor: simplify error handling in authentication module"`
2. `"fix: resolve race condition in concurrent file uploads"`
3. `"feat: add caching layer to improve API response times"`
4. `"docs: update API documentation with new endpoints"`
5. `"style: format code according to linting standards"`
6. `"test: add unit tests for user validation logic"`

### Template-Based (Fallback)
Used when Ollama is unavailable:
1. Simple timestamp: `"chore: automated update - {timestamp}"`
2. With counter: `"chore: scheduled update #{count} at {timestamp}"`
3. Random activity: `"{activity}: automated changes - {timestamp}"`
   - Activities: update, fix, refactor, improve, optimize

## Success Criteria
- System runs continuously without manual intervention
- Commits occur within the specified time window (550-650 seconds)
- All git operations log appropriately
- Handles network failures gracefully
- Can be easily deployed via Docker/systemd

## Ollama Integration Details

### Workflow
1. Detect file changes using `git status`
2. Generate diff using `git diff --staged`
3. Send diff summary + system prompt to Ollama API
4. Receive generated commit message
5. Sanitize and validate message format
6. Use in git commit

### Prompt Engineering
```
System: Generate a concise, realistic git commit message based on the provided file changes.
Follow conventional commit format (type: description).
Types: feat, fix, refactor, docs, style, test, chore.
Be specific but brief.

User: Files changed:
- src/auth.py: Modified authentication logic
- tests/test_auth.py: Added new test cases

Diff summary:
+ Added JWT token validation
+ Implemented refresh token mechanism
+ Added tests for token expiration

Generate commit message:
```

Expected output: `"feat: implement JWT token validation and refresh mechanism"`

### Error Handling
- If Ollama API is unreachable: fallback to template
- If response is invalid/too long: fallback to template
- If response time exceeds timeout: fallback to template
- Log all Ollama interactions for debugging

## Future Enhancements
- Support for multiple repositories simultaneously
- Multiple Ollama model selection based on repo type
- Learning from manual commit history to improve message style
- Webhook notifications on commit
- Smart content generation (modify files before commit)
- Conditional commits (only if files changed)
- Web dashboard for monitoring
- Pause/resume functionality via API
