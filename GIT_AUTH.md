# Git Authentication Guide

This guide explains how to configure git authentication for pushing commits to remote repositories.

## Authentication Methods

### Option 1: Git Credential Helper (Recommended for PAT)

#### macOS

```bash
# Configure git to use macOS keychain
git config --global credential.helper osxkeychain

# Set your remote URL with username (token will be stored in keychain)
cd /path/to/your/repo
git remote set-url origin https://YOUR_USERNAME@github.com/user/repo.git

# On first push, you'll be prompted for password - enter your PAT token
# The token will be stored securely in keychain for future use
```

#### Linux

```bash
# Install git credential helper
sudo apt-get install libsecret-1-0 libsecret-1-dev  # Ubuntu/Debian
# OR
sudo yum install libsecret-devel  # RHEL/CentOS

# Configure git to store credentials
git config --global credential.helper store
# OR for more security (cached in memory for 1 hour)
git config --global credential.helper 'cache --timeout=3600'

# Set your remote URL
cd /path/to/your/repo
git remote set-url origin https://YOUR_USERNAME@github.com/user/repo.git

# On first push, enter your PAT when prompted
```

### Option 2: Remote URL with Embedded Token

**WARNING**: This stores your token in plaintext in `.git/config`

```bash
cd /path/to/your/repo
git remote set-url origin https://YOUR_USERNAME:YOUR_PAT_TOKEN@github.com/user/repo.git

# Example:
# git remote set-url origin https://justyn:ghp_xxxxxxxxxxxx@github.com/justyn/myrepo.git
```

### Option 3: SSH Keys (Most Secure)

```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add SSH key to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key and add to GitHub/GitLab
cat ~/.ssh/id_ed25519.pub

# Set remote URL to SSH
cd /path/to/your/repo
git remote set-url origin git@github.com:user/repo.git
```

### Option 4: Environment Variable (Docker)

For Docker deployments, you can pass credentials via environment:

```bash
# In your .env file
GIT_USERNAME=your_username
GIT_TOKEN=ghp_your_personal_access_token
```

Then modify the repository URL at runtime using git commands in the container.

## Configuration for git-deploy-schedule

### Local Development

1. **Configure git credential helper:**
   ```bash
   git config --global credential.helper osxkeychain  # macOS
   # OR
   git config --global credential.helper store  # Linux
   ```

2. **Set your repository remote with username:**
   ```bash
   cd /Users/justynroberts/work/git-deploy-schedule
   git remote add origin https://YOUR_USERNAME@github.com/user/repo.git
   ```

3. **Enable push in config:**
   ```yaml
   # config/config.yaml
   push:
     enabled: true
     retry_attempts: 3
     retry_delay: 30
   ```

4. **Test with --once mode:**
   ```bash
   python3 main.py --once
   # You'll be prompted for PAT on first push
   # Enter your Personal Access Token (not your password)
   ```

### Docker Deployment

#### Option A: Mount SSH Keys (Recommended)

```yaml
# docker-compose.yml
services:
  git-scheduler:
    volumes:
      - ${HOME}/.ssh:/root/.ssh:ro  # Read-only SSH keys
      - ${HOME}/.gitconfig:/root/.gitconfig:ro
```

Ensure your repository uses SSH URL:
```bash
git remote set-url origin git@github.com:user/repo.git
```

#### Option B: Git Credentials File

1. Create a credentials file:
   ```bash
   echo "https://YOUR_USERNAME:YOUR_PAT@github.com" > ~/.git-credentials
   chmod 600 ~/.git-credentials
   ```

2. Configure git:
   ```bash
   git config --global credential.helper store
   ```

3. Mount in docker-compose:
   ```yaml
   volumes:
     - ${HOME}/.git-credentials:/root/.git-credentials:ro
     - ${HOME}/.gitconfig:/root/.gitconfig:ro
   ```

## GitHub Personal Access Token (PAT)

### Creating a PAT

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name: "git-deploy-schedule"
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (if using GitHub Actions)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

### Token Format

- Classic tokens: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Fine-grained tokens: `github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## GitLab Personal Access Token

1. GitLab → Preferences → Access Tokens
2. Name: "git-deploy-schedule"
3. Scopes:
   - ✅ `write_repository`
4. Click "Create personal access token"
5. Copy the token

### GitLab URL Format
```bash
git remote set-url origin https://oauth2:YOUR_TOKEN@gitlab.com/user/repo.git
```

## Bitbucket App Password

1. Bitbucket → Personal settings → App passwords
2. Create app password with `repository:write` permission
3. Use format:
   ```bash
   git remote set-url origin https://YOUR_USERNAME:YOUR_APP_PASSWORD@bitbucket.org/user/repo.git
   ```

## Testing Authentication

```bash
# Test push without making commits
git push --dry-run

# Test with actual push
echo "test" > test.txt
git add test.txt
git commit -m "test: authentication test"
git push
```

## Security Best Practices

1. ✅ **Use credential helper** - Don't embed tokens in remote URLs
2. ✅ **Use SSH keys** when possible - Most secure option
3. ✅ **Set token expiration** - Limit token lifetime (30-90 days)
4. ✅ **Minimal scopes** - Only grant necessary permissions
5. ✅ **Rotate tokens** regularly - Create new tokens periodically
6. ❌ **Never commit** `.git/config` with embedded tokens
7. ❌ **Never commit** `.git-credentials` file
8. ❌ **Never log** tokens in application logs

## Troubleshooting

### Authentication Failed

```bash
# Check remote URL
git remote -v

# Test authentication
git ls-remote origin

# Check credential helper
git config --get credential.helper
```

### Token Not Working

- Verify token hasn't expired
- Check token has correct scopes/permissions
- Ensure token is for correct account
- Try regenerating token

### Permission Denied (SSH)

```bash
# Test SSH connection
ssh -T git@github.com

# Add key to ssh-agent
ssh-add ~/.ssh/id_ed25519
```

## Current Repository Setup

For this specific repository:

```bash
# Check current remote
cd /Users/justynroberts/work/git-deploy-schedule
git remote -v

# If no remote, add one:
git remote add origin https://YOUR_USERNAME@github.com/YOUR_USERNAME/git-deploy-schedule.git

# Enable push in config
# Edit config/config.yaml and set push.enabled: true

# Test
python3 main.py --once
```

## Quick Start Checklist

- [ ] Create GitHub/GitLab Personal Access Token
- [ ] Configure git credential helper
- [ ] Set remote URL with username
- [ ] Test authentication with manual push
- [ ] Enable push in `config/config.yaml`
- [ ] Test with `python3 main.py --once`
- [ ] Verify commit appears on remote
- [ ] Enable continuous mode

## Support

For issues with specific git providers:
- GitHub: https://docs.github.com/en/authentication
- GitLab: https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html
- Bitbucket: https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/
