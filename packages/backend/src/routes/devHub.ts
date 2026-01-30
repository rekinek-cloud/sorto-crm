import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { authenticateUser } from '../shared/middleware/auth';

const execAsync = promisify(exec);
const router = Router();

// All routes require authentication
router.use(authenticateUser);

/**
 * Get all containers grouped by application
 */
router.get('/containers', async (req: Request, res: Response) => {
  try {
    const { stdout } = await execAsync(
      'docker ps -a --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.State}}"'
    );

    const containers: Record<string, any[]> = {};
    const lines = stdout.trim().split('\n').filter(Boolean);

    for (const line of lines) {
      const [id, name, image, status, state] = line.split('|');

      // Extract app name from container name (e.g., "crm-frontend" -> "crm")
      const appName = name.split('-')[0] || 'other';

      if (!containers[appName]) {
        containers[appName] = [];
      }

      containers[appName].push({
        id,
        name,
        image: image.split(':')[0], // Remove tag for cleaner display
        status,
        state,
      });
    }

    // Sort containers within each app
    for (const app of Object.keys(containers)) {
      containers[app].sort((a, b) => a.name.localeCompare(b.name));
    }

    res.json({
      total: lines.length,
      containers,
    });
  } catch (error: any) {
    console.error('Failed to list containers:', error);
    res.status(500).json({ error: 'Failed to list containers', details: error.message });
  }
});

/**
 * Get system resources (CPU, RAM, Disk)
 */
router.get('/system-resources', async (req: Request, res: Response) => {
  try {
    // CPU info
    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    // Memory info
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Disk info (Linux)
    let diskInfo = { used: 0, total: 0, percent: 0 };
    try {
      const { stdout } = await execAsync("df -B1 / | tail -1 | awk '{print $2,$3,$5}'");
      const [total, used, percent] = stdout.trim().split(' ');
      diskInfo = {
        total: parseInt(total) || 0,
        used: parseInt(used) || 0,
        percent: parseFloat(percent) || 0,
      };
    } catch (e) {
      // Ignore disk errors
    }

    res.json({
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percent: (usedMem / totalMem) * 100,
      },
      disk: diskInfo,
      uptime: os.uptime(),
      loadavg: os.loadavg(),
    });
  } catch (error: any) {
    console.error('Failed to get system resources:', error);
    res.status(500).json({ error: 'Failed to get system resources', details: error.message });
  }
});

/**
 * Start a container
 */
router.post('/containers/:name/start', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    await execAsync(`docker start ${name}`);
    res.json({ success: true, message: `Container ${name} started` });
  } catch (error: any) {
    console.error('Failed to start container:', error);
    res.status(500).json({ error: 'Failed to start container', details: error.message });
  }
});

/**
 * Stop a container
 */
router.post('/containers/:name/stop', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    await execAsync(`docker stop ${name}`);
    res.json({ success: true, message: `Container ${name} stopped` });
  } catch (error: any) {
    console.error('Failed to stop container:', error);
    res.status(500).json({ error: 'Failed to stop container', details: error.message });
  }
});

/**
 * Restart a container
 */
router.post('/containers/:name/restart', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    await execAsync(`docker restart ${name}`);
    res.json({ success: true, message: `Container ${name} restarted` });
  } catch (error: any) {
    console.error('Failed to restart container:', error);
    res.status(500).json({ error: 'Failed to restart container', details: error.message });
  }
});

/**
 * Get container logs
 */
router.get('/containers/:name/logs', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const lines = parseInt(req.query.lines as string) || 100;
    const { stdout } = await execAsync(`docker logs --tail ${lines} ${name} 2>&1`);
    res.json({ logs: stdout });
  } catch (error: any) {
    console.error('Failed to get container logs:', error);
    res.status(500).json({ error: 'Failed to get container logs', details: error.message });
  }
});

/**
 * Get container stats
 */
router.get('/containers/:name/stats', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { stdout } = await execAsync(
      `docker stats ${name} --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}"`
    );
    const [cpu, memUsage, memPerc, netIO, blockIO] = stdout.trim().split('|');
    res.json({
      cpu: cpu,
      memory: {
        usage: memUsage,
        percent: memPerc,
      },
      network: netIO,
      block: blockIO,
    });
  } catch (error: any) {
    console.error('Failed to get container stats:', error);
    res.status(500).json({ error: 'Failed to get container stats', details: error.message });
  }
});

/**
 * Deploy an application (git pull + docker compose up)
 */
router.post('/applications/:app/deploy', async (req: Request, res: Response) => {
  try {
    const { app } = req.params;

    // Map app names to their directories
    const appPaths: Record<string, string> = {
      'crm': '/home/dev/apps/sorto-crm',
      'sorto': '/home/dev/apps/sorto',
      // Add more apps as needed
    };

    const appPath = appPaths[app];
    if (!appPath) {
      return res.status(404).json({ error: `Unknown application: ${app}` });
    }

    // Git pull
    await execAsync(`cd ${appPath} && git pull`);

    // Docker compose up
    await execAsync(`cd ${appPath} && docker compose up -d --build`);

    res.json({ success: true, message: `Application ${app} deployed` });
  } catch (error: any) {
    console.error('Failed to deploy application:', error);
    res.status(500).json({ error: 'Failed to deploy application', details: error.message });
  }
});

/**
 * Get application status
 */
router.get('/applications/:app/status', async (req: Request, res: Response) => {
  try {
    const { app } = req.params;

    const { stdout } = await execAsync(
      `docker ps -a --filter "name=${app}" --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.State}}"`
    );

    const containers = stdout.trim().split('\n').filter(Boolean).map(line => {
      const [id, name, image, status, state] = line.split('|');
      return { id, name, image, status, state };
    });

    res.json({
      app,
      containers,
      healthy: containers.every(c => c.state === 'running'),
    });
  } catch (error: any) {
    console.error('Failed to get application status:', error);
    res.status(500).json({ error: 'Failed to get application status', details: error.message });
  }
});

export default router;
