# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Git Deploy Schedule is an automated git commit scheduler that uses Ollama AI to generate contextual commit messages. It commits changes at randomized intervals (10 minutes ± 50 seconds) with intelligent commit messages based on actual file diffs.

## Common Commands

### Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run scheduler continuously
python main.py

# Run once (testing mode)
python main.py --once

# Check scheduler status
python main.py --status

# Run with custom config
python main.py --config path/to/config.yaml
```

### Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_config.py

# Run specific test
pytest tests/test_config.py::test_config_load
```

### Docker
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f git-scheduler

# Run once mode
docker-compose run git-scheduler python main.py --once

# Check status
docker-compose run git-scheduler python main.py --status

# Stop
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

## Architecture

### Core Components

1. **scheduler.py** - Main orchestrator
   - Manages timing with randomized intervals
   - Coordinates git operations and message generation
   - Handles continuous running and logging
   - Entry point: `GitScheduler` class

2. **git_operations.py** - Git wrapper
   - Wraps GitPython for all git operations
   - Methods: stage_all(), commit(), push(), get_diff(), get_changed_files()
   - Handles errors gracefully with retries on push

3. **ollama_client.py** - Ollama API client
   - Communicates with local Ollama instance
   - Methods: generate(), health_check(), get_models()
   - Configurable timeout and token limits

4. **message_generator.py** - Commit message generation
   - Primary: Uses Ollama with diff context
   - Fallback: Template-based messages
   - Validates and sanitizes all messages
   - Enforces conventional commit format

5. **config.py** - Configuration management
   - Loads YAML configuration
   - Supports environment variable overrides
   - Provides typed accessors for config sections

### Data Flow

1. Scheduler calculates next interval (base ± jitter)
2. Waits for interval to elapse
3. Checks for git changes via GitOperations
4. If changes exist:
   - Stages all changes
   - Gets file list and diff
   - MessageGenerator queries Ollama with diff context
   - If Ollama fails, falls back to template
   - GitOperations creates commit with generated message
   - Optionally pushes to remote (if enabled)
5. Logs all operations
6. Repeats from step 1

### Configuration System

- **Primary config**: `config/config.yaml` - All settings
- **Environment overrides**: `.env` file - Overrides YAML values
- **Docker environment**: `docker-compose.yml` - Container-specific overrides

Configuration priority: Environment variables > YAML file

Key config sections:
- `repositories`: Git repos to manage
- `schedule`: Timing configuration
- `ollama`: AI model settings
- `commit`: Message generation settings
- `push`: Remote push settings
- `logging`: Log configuration

### Key Design Decisions

1. **Ollama Integration**: Uses local Ollama API (http://oracle.local:11434) for privacy and no API costs
2. **Fallback Strategy**: Always has template fallback if Ollama unavailable
3. **Conventional Commits**: Enforces conventional commit format (type: description)
4. **Random Jitter**: Adds ±50s randomness to avoid predictable patterns
5. **No Auto-Push by Default**: Push is disabled by default for safety
6. **Comprehensive Logging**: All operations logged to file and console

## Development Guidelines

### Adding New Features

When adding features, consider:
- Update tests in `tests/` directory
- Add configuration options to `config.yaml` and `.env.example`
- Update Config class accessors if new config sections added
- Update README.md with usage examples
- Maintain fallback behavior for robustness

### Testing Strategy

- Unit tests for each module in isolation
- Mock external dependencies (Ollama, git operations)
- Test both success and failure paths
- Test configuration loading and overrides
- Use pytest fixtures for common test objects

### Error Handling

All modules should:
- Log errors with appropriate level (ERROR, WARNING)
- Return None or False on failure (never raise in main flow)
- Provide fallback behavior where possible
- Retry network operations with configurable attempts

### Logging Conventions

- INFO: Normal operations, commit messages, intervals
- WARNING: Fallback usage, retries, non-critical issues
- ERROR: Failed operations, configuration issues
- DEBUG: Detailed operation info, API payloads

## Common Development Patterns

### Adding a New Configuration Option

1. Add to `config/config.yaml` with default value
2. Add to `.env.example` for environment override
3. Add override logic to `Config._apply_env_overrides()`
4. Add accessor method to Config class if needed
5. Add test in `tests/test_config.py`

### Adding a New Commit Message Type

1. Add type to `MessageGenerator.ACTIVITY_TYPES`
2. Update Ollama system prompt in config if needed
3. Update validation in `MessageGenerator._validate_message()`
4. Add test cases in `tests/test_message_generator.py`

### Integrating a New LLM Provider

1. Create new client class (e.g., `openai_client.py`)
2. Implement same interface as OllamaClient
3. Add configuration section to `config.yaml`
4. Update MessageGenerator to support multiple providers
5. Add tests for new client

## Troubleshooting

### Tests Failing
- Ensure you're in project root: `cd /Users/justynroberts/work/git-deploy-schedule`
- Check Python path includes src: tests use relative imports
- Verify config.yaml exists and is valid
- Mock external calls (Ollama, git) in tests

### Ollama Not Connecting
- Check Ollama is running: `curl http://oracle.local:11434/api/tags`
- Verify URL in config matches Ollama host
- Check network connectivity to oracle.local
- Review logs for connection errors

### Git Operations Failing
- Ensure repository path is valid git repo
- Check git authentication (SSH keys, credentials)
- Verify user has write permissions
- Check git status manually: `git status`

## Production Deployment

For production deployment:
1. Use Docker Compose for isolation
2. Enable push only after testing: `push.enabled: true`
3. Mount SSH keys securely in docker-compose.yml
4. Set appropriate log level: `logging.level: INFO`
5. Monitor logs directory for issues
6. Use restart policy: `restart: unless-stopped`
7. Test with `--once` mode before continuous run
