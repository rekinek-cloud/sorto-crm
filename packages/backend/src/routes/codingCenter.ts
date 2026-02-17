import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();
const execAsync = promisify(exec);

// Projects config file path
const PROJECTS_FILE = path.join(__dirname, '../../mcp-tools/projects.json');

interface Project {
  name: string;
  path: string;
  status: string;
  stream: string;
  description: string;
}

// Load projects from JSON
function loadProjects(): Project[] {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading projects:', err);
  }
  return [];
}

// Save projects to JSON
function saveProjects(projects: Project[]): void {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

/**
 * GET /api/v1/coding-center/projects
 * List all coding projects
 */
router.get('/projects', async (_req: Request, res: Response) => {
  try {
    const projects = loadProjects();
    return res.json({ success: true, data: projects });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to load projects' });
  }
});

/**
 * POST /api/v1/coding-center/projects
 * Add a new project
 */
router.post('/projects', async (req: Request, res: Response) => {
  try {
    const { name, path: projectPath, description } = req.body;

    if (!name || !projectPath) {
      return res.status(400).json({ success: false, error: 'Name and path are required' });
    }

    const projects = loadProjects();

    if (projects.find(p => p.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'Project already exists' });
    }

    if (!fs.existsSync(projectPath)) {
      return res.status(400).json({ success: false, error: 'Path does not exist' });
    }

    projects.push({
      name,
      path: projectPath,
      status: 'running',
      stream: 'dev-hub',
      description: description || ''
    });

    saveProjects(projects);
    return res.json({ success: true, data: { name, path: projectPath } });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to add project' });
  }
});

/**
 * DELETE /api/v1/coding-center/projects/:name
 * Remove a project
 */
router.delete('/projects/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    let projects = loadProjects();
    const initialLength = projects.length;

    projects = projects.filter(p => p.name.toLowerCase() !== name.toLowerCase());

    if (projects.length === initialLength) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    saveProjects(projects);
    return res.json({ success: true, message: 'Project removed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to remove project' });
  }
});

/**
 * GET /api/v1/coding-center/projects/:name/status
 * Get git status for a project
 */
router.get('/projects/:name/status', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const projects = loadProjects();
    const project = projects.find(p => p.name.toLowerCase() === name.toLowerCase());

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const gitStatus = await execAsync(`cd ${project.path} && git status --short 2>/dev/null || echo "Not a git repo"`);
    const gitBranch = await execAsync(`cd ${project.path} && git branch --show-current 2>/dev/null || echo "N/A"`);
    const gitLog = await execAsync(`cd ${project.path} && git log --oneline -5 2>/dev/null || echo "No commits"`);

    return res.json({
      success: true,
      data: {
        name: project.name,
        path: project.path,
        branch: gitBranch.stdout.trim(),
        status: gitStatus.stdout.trim(),
        recentCommits: gitLog.stdout.trim().split('\n')
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to get project status' });
  }
});

/**
 * POST /api/v1/coding-center/execute
 * Execute a command in a project directory (limited commands)
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { projectName, command } = req.body;

    if (!projectName || !command) {
      return res.status(400).json({ success: false, error: 'Project name and command required' });
    }

    // Whitelist of allowed commands
    const allowedCommands = [
      'git status',
      'git log',
      'git branch',
      'git diff',
      'ls',
      'pwd',
      'npm run build',
      'npm test',
      'docker ps',
      'docker compose ps'
    ];

    const isAllowed = allowedCommands.some(cmd => command.startsWith(cmd));
    if (!isAllowed) {
      return res.status(403).json({ success: false, error: 'Command not allowed' });
    }

    const projects = loadProjects();
    const project = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const result = await execAsync(`cd ${project.path} && ${command}`, { timeout: 30000 });

    return res.json({
      success: true,
      data: {
        stdout: result.stdout,
        stderr: result.stderr
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    });
  }
});

/**
 * GET /api/v1/coding-center/commands/:projectName
 * Get command snippets for a project
 */
router.get('/commands/:projectName', async (req: Request, res: Response) => {
  try {
    const { projectName } = req.params;
    const projects = loadProjects();
    const project = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    return res.json({
      success: true,
      data: {
        aider: `cd ${project.path} && aider`,
        aiderWithFiles: `cd ${project.path} && aider src/`,
        claudeCode: `cd ${project.path} && claude`,
        vscode: `code ${project.path}`,
        gitStatus: `cd ${project.path} && git status`,
        gitPull: `cd ${project.path} && git pull`,
        npmBuild: `cd ${project.path} && npm run build`,
        dockerPs: `cd ${project.path} && docker compose ps`
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to generate commands' });
  }
});

export default router;
