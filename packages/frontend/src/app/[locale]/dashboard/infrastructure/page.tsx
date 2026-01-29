'use client';

/**
 * Infrastructure Dashboard Page
 * FAZA-4: Unified Infrastructure Dashboard
 *
 * Monitoring serwerów, kontenerów Docker, logów i statusu aplikacji
 */

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import {
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  ArrowPathIcon,
  PlayIcon,
  StopIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

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
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ServerIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{server.name}</h3>
            <p className="text-sm text-gray-500">{server.host}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          server.status === 'online'
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {server.status}
        </span>
      </div>

      <div className="space-y-3">
        <MetricBar label="CPU" value={server.cpu} />
        <MetricBar label="Memory" value={server.memory} />
        <MetricBar label="Disk" value={server.disk} />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Uptime</span>
          <span className="text-gray-700">{server.uptime}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500">Load</span>
          <span className="text-gray-700">{server.loadAverage.map(l => l.toFixed(2)).join(' / ')}</span>
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
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-400'}`} />
        <div>
          <div className="font-medium text-gray-900">{container.name}</div>
          <div className="text-sm text-gray-500">{container.image}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          isRunning ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
        }`}>
          {container.state}
        </span>

        <div className="flex gap-1">
          <button
            onClick={() => onAction(container.name, 'restart')}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Restart"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
          {isRunning ? (
            <button
              onClick={() => onAction(container.name, 'stop')}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Stop"
            >
              <StopIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onAction(container.name, 'start')}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Start"
            >
              <PlayIcon className="w-4 h-4" />
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
              ? 'bg-green-50 border-green-200'
              : app.status === 'down'
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {app.status === 'up' ? (
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
            ) : app.status === 'down' ? (
              <XCircleIcon className="w-4 h-4 text-red-600" />
            ) : (
              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
            )}
            <span className="font-medium text-sm truncate">{app.name}</span>
          </div>
          {app.responseTime && (
            <div className="text-xs text-gray-500 mt-1">{app.responseTime}ms</div>
          )}
        </div>
      ))}
    </div>
  );
}

function DatabaseCard({ db }: { db: DatabaseStatus }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <CircleStackIcon className="w-5 h-5 text-purple-600" />
        <div>
          <div className="font-medium text-gray-900">{db.name}</div>
          {db.version && <div className="text-sm text-gray-500">{db.version}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {db.connections !== undefined && (
          <span className="text-sm text-gray-500">{db.connections} connections</span>
        )}
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          db.status === 'online'
            ? 'bg-green-100 text-green-700'
            : db.status === 'offline'
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-200 text-gray-600'
        }`}>
          {db.status}
        </span>
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Logs: {containerName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={lines}
              onChange={(e) => setLines(parseInt(e.target.value))}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value={50}>50 lines</option>
              <option value={100}>100 lines</option>
              <option value={200}>200 lines</option>
              <option value={500}>500 lines</option>
            </select>
            <button
              onClick={fetchLogs}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-gray-900">
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
      toast.error('Failed to fetch infrastructure data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showAllContainers]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleContainerAction = async (name: string, action: 'restart' | 'stop' | 'start') => {
    try {
      await api(`/containers/${name}/${action}`, { method: 'POST' });
      toast.success(`Container ${name} ${action}ed successfully`);
      setTimeout(() => fetchData(true), 2000);
    } catch (error) {
      toast.error(`Failed to ${action} container`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading infrastructure data...</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Failed to load infrastructure data</h3>
        <button
          onClick={() => fetchData()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Infrastructure</h1>
          <p className="text-gray-500">Monitor servers, containers, and services</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CpuChipIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{overview.summary.containers.running}</div>
              <div className="text-sm text-gray-500">Running Containers</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{overview.summary.apps.up}/{overview.summary.apps.total}</div>
              <div className="text-sm text-gray-500">Apps Online</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CircleStackIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{overview.summary.databases.online}/{overview.summary.databases.total}</div>
              <div className="text-sm text-gray-500">Databases Online</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ServerIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{overview.server.cpu.toFixed(0)}%</div>
              <div className="text-sm text-gray-500">Server CPU</div>
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
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Applications Health</h2>
          <HealthGrid apps={overview.health} />
        </div>
      </div>

      {/* Containers */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Docker Containers</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showAllContainers}
              onChange={(e) => setShowAllContainers(e.target.checked)}
              className="rounded border-gray-300"
            />
            Show stopped
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
                className="absolute right-20 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="View Logs"
              >
                <DocumentTextIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Databases */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Databases</h2>
        <div className="space-y-2">
          {overview.databases.map(db => (
            <DatabaseCard key={db.name} db={db} />
          ))}
        </div>
      </div>

      {/* Log Viewer Modal */}
      {selectedContainer && (
        <LogViewer
          containerName={selectedContainer}
          onClose={() => setSelectedContainer(null)}
        />
      )}
    </div>
  );
}
