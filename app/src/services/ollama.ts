import axios, { AxiosInstance } from 'axios';

export class OllamaService {
  private client: AxiosInstance;
  private model: string;

  constructor(url: string, model: string, timeout: number = 30000) {
    this.client = axios.create({
      baseURL: url,
      timeout,
      headers: { 'Content-Type': 'application/json' },
    });
    this.model = model;
  }

  async generate(prompt: string, systemPrompt: string = ''): Promise<string | null> {
    try {
      const response = await this.client.post('/api/generate', {
        model: this.model,
        prompt,
        system: systemPrompt,
        stream: false,
      });

      return response.data.response;
    } catch (error) {
      console.error('Ollama generation error:', error);
      return null;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/api/tags');
      return true;
    } catch {
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const response = await this.client.get('/api/tags');
      return response.data.models.map((m: any) => m.name);
    } catch {
      return [];
    }
  }
}
