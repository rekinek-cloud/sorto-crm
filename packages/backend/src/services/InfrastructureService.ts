/**
 * Infrastructure Service
 * Monitoring serwerów, kontenerów Docker, logów i statusu aplikacji
 * FAZA-4: Unified Infrastructure Dashboard
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../config/logger';

const execAsync = promisify(exec);

// Konfiguracja
const APPS_DIR = '/home/dev/apps';
const DEV_DOMAIN = 'dev.sorto.ai';

// Lista monitorowanych aplikacji
const MONITORED_APPS = [
  { name: 'Sorto CRM', slug: 'sorto-crm', url: `https://crm.${DEV_DOMAIN}` },
  { name: 'RetroNova', slug: 'retronova', url: `https://retronova.${DEV_DOMAIN}` },
  { name: 'Focus Photo', slug: 'focusphoto', url: `https://focusphoto.${DEV_DOMAIN}` },
  { name: 'VerbaMind', slug: 'verbamind', url: `https://verbamind.${DEV_DOMAIN}` },
  { name: 'ContentDNA', slug: 'contentdna', url: `https://contentdna.${DEV_DOMAIN}` },
  { name: 'Restaurant', slug: 'restaurant', url: `https://restaurant.${DEV_DOMAIN}` },
  { name: 'Flyball', slug: 'flyball', url: `https://flyball.${DEV_DOMAIN}` },
  { name: 'Manekin', slug: 'manekin', url: `https://manekin.${DEV_DOMAIN}` },
  { name: 'Picar', slug: 'picar', url: `https://picar.${DEV_DOMAIN}` },
  { name: 'WordLoomer', slug: 'wordloomer', url: `https://wordloomer.${DEV_DOMAIN}` },
  { name: 'YT Whisper', slug: 'yt-whisper', url: `https://ytwhisper.${DEV_DOMAIN}` },
  { name: 'Ebyt', slug: 'ebyt', url: `https://ebyt.${DEV_DOMAIN}` },
  { name: 'Thermomix', slug: 'jaros', url: `https://jaros.${DEV_DOMAIN}` },
];

interface ServerMetrics {
  id: string;
  name: string;
  host: string;
  status: 'online' | 'offline' | 'unknown';
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
  loadAverage: number[];
}

interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: 'running' | 'exited' | 'paused' | 'created';
  ports: string[];
  created: string;
}

interface ContainerStats {
  name: string;
  cpuPercent: number;
  memoryUsage: string;
  memoryPercent: number;
  networkIO: string;
  blockIO: string;
}

interface AppHealth {
  name: string;
  slug: string;
  url: string;
  status: 'up' | 'down' | 'error';
  statusCode: number | null;
  responseTime: number | null;
  error?: string;
}

interface DatabaseStatus {
  name: string;
  type: 'postgresql' | 'redis';
  status: 'online' | 'offline' | 'unknown';
  version?: string;
  connections?: number;
}

class InfrastructureService {

  // ============================================
  // SERWERY - Metryki systemowe
  // ============================================

  async getServerMetrics(): Promise<ServerMetrics> {
    try {
      // CPU usage
      const cpuResult = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
      const cpu = parseFloat(cpuResult.stdout.trim()) || 0;

      // Memory usage
      const memResult = await execAsync("free | grep Mem | awk '{printf \"%.1f\", $3/$2 * 100}'");
      const memory = parseFloat(memResult.stdout.trim()) || 0;

      // Disk usage
      const diskResult = await execAsync("df -h / | tail -1 | awk '{print $5}' | tr -d '%'");
      const disk = parseFloat(diskResult.stdout.trim()) || 0;

      // Uptime
      const uptimeResult = await execAsync("uptime -p");
      const uptime = uptimeResult.stdout.trim();

      // Load average
      const loadResult = await execAsync("cat /proc/loadavg | awk '{print $1, $2, $3}'");
      const loadAverage = loadResult.stdout.trim().split(' ').map(parseFloat);

      return {
        id: 'dev',
        name: 'DEV Server (Helsinki)',
        host: '77.42.83.55',
        status: 'online',
        cpu,
        memory,
        disk,
        uptime,
        loadAverage
      };
    } catch (error) {
      logger.error('Error getting server metrics:', error);
      return {
        id: 'dev',
        name: 'DEV Server (Helsinki)',
        host: '77.42.83.55',
        status: 'unknown',
        cpu: 0,
        memory: 0,
        disk: 0,
        uptime: 'unknown',
        loadAverage: [0, 0, 0]
      };
    }
  }

  // ============================================
  // KONTENERY DOCKER
  // ============================================

  async getContainers(showAll: boolean = false): Promise<Container[]> {
    try {
      const allFlag = showAll ? '-a' : '';
      const { stdout } = await execAsync(
        `docker ps ${allFlag} --format '{"id":"{{.ID}}","name":"{{.Names}}","image":"{{.Image}}","status":"{{.Status}}","state":"{{.State}}","ports":"{{.Ports}}","created":"{{.CreatedAt}}"}'`
      );

      const lines = stdout.trim().split('\n').filter(Boolean);

      return lines.map(line => {
        try {
          const container = JSON.parse(line);
          return {
            id: container.id,
            name: container.name,
            image: container.image.split(':')[0], // Remove tag
            status: container.status,
            state: container.state.toLowerCase() as Container['state'],
            ports: container.ports ? container.ports.split(', ').filter(Boolean) : [],
            created: container.created
          };
        } catch {
          return null;
        }
      }).filter((c): c is Container => c !== null);
    } catch (error) {
      logger.error('Error listing containers:', error);
      return [];
    }
  }

  async getContainerStats(containerName: string): Promise<ContainerStats | null> {
    try {
      const { stdout } = await execAsync(
        `docker stats ${containerName} --no-stream --format '{"cpuPercent":"{{.CPUPerc}}","memoryUsage":"{{.MemUsage}}","memoryPercent":"{{.MemPerc}}","networkIO":"{{.NetIO}}","blockIO":"{{.BlockIO}}"}'`
      );

      const stats = JSON.parse(stdout.trim());

      return {
        name: containerName,
        cpuPercent: parseFloat(stats.cpuPercent.replace('%', '')) || 0,
        memoryUsage: stats.memoryUsage,
        memoryPercent: parseFloat(stats.memoryPercent.replace('%', '')) || 0,
        networkIO: stats.networkIO,
        blockIO: stats.blockIO
      };
    } catch (error) {
      logger.error(`Error getting stats for ${containerName}:`, error);
      return null;
    }
  }

  async restartContainer(containerName: string): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(`docker restart ${containerName}`);
      return { success: true, message: `Container ${containerName} restarted successfully` };
    } catch (error: any) {
      logger.error(`Error restarting container ${containerName}:`, error);
      return { success: false, message: error.message };
    }
  }

  async stopContainer(containerName: string): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(`docker stop ${containerName}`);
      return { success: true, message: `Container ${containerName} stopped successfully` };
    } catch (error: any) {
      logger.error(`Error stopping container ${containerName}:`, error);
      return { success: false, message: error.message };
    }
  }

  async startContainer(containerName: string): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(`docker start ${containerName}`);
      return { success: true, message: `Container ${containerName} started successfully` };
    } catch (error: any) {
      logger.error(`Error starting container ${containerName}:`, error);
      return { success: false, message: error.message };
    }
  }

  // ============================================
  // LOGI
  // ============================================

  async getContainerLogs(containerName: string, lines: number = 100): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(
        `docker logs --tail ${lines} ${containerName} 2>&1`
      );
      return stdout || stderr || '(no logs)';
    } catch (error: any) {
      logger.error(`Error getting logs for ${containerName}:`, error);
      return `Error: ${error.message}`;
    }
  }

  async searchContainerLogs(containerName: string, query: string, lines: number = 500): Promise<string[]> {
    try {
      const { stdout } = await execAsync(
        `docker logs --tail ${lines} ${containerName} 2>&1 | grep -i "${query}" | tail -100`
      );
      return stdout.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  async getErrorLogs(containerName: string, lines: number = 500): Promise<string[]> {
    try {
      const { stdout } = await execAsync(
        `docker logs --tail ${lines} ${containerName} 2>&1 | grep -iE "(error|exception|fail|fatal)" | tail -50`
      );
      return stdout.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  async getSystemLogs(service?: string, lines: number = 50): Promise<string> {
    try {
      const cmd = service
        ? `journalctl -u ${service} -n ${lines} --no-pager 2>/dev/null || echo "Service not found"`
        : `journalctl -n ${lines} --no-pager 2>/dev/null || dmesg | tail -${lines}`;

      const { stdout } = await execAsync(cmd);
      return stdout;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  // ============================================
  // HEALTH CHECKS
  // ============================================

  async getAllAppsHealth(): Promise<AppHealth[]> {
    const results = await Promise.all(
      MONITORED_APPS.map(app => this.checkAppHealth(app))
    );
    return results;
  }

  async checkAppHealth(app: { name: string; slug: string; url: string }): Promise<AppHealth> {
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(app.url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'InfrastructureMonitor/1.0'
        }
      });

      clearTimeout(timeout);

      return {
        name: app.name,
        slug: app.slug,
        url: app.url,
        status: response.ok ? 'up' : 'error',
        statusCode: response.status,
        responseTime: Date.now() - start
      };
    } catch (error: any) {
      return {
        name: app.name,
        slug: app.slug,
        url: app.url,
        status: 'down',
        statusCode: null,
        responseTime: null,
        error: error.message
      };
    }
  }

  // ============================================
  // BAZY DANYCH
  // ============================================

  async getDatabasesStatus(): Promise<DatabaseStatus[]> {
    const results: DatabaseStatus[] = [];

    // PostgreSQL
    try {
      const { stdout } = await execAsync(
        `docker exec crm-postgres pg_isready -U postgres 2>/dev/null && echo "online" || echo "offline"`
      );
      const pgStatus = stdout.trim().includes('online') ? 'online' : 'offline';

      let pgVersion = '';
      let pgConnections = 0;

      if (pgStatus === 'online') {
        try {
          const versionResult = await execAsync(
            `docker exec crm-postgres psql -U postgres -t -c "SELECT version();" 2>/dev/null | head -1`
          );
          pgVersion = versionResult.stdout.trim().split(' ').slice(0, 2).join(' ');

          const connResult = await execAsync(
            `docker exec crm-postgres psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null`
          );
          pgConnections = parseInt(connResult.stdout.trim()) || 0;
        } catch {}
      }

      results.push({
        name: 'PostgreSQL',
        type: 'postgresql',
        status: pgStatus as 'online' | 'offline',
        version: pgVersion,
        connections: pgConnections
      });
    } catch {
      results.push({
        name: 'PostgreSQL',
        type: 'postgresql',
        status: 'unknown'
      });
    }

    // Redis
    try {
      const { stdout } = await execAsync(
        `docker exec crm-redis redis-cli ping 2>/dev/null | grep -q PONG && echo "online" || echo "offline"`
      );
      const redisStatus = stdout.trim() === 'online' ? 'online' : 'offline';

      let redisVersion = '';

      if (redisStatus === 'online') {
        try {
          const versionResult = await execAsync(
            `docker exec crm-redis redis-cli INFO server 2>/dev/null | grep redis_version | cut -d: -f2`
          );
          redisVersion = `Redis ${versionResult.stdout.trim()}`;
        } catch {}
      }

      results.push({
        name: 'Redis',
        type: 'redis',
        status: redisStatus as 'online' | 'offline',
        version: redisVersion
      });
    } catch {
      results.push({
        name: 'Redis',
        type: 'redis',
        status: 'unknown'
      });
    }

    return results;
  }

  // ============================================
  // OVERVIEW
  // ============================================

  async getOverview() {
    const [server, containers, health, databases] = await Promise.all([
      this.getServerMetrics(),
      this.getContainers(),
      this.getAllAppsHealth(),
      this.getDatabasesStatus()
    ]);

    const runningContainers = containers.filter(c => c.state === 'running').length;
    const stoppedContainers = containers.filter(c => c.state === 'exited').length;

    const appsUp = health.filter(h => h.status === 'up').length;
    const appsDown = health.filter(h => h.status === 'down').length;

    const dbOnline = databases.filter(d => d.status === 'online').length;

    return {
      server,
      summary: {
        containers: {
          total: containers.length,
          running: runningContainers,
          stopped: stoppedContainers
        },
        apps: {
          total: health.length,
          up: appsUp,
          down: appsDown
        },
        databases: {
          total: databases.length,
          online: dbOnline
        }
      },
      health,
      databases
    };
  }

  // ============================================
  // DISK USAGE
  // ============================================

  async getDiskUsage(): Promise<{ filesystem: string; size: string; used: string; available: string; usePercent: number; mountedOn: string }[]> {
    try {
      const { stdout } = await execAsync("df -h | grep -E '^/dev' | awk '{print $1\"|\"$2\"|\"$3\"|\"$4\"|\"$5\"|\"$6}'");

      return stdout.trim().split('\n').filter(Boolean).map(line => {
        const [filesystem, size, used, available, usePercent, mountedOn] = line.split('|');
        return {
          filesystem,
          size,
          used,
          available,
          usePercent: parseInt(usePercent.replace('%', '')) || 0,
          mountedOn
        };
      });
    } catch {
      return [];
    }
  }
}

export const infrastructureService = new InfrastructureService();
export default infrastructureService;
