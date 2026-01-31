import * as pty from 'node-pty';
import { WebSocket } from 'ws';
import * as os from 'os';

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
  // Kill existing session if any
  if (sessions.has(sessionId)) {
    const existing = sessions.get(sessionId);
    existing?.pty.kill();
    sessions.delete(sessionId);
  }

  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 120,
    rows: 30,
    cwd: projectPath,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
    },
  });

  // Send terminal output to WebSocket
  ptyProcess.onData((data: string) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data }));
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
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
