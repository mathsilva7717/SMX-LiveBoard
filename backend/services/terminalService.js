const { spawn, exec } = require('child_process');
const os = require('os');

class TerminalService {
  constructor() {
    this.activeSessions = new Map();
    this.commandHistory = [];
  }

  // Executar comando único
  async executeCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const platform = os.platform();
      let shell, shellArgs;

      if (platform === 'win32') {
        shell = 'cmd';
        shellArgs = ['/c', command];
      } else {
        shell = '/bin/bash';
        shellArgs = ['-c', command];
      }

      const child = spawn(shell, shellArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const result = {
          command,
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          timestamp: new Date().toISOString()
        };

        // Adicionar ao histórico
        this.commandHistory.push(result);
        if (this.commandHistory.length > 100) {
          this.commandHistory.shift();
        }

        resolve(result);
      });

      child.on('error', (error) => {
        reject({
          command,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  // Criar sessão de terminal interativa
  createSession(sessionId) {
    const platform = os.platform();
    let shell, shellArgs;

    if (platform === 'win32') {
      shell = 'cmd';
      shellArgs = [];
    } else {
      shell = '/bin/bash';
      shellArgs = [];
    }

    const child = spawn(shell, shellArgs, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const session = {
      id: sessionId,
      process: child,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    this.activeSessions.set(sessionId, session);

    // Limpar sessão quando o processo terminar
    child.on('close', () => {
      this.activeSessions.delete(sessionId);
    });

    return session;
  }

  // Enviar comando para sessão específica
  sendToSession(sessionId, command) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    session.process.stdin.write(command + '\n');
    session.lastActivity = new Date().toISOString();

    return {
      sessionId,
      command,
      timestamp: new Date().toISOString()
    };
  }

  // Fechar sessão
  closeSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.process.kill();
      this.activeSessions.delete(sessionId);
      return { success: true, sessionId };
    }
    return { success: false, error: 'Sessão não encontrada' };
  }

  // Listar sessões ativas
  getActiveSessions() {
    return Array.from(this.activeSessions.values()).map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    }));
  }

  // Obter histórico de comandos
  getCommandHistory(limit = 50) {
    return this.commandHistory.slice(-limit);
  }

  // Comandos seguros permitidos
  getSafeCommands() {
    return [
      'dir', 'ls', 'pwd', 'cd', 'echo', 'date', 'time',
      'whoami', 'hostname', 'ipconfig', 'ifconfig',
      'ping', 'tracert', 'traceroute', 'netstat',
      'tasklist', 'ps', 'top', 'htop',
      'systeminfo', 'uname', 'df', 'du',
      'free', 'uptime', 'w', 'who'
    ];
  }

  // Validar comando (básico)
  isCommandSafe(command) {
    const dangerousCommands = [
      'rm', 'del', 'format', 'fdisk', 'mkfs',
      'shutdown', 'reboot', 'halt', 'poweroff',
      'sudo', 'su', 'chmod', 'chown'
    ];

    const cmd = command.trim().split(' ')[0].toLowerCase();
    return !dangerousCommands.includes(cmd);
  }
}

module.exports = TerminalService;
