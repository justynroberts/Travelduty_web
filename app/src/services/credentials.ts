import * as keytar from 'keytar';
import { Credentials } from '../types';

const SERVICE_NAME = 'git-deploy-scheduler';

export class CredentialsService {
  async saveCredentials(credentials: Credentials): Promise<void> {
    try {
      if (credentials.pat_token) {
        await keytar.setPassword(SERVICE_NAME, 'pat_token', credentials.pat_token);
      }
      if (credentials.git_username) {
        await keytar.setPassword(SERVICE_NAME, 'git_username', credentials.git_username);
      }
      if (credentials.git_email) {
        await keytar.setPassword(SERVICE_NAME, 'git_email', credentials.git_email);
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      throw new Error('Failed to save credentials securely');
    }
  }

  async getCredentials(): Promise<Credentials> {
    try {
      const [pat_token, git_username, git_email] = await Promise.all([
        keytar.getPassword(SERVICE_NAME, 'pat_token'),
        keytar.getPassword(SERVICE_NAME, 'git_username'),
        keytar.getPassword(SERVICE_NAME, 'git_email'),
      ]);

      return {
        pat_token: pat_token || undefined,
        git_username: git_username || undefined,
        git_email: git_email || undefined,
      };
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      return {};
    }
  }

  async deleteCredentials(): Promise<void> {
    try {
      await Promise.all([
        keytar.deletePassword(SERVICE_NAME, 'pat_token'),
        keytar.deletePassword(SERVICE_NAME, 'git_username'),
        keytar.deletePassword(SERVICE_NAME, 'git_email'),
      ]);
    } catch (error) {
      console.error('Error deleting credentials:', error);
      throw new Error('Failed to delete credentials');
    }
  }

  async hasCredentials(): Promise<boolean> {
    const creds = await this.getCredentials();
    return !!creds.pat_token;
  }
}
