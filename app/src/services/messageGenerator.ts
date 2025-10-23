import { OllamaService } from './ollama';

export class MessageGeneratorService {
  private ollamaService: OllamaService | null;
  private useOllama: boolean;
  private theme?: string;

  constructor(ollamaService: OllamaService | null, useOllama: boolean, theme?: string) {
    this.ollamaService = ollamaService;
    this.useOllama = useOllama && ollamaService !== null;
    this.theme = theme;
  }

  async generateMessage(diff: string, files: string[]): Promise<{ message: string; usedOllama: boolean }> {
    if (this.useOllama && this.ollamaService) {
      const message = await this.generateWithOllama(diff, files);
      if (message) {
        return { message, usedOllama: true };
      }
    }

    return { message: this.generateFallback(files), usedOllama: false };
  }

  private async generateWithOllama(diff: string, files: string[]): Promise<string | null> {
    if (!this.ollamaService) return null;

    const prompt = this.buildPrompt(diff, files);
    const systemPrompt = this.buildSystemPrompt();

    const message = await this.ollamaService.generate(prompt, systemPrompt);
    return message ? message.trim() : null;
  }

  private buildPrompt(diff: string, files: string[]): string {
    const parts: string[] = [];

    parts.push('Generate a concise, professional git commit message (50 chars max) for these changes:');
    parts.push(`\nFiles modified: ${files.join(', ')}`);

    if (this.theme) {
      parts.push(`\nContext: This is a ${this.theme} project.`);
    }

    if (diff) {
      parts.push(`\nDiff:\n${diff.substring(0, 2000)}`);
    }

    parts.push('\nRespond with only the commit message, nothing else.');

    return parts.join('');
  }

  private buildSystemPrompt(): string {
    const parts: string[] = [
      'You are a git commit message generator.',
      'Generate concise, professional commit messages following conventional commit format.',
      'Keep messages under 50 characters.',
      'Use present tense, imperative mood.',
    ];

    if (this.theme) {
      parts.push(`Focus on ${this.theme}-related terminology and concepts.`);
    }

    return parts.join(' ');
  }

  private generateFallback(files: string[]): string {
    const templates = [
      'Update project files',
      'Apply code changes',
      'Refactor implementation',
      'Update configuration',
      'Improve functionality',
      'Fix code issues',
      'Update dependencies',
      'Enhance features',
    ];

    if (this.theme) {
      const themeTemplates: Record<string, string[]> = {
        kubernetes: [
          'Update K8s manifests',
          'Refactor deployment configs',
          'Update service definitions',
          'Improve pod configurations',
        ],
        docker: [
          'Update Dockerfile',
          'Refactor container configs',
          'Update compose files',
          'Improve image builds',
        ],
        terraform: [
          'Update infrastructure code',
          'Refactor modules',
          'Update provider configs',
          'Improve resource definitions',
        ],
      };

      if (themeTemplates[this.theme]) {
        templates.push(...themeTemplates[this.theme]);
      }
    }

    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

    if (files.length > 0 && files.length <= 3) {
      return `${randomTemplate}: ${files.join(', ')}`;
    }

    return `${randomTemplate} (${files.length} files)`;
  }
}
