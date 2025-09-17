// Sistema de Logs Padronizado - SMX LiveBoard
const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.logDir = path.join(__dirname, '..', 'logs');
        this.logFile = path.join(this.logDir, 'system.log');
        
        // Criar diretório de logs se não existir
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
        
        // Níveis de log em ordem de prioridade
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    // Verificar se o nível de log deve ser exibido
    shouldLog(level) {
        return this.levels[level] <= this.levels[this.logLevel];
    }

    // Formatar mensagem de log
    formatMessage(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const contextStr = Object.keys(context).length > 0 ? 
            ` | Context: ${JSON.stringify(context)}` : '';
        
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
    }

    // Escrever no arquivo de log
    writeToFile(formattedMessage) {
        try {
            fs.appendFileSync(this.logFile, formattedMessage + '\n');
        } catch (error) {
            console.error('Erro ao escrever no arquivo de log:', error.message);
        }
    }

    // Log de erro
    error(message, context = {}) {
        if (this.shouldLog('error')) {
            const formatted = this.formatMessage('error', message, context);
            console.error(formatted);
            this.writeToFile(formatted);
        }
    }

    // Log de aviso
    warn(message, context = {}) {
        if (this.shouldLog('warn')) {
            const formatted = this.formatMessage('warn', message, context);
            console.warn(formatted);
            this.writeToFile(formatted);
        }
    }

    // Log de informação
    info(message, context = {}) {
        if (this.shouldLog('info')) {
            const formatted = this.formatMessage('info', message, context);
            console.info(formatted);
            this.writeToFile(formatted);
        }
    }

    // Log de debug
    debug(message, context = {}) {
        if (this.shouldLog('debug')) {
            const formatted = this.formatMessage('debug', message, context);
            console.debug(formatted);
            this.writeToFile(formatted);
        }
    }

    // Log de sucesso (alias para info com contexto especial)
    success(message, context = {}) {
        this.info(`✅ ${message}`, { ...context, type: 'success' });
    }

    // Log de falha (alias para error com contexto especial)
    failure(message, context = {}) {
        this.error(`❌ ${message}`, { ...context, type: 'failure' });
    }

    // Log de inicialização
    startup(message, context = {}) {
        this.info(`🚀 ${message}`, { ...context, type: 'startup' });
    }

    // Log de shutdown
    shutdown(message, context = {}) {
        this.info(`🛑 ${message}`, { ...context, type: 'shutdown' });
    }

    // Log de conexão
    connection(message, context = {}) {
        this.info(`🔗 ${message}`, { ...context, type: 'connection' });
    }

    // Log de desconexão
    disconnection(message, context = {}) {
        this.info(`🔌 ${message}`, { ...context, type: 'disconnection' });
    }

    // Log de métricas
    metrics(message, context = {}) {
        this.debug(`📊 ${message}`, { ...context, type: 'metrics' });
    }

    // Log de segurança
    security(message, context = {}) {
        this.warn(`🔒 ${message}`, { ...context, type: 'security' });
    }

    // Limpar logs antigos
    cleanOldLogs(daysToKeep = 7) {
        try {
            const files = fs.readdirSync(this.logDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            files.forEach(file => {
                if (file.endsWith('.log')) {
                    const filePath = path.join(this.logDir, file);
                    const stats = fs.statSync(filePath);
                    
                    if (stats.mtime < cutoffDate) {
                        fs.unlinkSync(filePath);
                        this.info(`Log antigo removido: ${file}`, { 
                            type: 'cleanup',
                            file: file,
                            age: Math.round((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24))
                        });
                    }
                }
            });
        } catch (error) {
            this.error('Erro ao limpar logs antigos', { error: error.message });
        }
    }

    // Obter estatísticas dos logs
    getLogStats() {
        try {
            if (!fs.existsSync(this.logFile)) {
                return { totalLines: 0, fileSize: 0, lastModified: null };
            }

            const stats = fs.statSync(this.logFile);
            const content = fs.readFileSync(this.logFile, 'utf8');
            const lines = content.split('\n').filter(line => line.trim().length > 0);

            return {
                totalLines: lines.length,
                fileSize: stats.size,
                lastModified: stats.mtime,
                logLevel: this.logLevel
            };
        } catch (error) {
            this.error('Erro ao obter estatísticas dos logs', { error: error.message });
            return { totalLines: 0, fileSize: 0, lastModified: null, error: error.message };
        }
    }
}

// Exportar instância singleton
module.exports = new Logger();
