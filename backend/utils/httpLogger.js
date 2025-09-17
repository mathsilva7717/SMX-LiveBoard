// Middleware de Logging HTTP Personalizado - SMX LiveBoard
const logger = require('./logger');

class HttpLogger {
    constructor() {
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
            white: '\x1b[37m'
        };
        
        this.statusColors = {
            1: this.colors.cyan,    // 1xx - Informational
            2: this.colors.green,   // 2xx - Success
            3: this.colors.yellow,  // 3xx - Redirection
            4: this.colors.red,     // 4xx - Client Error
            5: this.colors.magenta  // 5xx - Server Error
        };
        
        this.methodColors = {
            GET: this.colors.blue,
            POST: this.colors.green,
            PUT: this.colors.yellow,
            DELETE: this.colors.red,
            PATCH: this.colors.magenta,
            OPTIONS: this.colors.cyan
        };
        
        // Cache para evitar logs duplicados
        this.requestCache = new Map();
        this.cacheTimeout = 5000; // 5 segundos
    }

    // Middleware principal
    middleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            const requestId = this.generateRequestId();
            
            // Adicionar ID da requisição ao objeto req
            req.requestId = requestId;
            
            // Interceptar o método end da resposta
            const originalEnd = res.end;
            res.end = (chunk, encoding) => {
                const duration = Date.now() - startTime;
                const responseSize = this.getResponseSize(res, chunk);
                
                // Log da requisição
                this.logRequest(req, res, duration, responseSize, requestId);
                
                // Chamar o método original
                originalEnd.call(res, chunk, encoding);
            };
            
            next();
        };
    }

    // Gerar ID único para requisição
    generateRequestId() {
        return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    // Obter tamanho da resposta
    getResponseSize(res, chunk) {
        const contentLength = res.getHeader('content-length');
        if (contentLength) {
            return parseInt(contentLength);
        }
        if (chunk) {
            return Buffer.byteLength(chunk, encoding);
        }
        return 0;
    }

    // Log da requisição
    logRequest(req, res, duration, responseSize, requestId) {
        const method = req.method;
        const url = req.url;
        const status = res.statusCode;
        const userAgent = req.get('User-Agent') || 'Unknown';
        const ip = this.getClientIP(req);
        
        // Verificar se deve logar esta requisição
        if (!this.shouldLogRequest(req, res, duration)) {
            return;
        }
        
        // Formatar informações da requisição
        const logData = {
            requestId,
            method,
            url,
            status,
            duration: `${duration}ms`,
            size: this.formatBytes(responseSize),
            ip,
            userAgent: this.shortenUserAgent(userAgent),
            timestamp: new Date().toISOString()
        };
        
        // Determinar nível de log baseado no status
        const logLevel = this.getLogLevel(status, duration);
        
        // Formatar mensagem
        const message = this.formatLogMessage(logData);
        
        // Log baseado no nível
        switch (logLevel) {
            case 'error':
                logger.error(message, logData);
                break;
            case 'warn':
                logger.warn(message, logData);
                break;
            default:
                logger.info(message, logData);
        }
        
        // Log adicional para requisições lentas
        if (duration > 10000) { // Mais de 10 segundos
            logger.warn(`🐌 Requisição lenta detectada: ${method} ${url} - ${duration}ms`, {
                ...logData,
                type: 'slow_request'
            });
        }
        
        // Log adicional para erros
        if (status >= 400) {
            logger.error(`❌ Erro HTTP: ${method} ${url} - ${status}`, {
                ...logData,
                type: 'http_error'
            });
        }
    }

    // Verificar se deve logar a requisição
    shouldLogRequest(req, res, duration) {
        const url = req.url;
        const method = req.method;
        const status = res.statusCode;
        
        // Não logar requisições de health check muito frequentes
        if (url === '/api/health' && status === 200 && duration < 100) {
            return false;
        }
        
        // Não logar requisições de favicon
        if (url.includes('favicon.ico')) {
            return false;
        }
        
        // Não logar requisições de assets estáticos com cache hit
        if (this.isStaticAsset(url) && status === 304) {
            return false;
        }
        
        // Logar sempre requisições com erro
        if (status >= 400) {
            return true;
        }
        
        // Logar sempre requisições lentas
        if (duration > 5000) {
            return true;
        }
        
        // Logar requisições importantes
        if (this.isImportantRequest(url, method)) {
            return true;
        }
        
        // Para outras requisições, usar cache para evitar spam
        const cacheKey = `${method}:${url}:${status}`;
        const now = Date.now();
        
        if (this.requestCache.has(cacheKey)) {
            const lastLog = this.requestCache.get(cacheKey);
            if (now - lastLog < this.cacheTimeout) {
                return false; // Não logar se foi logado recentemente
            }
        }
        
        this.requestCache.set(cacheKey, now);
        return true;
    }

    // Verificar se é um asset estático
    isStaticAsset(url) {
        const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2'];
        return staticExtensions.some(ext => url.includes(ext));
    }

    // Verificar se é uma requisição importante
    isImportantRequest(url, method) {
        const importantPaths = [
            '/api/system/metrics',
            '/api/processes',
            '/api/logs',
            '/api/telegram',
            '/api/ssh',
            '/api/terminal'
        ];
        
        return importantPaths.some(path => url.startsWith(path)) || method !== 'GET';
    }

    // Determinar nível de log
    getLogLevel(status, duration) {
        if (status >= 500) return 'error';
        if (status >= 400) return 'warn';
        if (duration > 10000) return 'warn';
        return 'info';
    }

    // Formatar mensagem de log
    formatLogMessage(data) {
        const { method, url, status, duration, size, ip } = data;
        
        // Emojis baseados no método
        const methodEmoji = {
            GET: '📥',
            POST: '📤',
            PUT: '🔄',
            DELETE: '🗑️',
            PATCH: '🔧',
            OPTIONS: '❓'
        };
        
        // Emojis baseados no status
        const statusEmoji = {
            200: '✅',
            201: '✅',
            204: '✅',
            301: '↩️',
            302: '↩️',
            304: '💾',
            400: '❌',
            401: '🔒',
            403: '🚫',
            404: '🔍',
            500: '💥',
            502: '🔌',
            503: '⏳'
        };
        
        const methodIcon = methodEmoji[method] || '📋';
        const statusIcon = statusEmoji[status] || '❓';
        
        // Formatar URL (truncar se muito longa)
        const displayUrl = url.length > 50 ? url.substring(0, 47) + '...' : url;
        
        return `${methodIcon} ${method} ${displayUrl} ${statusIcon} ${status} ${duration} ${size} (${ip})`;
    }

    // Formatar bytes
    formatBytes(bytes) {
        if (bytes === 0) return '0B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
    }

    // Obter IP do cliente
    getClientIP(req) {
        return req.ip || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               '127.0.0.1';
    }

    // Encurtar User Agent
    shortenUserAgent(userAgent) {
        if (!userAgent || userAgent === 'Unknown') return 'Unknown';
        
        // Extrair navegador principal
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        if (userAgent.includes('Opera')) return 'Opera';
        
        // Se for muito longo, truncar
        if (userAgent.length > 30) {
            return userAgent.substring(0, 27) + '...';
        }
        
        return userAgent;
    }

    // Limpar cache periodicamente
    startCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, timestamp] of this.requestCache.entries()) {
                if (now - timestamp > this.cacheTimeout * 2) {
                    this.requestCache.delete(key);
                }
            }
        }, 60000); // Limpar a cada minuto
    }

    // Obter estatísticas de requisições
    getRequestStats() {
        return {
            cacheSize: this.requestCache.size,
            cacheTimeout: this.cacheTimeout
        };
    }
}

module.exports = HttpLogger;
