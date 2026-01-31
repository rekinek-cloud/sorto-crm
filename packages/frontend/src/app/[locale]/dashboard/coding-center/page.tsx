'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  CommandLineIcon,
  FolderIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  CodeBracketIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import {
  getProjects,
  CodingProject,
} from '@/lib/api/codingCenter';

// Dynamic import for WebTerminal (client-side only)
const WebTerminal = dynamic(
  () => import('@/components/terminal/WebTerminal'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="text-gray-500">Loading terminal...</div>
      </div>
    ),
  }
);

interface TerminalTab {
  id: string;
  projectName: string;
  projectPath: string;
  title: string;
  connected: boolean;
}

export default function CodingCenterPage() {
  const [projects, setProjects] = useState<CodingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [showProjectList, setShowProjectList] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Nie udalo sie zaladowac projektow');
    } finally {
      setLoading(false);
    }
  };

  const openTerminal = (project: CodingProject) => {
    const newTab: TerminalTab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectName: project.name,
      projectPath: project.path,
      title: project.name,
      connected: false,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setShowProjectList(false);
  };

  const closeTab = (tabId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
        setShowProjectList(true);
      }
      return newTabs;
    });
  };

  const updateTabConnection = (tabId: string, connected: boolean) => {
    setTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, connected } : t
    ));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCmd(label);
      toast.success(`Skopiowano: ${label}`);
      setTimeout(() => setCopiedCmd(null), 2000);
    } catch (error) {
      toast.error('Nie udalo sie skopiowac');
    }
  };

  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar - Projects */}
      <div className={`${showProjectList ? 'w-64' : 'w-12'} bg-gray-900 text-gray-100 flex flex-col transition-all duration-200`}>
        <div className="p-2 border-b border-gray-700">
          <button
            onClick={() => setShowProjectList(!showProjectList)}
            className="w-full flex items-center justify-center gap-2 p-2 hover:bg-gray-800 rounded"
          >
            <CodeBracketIcon className="h-5 w-5 text-green-400" />
            {showProjectList && <span className="font-semibold flex-1 text-left">Projekty ({projects.length})</span>}
          </button>
        </div>

        {showProjectList && (
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : (
              projects.map(project => (
                <div
                  key={project.name}
                  className="group flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-800"
                  onClick={() => openTerminal(project)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderIcon className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span className="truncate text-sm">{project.name}</span>
                  </div>
                  <PlusIcon className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100" />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-950">
        {/* Tabs Bar */}
        <div className="flex items-center bg-gray-900 border-b border-gray-700 overflow-x-auto">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 cursor-pointer border-r border-gray-700 min-w-0 max-w-[200px] ${
                activeTabId === tab.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tab.connected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="truncate text-sm">{tab.title}</span>
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className="p-0.5 hover:bg-gray-700 rounded flex-shrink-0"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* New Tab Button */}
          <button
            onClick={() => setShowProjectList(true)}
            className="flex items-center gap-1 px-3 py-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Terminal Content */}
        {activeTab ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Quick Commands */}
            <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 py-1">{activeTab.projectPath}</span>
              <div className="flex-1" />
              {[
                { label: 'Aider', cmd: `cd ${activeTab.projectPath} && aider` },
                { label: 'Aider Qwen', cmd: `cd ${activeTab.projectPath} && aider --model openai/qwen-max` },
                { label: 'Claude', cmd: `cd ${activeTab.projectPath} && claude` },
                { label: 'VS Code', cmd: `code ${activeTab.projectPath}` },
              ].map(({ label, cmd }) => (
                <button
                  key={label}
                  onClick={() => copyToClipboard(cmd, label)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded"
                >
                  {copiedCmd === label ? (
                    <CheckIcon className="h-3 w-3 text-green-400" />
                  ) : (
                    <ClipboardDocumentIcon className="h-3 w-3" />
                  )}
                  {label}
                </button>
              ))}
            </div>

            {/* Terminal */}
            <div className="flex-1 min-h-0">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  className={`h-full ${tab.id === activeTabId ? 'block' : 'hidden'}`}
                >
                  <WebTerminal
                    projectPath={tab.projectPath}
                    onConnectionChange={(connected) => updateTabConnection(tab.id, connected)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <CommandLineIcon className="h-16 w-16 mx-auto mb-4 text-gray-700" />
              <p className="mb-4">Kliknij projekt aby otworzyc terminal</p>
              <p className="text-sm text-gray-600">Mozesz otworzyc wiele terminali jednoczesnie</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
