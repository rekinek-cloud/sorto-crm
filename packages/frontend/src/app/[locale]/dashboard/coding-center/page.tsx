'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  ChevronRightIcon,
  SignalIcon,
  SignalSlashIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import {
  getProjects,
  getProjectStatus,
  getCommandSnippets,
  addProject,
  removeProject,
  CodingProject,
  ProjectStatus,
  CommandSnippets,
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

export default function CodingCenterPage() {
  const [projects, setProjects] = useState<CodingProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<CodingProject | null>(null);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus | null>(null);
  const [commandSnippets, setCommandSnippets] = useState<CommandSnippets | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', path: '', description: '' });
  const [terminalConnected, setTerminalConnected] = useState(false);
  const [terminalKey, setTerminalKey] = useState(0);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        selectProject(data[0]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Nie udalo sie zaladowac projektow');
    } finally {
      setLoading(false);
    }
  };

  const selectProject = async (project: CodingProject) => {
    setSelectedProject(project);
    setTerminalKey(prev => prev + 1); // Force terminal reconnect

    try {
      const [status, snippets] = await Promise.all([
        getProjectStatus(project.name),
        getCommandSnippets(project.name),
      ]);
      setProjectStatus(status);
      setCommandSnippets(snippets);
    } catch (error) {
      console.error('Failed to load project details:', error);
    }
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

  const handleAddProject = async () => {
    if (!newProject.name || !newProject.path) {
      toast.error('Nazwa i sciezka sa wymagane');
      return;
    }

    try {
      await addProject(newProject);
      toast.success('Projekt dodany');
      setShowAddProject(false);
      setNewProject({ name: '', path: '', description: '' });
      loadProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Nie udalo sie dodac projektu');
    }
  };

  const handleRemoveProject = async (name: string) => {
    if (!confirm(`Usunac projekt ${name}?`)) return;

    try {
      await removeProject(name);
      toast.success('Projekt usuniety');
      if (selectedProject?.name === name) {
        setSelectedProject(null);
        setProjectStatus(null);
        setCommandSnippets(null);
      }
      loadProjects();
    } catch (error) {
      toast.error('Nie udalo sie usunac projektu');
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar - Projects */}
      <div className="w-64 bg-gray-900 text-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CodeBracketIcon className="h-5 w-5 text-green-400" />
              <span className="font-semibold">Projekty ({projects.length})</span>
            </div>
            <button
              onClick={() => setShowAddProject(!showAddProject)}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          {showAddProject && (
            <div className="mt-3 p-2 bg-gray-800 rounded space-y-2">
              <input
                type="text"
                placeholder="Nazwa"
                value={newProject.name}
                onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
                className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
              />
              <input
                type="text"
                placeholder="Sciezka"
                value={newProject.path}
                onChange={e => setNewProject(p => ({ ...p, path: e.target.value }))}
                className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
              />
              <button
                onClick={handleAddProject}
                className="w-full px-2 py-1 text-sm bg-green-600 hover:bg-green-700 rounded"
              >
                Dodaj
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
            projects.map(project => (
              <div
                key={project.name}
                className={`group flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-800 ${
                  selectedProject?.name === project.name ? 'bg-gray-800 border-l-2 border-green-400' : ''
                }`}
                onClick={() => selectProject(project)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FolderIcon className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  <span className="truncate text-sm">{project.name}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveProject(project.name); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded"
                >
                  <TrashIcon className="h-3 w-3 text-gray-500" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-950">
        {selectedProject ? (
          <>
            {/* Project Header */}
            <div className="px-4 py-3 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-white">{selectedProject.name}</h1>
                  {terminalConnected ? (
                    <SignalIcon className="h-4 w-4 text-green-400" title="Connected" />
                  ) : (
                    <SignalSlashIcon className="h-4 w-4 text-red-400" title="Disconnected" />
                  )}
                </div>
                <p className="text-sm text-gray-400">{selectedProject.path}</p>
              </div>
              {projectStatus && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-400">
                    <span className="text-gray-500">branch:</span> {projectStatus.branch}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Commands */}
            {commandSnippets && (
              <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 py-1">Skopiuj:</span>
                {[
                  { label: 'Aider', cmd: commandSnippets.aider },
                  { label: 'Claude Code', cmd: commandSnippets.claudeCode },
                  { label: 'VS Code', cmd: commandSnippets.vscode },
                  { label: 'Git Pull', cmd: commandSnippets.gitPull },
                  { label: 'npm build', cmd: commandSnippets.npmBuild },
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
            )}

            {/* Terminal */}
            <div className="flex-1 min-h-0">
              <WebTerminal
                key={terminalKey}
                projectPath={selectedProject.path}
                onConnectionChange={setTerminalConnected}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <CommandLineIcon className="h-16 w-16 mx-auto mb-4 text-gray-700" />
              <p>Wybierz projekt z listy</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Git Status */}
      {projectStatus && (
        <div className="w-72 bg-gray-900 text-gray-100 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <ChevronRightIcon className="h-4 w-4" />
              Git Status
            </h3>
          </div>

          <div className="p-4 border-b border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Branch</p>
            <p className="text-green-400 font-mono text-sm">{projectStatus.branch}</p>
          </div>

          <div className="p-4 border-b border-gray-800 flex-1 overflow-y-auto">
            <p className="text-xs text-gray-500 mb-2">Status</p>
            {projectStatus.status ? (
              <pre className="text-xs text-yellow-300 font-mono whitespace-pre-wrap">
                {projectStatus.status}
              </pre>
            ) : (
              <p className="text-xs text-gray-500 italic">Clean working tree</p>
            )}
          </div>

          <div className="p-4">
            <p className="text-xs text-gray-500 mb-2">Ostatnie commity</p>
            <div className="space-y-1">
              {projectStatus.recentCommits.slice(0, 5).map((commit, i) => (
                <p key={i} className="text-xs text-gray-400 font-mono truncate">
                  {commit}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
