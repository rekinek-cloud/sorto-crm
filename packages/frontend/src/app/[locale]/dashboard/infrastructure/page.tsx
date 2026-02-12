'use client';

/**
 * Infrastructure Dashboard Page
 * FAZA-4: Unified Infrastructure Dashboard
 *
 * Monitoring serwerow, kontenerow Docker, logow i statusu aplikacji
 */

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import {
  Server,
  Cpu,
  Database,
  RefreshCw,
  Play,
  Square,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  CloudDownload,
  Folder,
  Download,
  Code2,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

// Types
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

interface GitHubRepo {
  name: string;
  description: string;
  updatedAt: string;
  isPrivate: boolean;
  defaultBranch: string;
  installed: boolean;
  path: string | null;
  localCommit?: string;
  remoteCommit?: string;
  upToDate?: boolean;
  hasUncommittedChanges?: boolean;
}

interface GitHubReposData {
  organization: string;
  totalRepos: number;
  installedCount: number;
  notInstalledCount: number;
  repos: GitHubRepo[];
}

interface Overview {
  server: ServerMetrics;
  summary: {
    containers: { total: number; running: number; stopped: number };
    apps: { total: number; up: number; down: number };
    databases: { total: number; online: number };
  };
  health: AppHealth[];
  databases: DatabaseStatus[];
}

// API helpers
const api = async (endpoint: string, options?: RequestInit) => {
  const token = Cookies.get('access_token');
  const response = await fetch(`/api/v1/infrastructure${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
};

// Components
function MetricBar({ label, value, warning = 70, critical = 90 }: {
  label: string;
  value: number;
  warning?: number;
  critical?: number;
}) {
  const color = value >= critical ? 'bg-red-500' : value >= warning ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-medium text-slate-900 dark:text-slate-100">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function ServerCard({ server }: { server: ServerMetrics }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{server.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{server.host}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          server.status === 'online'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {server.status}
        </span>
      </div>

      <div className="space-y-3">
        <MetricBar label="CPU" value={server.cpu} />
        <MetricBar label="Memory" value={server.memory} />
        <MetricBar label="Disk" value={server.disk} />
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Uptime</span>
          <span className="text-slate-700 dark:text-slate-300">{server.uptime}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-slate-500 dark:text-slate-400">Load</span>
          <span className="text-slate-700 dark:text-slate-300">{server.loadAverage.map(l => l.toFixed(2)).join(' / ')}</span>
        </div>
      </div>
    </div>
  );
}

function ContainerItem({ container, onAction }: {
  container: Container;
  onAction: (name: string, action: 'restart' | 'stop' | 'start') => void;
}) {
  const isRunning = container.state === 'running';

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-slate-400 dark:bg-slate-500'}`} />
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-100">{container.name}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{container.image}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          isRunning ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
        }`}>
          {container.state}
        </span>

        <div className="flex gap-1">
          <button
            onClick={() => onAction(container.name, 'restart')}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            title="Restart"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isRunning ? (
            <button
              onClick={() => onAction(container.name, 'stop')}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Stop"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onAction(container.name, 'start')}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
              title="Start"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function HealthGrid({ apps }: { apps: AppHealth[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {apps.map(app => (
        <div
          key={app.slug}
          className={`p-3 rounded-lg border ${
            app.status === 'up'
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : app.status === 'down'
              ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
              : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {app.status === 'up' ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : app.status === 'down' ? (
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            )}
            <span className="font-medium text-sm truncate text-slate-900 dark:text-slate-100">{app.name}</span>
          </div>
          {app.responseTime && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{app.responseTime}ms</div>
          )}
        </div>
      ))}
    </div>
  );
}

