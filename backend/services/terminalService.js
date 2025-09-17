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
      shellArgs = ['-i']; // Modo interativo
    }

    const child = spawn(shell, shellArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, TERM: 'xterm-256color' }
    });

    const session = {
      id: sessionId,
      process: child,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      outputBuffer: '',
      isReady: false
    };

    this.activeSessions.set(sessionId, session);

    // Configurar listeners para output em tempo real
    child.stdout.on('data', (data) => {
      const output = data.toString();
      session.outputBuffer += output;
      session.lastActivity = new Date().toISOString();
      
      // Emitir evento de output se houver callback
      if (session.onOutput) {
        session.onOutput(output);
      }
    });

    child.stderr.on('data', (data) => {
      const output = data.toString();
      session.outputBuffer += output;
      session.lastActivity = new Date().toISOString();
      
      if (session.onError) {
        session.onError(output);
      }
    });

    // Marcar como pronto após um pequeno delay
    setTimeout(() => {
      session.isReady = true;
    }, 500);

    // Limpar sessão quando o processo terminar
    child.on('close', (code) => {
      this.activeSessions.delete(sessionId);
    });

    child.on('error', (error) => {
      console.error(`Terminal session ${sessionId} error:`, error);
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

    if (!session.isReady) {
      throw new Error('Sessão ainda não está pronta');
    }

    // Validar comando antes de enviar
    if (!this.isCommandSafe(command)) {
      throw new Error('Comando não permitido por segurança');
    }

    session.process.stdin.write(command + '\n');
    session.lastActivity = new Date().toISOString();

    return {
      sessionId,
      command,
      timestamp: new Date().toISOString()
    };
  }

  // Obter output da sessão
  getSessionOutput(sessionId, clearBuffer = false) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    const output = session.outputBuffer;
    if (clearBuffer) {
      session.outputBuffer = '';
    }

    return output;
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

  // Validar comando (melhorado para suportar pipes)
  isCommandSafe(command) {
    const dangerousCommands = [
      'rm', 'del', 'format', 'fdisk', 'mkfs',
      'shutdown', 'reboot', 'halt', 'poweroff',
      'sudo', 'su', 'chmod', 'chown', 'passwd',
      'useradd', 'userdel', 'groupadd', 'groupdel',
      'mount', 'umount', 'dd', 'mkfs', 'fsck'
    ];

    const dangerousPatterns = [
      /rm\s+-rf/, /del\s+\/s/, /format\s+c:/,
      /shutdown/, /reboot/, /halt/, /poweroff/,
      /sudo\s+/, /su\s+/, /chmod\s+777/, /chown\s+root/,
      /passwd/, /useradd/, /userdel/, /groupadd/, /groupdel/,
      /mount/, /umount/, /dd\s+if=/, /mkfs/, /fsck/
    ];

    // Verificar comandos perigosos
    const cmd = command.trim().split(' ')[0].toLowerCase();
    if (dangerousCommands.includes(cmd)) {
      return false;
    }

    // Verificar padrões perigosos
    for (const pattern of dangerousPatterns) {
      if (pattern.test(command.toLowerCase())) {
        return false;
      }
    }

    // Verificar redirecionamentos perigosos
    if (command.includes('>') && command.includes('/dev/')) {
      return false;
    }

    // Verificar tentativas de escape
    if (command.includes('$(') || command.includes('`') || command.includes('${')) {
      return false;
    }

    return true;
  }

  // Autocompletar comandos
  getCommandSuggestions(partialCommand) {
    const allCommands = [
      // Comandos básicos
      'ls', 'dir', 'pwd', 'cd', 'echo', 'cat', 'type',
      'date', 'time', 'whoami', 'hostname', 'clear', 'cls',
      
      // Comandos de rede
      'ping', 'tracert', 'traceroute', 'netstat', 'ipconfig', 'ifconfig',
      'nslookup', 'dig', 'curl', 'wget',
      
      // Comandos de sistema
      'tasklist', 'ps', 'top', 'htop', 'systeminfo', 'uname',
      'df', 'du', 'free', 'uptime', 'w', 'who',
      
      // Comandos de arquivo
      'find', 'grep', 'sort', 'uniq', 'wc', 'head', 'tail',
      'less', 'more', 'touch', 'mkdir', 'rmdir',
      
      // Comandos com pipes
      'grep', 'sort', 'uniq', 'wc', 'head', 'tail', 'less', 'more'
    ];

    const suggestions = allCommands.filter(cmd => 
      cmd.toLowerCase().startsWith(partialCommand.toLowerCase())
    );

    return suggestions.slice(0, 10); // Máximo 10 sugestões
  }

  // Obter sugestões de autocompletar para arquivos/diretórios
  async getPathSuggestions(partialPath) {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const dir = path.dirname(partialPath) || '.';
      const base = path.basename(partialPath);
      
      const files = await fs.readdir(dir);
      const suggestions = files.filter(file => 
        file.toLowerCase().startsWith(base.toLowerCase())
      );
      
      return suggestions.slice(0, 10);
    } catch (error) {
      return [];
    }
  }
}

module.exports = TerminalService;
