const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class LogsService extends EventEmitter {
  constructor() {
    super();
    this.logs = [];
    this.logFile = path.join(__dirname, '..', 'logs', 'system.log');
    this.maxLogs = 10000;
    this.logLevels = {
      INFO: 0,
      WARNING: 1,
      ERROR: 2,
      CRITICAL: 3
    };
    
    this.initializeLogFile();
    this.startSystemLogging();
  }

  // Inicializar arquivo de log
  async initializeLogFile() {
    try {
      const logDir = path.dirname(this.logFile);
      await fs.mkdir(logDir, { recursive: true });
      
      // Verificar se arquivo existe, se não, criar
      try {
        await fs.access(this.logFile);
      } catch {
        await fs.writeFile(this.logFile, '');
      }
    } catch (error) {
      console.error('Erro ao inicializar arquivo de log:', error);
    }
  }

  // Adicionar log
  async addLog(level, message, source = 'SYSTEM', metadata = {}) {
    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      source,
      metadata,
      severity: this.logLevels[level.toUpperCase()] || 0
    };

    // Adicionar à memória
    this.logs.push(logEntry);
    
    // Manter apenas os últimos logs na memória
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Escrever no arquivo
    await this.writeToFile(logEntry);

    // Emitir evento
    this.emit('log', logEntry);

    return logEntry;
  }

  // Log de informação
  async info(message, source = 'SYSTEM', metadata = {}) {
    return this.addLog('INFO', message, source, metadata);
  }

  // Log de aviso
  async warning(message, source = 'SYSTEM', metadata = {}) {
    return this.addLog('WARNING', message, source, metadata);
  }

  // Log de erro
  async error(message, source = 'SYSTEM', metadata = {}) {
    return this.addLog('ERROR', message, source, metadata);
  }

  // Log crítico
  async critical(message, source = 'SYSTEM', metadata = {}) {
    return this.addLog('CRITICAL', message, source, metadata);
  }

  // Obter logs
  getLogs(options = {}) {
    let filteredLogs = [...this.logs];

    // Filtrar por nível
    if (options.level) {
      const minSeverity = this.logLevels[options.level.toUpperCase()] || 0;
      filteredLogs = filteredLogs.filter(log => log.severity >= minSeverity);
    }

    // Filtrar por fonte
    if (options.source) {
      filteredLogs = filteredLogs.filter(log => 
        log.source.toLowerCase().includes(options.source.toLowerCase())
      );
    }

    // Filtrar por período
    if (options.startDate) {
      const startDate = new Date(options.startDate);
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= startDate
      );
    }

    if (options.endDate) {
      const endDate = new Date(options.endDate);
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= endDate
      );
    }

    // Buscar por texto
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        log.source.toLowerCase().includes(searchTerm)
      );
    }

    // Ordenar (mais recente primeiro)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limitar resultados
    const limit = options.limit || 100;
    const offset = options.offset || 0;
    
    return {
      logs: filteredLogs.slice(offset, offset + limit),
      total: filteredLogs.length,
      hasMore: filteredLogs.length > offset + limit
    };
  }

  // Obter estatísticas dos logs
  getLogStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {},
      bySource: {},
      recent: 0
    };

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    this.logs.forEach(log => {
      // Por nível
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // Por fonte
      stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1;
      
      // Recentes (última hora)
      if (new Date(log.timestamp) > oneHourAgo) {
        stats.recent++;
      }
    });

    return stats;
  }

  // Limpar logs antigos
  async clearOldLogs(daysToKeep = 30) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoffDate);
    
    const removedCount = initialCount - this.logs.length;
    
    // Limpar arquivo também
    await this.rotateLogFile();
    
    return {
      removed: removedCount,
      remaining: this.logs.length
    };
  }

  // Rotacionar arquivo de log
  async rotateLogFile() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFile = this.logFile.replace('.log', `_${timestamp}.log`);
      
      await fs.rename(this.logFile, rotatedFile);
      await fs.writeFile(this.logFile, '');
      
      return rotatedFile;
    } catch (error) {
      console.error('Erro ao rotacionar arquivo de log:', error);
      throw error;
    }
  }

  // Escrever no arquivo
  async writeToFile(logEntry) {
    try {
      const logLine = `[${logEntry.timestamp}] [${logEntry.level}] [${logEntry.source}] ${logEntry.message}\n`;
      await fs.appendFile(this.logFile, logLine);
    } catch (error) {
      console.error('Erro ao escrever no arquivo de log:', error);
    }
  }

  // Ler logs do arquivo
  async readLogsFromFile(options = {}) {
    try {
      const content = await fs.readFile(this.logFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const logs = lines.map(line => {
        const match = line.match(/^\[([^\]]+)\] \[([^\]]+)\] \[([^\]]+)\] (.+)$/);
        if (match) {
          return {
            timestamp: match[1],
            level: match[2],
            source: match[3],
            message: match[4]
          };
        }
        return null;
      }).filter(log => log);

      return logs;
    } catch (error) {
      console.error('Erro ao ler logs do arquivo:', error);
      return [];
    }
  }

  // Gerar ID único para log
  generateLogId() {
    return 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Exportar logs
  async exportLogs(format = 'json', options = {}) {
    const logs = this.getLogs(options);
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(logs.logs, null, 2);
      
      case 'csv':
        const headers = ['timestamp', 'level', 'source', 'message'];
        const csvContent = [
          headers.join(','),
          ...logs.logs.map(log => 
            headers.map(header => `"${log[header] || ''}"`).join(',')
          )
        ].join('\n');
        return csvContent;
      
      case 'txt':
        return logs.logs.map(log => 
          `[${log.timestamp}] [${log.level}] [${log.source}] ${log.message}`
        ).join('\n');
      
      default:
        throw new Error('Formato não suportado. Use: json, csv, txt');
    }
  }

  // Iniciar logging do sistema
  startSystemLogging() {
    // Log de inicialização
    this.info('LogsService inicializado', 'SYSTEM');
    
    // Monitorar eventos do sistema
    this.monitorSystemEvents();
    
    // Log periódico de status
    setInterval(() => {
      this.info('Sistema funcionando normalmente', 'MONITOR');
    }, 30000); // A cada 30 segundos
  }

  // Monitorar eventos do sistema
  monitorSystemEvents() {
    // Monitorar uso de memória
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      if (memUsageMB > 100) {
        this.warning(`Alto uso de memória: ${memUsageMB}MB`, 'MEMORY', { 
          heapUsed: memUsageMB,
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
        });
      } else {
        this.info(`Uso de memória: ${memUsageMB}MB`, 'MEMORY');
      }
    }, 60000); // A cada minuto

    // Monitorar CPU
    setInterval(() => {
      const cpuUsage = process.cpuUsage();
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
      
      if (cpuPercent > 0.5) {
        this.warning(`Alto uso de CPU: ${cpuPercent.toFixed(2)}s`, 'CPU', { 
          user: cpuUsage.user,
          system: cpuUsage.system
        });
      }
    }, 30000); // A cada 30 segundos

    // Monitorar uptime
    setInterval(() => {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      
      this.info(`Uptime: ${hours}h ${minutes}m`, 'SYSTEM', { uptime });
    }, 300000); // A cada 5 minutos
  }

  // Monitorar logs em tempo real
  startRealTimeMonitoring(ws) {
    const onLog = (logEntry) => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify({
          type: 'log',
          data: logEntry
        }));
      }
    };

    this.on('log', onLog);

    // Remover listener quando WebSocket fechar
    ws.on('close', () => {
      this.removeListener('log', onLog);
    });
  }
}

module.exports = LogsService;
