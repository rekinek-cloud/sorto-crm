'use client';

import React, { useState, useEffect } from 'react';
import {
  ServerIcon,
  ArrowPathIcon,
  PlayIcon,
  StopIcon,
  CloudArrowUpIcon,
  CpuChipIcon,
  CircleStackIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { devHubApi } from '@/lib/api/devHub';

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
      toast.error('Nie udało się załadować kontenerów');
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
      toast.error('Nie udało się załadować statusu aplikacji');
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
      toast.error(`Nie udało się wykonać ${action} na kontenerze`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeploy = async (app: string) => {
    try {
      setActionLoading(`deploy-${app}`);
      await devHubApi.deployApp(app);
      toast.success(`Aplikacja ${app} - deploy rozpoczęty`);
      await loadContainers();
    } catch (error) {
      console.error('Failed to deploy:', error);
      toast.error('Nie udało się wdrożyć aplikacji');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('healthy') || status.includes('running')) {
      return 'text-green-600 bg-green-100';
    }
    if (status.includes('unhealthy') || status.includes('restarting')) {
      return 'text-yellow-600 bg-yellow-100';
    }
    if (status.includes('exited') || status.includes('stopped')) {
      return 'text-red-600 bg-red-100';
    }
    return 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('healthy') || status.includes('running')) {
      return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
    }
    if (status.includes('unhealthy') || status.includes('restarting')) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />;
    }
    return <XCircleIcon className="h-4 w-4 text-red-600" />;
  };

  const appGroups = Object.keys(containers).sort();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <ServerIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dev Hub</h1>
            <p className="text-sm text-gray-600">Zarządzanie kontenerami i aplikacjami</p>
          </div>
        </div>
        <button
          onClick={() => { loadContainers(); loadSystemResources(); }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          Odśwież
        </button>
      </div>

      {/* System Resources */}
      {systemResources && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <CpuChipIcon className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">CPU</p>
                <p className="text-xl font-bold">{systemResources.cpu?.usage?.toFixed(1) || 0}%</p>
                <p className="text-xs text-gray-400">{systemResources.cpu?.cores || 0} cores</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <CircleStackIcon className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">RAM</p>
                <p className="text-xl font-bold">{systemResources.memory?.percent?.toFixed(1) || 0}%</p>
                <p className="text-xs text-gray-400">
                  {((systemResources.memory?.used || 0) / 1024 / 1024 / 1024).toFixed(1)} /
                  {((systemResources.memory?.total || 0) / 1024 / 1024 / 1024).toFixed(1)} GB
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <ServerIcon className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Dysk</p>
                <p className="text-xl font-bold">{systemResources.disk?.percent?.toFixed(1) || 0}%</p>
                <p className="text-xs text-gray-400">
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
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
        </div>
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
              <div key={appName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* App Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${healthyCount === totalCount ? 'bg-green-500' : healthyCount > 0 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <h3 className="font-semibold text-gray-900">{appName}</h3>
                    <span className="text-sm text-gray-500">
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
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <CloudArrowUpIcon className="h-4 w-4" />
                      )}
                      Deploy
                    </button>
                  </div>
                </div>

                {/* Containers */}
                <div className="divide-y divide-gray-100">
                  {appContainers.map((container) => (
                    <div key={container.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(container.status || container.state)}
                        <div>
                          <p className="font-medium text-gray-900">{container.name}</p>
                          <p className="text-xs text-gray-500">{container.image}</p>
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
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Start"
                            >
                              <PlayIcon className="h-4 w-4" />
                            </button>
                          )}
                          {container.state === 'running' && (
                            <button
                              onClick={() => handleContainerAction(container.name, 'stop')}
                              disabled={actionLoading === `${container.name}-stop`}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Stop"
                            >
                              <StopIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleContainerAction(container.name, 'restart')}
                            disabled={actionLoading === `${container.name}-restart`}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Restart"
                          >
                            <ArrowPathIcon className={`h-4 w-4 ${actionLoading === `${container.name}-restart` ? 'animate-spin' : ''}`} />
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
          <ServerIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Brak kontenerów do wyświetlenia</p>
        </div>
      )}
    </div>
  );
}
