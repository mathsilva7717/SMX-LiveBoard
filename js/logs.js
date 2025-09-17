// SMX LiveBoard - Sistema de Logs
class SMXLogs {
    constructor() {
        this.logs = [];
        this.filteredLogs = [];
        this.currentFilters = {
            level: 'all',
            source: 'all',
            search: '',
            dateFrom: '',
            dateTo: ''
        };
        this.isRealTime = false;
        this.autoRefresh = false;
        this.refreshInterval = null;
    }

    // Inicializar sistema de logs
    async init() {
        console.log('🔍 Inicializando sistema de logs...');
        await this.loadLogs();
        this.setupEventListeners();
        this.startAutoRefresh();
        
        // Tentar conectar com backend
        await this.connectToBackend();
    }

    // Carregar logs (integração com backend)
    async loadLogs() {
        try {
            // Tentar carregar logs do backend primeiro
            if (this.socket && this.socket.connected) {
                console.log('📋 Carregando logs do backend...');
                this.socket.emit('logs:request', {
                    limit: 200,
                    offset: 0
                });
                return;
            }
            
            // Fallback: carregar logs do localStorage
            const savedLogs = localStorage.getItem('smx-logs');
            
            if (savedLogs) {
                this.logs = JSON.parse(savedLogs);
                console.log(`📋 ${this.logs.length} logs carregados do localStorage`);
            } else {
                // Gerar logs de exemplo se não houver logs salvos
                this.generateSampleLogs();
                console.log(`📋 ${this.logs.length} logs de exemplo gerados`);
            }
            
            this.applyFilters();
        } catch (error) {
            console.error('❌ Erro ao carregar logs:', error);
            this.generateSampleLogs();
            this.applyFilters();
        }
    }

    // Gerar logs de exemplo
    generateSampleLogs() {
        const sources = ['SYSTEM', 'MONITOR', 'TERMINAL', 'NETWORK', 'DISK', 'CPU'];
        const levels = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'];
        const messages = [
            'Sistema inicializado com sucesso',
            'Monitoramento de CPU iniciado',
            'Terminal conectado',
            'Rede configurada',
            'Disco verificado',
            'Memória otimizada',
            'Processo finalizado',
            'Conexão estabelecida',
            'Dados sincronizados',
            'Cache limpo',
            'Erro de conexão detectado',
            'Falha na autenticação',
            'Sistema sobrecarregado',
            'Recurso não encontrado',
            'Timeout na operação',
            'Permissão negada',
            'Arquivo corrompido',
            'Serviço indisponível',
            'Falha crítica no sistema',
            'Backup realizado com sucesso'
        ];

        this.logs = [];
        const now = new Date();
        
        // Gerar 50 logs de exemplo
        for (let i = 0; i < 50; i++) {
            const timestamp = new Date(now.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000)); // Últimos 7 dias
            const level = levels[Math.floor(Math.random() * levels.length)];
            const source = sources[Math.floor(Math.random() * sources.length)];
            const message = messages[Math.floor(Math.random() * messages.length)];
            
            this.logs.push({
                id: `log-${i + 1}`,
                timestamp: timestamp.toISOString(),
                level: level,
                message: message,
                source: source,
                metadata: Math.random() > 0.7 ? {
                    pid: Math.floor(Math.random() * 10000),
                    user: 'system',
                    session: `session-${Math.floor(Math.random() * 1000)}`
                } : {},
                severity: this.getSeverityLevel(level)
            });
        }
        
