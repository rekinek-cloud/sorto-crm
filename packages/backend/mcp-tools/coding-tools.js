#!/usr/bin/env node
/**
 * Coding Tools MCP Server
 * Centrum kodowania - Aider, Cline, Claude Code
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { z } = require('zod');

// Konfiguracja projektów
const PROJECTS_FILE = path.join(__dirname, 'projects.json');

// Domyślne projekty
const DEFAULT_PROJECTS = [
  { name: 'sorto-crm', path: '/home/dev/apps/sorto-crm', status: 'running', description: 'CRM Streams - główna aplikacja' },
  { name: 'retronova', path: '/home/dev/apps/retronova', status: 'running', description: 'Retronova - gra retro' },
];

// Załaduj projekty
function loadProjects() {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Błąd ładowania projektów:', err);
  }
  saveProjects(DEFAULT_PROJECTS);
  return DEFAULT_PROJECTS;
}

// Zapisz projekty
function saveProjects(projects) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

// Znajdź projekt po nazwie
function findProject(name) {
  const projects = loadProjects();
  return projects.find(p =>
    p.name.toLowerCase() === name.toLowerCase() ||
    p.name.toLowerCase().includes(name.toLowerCase())
  );
}

// Serwer MCP
const server = new McpServer(
  { name: 'coding-tools', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Tool: list_projects
server.tool(
  'list_projects',
  'Pokaż listę projektów do pracy kodowania',
  {},
  async () => {
    const projects = loadProjects();

    let output = '╔══════════════════════════════════════════════════════════╗\n';
    output += '║          PROJEKTY DO PRACY KODOWANIA                     ║\n';
    output += '╠══════════════════════════════════════════════════════════╣\n';

    for (const p of projects) {
      const icon = p.status === 'running' ? '🟢' : p.status === 'error' ? '🔴' : '⚪';
      output += `║ ${icon} ${p.name.padEnd(15)} ${p.path.padEnd(35).slice(0, 35)} ║\n`;
      if (p.description) {
        output += `║    └─ ${p.description.padEnd(48).slice(0, 48)} ║\n`;
      }
    }

    output += '╠══════════════════════════════════════════════════════════╣\n';
    output += '║ KOMENDY:                                                 ║\n';
    output += '║ • "Aider na [projekt]" - codzienna praca (tanie)         ║\n';
    output += '║ • "Cline dla [projekt]" - praca w VS Code (tanie)        ║\n';
    output += '║ • "Claude Code na [projekt]" - TYLKO trudne zadania      ║\n';
    output += '╚══════════════════════════════════════════════════════════╝\n';

    return { content: [{ type: 'text', text: output }] };
  }
);

// Tool: add_project
server.tool(
  'add_project',
  'Dodaj nowy projekt do listy',
  {
    name: z.string().describe('Nazwa projektu'),
    path: z.string().describe('Ścieżka do katalogu projektu'),
    description: z.string().optional().describe('Opis projektu')
  },
  async ({ name, path: projectPath, description }) => {
    const projects = loadProjects();

    if (projects.find(p => p.name.toLowerCase() === name.toLowerCase())) {
      return { content: [{ type: 'text', text: `Projekt "${name}" już istnieje!` }] };
    }

    if (!fs.existsSync(projectPath)) {
      return { content: [{ type: 'text', text: `Ścieżka nie istnieje: ${projectPath}` }] };
    }

    projects.push({
      name,
      path: projectPath,
      status: 'running',
      description: description || ''
    });

    saveProjects(projects);
    return { content: [{ type: 'text', text: `✅ Dodano projekt: ${name}\nŚcieżka: ${projectPath}` }] };
  }
);

// Tool: open_aider
server.tool(
  'open_aider',
  'Uruchom Aider w katalogu projektu (codzienna praca, oszczędza limit Max)',
  {
    project: z.string().describe('Nazwa projektu'),
    files: z.string().optional().describe('Opcjonalne: pliki do edycji')
  },
  async ({ project: projectName, files }) => {
    const project = findProject(projectName);
    if (!project) {
      return { content: [{ type: 'text', text: `❌ Nie znaleziono projektu: ${projectName}\nUżyj "Pokaż projekty" aby zobaczyć dostępne.` }] };
    }

    const filesStr = files || '';
    const cmd = `cd ${project.path} && aider ${filesStr}`.trim();

    let output = '╔══════════════════════════════════════════════════════════╗\n';
    output += `║  AIDER - ${project.name.padEnd(45).slice(0, 45)}  ║\n`;
    output += '╠══════════════════════════════════════════════════════════╣\n';
    output += `║ Katalog: ${project.path.padEnd(45).slice(0, 45)}   ║\n`;
    output += '║                                                          ║\n';
    output += '║ 📋 Uruchom w terminalu:                                  ║\n';
    output += '╠══════════════════════════════════════════════════════════╣\n';
    output += `║ ${cmd.padEnd(56).slice(0, 56)} ║\n`;
    output += '╠══════════════════════════════════════════════════════════╣\n';
    output += '║ Komendy Aider:                                           ║\n';
    output += '║   /add plik.js  - dodaj plik do kontekstu                ║\n';
    output += '║   /drop plik.js - usuń plik z kontekstu                  ║\n';
    output += '║   /diff         - pokaż zmiany                           ║\n';
    output += '║   /undo         - cofnij ostatnią zmianę                 ║\n';
    output += '║   /quit         - wyjdź                                  ║\n';
    output += '╚══════════════════════════════════════════════════════════╝\n';

    return { content: [{ type: 'text', text: output }] };
  }
);

// Tool: open_cline
server.tool(
  'open_cline',
  'Otwórz VS Code z Cline w projekcie (GUI, oszczędza limit Max)',
  {
    project: z.string().describe('Nazwa projektu')
  },
  async ({ project: projectName }) => {
    const project = findProject(projectName);
    if (!project) {
      return { content: [{ type: 'text', text: `❌ Nie znaleziono projektu: ${projectName}` }] };
    }

    exec(`code ${project.path}`, (err) => {
      if (err) console.error('Błąd otwierania VS Code:', err);
    });

    let output = '╔══════════════════════════════════════════════════════════╗\n';
    output += `║  CLINE (VS Code) - ${project.name.padEnd(35).slice(0, 35)}  ║\n`;
    output += '╠══════════════════════════════════════════════════════════╣\n';
    output += `║ Otwieram VS Code w: ${project.path.padEnd(35).slice(0, 35)} ║\n`;
    output += '║                                                          ║\n';
    output += '║ Następne kroki:                                          ║\n';
    output += '║ 1. Poczekaj aż VS Code się otworzy                       ║\n';
    output += '║ 2. Ctrl+Shift+P → "Cline: Open Cline"                    ║\n';
    output += '║ 3. Wpisz zadanie w naturalnym języku                     ║\n';
    output += '║ 4. Zatwierdź lub odrzuć zmiany                           ║\n';
    output += '╚══════════════════════════════════════════════════════════╝\n';

    return { content: [{ type: 'text', text: output }] };
  }
);

// Tool: open_claude_code
server.tool(
  'open_claude_code',
  'Uruchom Claude Code w projekcie (TYLKO trudne zadania - zużywa limit Max!)',
  {
    project: z.string().describe('Nazwa projektu')
  },
  async ({ project: projectName }) => {
    const project = findProject(projectName);
    if (!project) {
      return { content: [{ type: 'text', text: `❌ Nie znaleziono projektu: ${projectName}` }] };
    }

    const cmd = `cd ${project.path} && claude`;

    let output = '╔══════════════════════════════════════════════════════════╗\n';
    output += '║  ⚠️  CLAUDE CODE - ZUŻYWA LIMIT MAX!                      ║\n';
    output += '╠══════════════════════════════════════════════════════════╣\n';
    output += `║ Projekt: ${project.name.padEnd(45).slice(0, 45)}   ║\n`;
    output += `║ Katalog: ${project.path.padEnd(45).slice(0, 45)}   ║\n`;
    output += '║                                                          ║\n';
    output += '║ ⚠️  Używaj TYLKO do:                                      ║\n';
    output += '║    • Trudnej architektury                                ║\n';
    output += '║    • Skomplikowanego debuggingu                          ║\n';
    output += '║    • Code review                                         ║\n';
    output += '║                                                          ║\n';
    output += '║ 📋 Uruchom w terminalu:                                  ║\n';
    output += '╠══════════════════════════════════════════════════════════╣\n';
    output += `║ ${cmd.padEnd(56).slice(0, 56)} ║\n`;
    output += '╠══════════════════════════════════════════════════════════╣\n';
    output += '║ 💡 Dla codziennej pracy użyj Aider lub Cline!            ║\n';
    output += '╚══════════════════════════════════════════════════════════╝\n';

    return { content: [{ type: 'text', text: output }] };
  }
);

// Tool: project_status
server.tool(
  'project_status',
  'Sprawdź status projektu (git, docker)',
  {
    project: z.string().describe('Nazwa projektu')
  },
  async ({ project: projectName }) => {
    const project = findProject(projectName);
    if (!project) {
      return { content: [{ type: 'text', text: `❌ Nie znaleziono projektu: ${projectName}` }] };
    }

    return new Promise((resolve) => {
      exec(`cd ${project.path} && git status --short && echo "---" && git log --oneline -3`, (err, stdout) => {
        let output = '╔══════════════════════════════════════════════════════════╗\n';
        output += `║  STATUS - ${project.name.padEnd(44).slice(0, 44)}  ║\n`;
        output += '╠══════════════════════════════════════════════════════════╣\n';

        if (err) {
          output += '║ ❌ Błąd: ' + err.message.slice(0, 47).padEnd(47) + ' ║\n';
        } else {
          const lines = stdout.split('\n').filter(l => l.trim());
          for (const line of lines.slice(0, 10)) {
            output += `║ ${line.padEnd(56).slice(0, 56)} ║\n`;
          }
        }

        output += '╚══════════════════════════════════════════════════════════╝\n';
        resolve({ content: [{ type: 'text', text: output }] });
      });
    });
  }
);

// Start serwera
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Coding Tools MCP started');
}

main().catch(console.error);
