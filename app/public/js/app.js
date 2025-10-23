const API_BASE = window.location.origin;

// Tab Management
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
    });
});

// Dashboard Functions
async function loadDashboard() {
    await Promise.all([
        loadStatus(),
        loadStats(),
        loadHistory()
    ]);
}

async function loadStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/status`);
        const data = await response.json();

        const statusBadge = document.getElementById('scheduler-status');
        const statusText = document.getElementById('status-text');

        statusBadge.className = 'status-badge';

        if (!data.running) {
            statusBadge.classList.add('stopped');
            statusText.textContent = 'Stopped';
        } else if (data.paused) {
            statusBadge.classList.add('paused');
            statusText.textContent = 'Paused';
        } else {
            statusText.textContent = 'Running';
        }

        document.getElementById('last-run').textContent = data.lastRun
            ? new Date(data.lastRun).toLocaleString()
            : 'Never';

        document.getElementById('next-run').textContent = data.nextRun
            ? new Date(data.nextRun).toLocaleString()
            : 'Not scheduled';

    } catch (error) {
        console.error('Error loading status:', error);
    }
}

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/api/stats`);
        const data = await response.json();

        document.getElementById('total-commits').textContent = data.total_commits || 0;
        document.getElementById('successful-commits').textContent = data.successful_commits || 0;
        document.getElementById('files-changed').textContent = data.total_files_changed || 0;
        document.getElementById('ollama-usage').textContent = data.ollama_usage_count || 0;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE}/api/history?limit=10`);
        const data = await response.json();

        const feed = document.getElementById('commit-feed');

        if (!data.commits || data.commits.length === 0) {
            feed.innerHTML = '<div class="loading">No commits yet</div>';
            return;
        }

        feed.innerHTML = data.commits.map(commit => `
            <div class="commit-item ${commit.success ? 'success' : 'failed'}">
                <div class="commit-header">
                    <span class="commit-hash">${commit.commit_hash.substring(0, 7)}</span>
                    <span class="commit-time">${new Date(commit.timestamp).toLocaleString()}</span>
                </div>
                <div class="commit-message">${commit.message}</div>
                <div class="commit-meta">
                    <span class="meta-badge">
                        <span class="material-icons" style="font-size: 0.9rem;">insert_drive_file</span>
                        ${commit.files_changed} files
                    </span>
                    ${commit.used_ollama ? '<span class="meta-badge ai"><span class="material-icons" style="font-size: 0.9rem;">psychology</span> AI</span>' : ''}
                    ${commit.theme ? `<span class="meta-badge">${commit.theme}</span>` : ''}
                    ${commit.push_success ? '<span class="meta-badge"><span class="material-icons" style="font-size: 0.9rem;">cloud_done</span> Pushed</span>' : ''}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Control Actions
async function controlAction(action) {
    try {
        const response = await fetch(`${API_BASE}/api/control`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });

        const data = await response.json();

        if (data.success) {
            await loadDashboard();
        }

    } catch (error) {
        console.error(`Error performing ${action}:`, error);
        alert(`Failed to ${action} scheduler`);
    }
}

document.getElementById('pause-btn').addEventListener('click', () => controlAction('pause'));
document.getElementById('resume-btn').addEventListener('click', () => controlAction('resume'));
document.getElementById('trigger-btn').addEventListener('click', () => controlAction('trigger'));

// Settings Functions
async function loadSettings() {
    await Promise.all([
        loadCredentialsStatus(),
        loadConfig()
    ]);
}

async function loadCredentialsStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/settings/credentials`);
        const data = await response.json();

        const indicator = document.getElementById('credentials-indicator');
        indicator.className = 'status-indicator';

        if (data.hasCredentials) {
            indicator.classList.add('has-credentials');
            indicator.textContent = 'Credentials are stored securely';
        } else {
            indicator.textContent = 'No credentials stored';
        }

    } catch (error) {
        console.error('Error loading credentials status:', error);
    }
}

async function loadConfig() {
    try {
        const response = await fetch(`${API_BASE}/api/settings/config`);
        const config = await response.json();

        document.getElementById('ollama-theme').value = config.ollama.theme || '';
        document.getElementById('base-interval').value = config.schedule.base_interval;
        document.getElementById('jitter-range').value = config.schedule.jitter_range;
        document.getElementById('push-enabled').checked = config.git.push_enabled;

    } catch (error) {
        console.error('Error loading config:', error);
    }
}

// Credentials Form
document.getElementById('credentials-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const credentials = {
        pat_token: document.getElementById('pat-token').value,
        git_username: document.getElementById('git-username').value,
        git_email: document.getElementById('git-email').value
    };

    try {
        const response = await fetch(`${API_BASE}/api/settings/credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (data.success) {
            alert('Credentials saved securely!');
            document.getElementById('pat-token').value = '';
            await loadCredentialsStatus();
        }

    } catch (error) {
        console.error('Error saving credentials:', error);
        alert('Failed to save credentials');
    }
});

document.getElementById('delete-credentials-btn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete stored credentials?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/settings/credentials`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            alert('Credentials deleted');
            await loadCredentialsStatus();
        }

    } catch (error) {
        console.error('Error deleting credentials:', error);
        alert('Failed to delete credentials');
    }
});

// Config Form
document.getElementById('config-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const updates = {
        ollama: {
            theme: document.getElementById('ollama-theme').value || undefined
        },
        schedule: {
            base_interval: parseInt(document.getElementById('base-interval').value),
            jitter_range: parseInt(document.getElementById('jitter-range').value)
        },
        git: {
            push_enabled: document.getElementById('push-enabled').checked
        }
    };

    try {
        const response = await fetch(`${API_BASE}/api/settings/config`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        const data = await response.json();

        if (data.success) {
            alert('Configuration updated!');
        }

    } catch (error) {
        console.error('Error updating config:', error);
        alert('Failed to update configuration');
    }
});

// Auto-refresh
let refreshInterval;

function startAutoRefresh() {
    refreshInterval = setInterval(() => {
        const activeTab = document.querySelector('.tab-content.active').id;
        if (activeTab === 'dashboard-tab') {
            loadDashboard();
        }
    }, 5000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    loadSettings();
    startAutoRefresh();
});

window.addEventListener('beforeunload', stopAutoRefresh);
