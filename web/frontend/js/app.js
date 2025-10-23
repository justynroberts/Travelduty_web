// Git Deploy Scheduler - Frontend JavaScript

const API_BASE = '';
let refreshInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Git Deploy Scheduler UI Loaded');
    loadData();
    startAutoRefresh();
});

// Auto refresh every 5 seconds
function startAutoRefresh() {
    refreshInterval = setInterval(() => {
        loadData();
    }, 5000);
}

// Load all data
async function loadData() {
    try {
        await Promise.all([
            loadStatus(),
            loadHistory(),
            loadStats()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Load status
async function loadStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/status`);
        const data = await response.json();

        // Update status badge
        const badge = document.getElementById('statusBadge');
        const statusText = document.getElementById('statusText');

        if (data.paused) {
            badge.className = 'status-badge paused';
            statusText.textContent = 'Paused';
            document.getElementById('pauseBtn').style.display = 'none';
            document.getElementById('resumeBtn').style.display = 'inline-block';
        } else {
            badge.className = 'status-badge running';
            statusText.textContent = 'Running';
            document.getElementById('pauseBtn').style.display = 'inline-block';
            document.getElementById('resumeBtn').style.display = 'none';
        }

        // Update next commit countdown
        if (data.next_commit_in !== null && data.next_commit_in !== undefined) {
            const minutes = Math.floor(data.next_commit_in / 60);
            const seconds = data.next_commit_in % 60;
            document.getElementById('nextCommit').textContent =
                `${minutes}m ${seconds}s`;
        } else {
            document.getElementById('nextCommit').textContent = '--:--';
        }

        // Update theme
        document.getElementById('currentTheme').textContent = data.current_theme || 'None';

        // Update Ollama status
        document.getElementById('ollamaStatus').textContent =
            data.ollama_available ? '✅ Available' : '❌ Unavailable';

        // Update repo info
        if (data.repository) {
            const repoName = data.repository.split('/').pop();
            document.getElementById('repoPath').textContent = repoName;
            document.getElementById('repoBranch').textContent = data.branch || 'main';
        }

    } catch (error) {
        console.error('Error loading status:', error);
    }
}

// Load history
async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE}/api/history?limit=20`);
        const data = await response.json();

        const commitList = document.getElementById('commitList');
        const commitCount = document.getElementById('commitCount');

        commitCount.textContent = data.total;

        if (data.commits.length === 0) {
            commitList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <div>No commits yet</div>
                </div>
            `;
            return;
        }

        commitList.innerHTML = data.commits.map(commit => {
            const type = extractCommitType(commit.message);
            const timeAgo = formatTimeAgo(commit.timestamp);
            const icon = getCommitIcon(commit.success, commit.used_ollama);

            return `
                <div class="commit-item">
                    <div class="commit-message">
                        ${icon}
                        <span class="badge ${type}">${type}</span>
                        ${escapeHtml(commit.message)}
                    </div>
                    <div class="commit-meta">
                        <span>🕐 ${timeAgo}</span>
                        <span>📄 ${commit.files_changed} file${commit.files_changed !== 1 ? 's' : ''}</span>
                        <span>🔖 ${commit.hash.substring(0, 7)}</span>
                        ${commit.theme ? `<span>🏷️ ${commit.theme}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading history:', error);
        document.getElementById('commitList').innerHTML = `
            <div class="empty-state">
                <div>Error loading commits</div>
            </div>
        `;
    }
}

// Load stats
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/api/stats`);
        const data = await response.json();

        document.getElementById('totalCommits').textContent = data.total_commits;
        document.getElementById('successRate').textContent = `${data.success_rate}%`;
        document.getElementById('aiUsage').textContent = `${data.ollama_usage_rate}%`;
        document.getElementById('commits24h').textContent = data.commits_last_24h;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Control functions
async function pauseScheduler() {
    try {
        const response = await fetch(`${API_BASE}/api/control`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'pause' })
        });

        if (response.ok) {
            showNotification('Scheduler paused', 'success');
            loadStatus();
        }
    } catch (error) {
        console.error('Error pausing scheduler:', error);
        showNotification('Failed to pause scheduler', 'error');
    }
}

async function resumeScheduler() {
    try {
        const response = await fetch(`${API_BASE}/api/control`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'resume' })
        });

        if (response.ok) {
            showNotification('Scheduler resumed', 'success');
            loadStatus();
        }
    } catch (error) {
        console.error('Error resuming scheduler:', error);
        showNotification('Failed to resume scheduler', 'error');
    }
}

async function triggerCommit() {
    try {
        const response = await fetch(`${API_BASE}/api/control`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'trigger' })
        });

        if (response.ok) {
            showNotification('Commit triggered! Check commits in a moment...', 'success');
            setTimeout(() => loadData(), 2000);
        }
    } catch (error) {
        console.error('Error triggering commit:', error);
        showNotification('Failed to trigger commit', 'error');
    }
}

function refreshData() {
    showNotification('Refreshing data...', 'info');
    loadData();
}

// Helper functions
function extractCommitType(message) {
    if (!message) return 'chore';
    const match = message.match(/^(\w+)(\([^)]+\))?:/);
    if (match) {
        return match[1].toLowerCase();
    }
    return 'chore';
}

function getCommitIcon(success, usedOllama) {
    if (!success) return '❌';
    if (usedOllama) return '🤖';
    return '✅';
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Simple console notification for now
    console.log(`[${type.toUpperCase()}] ${message}`);

    // You could implement a toast notification here
    // For now, we'll just show an alert for errors
    if (type === 'error') {
        alert(message);
    }
}

// Handle visibility change - pause refresh when tab is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    } else {
        if (!refreshInterval) {
            loadData();
            startAutoRefresh();
        }
    }
});
