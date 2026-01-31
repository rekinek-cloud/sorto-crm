import * as pty from 'node-pty';
import { WebSocket } from 'ws';
import * as os from 'os';
import * as fs from 'fs';
import logger from '../config/logger';

interface TerminalSession {
  pty: pty.IPty;
  ws: WebSocket;
  projectPath: string;
}

const sessions = new Map<string, TerminalSession>();

export function createTerminalSession(
  sessionId: string,
  ws: WebSocket,
  projectPath: string
): void {
  try {
    // Kill existing session if any
    if (sessions.has(sessionId)) {
      const existing = sessions.get(sessionId);
      existing?.pty.kill();
      sessions.delete(sessionId);
    }

    // Check if path exists
    if (!fs.existsSync(projectPath)) {
      logger.error(`Terminal path does not exist: ${projectPath}`);
      ws.send(JSON.stringify({
        type: 'output',
        data: `\r\n\x1b[31mError: Path does not exist: ${projectPath}\x1b[0m\r\n`
      }));
      return;
    }

    const shell = '/bin/sh';
    logger.info(`Spawning PTY: shell=${shell}, cwd=${projectPath}`);

    const ptyProcess = pty.spawn(shell, ['-l'], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: projectPath,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        HOME: '/root',
        PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
      },
    });

    logger.info(`PTY spawned with PID: ${ptyProcess.pid}`);

    // Send terminal output to WebSocket
    ptyProcess.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data }));
      }
    });

    ptyProcess.onExit(({ exitCode, signal }) => {
      logger.info(`PTY exited: exitCode=${exitCode}, signal=${signal}`);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'exit', exitCode }));
      }
      sessions.delete(sessionId);
    });

    sessions.set(sessionId, { pty: ptyProcess, ws, projectPath });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'output',
      data: `\r\n\x1b[32m📁 Terminal started in: ${projectPath}\x1b[0m\r\n\r\n`
    }));

  } catch (error: any) {
    logger.error(`Failed to create terminal session: ${error.message}`, error);
    ws.send(JSON.stringify({
      type: 'output',
      data: `\r\n\x1b[31mError: ${error.message}\x1b[0m\r\n`
    }));
  }
}

export function handleTerminalInput(sessionId: string, data: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.pty.write(data);
  }
}

export function resizeTerminal(sessionId: string, cols: number, rows: number): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.pty.resize(cols, rows);
  }
}

export function killTerminalSession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.pty.kill();
    sessions.delete(sessionId);
  }
}

export function getActiveSessionCount(): number {
  return sessions.size;
}
