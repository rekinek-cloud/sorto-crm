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

  // ============================================
  // GITHUB REPOSITORIES
  // ============================================

  private GITHUB_ORG = 'rekinek-cloud';

  /**
   * Lista repozytoriów z GitHub z informacją czy są zainstalowane
   */
  async getGitHubRepos(): Promise<{
    organization: string;
    totalRepos: number;
    installedCount: number;
    notInstalledCount: number;
    repos: any[];
  }> {
    try {
      // Pobierz repozytoria z GitHub
      const { stdout: ghOutput } = await execAsync(
        `gh repo list ${this.GITHUB_ORG} --json name,description,updatedAt,isPrivate,defaultBranchRef --limit 100`
      );
      const repos = JSON.parse(ghOutput);

      // Pobierz listę zainstalowanych aplikacji
      const { stdout: installedApps } = await execAsync(`ls -1 ${APPS_DIR}`);
      const installed = new Set(installedApps.trim().split('\n').filter(Boolean));

      // Mapuj repozytoria
      const result = repos.map((repo: any) => ({
        name: repo.name,
        description: repo.description || '',
        updatedAt: repo.updatedAt,
        isPrivate: repo.isPrivate,
        defaultBranch: repo.defaultBranchRef?.name || 'main',
        installed: installed.has(repo.name),
        path: installed.has(repo.name) ? `${APPS_DIR}/${repo.name}` : null
      }));

      // Sortuj: niezainstalowane najpierw
      result.sort((a: any, b: any) => {
        if (a.installed !== b.installed) return a.installed ? 1 : -1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      return {
        organization: this.GITHUB_ORG,
        totalRepos: result.length,
        installedCount: result.filter((r: any) => r.installed).length,
        notInstalledCount: result.filter((r: any) => !r.installed).length,
        repos: result
      };
    } catch (error: any) {
      logger.error('Error fetching GitHub repos:', error);
      throw new Error(`Failed to fetch GitHub repos: ${error.message}`);
    }
  }

  /**
   * Tylko niezainstalowane repozytoria
   */
  async getNewGitHubRepos(): Promise<{ newReposCount: number; repos: any[] }> {
    try {
      const { repos } = await this.getGitHubRepos();
      const newRepos = repos.filter((r: any) => !r.installed);
      return { newReposCount: newRepos.length, repos: newRepos };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Sklonuj repozytorium z GitHub
   */
  async cloneGitHubRepo(repoName: string, branch?: string): Promise<{
    success: boolean;
    message: string;
    path?: string;
    hasDockerCompose?: boolean;
  }> {
    const targetDir = `${APPS_DIR}/${repoName}`;

    try {
      // Sprawdź czy już istnieje
      try {
        await execAsync(`test -d ${targetDir}`);
        return { success: false, message: `Repository ${repoName} already exists at ${targetDir}` };
      } catch {
        // Nie istnieje - kontynuuj
      }

      // Klonuj - bez --branch jeśli nie podano (obsłuży puste repo i różne domyślne branche)
      const branchArg = branch ? `-- --branch ${branch}` : '';
      await execAsync(
        `gh repo clone ${this.GITHUB_ORG}/${repoName} ${targetDir} ${branchArg}`,
        { timeout: 120000 }
      );

      // Sprawdź docker-compose
      let hasDockerCompose = false;
      try {
        await execAsync(`test -f ${targetDir}/docker-compose.yml`);
        hasDockerCompose = true;
      } catch {}

      logger.info(`Cloned repository ${repoName} to ${targetDir}`);

      return {
        success: true,
        message: `Repository ${repoName} cloned successfully`,
        path: targetDir,
        hasDockerCompose
      };
    } catch (error: any) {
      logger.error(`Error cloning repo ${repoName}:`, error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Status synchronizacji wszystkich repozytoriów
   */
  async getReposSyncStatus(): Promise<{
    summary: { total: number; installed: number; notInstalled: number; needsUpdate: number; hasUncommitted: number };
    repos: any[];
  }> {
    try {
      const { repos: ghRepos } = await this.getGitHubRepos();
      const results: any[] = [];

      for (const repo of ghRepos) {
        if (!repo.installed) {
          results.push({
            name: repo.name,
            installed: false,
            inGitHub: true,
            updatedAt: repo.updatedAt
          });
          continue;
        }

        const appDir = `${APPS_DIR}/${repo.name}`;
        let status: any = {
          name: repo.name,
          installed: true,
          inGitHub: true
        };

        try {
          // Fetch latest
          await execAsync(`cd ${appDir} && git fetch origin 2>/dev/null`);

          const { stdout: localCommit } = await execAsync(
            `cd ${appDir} && git rev-parse HEAD 2>/dev/null`
          );
          const { stdout: remoteCommit } = await execAsync(
            `cd ${appDir} && git rev-parse origin/${repo.defaultBranch} 2>/dev/null`
          );

          status.localCommit = localCommit.trim().substring(0, 7);
          status.remoteCommit = remoteCommit.trim().substring(0, 7);
          status.upToDate = localCommit.trim() === remoteCommit.trim();

          // Sprawdź niezacommitowane zmiany
          const { stdout: gitStatus } = await execAsync(
            `cd ${appDir} && git status --porcelain 2>/dev/null`
          );
          status.hasUncommittedChanges = gitStatus.trim().length > 0;
        } catch {
          status.gitError = true;
        }

        results.push(status);
      }

      const summary = {
        total: results.length,
        installed: results.filter(r => r.installed).length,
        notInstalled: results.filter(r => !r.installed).length,
        needsUpdate: results.filter(r => r.installed && r.upToDate === false).length,
        hasUncommitted: results.filter(r => r.hasUncommittedChanges).length
      };

      return { summary, repos: results };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Pull najnowszych zmian z GitHub
   */
  async pullGitHubRepo(repoName: string): Promise<{
    success: boolean;
    message: string;
    output?: string;
  }> {
    const appDir = `${APPS_DIR}/${repoName}`;

    try {
      // Sprawdź czy istnieje
      await execAsync(`test -d ${appDir}`);

      // Sprawdź czy są niezacommitowane zmiany
      const { stdout: gitStatus } = await execAsync(`cd ${appDir} && git status --porcelain`);
      if (gitStatus.trim().length > 0) {
        return {
          success: false,
          message: `Repository has uncommitted changes. Please commit or stash them first.`
        };
      }

      // Pull
      const { stdout, stderr } = await execAsync(
        `cd ${appDir} && git pull origin main 2>&1 || git pull origin master 2>&1`
      );

      return {
        success: true,
        message: 'Pull successful',
        output: stdout + stderr
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

export const infrastructureService = new InfrastructureService();
export default infrastructureService;
