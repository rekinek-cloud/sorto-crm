'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CommandLineIcon,
  FolderIcon,
  ArrowPathIcon,
  PlayIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  CodeBracketIcon,
  TrashIcon,
  PlusIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import {
  getProjects,
  getProjectStatus,
  executeCommand,
  getCommandSnippets,
  addProject,
  removeProject,
  CodingProject,
  ProjectStatus,
  CommandSnippets,
} from '@/lib/api/codingCenter';

interface TerminalLine {
  type: 'command' | 'output' | 'error' | 'info';
  content: string;
  timestamp: Date;
}

export default function CodingCenterPage() {
  const [projects, setProjects] = useState<CodingProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<CodingProject | null>(null);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus | null>(null);
  const [commandSnippets, setCommandSnippets] = useState<CommandSnippets | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [command, setCommand] = useState('');
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', path: '', description: '' });

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

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
    setTerminalLines([{
      type: 'info',
      content: `Wybrano projekt: ${project.name} (${project.path})`,
      timestamp: new Date(),
    }]);

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

  const handleExecute = async () => {
    if (!selectedProject || !command.trim()) return;

    const cmd = command.trim();
    setTerminalLines(prev => [...prev, {
      type: 'command',
      content: `$ ${cmd}`,
      timestamp: new Date(),
    }]);
    setCommand('');
    setExecuting(true);

    try {
      const result = await executeCommand(selectedProject.name, cmd);

      if (result.stdout) {
        setTerminalLines(prev => [...prev, {
          type: 'output',
          content: result.stdout,
          timestamp: new Date(),
        }]);
      }
      if (result.stderr) {
        setTerminalLines(prev => [...prev, {
          type: 'error',
          content: result.stderr,
          timestamp: new Date(),
        }]);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Komenda nie dozwolona';
      setTerminalLines(prev => [...prev, {
        type: 'error',
        content: `Error: ${errorMsg}`,
        timestamp: new Date(),
      }]);
    } finally {
      setExecuting(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !executing) {
      handleExecute();
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

  const quickCommands = [
    { label: 'git status', cmd: 'git status' },
    { label: 'git log', cmd: 'git log --oneline -10' },
    { label: 'git branch', cmd: 'git branch -a' },
    { label: 'git diff', cmd: 'git diff --stat' },
    { label: 'ls', cmd: 'ls -la' },
    { label: 'docker ps', cmd: 'docker compose ps' },
  ];

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar - Projects */}
      <div className="w-64 bg-gray-900 text-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CodeBracketIcon className="h-5 w-5 text-green-400" />
              <span className="font-semibold">Projekty</span>
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
                <h1 className="text-lg font-semibold text-white">{selectedProject.name}</h1>
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
            <div className="flex-1 flex flex-col min-h-0">
              {/* Terminal Output */}
              <div
                ref={terminalRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-sm"
                onClick={() => inputRef.current?.focus()}
              >
                {terminalLines.map((line, i) => (
                  <div
                    key={i}
                    className={`whitespace-pre-wrap ${
                      line.type === 'command' ? 'text-green-400' :
                      line.type === 'error' ? 'text-red-400' :
                      line.type === 'info' ? 'text-blue-400' :
                      'text-gray-300'
                    }`}
                  >
                    {line.content}
                  </div>
                ))}
                {executing && (
                  <div className="text-yellow-400 flex items-center gap-2">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Wykonywanie...
                  </div>
                )}
              </div>

              {/* Quick Command Buttons */}
              <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 flex flex-wrap gap-2">
                {quickCommands.map(({ label, cmd }) => (
                  <button
                    key={label}
                    onClick={() => { setCommand(cmd); inputRef.current?.focus(); }}
                    className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 rounded"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Command Input */}
              <div className="px-4 py-3 bg-gray-900 border-t border-gray-700 flex items-center gap-2">
                <span className="text-green-400 font-mono">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={executing}
                  placeholder="Wpisz komende (git status, ls, npm run build...)"
                  className="flex-1 bg-transparent text-white font-mono text-sm focus:outline-none placeholder-gray-600"
                />
                <button
                  onClick={handleExecute}
                  disabled={executing || !command.trim()}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded text-sm flex items-center gap-1"
                >
                  <PlayIcon className="h-4 w-4" />
                  Run
                </button>
              </div>
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
