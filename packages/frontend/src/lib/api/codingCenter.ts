import apiClient from './client';

export interface CodingProject {
  name: string;
  path: string;
  status: string;
  stream: string;
  description: string;
}

export interface ProjectStatus {
  name: string;
  path: string;
  branch: string;
  status: string;
  recentCommits: string[];
}

export interface CommandSnippets {
  aider: string;
  aiderWithFiles: string;
  claudeCode: string;
  vscode: string;
  gitStatus: string;
  gitPull: string;
  npmBuild: string;
  dockerPs: string;
}

export interface ExecuteResult {
  stdout: string;
  stderr: string;
}

// Get all coding projects
export async function getProjects(): Promise<CodingProject[]> {
  const response = await apiClient.get('/coding-center/projects');
  return response.data.data;
}

// Add a new project
export async function addProject(data: {
  name: string;
  path: string;
  description?: string;
}): Promise<{ name: string; path: string }> {
  const response = await apiClient.post('/coding-center/projects', data);
  return response.data.data;
}

// Remove a project
export async function removeProject(name: string): Promise<void> {
  await apiClient.delete(`/coding-center/projects/${encodeURIComponent(name)}`);
}

// Get project git status
export async function getProjectStatus(name: string): Promise<ProjectStatus> {
  const response = await apiClient.get(`/coding-center/projects/${encodeURIComponent(name)}/status`);
  return response.data.data;
}

// Execute a command in project directory
export async function executeCommand(
  projectName: string,
  command: string
): Promise<ExecuteResult> {
  const response = await apiClient.post('/coding-center/execute', {
    projectName,
    command,
  });
  return response.data.data;
}

// Get command snippets for a project
export async function getCommandSnippets(projectName: string): Promise<CommandSnippets> {
  const response = await apiClient.get(`/coding-center/commands/${encodeURIComponent(projectName)}`);
  return response.data.data;
}
