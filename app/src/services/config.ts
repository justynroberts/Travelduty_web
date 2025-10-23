import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import dotenv from 'dotenv';
import { Config } from '../types';

dotenv.config();

export class ConfigService {
  private config: Config;
  private configPath: string;

  constructor(configPath: string = '../config/config.yaml') {
    // Resolve from project root, not from __dirname
    this.configPath = path.resolve(process.cwd(), configPath);
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    console.log(`Loading config from: ${this.configPath}`);
    console.log(`process.cwd(): ${process.cwd()}`);

    try {
      if (!fs.existsSync(this.configPath)) {
        throw new Error(`Config file does not exist at: ${this.configPath}`);
      }

      const fileContents = fs.readFileSync(this.configPath, 'utf8');
      const config = yaml.load(fileContents) as Config;

      // Override with environment variables
      if (process.env.OLLAMA_URL) config.ollama.url = process.env.OLLAMA_URL;
      if (process.env.OLLAMA_MODEL) config.ollama.model = process.env.OLLAMA_MODEL;
      if (process.env.REPO_PATH) config.git.repo_path = process.env.REPO_PATH;
      if (process.env.SERVER_PORT) config.server.port = parseInt(process.env.SERVER_PORT);

      console.log('✅ Config loaded successfully');
      return config;
    } catch (error) {
      console.error('❌ Error loading config:', error);
      throw new Error(`Configuration file not found or invalid: ${this.configPath}`);
    }
  }

  public getConfig(): Config {
    return this.config;
  }

  public updateConfig(updates: Partial<Config>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  private saveConfig(): void {
    try {
      const yamlStr = yaml.dump(this.config);
      fs.writeFileSync(this.configPath, yamlStr, 'utf8');
    } catch (error) {
      console.error('Error saving config:', error);
      throw new Error('Failed to save configuration');
    }
  }
}
