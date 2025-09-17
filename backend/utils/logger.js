// Sistema de Logs Padronizado - SMX LiveBoard
const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.logDir = path.join(__dirname, '..', 'logs');
        this.logFile = path.join(this.logDir, 'system.log');
        this.isProduction = process.env.NODE_ENV === 'production';
        
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
        
        // Cores para terminal (apenas em desenvolvimento)
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            dim: '\x1b[2m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m',
            gray: '\x1b[90m'
        };
        
        // Cores por nível de log
        this.levelColors = {
            error: this.colors.red,
            warn: this.colors.yellow,
            info: this.colors.blue,
            debug: this.colors.gray
        };
        
        // Emojis por nível de log
        this.levelEmojis = {
            error: '❌',
            warn: '⚠️',
            info: 'ℹ️',
            debug: '🔍'
        };
        
        // Emojis especiais para tipos de log
        this.typeEmojis = {
            success: '✅',
            failure: '❌',
            startup: '🚀',
            shutdown: '🛑',
            connection: '🔗',
            disconnection: '🔌',
            metrics: '📊',
            security: '🔒',
            cleanup: '🧹',
            performance: '⚡',
            http: '🌐',
            websocket: '🔌',
            database: '🗄️',
            api: '🔌'
        };
    }

    // Verificar se o nível de log deve ser exibido
    shouldLog(level) {
        return this.levels[level] <= this.levels[this.logLevel];
    }

    // Formatar mensagem de log
    formatMessage(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const timeStr = new Date().toLocaleTimeString('pt-BR');
        const dateStr = new Date().toLocaleDateString('pt-BR');
        
        // Determinar emoji baseado no tipo de contexto
        let emoji = this.levelEmojis[level];
        if (context.type && this.typeEmojis[context.type]) {
            emoji = this.typeEmojis[context.type];
        }
        
        // Formatar contexto
        const contextStr = Object.keys(context).length > 0 ? 
            ` | ${JSON.stringify(context)}` : '';
        
        // Formatação para arquivo (sem cores)
        const fileMessage = `[${timestamp}] [${level.toUpperCase()}] ${emoji} ${message}${contextStr}`;
        
        // Formatação para console (com cores se não for produção)
        let consoleMessage = fileMessage;
        if (!this.isProduction) {
            const color = this.levelColors[level] || this.colors.white;
            const levelStr = level.toUpperCase().padEnd(5);
            consoleMessage = `${this.colors.gray}[${dateStr} ${timeStr}]${this.colors.reset} ${color}[${levelStr}]${this.colors.reset} ${emoji} ${message}${this.colors.dim}${contextStr}${this.colors.reset}`;
        }
        
        return { file: fileMessage, console: consoleMessage };
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
            console.error(formatted.console);
            this.writeToFile(formatted.file);
        }
    }

    // Log de aviso
    warn(message, context = {}) {
        if (this.shouldLog('warn')) {
            const formatted = this.formatMessage('warn', message, context);
            console.warn(formatted.console);
            this.writeToFile(formatted.file);
        }
    }

    // Log de informação
    info(message, context = {}) {
        if (this.shouldLog('info')) {
            const formatted = this.formatMessage('info', message, context);
            console.info(formatted.console);
            this.writeToFile(formatted.file);
        }
    }

    // Log de debug
    debug(message, context = {}) {
        if (this.shouldLog('debug')) {
            const formatted = this.formatMessage('debug', message, context);
            console.debug(formatted.console);
            this.writeToFile(formatted.file);
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

    // Log de performance
    performance(message, context = {}) {
        this.info(`⚡ ${message}`, { ...context, type: 'performance' });
    }

    // Log HTTP
    http(message, context = {}) {
        this.info(`🌐 ${message}`, { ...context, type: 'http' });
    }

    // Log WebSocket
    websocket(message, context = {}) {
        this.info(`🔌 ${message}`, { ...context, type: 'websocket' });
    }

    // Log de API
    api(message, context = {}) {
        this.info(`🔌 ${message}`, { ...context, type: 'api' });
    }

    // Log de banco de dados
    database(message, context = {}) {
        this.info(`🗄️ ${message}`, { ...context, type: 'database' });
    }

    // Log estruturado com contexto rico
    structured(level, message, context = {}) {
        const enrichedContext = {
            ...context,
            timestamp: new Date().toISOString(),
            pid: process.pid,
            memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
        };

        switch (level.toLowerCase()) {
            case 'error':
                this.error(message, enrichedContext);
                break;
            case 'warn':
                this.warn(message, enrichedContext);
                break;
            case 'debug':
                this.debug(message, enrichedContext);
                break;
            default:
                this.info(message, enrichedContext);
        }
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
