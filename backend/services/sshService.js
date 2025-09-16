const { Client } = require('ssh2');
const EventEmitter = require('events');

class SSHService extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map();
    this.connectionHistory = [];
  }

  // Conectar via SSH
  async connect(connectionConfig) {
    return new Promise((resolve, reject) => {
      const connectionId = this.generateConnectionId();
      const client = new Client();

      const connection = {
        id: connectionId,
        config: connectionConfig,
        client,
        connected: false,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      client.on('ready', () => {
        connection.connected = true;
        connection.lastActivity = new Date().toISOString();
        this.connections.set(connectionId, connection);
        
        this.connectionHistory.push({
          id: connectionId,
          host: connectionConfig.host,
          user: connectionConfig.username,
          status: 'connected',
          timestamp: new Date().toISOString()
        });

        this.emit('connected', connectionId, connectionConfig);
        resolve({ connectionId, status: 'connected' });
      });

      client.on('error', (error) => {
        this.connectionHistory.push({
          id: connectionId,
          host: connectionConfig.host,
          user: connectionConfig.username,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.emit('error', connectionId, error);
        reject(error);
      });

      client.on('close', () => {
        connection.connected = false;
        this.connections.delete(connectionId);
        this.emit('disconnected', connectionId);
      });

      // Conectar
      client.connect({
        host: connectionConfig.host,
        port: connectionConfig.port || 22,
        username: connectionConfig.username,
        password: connectionConfig.password,
        privateKey: connectionConfig.privateKey,
        readyTimeout: 20000,
        keepaliveInterval: 30000
      });
    });
  }

  // Executar comando via SSH
  async executeCommand(connectionId, command) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.connected) {
      throw new Error('Conexão SSH não encontrada ou desconectada');
    }

    return new Promise((resolve, reject) => {
      connection.client.exec(command, (error, stream) => {
        if (error) {
          reject(error);
          return;
        }

        let stdout = '';
        let stderr = '';

        stream.on('close', (code, signal) => {
          connection.lastActivity = new Date().toISOString();
          
          resolve({
            connectionId,
            command,
            exitCode: code,
            signal,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            timestamp: new Date().toISOString()
          });
        });

        stream.on('data', (data) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      });
    });
  }

  // Criar shell interativo
  createShell(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.connected) {
      throw new Error('Conexão SSH não encontrada ou desconectada');
    }

    return new Promise((resolve, reject) => {
      connection.client.shell((error, stream) => {
        if (error) {
          reject(error);
          return;
        }

        const shellId = this.generateShellId();
        const shell = {
          id: shellId,
          connectionId,
          stream,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        };

        connection.shells = connection.shells || new Map();
        connection.shells.set(shellId, shell);

        // Eventos do shell
        stream.on('close', () => {
          connection.shells.delete(shellId);
        });

        resolve(shell);
      });
    });
  }

  // Enviar dados para shell
  sendToShell(connectionId, shellId, data) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.connected) {
      throw new Error('Conexão SSH não encontrada');
    }

    const shell = connection.shells?.get(shellId);
    if (!shell) {
      throw new Error('Shell não encontrado');
    }

    shell.stream.write(data);
    shell.lastActivity = new Date().toISOString();
    connection.lastActivity = new Date().toISOString();

    return {
      connectionId,
      shellId,
      data,
      timestamp: new Date().toISOString()
    };
  }

  // Desconectar
  disconnect(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.client.end();
      this.connections.delete(connectionId);
      
      this.connectionHistory.push({
        id: connectionId,
        host: connection.config.host,
        user: connection.config.username,
        status: 'disconnected',
        timestamp: new Date().toISOString()
      });

      return { success: true, connectionId };
    }
    return { success: false, error: 'Conexão não encontrada' };
  }

  // Listar conexões ativas
  getActiveConnections() {
    return Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      host: conn.config.host,
      user: conn.config.username,
      connected: conn.connected,
      createdAt: conn.createdAt,
      lastActivity: conn.lastActivity,
      shellsCount: conn.shells ? conn.shells.size : 0
    }));
  }

  // Obter histórico de conexões
  getConnectionHistory(limit = 50) {
    return this.connectionHistory.slice(-limit);
  }

  // Gerar ID único para conexão
  generateConnectionId() {
    return 'ssh_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Gerar ID único para shell
  generateShellId() {
    return 'shell_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Validar configuração de conexão
  validateConnectionConfig(config) {
    const required = ['host', 'username'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Campos obrigatórios: ${missing.join(', ')}`);
    }

    if (!config.password && !config.privateKey) {
      throw new Error('Senha ou chave privada é obrigatória');
    }

    return true;
  }

  // Limpar conexões inativas
  cleanupInactiveConnections() {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutos

    for (const [id, connection] of this.connections) {
      const lastActivity = new Date(connection.lastActivity).getTime();
      if (now - lastActivity > timeout) {
        this.disconnect(id);
      }
    }
  }
}

module.exports = SSHService;