function DatabaseCard({ db }: { db: DatabaseStatus }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
      <div className="flex items-center gap-3">
        <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-100">{db.name}</div>
          {db.version && <div className="text-sm text-slate-500 dark:text-slate-400">{db.version}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {db.connections !== undefined && (
          <span className="text-sm text-slate-500 dark:text-slate-400">{db.connections} connections</span>
        )}
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          db.status === 'online'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : db.status === 'offline'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
        }`}>
          {db.status}
        </span>
      </div>
    </div>
  );
}

function GitHubReposSection() {
  const [repos, setRepos] = useState<GitHubReposData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState<string | null>(null);
  const [pulling, setPulling] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'installed' | 'new'>('all');

  const fetchRepos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/github/repos');
      setRepos(data);
    } catch (error) {
      toast.error('Failed to fetch GitHub repos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  const handleClone = async (repoName: string) => {
    setCloning(repoName);
    try {
      const result = await api(`/github/repos/${repoName}/clone`, { method: 'POST' });
      if (result.success) {
        toast.success(`Repository ${repoName} cloned successfully`);
        fetchRepos();
      } else {
        toast.error(result.message || 'Clone failed');
      }
    } catch (error) {
      toast.error('Failed to clone repository');
    } finally {
      setCloning(null);
    }
  };

  const handlePull = async (repoName: string) => {
    setPulling(repoName);
    try {
      const result = await api(`/github/repos/${repoName}/pull`, { method: 'POST' });
      if (result.success) {
        toast.success(`Pulled latest changes for ${repoName}`);
        fetchRepos();
      } else {
        toast.error(result.message || 'Pull failed');
      }
    } catch (error) {
      toast.error('Failed to pull repository');
    } finally {
      setPulling(null);
    }
  };

  const filteredRepos = repos?.repos.filter(repo => {
    if (filter === 'installed') return repo.installed;
    if (filter === 'new') return !repo.installed;
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">GitHub Repositories</h2>
          {repos && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              ({repos.installedCount} installed / {repos.notInstalledCount} available)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="all">Wszystkie repozytoria</option>
            <option value="installed">Zainstalowane</option>
            <option value="new">Niezainstalowane</option>
          </select>
          <button
            onClick={fetchRepos}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredRepos.map(repo => (
          <div
            key={repo.name}
            className={`flex items-center justify-between p-3 rounded-lg ${
              repo.installed
                ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
                : 'bg-slate-50 border border-slate-200 dark:bg-slate-700/40 dark:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-2 h-2 rounded-full ${repo.installed ? 'bg-green-500' : 'bg-slate-400 dark:bg-slate-500'}`} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{repo.name}</span>
                  {repo.isPrivate && (
                    <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs rounded">private</span>
                  )}
                  {repo.installed && repo.hasUncommittedChanges && (
                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs rounded">uncommitted</span>
                  )}
                  {repo.installed && repo.upToDate === false && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded">updates available</span>
                  )}
                </div>
                {repo.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{repo.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              {repo.installed ? (
                <>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {repo.localCommit || '---'}
                  </span>
                  <button
                    onClick={() => handlePull(repo.name)}
                    disabled={pulling === repo.name || repo.hasUncommittedChanges}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={repo.hasUncommittedChanges ? 'Commit changes first' : 'Pull latest'}
                  >
                    {pulling === repo.name ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudDownload className="w-4 h-4" />
                    )}
                    Pull
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleClone(repo.name)}
                  disabled={cloning === repo.name}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 transition-colors"
                >
                  {cloning === repo.name ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Clone
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredRepos.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            Brak repozytoriow
          </div>
        )}
      </div>
    </div>
  );
}

function LogViewer({ containerName, onClose }: { containerName: string; onClose: () => void }) {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState(100);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(`/containers/${containerName}/logs?lines=${lines}`);
      setLogs(data.logs);
    } catch (error) {
      toast.error('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [containerName, lines]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Logi: {containerName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={lines}
              onChange={(e) => setLines(parseInt(e.target.value))}
              className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value={50}>50 linii</option>
              <option value={100}>100 linii</option>
              <option value={200}>200 linii</option>
              <option value={500}>500 linii</option>
            </select>
            <button
              onClick={fetchLogs}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-slate-900 dark:bg-slate-950">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{logs}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function InfrastructurePage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllContainers, setShowAllContainers] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [overviewData, containersData] = await Promise.all([
        api('/overview'),
        api(`/containers?all=${showAllContainers}`)
      ]);
      setOverview(overviewData);
      setContainers(containersData);
    } catch (error) {
      toast.error('Nie udalo sie pobrac danych infrastruktury');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showAllContainers]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleContainerAction = async (name: string, action: 'restart' | 'stop' | 'start') => {
    try {
      await api(`/containers/${name}/${action}`, { method: 'POST' });
      toast.success(`Kontener ${name} ${action === 'restart' ? 'zrestartowany' : action === 'stop' ? 'zatrzymany' : 'uruchomiony'}`);
      setTimeout(() => fetchData(true), 2000);
    } catch (error) {
      toast.error(`Nie udalo sie ${action === 'restart' ? 'zrestartowac' : action === 'stop' ? 'zatrzymac' : 'uruchomic'} kontenera`);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400">Ladowanie danych infrastruktury...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!overview) {
    return (
      <PageShell>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nie udalo sie zaladowac danych infrastruktury</h3>
          <button
            onClick={() => fetchData()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ponow probe
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Infrastruktura"
        subtitle="Monitoring serwerow, kontenerow i uslug"
        icon={Server}
        iconColor="text-blue-600"
        actions={
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Odswiez
          </button>
        }
      />

      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Cpu className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{overview.summary.containers.running}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Uruchomione kontenery</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{overview.summary.apps.up}/{overview.summary.apps.total}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Aplikacje online</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{overview.summary.databases.online}/{overview.summary.databases.total}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Bazy danych online</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Server className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{overview.server.cpu.toFixed(0)}%</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">CPU serwera</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Server Metrics */}
          <div className="lg:col-span-1">
            <ServerCard server={overview.server} />
          </div>

          {/* Health Status */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Status aplikacji</h2>
            <HealthGrid apps={overview.health} />
          </div>
        </div>

        {/* Containers */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Kontenery Docker</h2>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showAllContainers}
                onChange={(e) => setShowAllContainers(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              Pokaz zatrzymane
            </label>
          </div>
          <div className="space-y-2">
            {containers.map(container => (
              <div key={container.id} className="relative">
                <ContainerItem
                  container={container}
                  onAction={handleContainerAction}
                />
                <button
                  onClick={() => setSelectedContainer(container.name)}
                  className="absolute right-20 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                  title="Pokaz logi"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Databases */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Bazy danych</h2>
          <div className="space-y-2">
            {overview.databases.map(db => (
              <DatabaseCard key={db.name} db={db} />
            ))}
          </div>
        </div>

        {/* GitHub Repositories */}
        <GitHubReposSection />

        {/* Log Viewer Modal */}
        {selectedContainer && (
          <LogViewer
            containerName={selectedContainer}
            onClose={() => setSelectedContainer(null)}
          />
        )}
      </div>
    </PageShell>
  );
}