        // Ordenar por timestamp (mais recentes primeiro)
        this.logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Salvar no localStorage
        this.saveLogs();
    }

    // Obter nível de severidade
    getSeverityLevel(level) {
        const levels = {
            'INFO': 0,
            'WARNING': 1,
            'ERROR': 2,
            'CRITICAL': 3
        };
        return levels[level] || 0;
    }

    // Salvar logs no localStorage
    saveLogs() {
        try {
            localStorage.setItem('smx-logs', JSON.stringify(this.logs));
        } catch (error) {
            console.warn('⚠️ Erro ao salvar logs no localStorage:', error);
        }
    }

    // Aplicar filtros aos logs
    applyFilters() {
        this.filteredLogs = this.logs.filter(log => {
            // Filtro por nível
            if (this.currentFilters.level !== 'all' && 
                log.level.toLowerCase() !== this.currentFilters.level) {
                return false;
            }

            // Filtro por fonte
            if (this.currentFilters.source !== 'all' && 
                log.source !== this.currentFilters.source) {
                return false;
            }

            // Filtro por texto
            if (this.currentFilters.search && 
                !log.message.toLowerCase().includes(this.currentFilters.search.toLowerCase())) {
                return false;
            }

            // Filtro por data
            if (this.currentFilters.dateFrom) {
                const logDate = new Date(log.timestamp);
                const fromDate = new Date(this.currentFilters.dateFrom);
                if (logDate < fromDate) return false;
            }

            if (this.currentFilters.dateTo) {
                const logDate = new Date(log.timestamp);
                const toDate = new Date(this.currentFilters.dateTo);
                toDate.setHours(23, 59, 59, 999); // Final do dia
                if (logDate > toDate) return false;
            }

            return true;
        });

        this.updateLogsDisplay();
    }

    // Atualizar exibição dos logs
    updateLogsDisplay() {
        const container = document.getElementById('logsContainer');
        if (!container) return;

        if (this.filteredLogs.length === 0) {
            container.innerHTML = `
                <div class="no-logs">
                    <p>Nenhum log encontrado com os filtros aplicados.</p>
                </div>
            `;
            return;
        }

        const logsHtml = this.filteredLogs.map(log => this.createLogEntry(log)).join('');
        container.innerHTML = logsHtml;

        // Rolar para o final
        container.scrollTop = container.scrollHeight;
    }

    // Criar entrada de log simples
    createLogEntry(log) {
        const timestamp = new Date(log.timestamp).toLocaleString('pt-BR');
        const levelClass = log.level.toLowerCase();
        const levelIcon = this.getLevelIcon(log.level);
        const categoryIcon = this.getCategoryIcon(log.source);
        
        return `
            <div class="log-entry log-${levelClass}" data-log-id="${log.id}">
                <span class="log-time">${timestamp}</span>
                <span class="log-level">
                    <span class="log-icon">${levelIcon}</span>
                    [${log.level}]
                </span>
                <span class="log-source">
                    <span class="source-icon">${categoryIcon}</span>
                    [${log.source}]
                </span>
                <span class="log-message">${this.escapeHtml(log.message)}</span>
                ${log.metadata && Object.keys(log.metadata).length > 0 ? 
                    `<span class="log-metadata" title="${this.escapeHtml(JSON.stringify(log.metadata, null, 2))}">📋</span>` : 
                    ''
                }
            </div>
        `;
    }

    // Obter ícone do nível de log
    getLevelIcon(level) {
        const icons = {
            'INFO': 'ℹ️',
            'WARNING': '⚠️',
            'ERROR': '❌',
            'CRITICAL': '🚨'
        };
        return icons[level] || '📝';
    }

    // Obter cor do nível de log
    getLevelColor(level) {
        const colors = {
            'INFO': 'linear-gradient(135deg, #00d4ff, #0099cc)',
            'WARNING': 'linear-gradient(135deg, #ffa500, #ff8c00)',
            'ERROR': 'linear-gradient(135deg, #ff6b6b, #ff4757)',
            'CRITICAL': 'linear-gradient(135deg, #dc2626, #b91c1c)'
        };
        return colors[level] || 'linear-gradient(135deg, #64748b, #475569)';
    }

    // Obter ícone da categoria
    getCategoryIcon(source) {
        const icons = {
            'SYSTEM': '🖥️',
            'MONITOR': '📊',
            'TERMINAL': '💻',
            'NETWORK': '🌐',
            'DISK': '💾',
            'CPU': '⚡',
            'MEMORY': '🧠',
            'SECURITY': '🔒',
            'BACKUP': '💿',
            'DATABASE': '🗄️',
            'API': '🔌',
            'AUTH': '🔐'
        };
        return icons[source] || '📋';
    }

    // Escapar HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Configurar event listeners
    setupEventListeners() {
        // Filtro por nível
        const levelFilter = document.getElementById('logLevelFilter');
        if (levelFilter) {
            levelFilter.addEventListener('change', (e) => {
                this.currentFilters.level = e.target.value;
                this.applyFilters();
            });
        }

        // Filtro por fonte
        const sourceFilter = document.getElementById('logSourceFilter');
        if (sourceFilter) {
            sourceFilter.addEventListener('change', (e) => {
                this.currentFilters.source = e.target.value;
                this.applyFilters();
            });
        }

        // Busca por texto
        const searchInput = document.getElementById('logSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
            });
        }

        // Filtro por data
        const dateFromInput = document.getElementById('logDateFrom');
        if (dateFromInput) {
            dateFromInput.addEventListener('change', (e) => {
                this.currentFilters.dateFrom = e.target.value;
                this.applyFilters();
            });
        }

        const dateToInput = document.getElementById('logDateTo');
        if (dateToInput) {
            dateToInput.addEventListener('change', (e) => {
                this.currentFilters.dateTo = e.target.value;
                this.applyFilters();
            });
        }

        // Botão de limpar filtros
        const clearFiltersBtn = document.getElementById('clearLogFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Botão de atualizar
        const refreshBtn = document.getElementById('refreshLogs');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadLogs();
            });
        }

        // Botão de tempo real
        const realTimeBtn = document.getElementById('toggleRealTime');
        if (realTimeBtn) {
            realTimeBtn.addEventListener('click', () => {
                this.toggleRealTime();
            });
        }

        // Botão de exportar
        const exportBtn = document.getElementById('exportLogs');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportLogs();
            });
        }

        // Botão de limpar logs
        const clearLogsBtn = document.getElementById('clearLogs');
        if (clearLogsBtn) {
            clearLogsBtn.addEventListener('click', () => {
                this.clearLogs();
            });
        }
    }

    // Limpar filtros
    clearFilters() {
        this.currentFilters = {
            level: 'all',
            source: 'all',
            search: '',
            dateFrom: '',
            dateTo: ''
        };

        // Resetar inputs
        const levelFilter = document.getElementById('logLevelFilter');
        const sourceFilter = document.getElementById('logSourceFilter');
        const searchInput = document.getElementById('logSearchInput');
        const dateFromInput = document.getElementById('logDateFrom');
        const dateToInput = document.getElementById('logDateTo');

        if (levelFilter) levelFilter.value = 'all';
        if (sourceFilter) sourceFilter.value = 'all';
        if (searchInput) searchInput.value = '';
        if (dateFromInput) dateFromInput.value = '';
        if (dateToInput) dateToInput.value = '';

        this.applyFilters();
    }

    // Alternar tempo real
    toggleRealTime() {
        this.isRealTime = !this.isRealTime;
        const btn = document.getElementById('toggleRealTime');
        
        if (btn) {
            btn.textContent = this.isRealTime ? '⏸️ Parar Tempo Real' : '▶️ Tempo Real';
            btn.className = this.isRealTime ? 'btn-warning' : 'btn-primary';
        }

        if (this.isRealTime) {
            this.startRealTimeMonitoring();
        } else {
            this.stopRealTimeMonitoring();
        }
    }

    // Iniciar monitoramento em tempo real
    startRealTimeMonitoring() {
        console.log('🔄 Iniciando monitoramento em tempo real...');
        
        if (this.socket && this.socket.connected) {
            // Usar backend para logs em tempo real
            this.socket.emit('logs:start_realtime');
        } else {
            // Fallback para simulação local
            this.startLogSimulation();
        }
    }

    // Parar monitoramento em tempo real
    stopRealTimeMonitoring() {
        console.log('⏸️ Parando monitoramento em tempo real...');
        this.stopLogSimulation();
    }

    // Iniciar auto-refresh
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            if (!this.isRealTime) {
                this.loadLogs();
            }
        }, 30000); // Atualizar a cada 30 segundos
    }

    // Parar auto-refresh
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // Exportar logs (frontend apenas)
    async exportLogs() {
        try {
            const logsToExport = this.filteredLogs.length > 0 ? this.filteredLogs : this.logs;
            const exportData = {
                exportedAt: new Date().toISOString(),
                totalLogs: logsToExport.length,
                filters: this.currentFilters,
                logs: logsToExport
            };
            
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `smx-logs-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            console.log(`📤 ${logsToExport.length} logs exportados com sucesso`);
        } catch (error) {
            console.error('❌ Erro ao exportar logs:', error);
        }
    }

    // Limpar logs (frontend apenas)
    async clearLogs() {
        if (!confirm('Tem certeza que deseja limpar todos os logs? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            this.logs = [];
            this.filteredLogs = [];
            localStorage.removeItem('smx-logs');
            this.applyFilters();
            console.log('🗑️ Logs limpos com sucesso');
        } catch (error) {
            console.error('❌ Erro ao limpar logs:', error);
        }
    }

    // Obter estatísticas dos logs (integração com backend)
    async getLogStats() {
        try {
            // Tentar obter estatísticas do backend primeiro
            if (this.socket && this.socket.connected) {
                return new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        resolve(this.calculateLocalStats());
                    }, 2000); // Timeout de 2 segundos
                    
                    this.socket.emit('logs:stats');
                    
                    // Listener temporário para resposta
                    const onStats = (stats) => {
                        clearTimeout(timeout);
                        this.socket.off('logs:stats', onStats);
                        resolve(stats);
                    };
                    
                    this.socket.on('logs:stats', onStats);
                });
            }
            
            // Fallback: calcular estatísticas localmente
            return this.calculateLocalStats();
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return this.calculateLocalStats();
        }
    }

    // Calcular estatísticas localmente
    calculateLocalStats() {
        const stats = {
            total: this.logs.length,
            byLevel: {
                INFO: 0,
                WARNING: 0,
                ERROR: 0,
                CRITICAL: 0
            },
            bySource: {},
            last24Hours: 0,
            last7Days: 0
        };

        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        this.logs.forEach(log => {
            // Contar por nível
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
            
            // Contar por fonte
            stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1;
            
            // Contar por período
            const logDate = new Date(log.timestamp);
            if (logDate >= last24Hours) {
                stats.last24Hours++;
            }
            if (logDate >= last7Days) {
                stats.last7Days++;
            }
        });

        return stats;
    }

    // Obter fontes únicas dos logs
    getUniqueSources() {
        const sources = [...new Set(this.logs.map(log => log.source))];
        return sources.sort();
    }

    // Adicionar novo log (frontend apenas)
    addLog(level, message, source = 'SYSTEM', metadata = {}) {
        const newLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            message: message,
            source: source,
            metadata: metadata,
            severity: this.getSeverityLevel(level.toUpperCase())
        };

        // Adicionar no início do array (logs mais recentes primeiro)
        this.logs.unshift(newLog);
        
        // Manter apenas os últimos 1000 logs
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(0, 1000);
        }

        // Salvar no localStorage
        this.saveLogs();
        
        // Aplicar filtros para atualizar a exibição
        this.applyFilters();
        
        // Atualizar estatísticas
        this.updateLogStats(this.calculateLocalStats());
        
        console.log(`📝 Novo log adicionado: [${level}] ${message}`);
        return newLog;
    }

    // Simular logs em tempo real
    startLogSimulation() {
        if (this.logSimulationInterval) {
            clearInterval(this.logSimulationInterval);
        }

        const messages = [
            'Sistema funcionando normalmente',
            'Verificação de integridade concluída',
            'Cache atualizado',
            'Conexão de rede estável',
            'Memória otimizada',
            'Processo em execução',
            'Dados sincronizados',
            'Serviço ativo',
            'Monitoramento ativo',
            'Sistema estável',
            'Backup automático iniciado',
            'Logs de segurança verificados',
            'Performance otimizada',
            'Conexão SSH estabelecida',
            'Arquivo de configuração carregado'
        ];

        const sources = ['SYSTEM', 'MONITOR', 'NETWORK', 'CPU', 'DISK', 'SECURITY', 'BACKUP', 'API'];
        const levels = ['INFO', 'WARNING'];

        this.logSimulationInterval = setInterval(() => {
            if (this.isRealTime) {
                const level = levels[Math.floor(Math.random() * levels.length)];
                const source = sources[Math.floor(Math.random() * sources.length)];
                const message = messages[Math.floor(Math.random() * messages.length)];
                
                this.addLog(level, message, source);
            }
        }, 3000); // Novo log a cada 3 segundos
    }

    // Integrar com backend (quando disponível)
    async connectToBackend() {
        try {
            // Tentar conectar com WebSocket do backend
            if (window.io) {
                this.socket = window.io();
                
                // Eventos de logs do backend
                this.socket.on('logs:data', (data) => {
                    console.log('📋 Logs recebidos do backend:', data.logs.length);
                    this.logs = data.logs || [];
                    this.applyFilters();
                    // Atualizar estatísticas após carregar logs
                    this.updateLogStats(this.calculateLocalStats());
                });
                
                this.socket.on('logs:stats', (stats) => {
                    console.log('📊 Estatísticas de logs recebidas:', stats);
                    this.updateLogStats(stats);
                });
                
                this.socket.on('logs:realtime_started', (data) => {
                    console.log('🔄 Monitoramento em tempo real iniciado:', data.message);
                });
                
                this.socket.on('logs:error', (error) => {
                    console.error('❌ Erro nos logs:', error.error);
                });
                
                // Log individual em tempo real
                this.socket.on('log', (logData) => {
                    this.addLog(logData.level, logData.message, logData.source, logData.metadata);
                });
                
                this.socket.on('connect', () => {
                    console.log('🔌 Conectado ao backend para logs em tempo real');
                    // Carregar logs iniciais quando conectar
                    this.loadLogs();
                });
                
                this.socket.on('disconnect', () => {
                    console.log('🔌 Desconectado do backend');
                });
            }
        } catch (error) {
            console.warn('⚠️ Backend não disponível, usando simulação local');
        }
    }

    // Parar simulação de logs
    stopLogSimulation() {
        if (this.logSimulationInterval) {
            clearInterval(this.logSimulationInterval);
            this.logSimulationInterval = null;
        }
    }

    // Atualizar estatísticas de logs
    updateLogStats(stats) {
        // Atualizar interface com estatísticas se necessário
        console.log('📊 Estatísticas atualizadas:', stats);
        
        // Atualizar elemento de estatísticas se existir
        const statsElement = document.getElementById('logsCount');
        if (statsElement && stats) {
            statsElement.innerHTML = `
                Total: ${stats.total} | 
                Info: ${stats.byLevel.INFO || 0} | 
                Warning: ${stats.byLevel.WARNING || 0} | 
                Error: ${stats.byLevel.ERROR || 0} | 
                Critical: ${stats.byLevel.CRITICAL || 0}
            `;
        }
    }

    // Destruir instância
    destroy() {
        this.stopAutoRefresh();
        this.stopRealTimeMonitoring();
        this.stopLogSimulation();
    }
}

// Instância global
window.smxLogs = new SMXLogs();
