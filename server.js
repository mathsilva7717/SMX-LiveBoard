const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: './config.env' });

// Importar serviços com tratamento de erro
let SystemMetricsService, ProcessMonitoringService, ServiceMonitoringService, TerminalService;
let SSHService, LogsService, TelegramService;

try {
    // Serviços básicos
    SystemMetricsService = require('./backend/services/systemMetricsService');
    ProcessMonitoringService = require('./backend/services/processMonitoringService');
    ServiceMonitoringService = require('./backend/services/serviceMonitoringService');
    TerminalService = require('./backend/services/terminalService');
    
    // Serviços avançados
    SSHService = require('./backend/services/sshService');
    LogsService = require('./backend/services/logsService');
    TelegramService = require('./backend/services/telegramService');
} catch (error) {
    console.error('Erro ao carregar serviços:', error.message);
    process.exit(1);
}

class SMXLiveBoardServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.port = process.env.PORT || 3000;
        this.isProduction = process.env.NODE_ENV === 'production';
        
        // Controle de intervalos
        this.intervals = {
            metrics: null,
            processes: null,
            services: null
        };
        
        // Inicializar serviços com tratamento de erro
        try {
            // Serviços básicos
            this.systemMetrics = new SystemMetricsService();
            this.processMonitoring = new ProcessMonitoringService();
            this.serviceMonitoring = new ServiceMonitoringService();
            this.terminalService = new TerminalService();
            
            // Serviços avançados
            this.sshService = new SSHService();
            this.logsService = new LogsService();
            this.telegramService = new TelegramService();
            
            console.log('✅ Todos os serviços inicializados com sucesso');
        } catch (error) {
            console.error('❌ Erro ao inicializar serviços:', error.message);
            throw error;
        }
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketIO();
        this.startDataCollection();
    }

    setupMiddleware() {
        // Segurança
        this.app.use(helmet({
            contentSecurityPolicy: false // Desabilitado para desenvolvimento
        }));
        
        // Compressão
        this.app.use(compression());
        
        // Logs
        this.app.use(morgan(this.isProduction ? 'combined' : 'dev'));
        
        // CORS
        this.app.use(cors());
        
        // Parser JSON
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Arquivos estáticos
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.app.use('/assets', express.static(path.join(__dirname, 'assets')));
        this.app.use('/js', express.static(path.join(__dirname, 'js')));
        this.app.use('/styles', express.static(path.join(__dirname, 'styles')));
    }

    setupRoutes() {
        // Rota principal
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });

        // API Routes
        this.app.get('/api/system/info', async (req, res) => {
            try {
                const systemInfo = await this.systemMetrics.getSystemInfo();
                res.json(systemInfo);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/system/metrics', async (req, res) => {
            try {
                const metrics = await this.systemMetrics.getAllMetrics();
                res.json(metrics);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/processes', async (req, res) => {
            try {
                const processes = await this.processMonitoring.getTopProcesses();
                res.json(processes);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/services', (req, res) => {
            try {
                const services = this.serviceMonitoring.getAllServices();
                res.json(services);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/services', (req, res) => {
            try {
                const newService = this.serviceMonitoring.addService(req.body);
                res.json(newService);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        this.app.delete('/api/services/:id', (req, res) => {
            try {
                const result = this.serviceMonitoring.removeService(req.params.id);
                res.json(result);
            } catch (error) {
                res.status(404).json({ error: error.message });
            }
        });

        // Terminal API
        this.app.post('/api/terminal/execute', async (req, res) => {
            try {
                const { command } = req.body;
                
                // Validação de entrada
                if (!command || typeof command !== 'string') {
                    return res.status(400).json({ error: 'Comando é obrigatório' });
                }
                
                // Verificar se comando é seguro
                if (!this.terminalService.isCommandSafe(command)) {
                    return res.status(400).json({ error: 'Comando não permitido por segurança' });
                }
                
                const result = await this.terminalService.executeCommand(command);
                res.json(result);
            } catch (error) {
                console.error('Erro ao executar comando:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'OK', 
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage()
            });
        });

        // ===== ROTAS SSH =====
        this.app.post('/api/ssh/connect', async (req, res) => {
            try {
                const connectionConfig = req.body;
                
                this.sshService.validateConnectionConfig(connectionConfig);
                const result = await this.sshService.connect(connectionConfig);
                
                await this.logsService.info(`Conexão SSH estabelecida: ${connectionConfig.host}`, 'SSH', {
                    host: connectionConfig.host,
                    user: connectionConfig.username
                });

                res.json(result);
            } catch (error) {
                await this.logsService.error(`Erro na conexão SSH: ${error.message}`, 'SSH');
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/ssh/:connectionId/execute', async (req, res) => {
            try {
                const { connectionId } = req.params;
                const { command } = req.body;
                
                if (!command) {
                    return res.status(400).json({ error: 'Comando é obrigatório' });
                }

                const result = await this.sshService.executeCommand(connectionId, command);
                
                await this.logsService.info(`Comando SSH executado: ${command}`, 'SSH', {
                    connectionId,
                    exitCode: result.exitCode
                });

                res.json(result);
            } catch (error) {
                await this.logsService.error(`Erro ao executar comando SSH: ${error.message}`, 'SSH');
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/ssh/connections', (req, res) => {
            try {
                const connections = this.sshService.getActiveConnections();
                res.json(connections);
            } catch (error) {
                res.status(500).json({ error: 'Erro ao obter conexões' });
            }
        });

        this.app.delete('/api/ssh/:connectionId', (req, res) => {
            try {
                const { connectionId } = req.params;
                const result = this.sshService.disconnect(connectionId);
                
                if (result.success) {
                    this.logsService.info(`Conexão SSH desconectada: ${connectionId}`, 'SSH');
                }
                
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // ===== ROTAS DE LOGS =====
        this.app.get('/api/logs', async (req, res) => {
            try {
                const options = {
                    level: req.query.level,
                    source: req.query.source,
                    startDate: req.query.startDate,
                    endDate: req.query.endDate,
                    search: req.query.search,
                    limit: parseInt(req.query.limit) || 100,
                    offset: parseInt(req.query.offset) || 0
                };

                const result = this.logsService.getLogs(options);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Erro ao obter logs' });
            }
        });

        this.app.get('/api/logs/stats', (req, res) => {
            try {
                const stats = this.logsService.getLogStats();
                res.json(stats);
            } catch (error) {
                res.status(500).json({ error: 'Erro ao obter estatísticas' });
            }
        });

        this.app.post('/api/logs/clear', async (req, res) => {
            try {
                const { daysToKeep } = req.body;
                const result = await this.logsService.clearOldLogs(daysToKeep || 30);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Erro ao limpar logs' });
            }
        });

        // ===== ROTAS TELEGRAM =====
        this.app.post('/api/telegram/configure', (req, res) => {
            try {
                const { botToken, chatId } = req.body;
                
                if (!botToken || !chatId) {
                    return res.status(400).json({ error: 'Bot token e chat ID são obrigatórios' });
                }

                const result = this.telegramService.configure(botToken, chatId);
                
                this.logsService.info('Bot do Telegram configurado', 'TELEGRAM', {
                    chatId,
                    hasToken: !!botToken
                });

                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/telegram/send', async (req, res) => {
            try {
                const { message, options = {} } = req.body;
                
                if (!message) {
                    return res.status(400).json({ error: 'Mensagem é obrigatória' });
                }

                const result = await this.telegramService.sendMessage(message, options);
                
                this.logsService.info('Mensagem enviada via Telegram', 'TELEGRAM', {
                    messageLength: message.length,
                    hasOptions: Object.keys(options).length > 0
                });

                res.json(result);
            } catch (error) {
                this.logsService.error(`Erro ao enviar mensagem Telegram: ${error.message}`, 'TELEGRAM');
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/telegram/alert', async (req, res) => {
            try {
                const { alertType, data, severity = 'INFO' } = req.body;
                
                if (!alertType || !data) {
                    return res.status(400).json({ error: 'Tipo de alerta e dados são obrigatórios' });
                }

                const result = await this.telegramService.sendSystemAlert(alertType, data, severity);
                
                this.logsService.info(`Alerta enviado via Telegram: ${alertType}`, 'TELEGRAM', {
                    alertType,
                    severity
                });

                res.json(result);
            } catch (error) {
                this.logsService.error(`Erro ao enviar alerta Telegram: ${error.message}`, 'TELEGRAM');
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/telegram/test', async (req, res) => {
            try {
                const result = await this.telegramService.testConnection();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/telegram/status', (req, res) => {
            try {
                const isConfigured = this.telegramService.isBotConfigured();
                const history = this.telegramService.getMessageHistory(10);
                
                res.json({
                    configured: isConfigured,
                    recentMessages: history.length
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    setupSocketIO() {
        this.io.on('connection', (socket) => {
            console.log(`Cliente conectado: ${socket.id}`);

            // Enviar dados iniciais
            this.sendInitialData(socket);

            // Terminal interativo
            socket.on('terminal:command', async (data) => {
                try {
                    const result = await this.terminalService.executeCommand(data.command);
                    socket.emit('terminal:response', result);
                } catch (error) {
                    socket.emit('terminal:error', { error: error.message });
                }
            });

            // Adicionar serviço
            socket.on('service:add', (serviceData) => {
                try {
                    const service = this.serviceMonitoring.addService(serviceData);
                    this.io.emit('service:added', service);
                } catch (error) {
                    socket.emit('service:error', { error: error.message });
                }
            });

            // Remover serviço
            socket.on('service:remove', (serviceId) => {
                try {
                    this.serviceMonitoring.removeService(serviceId);
                    this.io.emit('service:removed', { id: serviceId });
                } catch (error) {
                    socket.emit('service:error', { error: error.message });
                }
            });

            // SSH events
            socket.on('ssh:connect', async (connectionConfig) => {
                try {
                    const result = await this.sshService.connect(connectionConfig);
                    socket.emit('ssh:connected', result);
                } catch (error) {
                    socket.emit('ssh:error', { error: error.message });
                }
            });

            socket.on('ssh:execute', async (data) => {
                try {
                    const { connectionId, command } = data;
                    const result = await this.sshService.executeCommand(connectionId, command);
                    socket.emit('ssh:response', result);
                } catch (error) {
                    socket.emit('ssh:error', { error: error.message });
                }
            });

            // Telegram events
            socket.on('telegram:configure', (config) => {
                try {
                    const result = this.telegramService.configure(config.botToken, config.chatId);
                    socket.emit('telegram:configured', result);
                } catch (error) {
                    socket.emit('telegram:error', { error: error.message });
                }
            });

            socket.on('telegram:send', async (data) => {
                try {
                    const result = await this.telegramService.sendMessage(data.message, data.options);
                    socket.emit('telegram:sent', result);
                } catch (error) {
                    socket.emit('telegram:error', { error: error.message });
                }
            });

            socket.on('disconnect', () => {
                console.log(`Cliente desconectado: ${socket.id}`);
            });
        });
    }

    async sendInitialData(socket) {
        try {
            // Coletar dados essenciais primeiro
            const systemInfo = await this.systemMetrics.getSystemInfo();
            
            // Coletar dados adicionais de forma assíncrona
            try {
                const [processes, services] = await Promise.all([
                    this.processMonitoring.getTopProcesses(),
                    Promise.resolve(this.serviceMonitoring.getAllServices())
                ]);
                
                socket.emit('initial:data', {
                    systemInfo,
                    processes,
                    services
                });
            } catch (error) {
                console.warn('Erro ao coletar dados adicionais:', error.message);
                // Enviar apenas dados essenciais
                socket.emit('initial:data', {
                    systemInfo,
                    processes: { processes: [], totalCpu: 0, totalMemory: 0, totalProcesses: 0 },
                    services: []
                });
            }
        } catch (error) {
            console.error('Erro ao enviar dados iniciais:', error.message);
            socket.emit('initial:error', { error: error.message });
        }
    }

    startDataCollection() {
        // Limpar intervalos existentes
        this.stopDataCollection();
        
        // Coletar métricas do sistema a cada 3 segundos
        this.intervals.metrics = setInterval(async () => {
            try {
                const metrics = await this.systemMetrics.getAllMetrics();
                this.io.emit('system:metrics', metrics);
            } catch (error) {
                console.error('Erro ao coletar métricas:', error);
            }
        }, 3000);

        // Coletar processos a cada 10 segundos
        this.intervals.processes = setInterval(async () => {
            try {
                const processes = await this.processMonitoring.getTopProcesses();
                this.io.emit('processes:update', processes);
            } catch (error) {
                console.error('Erro ao coletar processos:', error);
            }
        }, 10000);

        // Verificar serviços a cada 60 segundos
        this.intervals.services = setInterval(() => {
            try {
                const services = this.serviceMonitoring.getAllServices();
                this.io.emit('services:update', services);
            } catch (error) {
                console.error('Erro ao verificar serviços:', error);
            }
        }, 60000);
        
        console.log('✅ Coleta de dados iniciada');
    }
    
    stopDataCollection() {
        // Parar todos os intervalos
        Object.values(this.intervals).forEach(interval => {
            if (interval) {
                clearInterval(interval);
            }
        });
        
        // Resetar referências
        this.intervals = {
            metrics: null,
            processes: null,
            services: null
        };
        
        console.log('🛑 Coleta de dados parada');
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🚀 SMX LiveBoard rodando na porta ${this.port}`);
            console.log(`📊 Dashboard: http://localhost:${this.port}`);
            console.log(`🔧 API: http://localhost:${this.port}/api/health`);
            console.log(`⚡ Socket.IO: ws://localhost:${this.port}`);
            console.log(`📋 Serviços disponíveis:`);
            console.log(`   • Sistema: Métricas, Processos, Serviços`);
            console.log(`   • Terminal: Execução de comandos`);
            console.log(`   • SSH: Conexões remotas`);
            console.log(`   • Logs: Sistema de logs completo`);
            console.log(`   • Telegram: Alertas e notificações`);
        });
    }
}

// Inicializar servidor com tratamento de erro
let server;
try {
    server = new SMXLiveBoardServer();
    server.start();
} catch (error) {
    console.error('❌ Erro fatal ao inicializar servidor:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}

// Graceful shutdown
let isShuttingDown = false;

function gracefulShutdown(signal) {
    if (isShuttingDown) {
        console.log('🛑 Forçando encerramento...');
        process.exit(1);
        return;
    }
    
    isShuttingDown = true;
    console.log(`🛑 Recebido ${signal}, encerrando servidor...`);
    
    if (server) {
        try {
            // Parar coleta de dados
            server.stopDataCollection();
            
            // Fechar Socket.IO
            if (server.io) {
                server.io.close();
            }
            
            // Fechar servidor HTTP
            if (server.server) {
                server.server.close(() => {
                    console.log('✅ Servidor encerrado com sucesso');
                    process.exit(0);
                });
                
                // Timeout de segurança - forçar encerramento após 5 segundos
                setTimeout(() => {
                    console.log('⚠️ Timeout no encerramento - forçando saída');
                    process.exit(1);
                }, 5000);
            } else {
                process.exit(0);
            }
        } catch (error) {
            console.error('❌ Erro durante encerramento:', error.message);
            process.exit(1);
        }
    } else {
        process.exit(0);
    }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Tratar erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', reason);
    process.exit(1);
});
