import { Router, Request, Response } from 'express';
import { SchedulerService } from '../services/scheduler';
import { DatabaseService } from '../services/database';
import { CredentialsService } from '../services/credentials';
import { ConfigService } from '../services/config';

export function createApiRouter(
  scheduler: SchedulerService,
  db: DatabaseService,
  credentialsService: CredentialsService,
  configService: ConfigService
): Router {
  const router = Router();

  // Status endpoint
  router.get('/status', (req: Request, res: Response) => {
    const status = scheduler.getStatus();
    const config = configService.getConfig();
    res.json({
      ...status,
      config,
    });
  });

  // History endpoint
  router.get('/history', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const commits = await db.getRecentCommits(limit);
      res.json({ commits });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Stats endpoint
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await db.getStats();
      const status = scheduler.getStatus();
      res.json({
        ...stats,
        next_scheduled_commit: status.nextRun,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Control endpoint
  router.post('/control', async (req: Request, res: Response) => {
    const { action } = req.body;

    try {
      switch (action) {
        case 'pause':
          scheduler.pause();
          res.json({ success: true, message: 'Scheduler paused' });
          break;
        case 'resume':
          scheduler.resume();
          res.json({ success: true, message: 'Scheduler resumed' });
          break;
        case 'trigger':
          await scheduler.triggerNow();
          res.json({ success: true, message: 'Commit triggered' });
          break;
        case 'start':
          scheduler.start();
          res.json({ success: true, message: 'Scheduler started' });
          break;
        case 'stop':
          scheduler.stop();
          res.json({ success: true, message: 'Scheduler stopped' });
          break;
        default:
          res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Settings endpoints
  router.get('/settings/credentials', async (req: Request, res: Response) => {
    try {
      const hasCredentials = await credentialsService.hasCredentials();
      res.json({ hasCredentials });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/settings/credentials', async (req: Request, res: Response) => {
    try {
      const credentials = req.body;
      await credentialsService.saveCredentials(credentials);
      res.json({ success: true, message: 'Credentials saved securely' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.delete('/settings/credentials', async (req: Request, res: Response) => {
    try {
      await credentialsService.deleteCredentials();
      res.json({ success: true, message: 'Credentials deleted' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.get('/settings/config', (req: Request, res: Response) => {
    const config = configService.getConfig();
    res.json(config);
  });

  router.patch('/settings/config', (req: Request, res: Response) => {
    try {
      const updates = req.body;
      configService.updateConfig(updates);
      res.json({ success: true, message: 'Configuration updated' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
