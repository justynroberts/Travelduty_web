import sqlite3 from 'sqlite3';
import { Commit, Stats } from '../types';
import path from 'path';

export class DatabaseService {
  private db: sqlite3.Database;

  constructor(dbPath: string = '../database/scheduler.db') {
    // Resolve from project root
    const resolvedPath = path.resolve(process.cwd(), dbPath);
    this.db = new sqlite3.Database(resolvedPath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS commits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          commit_hash TEXT NOT NULL,
          message TEXT NOT NULL,
          files_changed INTEGER DEFAULT 0,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          success BOOLEAN DEFAULT 1,
          used_ollama BOOLEAN DEFAULT 0,
          theme TEXT,
          push_success BOOLEAN,
          error_message TEXT
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS stats (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          total_commits INTEGER DEFAULT 0,
          successful_commits INTEGER DEFAULT 0,
          failed_commits INTEGER DEFAULT 0,
          total_files_changed INTEGER DEFAULT 0,
          ollama_usage_count INTEGER DEFAULT 0,
          last_commit_time DATETIME,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.db.run(
        `INSERT OR IGNORE INTO stats (id, total_commits) VALUES (1, 0)`
      );
    });
  }

  addCommit(commit: Omit<Commit, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO commits (commit_hash, message, files_changed, success, used_ollama, theme, push_success, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          commit.commit_hash,
          commit.message,
          commit.files_changed,
          commit.success ? 1 : 0,
          commit.used_ollama ? 1 : 0,
          commit.theme,
          commit.push_success ? 1 : 0,
          commit.error_message,
        ],
        function (err) {
          if (err) reject(err);
          else {
            resolve(this.lastID);
          }
        }
      );

      this.updateStats(commit);
    });
  }

  private updateStats(commit: Omit<Commit, 'id'>): void {
    this.db.run(`
      UPDATE stats SET
        total_commits = total_commits + 1,
        successful_commits = successful_commits + ${commit.success ? 1 : 0},
        failed_commits = failed_commits + ${commit.success ? 0 : 1},
        total_files_changed = total_files_changed + ${commit.files_changed},
        ollama_usage_count = ollama_usage_count + ${commit.used_ollama ? 1 : 0},
        last_commit_time = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);
  }

  getRecentCommits(limit: number = 10): Promise<Commit[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM commits ORDER BY timestamp DESC LIMIT ?`,
        [limit],
        (err, rows: Commit[]) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  getStats(): Promise<Stats> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM stats WHERE id = 1`,
        (err, row: Stats) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  close(): void {
    this.db.close();
  }
}
