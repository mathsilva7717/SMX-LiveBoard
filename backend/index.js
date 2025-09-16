// SMX LiveBoard - Servidor Completo
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });

// Importar serviços
let SystemMetricsService, ProcessMonitoringService, ServiceMonitoringService, TerminalService;
let SSHService, LogsService, TelegramService;

try {
    SystemMetricsService = require('./services/systemMetricsService');
    ProcessMonitoringService = require('./services/processMonitoringService');
    ServiceMonitoringService = require('./services/serviceMonitoringService');
    TerminalService = require('./services/terminalService');
    SSHService = require('./services/sshService');
    LogsService = require('./services/logsService');
    TelegramService = require('./services/telegramService');
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
                methods: ["GET", "POST"],
                credentials: true
            },
            // Configurações para evitar desconexões
            pingTimeout: 60000,        // 60 segundos
            pingInterval: 25000,       // 25 segundos
            upgradeTimeout: 10000,     // 10 segundos
            allowEIO3: true,           // Compatibilidade
            transports: ['websocket', 'polling'], // WebSocket primeiro
            // Configurações de heartbeat
            heartbeatTimeout: 60000,
            heartbeatInterval: 25000
        });
        
        this.port = process.env.PORT || 3000;
        this.isProduction = process.env.NODE_ENV === 'production';
        
        this.intervals = { metrics: null, processes: null, services: null, historical: null };
        
        // Dados históricos
        this.historicalData = {
            cpu: [],
            memory: [],
            network: { download: [], upload: [] },
            disk: []
        };
        
        // Inicializar serviços
        try {
            this.systemMetrics = new SystemMetricsService();
            this.processMonitoring = new ProcessMonitoringService();
            this.serviceMonitoring = new ServiceMonitoringService();
            this.terminalService = new TerminalService();
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
        this.app.use(helmet({ contentSecurityPolicy: false }));
        this.app.use(compression());
        this.app.use(morgan(this.isProduction ? 'combined' : 'dev'));
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Arquivos estáticos (servir da pasta pai)
        this.app.use(express.static(path.join(__dirname, '..')));
        this.app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
        this.app.use('/js', express.static(path.join(__dirname, '..', 'js')));
        this.app.use('/styles', express.static(path.join(__dirname, '..', 'styles')));
    }

    setupRoutes() {
        // Rota principal
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'index.html'));
        });

        // APIs básicas
        this.app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'OK', 
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage()
            });
        });

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
                if (!command || typeof command !== 'string') {
                    return res.status(400).json({ error: 'Comando é obrigatório' });
                }
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
    }

    setupSocketIO() {
        this.io.on('connection', (socket) => {
            // Enviar dados iniciais
            this.sendInitialData(socket);
            
            // Enviar dados históricos se disponíveis
            if (this.historicalData.cpu.length > 0) {
                socket.emit('historical:data', this.historicalData);
            }

            // Evento de ping/pong para monitoramento
            socket.on('ping', () => {
                socket.emit('pong', { timestamp: Date.now() });
            });

            // Terminal interativo
            socket.on('terminal:command', async (data) => {
                try {
                    const result = await this.terminalService.executeCommand(data.command);
                    socket.emit('terminal:response', result);
                } catch (error) {
                    console.error(`❌ Terminal error for ${socket.id}:`, error.message);
                    socket.emit('terminal:error', { error: error.message });
                }
            });

            // Gerenciamento de serviços
            socket.on('service:add', (serviceData) => {
                try {
                    const service = this.serviceMonitoring.addService(serviceData);
                    this.io.emit('service:added', service);
                } catch (error) {
                    console.error(`❌ Service add error for ${socket.id}:`, error.message);
                    socket.emit('service:error', { error: error.message });
                }
            });

            socket.on('service:remove', (serviceId) => {
                try {
                    this.serviceMonitoring.removeService(serviceId);
                    this.io.emit('service:removed', { id: serviceId });
                } catch (error) {
                    console.error(`❌ Service remove error for ${socket.id}:`, error.message);
                    socket.emit('service:error', { error: error.message });
                }
            });

            // Tratamento de erros de conexão
            socket.on('error', (error) => {
                console.error(`❌ Socket error for ${socket.id}:`, error.message);
            });

            // Eventos de desconexão
            socket.on('disconnect', (reason) => {
                // Log removido para limpar terminal
            });

            // Evento de reconexão
            socket.on('reconnect', (attemptNumber) => {
                // Log removido para limpar terminal
            });
        });

        // Log de eventos do servidor Socket.IO
        this.io.engine.on('connection_error', (err) => {
            console.error('❌ Erro de conexão Socket.IO:', err.message);
        });
    }

    async sendInitialData(socket) {
        try {
            // Coletar dados essenciais primeiro
            const systemInfo = await this.systemMetrics.getSystemInfo();
            
            // Coletar dados adicionais de forma assíncrona com timeout
            const [processes, services] = await Promise.allSettled([
                this.processMonitoring.getTopProcesses(),
                Promise.resolve(this.serviceMonitoring.getAllServices())
            ]);
            
            const initialData = {
                systemInfo,
                processes: processes.status === 'fulfilled' ? processes.value : { processes: [], totalCpu: 0, totalMemory: 0, totalProcesses: 0 },
                services: services.status === 'fulfilled' ? services.value : []
            };
            
            socket.emit('initial:data', initialData);
            
        } catch (error) {
            console.error(`❌ Erro ao enviar dados iniciais para ${socket.id}:`, error.message);
            socket.emit('initial:error', { 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    startDataCollection() {
        this.stopDataCollection();
        
        // Coletar métricas do sistema a cada 5 segundos (reduzido para evitar sobrecarga)
        this.intervals.metrics = setInterval(async () => {
            try {
                const metrics = await this.systemMetrics.getAllMetrics();
                // Verificar se há clientes conectados antes de enviar
                if (this.io.engine.clientsCount > 0) {
                    this.io.emit('system:metrics', metrics);
                }
            } catch (error) {
                console.error('❌ Erro ao coletar métricas:', error.message);
                // Não parar o intervalo por causa de um erro
            }
        }, 5000);

        // Coletar dados históricos a cada 30 segundos
        this.intervals.historical = setInterval(async () => {
            try {
                await this.collectHistoricalData();
            } catch (error) {
                console.error('❌ Erro ao coletar dados históricos:', error.message);
            }
        }, 30000);

        // Coletar processos a cada 15 segundos (reduzido para evitar sobrecarga)
        this.intervals.processes = setInterval(async () => {
            try {
                const processes = await this.processMonitoring.getTopProcesses();
                // Verificar se há clientes conectados antes de enviar
                if (this.io.engine.clientsCount > 0) {
                    this.io.emit('processes:update', processes);
                }
            } catch (error) {
                console.error('❌ Erro ao coletar processos:', error.message);
                // Não parar o intervalo por causa de um erro
            }
        }, 15000);

        // Verificar serviços a cada 60 segundos
        this.intervals.services = setInterval(() => {
            try {
                const services = this.serviceMonitoring.getAllServices();
                // Verificar se há clientes conectados antes de enviar
                if (this.io.engine.clientsCount > 0) {
                    this.io.emit('services:update', services);
                }
            } catch (error) {
                console.error('❌ Erro ao verificar serviços:', error.message);
                // Não parar o intervalo por causa de um erro
            }
        }, 60000);
        
        // Coleta de dados iniciada
    }
    
    async collectHistoricalData() {
        try {
            const metrics = await this.systemMetrics.getAllMetrics();
            const timestamp = Date.now();
            
            // Adicionar dados de CPU
            this.historicalData.cpu.push({
                timestamp,
                value: metrics.cpu?.usage || 0
            });
            
            // Adicionar dados de Memória
            this.historicalData.memory.push({
                timestamp,
                value: metrics.memory?.usage || 0
            });
            
            // Adicionar dados de Rede (velocidades em MB/s)
            this.historicalData.network.download.push({
                timestamp,
                value: (metrics.network?.downloadSpeed || 0) / 1024 / 1024 // Converter para MB/s
            });
            
            this.historicalData.network.upload.push({
                timestamp,
                value: (metrics.network?.uploadSpeed || 0) / 1024 / 1024 // Converter para MB/s
            });
            
            // Adicionar dados de Disco
            this.historicalData.disk.push({
                timestamp,
                value: metrics.disk?.usage || 0
            });
            
            // Manter apenas últimos 288 pontos (24h com coleta a cada 30s)
            const maxPoints = 288;
            Object.keys(this.historicalData).forEach(key => {
                if (key === 'network') {
                    this.historicalData.network.download = this.historicalData.network.download.slice(-maxPoints);
                    this.historicalData.network.upload = this.historicalData.network.upload.slice(-maxPoints);
                } else {
                    this.historicalData[key] = this.historicalData[key].slice(-maxPoints);
                }
            });
            
            // Enviar dados históricos para clientes conectados
            if (this.io.engine.clientsCount > 0) {
                this.io.emit('historical:data', this.historicalData);
            }
            
        } catch (error) {
            console.error('❌ Erro ao coletar dados históricos:', error.message);
        }
    }
    
    stopDataCollection() {
        Object.values(this.intervals).forEach(interval => {
            if (interval) clearInterval(interval);
        });
        this.intervals = { metrics: null, processes: null, services: null, historical: null };
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

// Inicializar servidor
let server;
try {
    server = new SMXLiveBoardServer();
    server.start();
} catch (error) {
    console.error('❌ Erro fatal ao inicializar servidor:', error.message);
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
                
                // Timeout de segurança - forçar encerramento após 3 segundos
                setTimeout(() => {
                    console.log('⚠️ Timeout no encerramento - forçando saída');
                    process.exit(1);
                }, 3000);
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