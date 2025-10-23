import { GitService } from './git';
import { MessageGeneratorService } from './messageGenerator';
import { DatabaseService } from './database';
import { Config } from '../types';

export class SchedulerService {
  private gitService: GitService;
  private messageGenerator: MessageGeneratorService;
  private db: DatabaseService;
  private config: Config;
  private timeout: NodeJS.Timeout | null = null;
  private running: boolean = false;
  private paused: boolean = false;
  private nextRun: Date | null = null;
  private lastRun: Date | null = null;

  constructor(
    gitService: GitService,
    messageGenerator: MessageGeneratorService,
    db: DatabaseService,
    config: Config
  ) {
    this.gitService = gitService;
    this.messageGenerator = messageGenerator;
    this.db = db;
    this.config = config;
  }

  start(): void {
    if (this.running) {
      console.log('Scheduler already running');
      return;
    }

    this.running = true;
    console.log('Scheduler started');
    this.scheduleNext();
  }

  stop(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.running = false;
    console.log('Scheduler stopped');
  }

  pause(): void {
    this.paused = true;
    console.log('Scheduler paused');
  }

  resume(): void {
    this.paused = false;
    console.log('Scheduler resumed');
  }

  async triggerNow(): Promise<void> {
    await this.performCommit();
  }

  private scheduleNext(): void {
    const interval = this.calculateNextInterval();
    const nextRunTime = new Date(Date.now() + interval * 1000);
    this.nextRun = nextRunTime;

    console.log(`Next commit scheduled for: ${nextRunTime.toLocaleString()}`);

    this.timeout = setTimeout(async () => {
      if (!this.paused) {
        await this.performCommit();
      }
      if (this.running) {
        this.scheduleNext();
      }
    }, interval * 1000);
  }

  private calculateNextInterval(): number {
    const baseInterval = this.config.schedule.base_interval;
    const jitterRange = this.config.schedule.jitter_range;
    const jitter = Math.floor(Math.random() * (jitterRange * 2 + 1)) - jitterRange;
    return baseInterval + jitter;
  }

  private async performCommit(): Promise<void> {
    this.lastRun = new Date();
    console.log('Performing scheduled commit...');

    try {
      const hasChanges = await this.gitService.hasChanges();

      if (!hasChanges) {
        console.log('No changes to commit');
        return;
      }

      await this.gitService.stageAll();

      const changedFiles = await this.gitService.getChangedFiles();
      const diff = await this.gitService.getDiff();

      const { message, usedOllama } = await this.messageGenerator.generateMessage(diff, changedFiles);

      const commitHash = await this.gitService.commit(message);
      console.log(`Committed: ${commitHash} - ${message}`);

      let pushSuccess = false;
      if (this.config.git.push_enabled) {
        pushSuccess = await this.gitService.push(
          this.config.git.retry_attempts,
          this.config.git.retry_delay
        );
      }

      await this.db.addCommit({
        commit_hash: commitHash,
        message,
        files_changed: changedFiles.length,
        timestamp: new Date().toISOString(),
        success: true,
        used_ollama: usedOllama,
        theme: this.config.ollama.theme,
        push_success: pushSuccess,
      });

      console.log('Commit recorded in database');
    } catch (error) {
      console.error('Error during commit:', error);

      await this.db.addCommit({
        commit_hash: 'ERROR',
        message: 'Commit failed',
        files_changed: 0,
        timestamp: new Date().toISOString(),
        success: false,
        used_ollama: false,
        error_message: (error as Error).message,
      });
    }
  }

  getStatus() {
    return {
      running: this.running,
      paused: this.paused,
      nextRun: this.nextRun?.toISOString(),
      lastRun: this.lastRun?.toISOString(),
    };
  }
}
