import express from 'express';
import cors from 'cors';
import path from 'path';
import { ConfigService } from './services/config';
import { CredentialsService } from './services/credentials';
import { DatabaseService } from './services/database';
import { GitService } from './services/git';
import { OllamaService } from './services/ollama';
import { MessageGeneratorService } from './services/messageGenerator';
import { SchedulerService } from './services/scheduler';
import { createApiRouter } from './routes/api';

async function main() {
  console.log('🚀 Starting Git Deploy Scheduler...');

  // Initialize services
  const configService = new ConfigService();
  const config = configService.getConfig();

  const credentialsService = new CredentialsService();
  const db = new DatabaseService();

  const gitService = new GitService(config.git.repo_path, credentialsService);

  let ollamaService: OllamaService | null = null;
  if (config.ollama.enabled) {
    ollamaService = new OllamaService(
      config.ollama.url,
      config.ollama.model,
      config.ollama.timeout
    );

    const ollamaHealthy = await ollamaService.healthCheck();
    if (!ollamaHealthy) {
      console.warn('⚠️  Ollama is not reachable, will use fallback messages');
      ollamaService = null;
    } else {
      console.log('✅ Ollama connected');
    }
  }

  const messageGenerator = new MessageGeneratorService(
    ollamaService,
    config.ollama.enabled,
    config.ollama.theme
  );

  const scheduler = new SchedulerService(gitService, messageGenerator, db, config);

  // Start scheduler if enabled
  if (config.schedule.enabled) {
    scheduler.start();
  }

  // Create Express app
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  // API routes
  app.use('/api', createApiRouter(scheduler, db, credentialsService, configService));

  // Serve index.html for root
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  // Start server
  const server = app.listen(config.server.port, config.server.host, () => {
    console.log(`✅ Server running at http://${config.server.host}:${config.server.port}`);
    console.log(`📊 Dashboard: http://${config.server.host}:${config.server.port}`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    scheduler.stop();
    db.close();
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
