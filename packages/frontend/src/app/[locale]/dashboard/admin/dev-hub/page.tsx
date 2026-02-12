'use client';

import React, { useState, useEffect } from 'react';
import {
  Server,
  RefreshCw,
  Play,
  Square,
  Upload,
  Cpu,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { devHubApi } from '@/lib/api/devHub';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
}

interface AppStatus {
  app: string;
  path: string;
  url: string;
  health: string;
  containers: any[];
}

interface SystemResources {
  cpu: { usage: number; cores: number };
  memory: { used: number; total: number; percent: number };
  disk: { used: number; total: number; percent: number };
}

export default function DevHubPage() {
  const [containers, setContainers] = useState<Record<string, Container[]>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [systemResources, setSystemResources] = useState<SystemResources | null>(null);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [appStatus, setAppStatus] = useState<AppStatus | null>(null);

  useEffect(() => {
    loadContainers();
    loadSystemResources();
  }, []);

  const loadContainers = async () => {
    try {
      setLoading(true);
      const data = await devHubApi.getContainers();
      setContainers(data.containers || {});
    } catch (error) {
      console.error('Failed to load containers:', error);
      toast.error('Nie udalo sie zaladowac kontenerow');
    } finally {
      setLoading(false);
    }
  };

  const loadSystemResources = async () => {
    try {
      const data = await devHubApi.getSystemResources();
      setSystemResources(data);
    } catch (error) {
      console.error('Failed to load system resources:', error);
    }
  };

  const loadAppStatus = async (app: string) => {
    try {
      setSelectedApp(app);
      const data = await devHubApi.getAppStatus(app);
      setAppStatus(data);
    } catch (error) {
      console.error('Failed to load app status:', error);
      toast.error('Nie udalo sie zaladowac statusu aplikacji');
    }
  };

  const handleContainerAction = async (containerName: string, action: 'start' | 'stop' | 'restart') => {
    try {
      setActionLoading(`${containerName}-${action}`);
      await devHubApi.containerAction(containerName, action);
      toast.success(`Kontener ${containerName} - ${action} wykonane`);
      await loadContainers();
    } catch (error) {
      console.error(`Failed to ${action} container:`, error);
      toast.error(`Nie udalo sie wykonac ${action} na kontenerze`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeploy = async (app: string) => {
    try {
      setActionLoading(`deploy-${app}`);
      await devHubApi.deployApp(app);
      toast.success(`Aplikacja ${app} - deploy rozpoczety`);
      await loadContainers();
    } catch (error) {
      console.error('Failed to deploy:', error);
      toast.error('Nie udalo sie wdrozyc aplikacji');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('healthy') || status.includes('running')) {
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    }
    if (status.includes('unhealthy') || status.includes('restarting')) {
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    }
    if (status.includes('exited') || status.includes('stopped')) {
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
    }
    return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700';
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('healthy') || status.includes('running')) {
      return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
    }
    if (status.includes('unhealthy') || status.includes('restarting')) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    }
    return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
  };

  const appGroups = Object.keys(containers).sort();

  return (
    <PageShell>
      <PageHeader
        title="Dev Hub"
        subtitle="Zarzadzanie kontenerami i aplikacjami"
        icon={Server}
        iconColor="text-indigo-600"
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Dev Hub' }]}
        actions={
          <button
            onClick={() => { loadContainers(); loadSystemResources(); }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Odswiez
          </button>
        }
      />

      {/* System Resources */}
      {systemResources && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <Cpu className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">CPU</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{systemResources.cpu?.usage?.toFixed(1) || 0}%</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{systemResources.cpu?.cores || 0} cores</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-green-500 dark:text-green-400" />
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">RAM</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{systemResources.memory?.percent?.toFixed(1) || 0}%</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {((systemResources.memory?.used || 0) / 1024 / 1024 / 1024).toFixed(1)} /
                  {((systemResources.memory?.total || 0) / 1024 / 1024 / 1024).toFixed(1)} GB
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <Server className="h-8 w-8 text-purple-500 dark:text-purple-400" />
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Dysk</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{systemResources.disk?.percent?.toFixed(1) || 0}%</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {((systemResources.disk?.used || 0) / 1024 / 1024 / 1024).toFixed(1)} /
                  {((systemResources.disk?.total || 0) / 1024 / 1024 / 1024).toFixed(1)} GB
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <SkeletonPage />
      ) : (
        /* Applications */
        <div className="space-y-4">
          {appGroups.map((appName) => {
            const appContainers = containers[appName] || [];
            const healthyCount = appContainers.filter(c =>
              c.status?.includes('healthy') || (c.state === 'running' && !c.status?.includes('unhealthy'))
            ).length;
            const totalCount = appContainers.length;

            return (
              <div key={appName} className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden">
                {/* App Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${healthyCount === totalCount ? 'bg-green-500' : healthyCount > 0 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{appName}</h3>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {healthyCount}/{totalCount} healthy
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeploy(appName)}
                      disabled={actionLoading === `deploy-${appName}`}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {actionLoading === `deploy-${appName}` ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Deploy
                    </button>
                  </div>
                </div>

                {/* Containers */}
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {appContainers.map((container) => (
                    <div key={container.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(container.status || container.state)}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{container.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{container.image}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(container.status || container.state)}`}>
                          {container.status || container.state}
                        </span>
                        <div className="flex items-center gap-1">
                          {container.state !== 'running' && (
                            <button
                              onClick={() => handleContainerAction(container.name, 'start')}
                              disabled={actionLoading === `${container.name}-start`}
                              className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                              title="Start"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          )}
                          {container.state === 'running' && (
                            <button
                              onClick={() => handleContainerAction(container.name, 'stop')}
                              disabled={actionLoading === `${container.name}-stop`}
                              className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              title="Stop"
                            >
                              <Square className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleContainerAction(container.name, 'restart')}
                            disabled={actionLoading === `${container.name}-restart`}
                            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            title="Restart"
                          >
                            <RefreshCw className={`h-4 w-4 ${actionLoading === `${container.name}-restart` ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && appGroups.length === 0 && (
        <div className="text-center py-12">
          <Server className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Brak kontenerow do wyswietlenia</p>
        </div>
      )}
    </PageShell>
  );
}
