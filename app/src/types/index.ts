export interface Config {
  git: {
    repo_path: string;
    push_enabled: boolean;
    retry_attempts: number;
    retry_delay: number;
  };
  schedule: {
    base_interval: number;
    jitter_range: number;
    enabled: boolean;
  };
  ollama: {
    enabled: boolean;
    url: string;
    model: string;
    theme?: string;
    timeout: number;
  };
  server: {
    host: string;
    port: number;
  };
}

export interface Commit {
  id?: number;
  commit_hash: string;
  message: string;
  files_changed: number;
  timestamp: string;
  success: boolean;
  used_ollama: boolean;
  theme?: string;
  push_success?: boolean;
  error_message?: string;
}

export interface Stats {
  total_commits: number;
  successful_commits: number;
  failed_commits: number;
  total_files_changed: number;
  ollama_usage_count: number;
  last_commit_time?: string;
  next_scheduled_commit?: string;
}

export interface SchedulerStatus {
  running: boolean;
  paused: boolean;
  next_run?: string;
  last_run?: string;
  config: Config;
}

export interface Credentials {
  pat_token?: string;
  git_username?: string;
  git_email?: string;
}
