import simpleGit, { SimpleGit, DiffResult } from 'simple-git';
import { CredentialsService } from './credentials';

export class GitService {
  private git: SimpleGit;
  private credentialsService: CredentialsService;

  constructor(repoPath: string, credentialsService: CredentialsService) {
    this.git = simpleGit(repoPath);
    this.credentialsService = credentialsService;
  }

  async stageAll(): Promise<void> {
    await this.git.add('.');
  }

  async commit(message: string): Promise<string> {
    const result = await this.git.commit(message);
    return result.commit;
  }

  async push(retryAttempts: number = 3, retryDelay: number = 5000): Promise<boolean> {
    const credentials = await this.credentialsService.getCredentials();

    if (credentials.pat_token) {
      // Configure remote with PAT only if not already set
      const remotes = await this.git.getRemotes(true);
      if (remotes.length > 0) {
        const remote = remotes[0];
        const remoteUrl = remote.refs.push;
        if (remoteUrl && !remoteUrl.includes('x-access-token')) {
          // Only add token if not already present
          const authenticatedUrl = this.getAuthenticatedUrl(remoteUrl, credentials.pat_token);
          await this.git.remote(['set-url', remote.name, authenticatedUrl]);
        }
      }
    }

    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        await this.git.push();
        console.log('✅ Pushed successfully to remote');
        return true;
      } catch (error) {
        console.error(`Push attempt ${attempt + 1} failed:`, error);
        if (attempt < retryAttempts - 1) {
          await this.delay(retryDelay);
        }
      }
    }
    return false;
  }

  async getDiff(): Promise<string> {
    const diff = await this.git.diff(['--cached']);
    return diff;
  }

  async getChangedFiles(): Promise<string[]> {
    const status = await this.git.status();
    return [...status.modified, ...status.not_added, ...status.created];
  }

  async hasChanges(): Promise<boolean> {
    const status = await this.git.status();
    return !status.isClean();
  }

  async getCurrentBranch(): Promise<string> {
    const branch = await this.git.branch();
    return branch.current;
  }

  private getAuthenticatedUrl(url: string, token: string): string {
    if (url.startsWith('https://')) {
      return url.replace('https://', `https://x-access-token:${token}@`);
    }
    return url;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
