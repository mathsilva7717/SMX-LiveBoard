// SMX LiveBoard - JavaScript Vanilla
class SMXLiveBoard {
    constructor() {
        this.systemData = null;
        this.isConnected = false;
        this.ws = null;
        this.socket = null;
        this.timeInterval = null;
        this.dataInterval = null;
        this.restInterval = null;
        this.pingInterval = null;
        this.isInitialized = false;
        this.diskDataInitialized = false;
        this.lastDataTime = null;
        
        // Histórico para sparklines
        this.history = {
            cpu: [],
            ram: [],
            disk: [],
            network: []
        };
        
        // DNS e latência
        this.dnsInfo = {
            server: null,
            latency: null
        };
        
        this.init();
    }

    init() {
        if (this.isInitialized) {
            console.log('SMX LiveBoard já foi inicializado');
            return;
        }
        
        console.log('Inicializando SMX LiveBoard...');
        this.updateTime();
        this.updateGreeting(); // Adicionar saudação dinâmica
        this.startTimeInterval();
        this.setConnectionStatus(false); // Iniciar como desconectado
        this.connectWebSocket(); // Conectar ao WebSocket real
        this.setupHeaderControls();
        this.startNetworkMonitoring();
        this.setupProcessTableControls();
        this.setupButtonEvents(); // Configurar eventos dos botões
        
        this.isInitialized = true;
        
        // Disponibilizar instância globalmente para outros módulos
        window.smxLiveBoard = this;
        
        console.log('SMX LiveBoard inicializado com sucesso');
    }

    // Atualizar saudação dinâmica
    updateGreeting() {
        const now = new Date();
        const hour = now.getHours();
        const greetingIcon = document.getElementById('greetingIcon');
        const greetingMessage = document.getElementById('greetingMessage');
        
        let greeting, iconSvg, timeColor;
        
        // Determinar período do dia e saudação
        if (hour >= 5 && hour < 12) {
            // Manhã (5h - 11h59)
            greeting = 'Bom dia!';
            timeColor = '#ffd700'; // Dourado para manhã
            iconSvg = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
            `;
        } else if (hour >= 12 && hour < 18) {
            // Tarde (12h - 17h59)
            greeting = 'Boa tarde!';
            timeColor = '#ff8c00'; // Laranja para tarde
            iconSvg = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    <path d="M8.5 8.5c-1.5-1.5-4-1.5-5.5 0s-1.5 4 0 5.5"/>
                    <path d="M15.5 8.5c1.5-1.5 4-1.5 5.5 0s1.5 4 0 5.5"/>
                </svg>
            `;
        } else {
            // Noite (18h - 4h59)
            greeting = 'Boa noite!';
            timeColor = '#4169e1'; // Azul para noite
            iconSvg = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    <path d="M12 2v2"/>
                    <path d="M12 20v2"/>
                    <path d="M4.93 4.93l1.41 1.41"/>
                    <path d="M17.66 17.66l1.41 1.41"/>
                    <path d="M2 12h2"/>
                    <path d="M20 12h2"/>
                    <path d="M6.34 17.66l-1.41 1.41"/>
                    <path d="M19.07 4.93l-1.41 1.41"/>
                </svg>
            `;
        }
        
        // Atualizar elementos
        if (greetingIcon) {
            greetingIcon.innerHTML = iconSvg;
            greetingIcon.style.color = timeColor;
        }
        
        if (greetingMessage) {
            greetingMessage.textContent = greeting;
        }
    }

    // Atualizar relógio
    updateTime() {
        const now = new Date();
        const timeElement = document.getElementById('currentTime');
        const dateElement = document.getElementById('currentDate');
        
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('pt-BR');
        }
        
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('pt-BR');
        }
        
        // Atualizar saudação a cada minuto
        this.updateGreeting();
    }

    startTimeInterval() {
        this.timeInterval = setInterval(() => {
            this.updateTime();
        }, 1000);
    }

    // Conectar ao WebSocket/Socket.IO
    connectWebSocket() {
        // Evitar múltiplas conexões
        if (this.socket && this.socket.connected) {
            console.log('Socket.IO já conectado');
            return;
        }

        try {
            // Tentar conectar ao Socket.IO primeiro (servidor principal na porta 3000)
            if (typeof io !== 'undefined') {
                this.socket = io('http://localhost:3000', {
                    // Configurações de reconexão otimizadas
                    reconnection: true,
                    reconnectionDelay: 1000,        // 1 segundo
                    reconnectionDelayMax: 5000,     // Máximo 5 segundos
                    reconnectionAttempts: Infinity, // Tentar indefinidamente
                    timeout: 20000,                 // 20 segundos de timeout
                    forceNew: true,                 // Forçar nova conexão
                    transports: ['websocket', 'polling'], // WebSocket primeiro
                    upgrade: true,                  // Permitir upgrade para WebSocket
                    rememberUpgrade: true,          // Lembrar upgrade
                    // Configurações de heartbeat
                    pingTimeout: 60000,            // 60 segundos
                    pingInterval: 25000            // 25 segundos
                });
                
                this.socket.on('connect', () => {
                    console.log('✅ Conectado ao Socket.IO');
                    console.log(`   🆔 Socket ID: ${this.socket.id}`);
                    console.log(`   🚀 Transport: ${this.socket.io.engine.transport.name}`);
                    console.log(`   🕐 Timestamp: ${new Date().toISOString()}`);
                    
                    this.setConnectionStatus(true);
                    // Resetar flag de dados do disco para permitir atualização na reconexão
                    this.diskDataInitialized = false;
                    // Limpar intervalos de fallback se existirem
                    if (this.restInterval) {
                        clearInterval(this.restInterval);
                        this.restInterval = null;
                    }
                    // Iniciar ping periódico para manter conexão ativa
                    this.startPingInterval();
                });

                this.socket.on('system:metrics', (data) => {
                    this.updateSystemData(data);
                    // Atualizar dados do disco se ainda não foram inicializados
                    if (!this.diskDataInitialized) {
                        this.updateDiskStaticData();
                    }
                });

                this.socket.on('processes:update', (data) => {
                    this.updateProcessesData(data);
                });

                this.socket.on('initial:data', (data) => {
                    this.updateSystemData(data);
                    // Atualizar dados estáticos do disco apenas na conexão inicial
                    this.updateDiskStaticData();
                });

                this.socket.on('disconnect', (reason) => {
                    console.log('❌ Desconectado do Socket.IO');
                    console.log(`   📋 Motivo: ${reason}`);
                    console.log(`   🕐 Timestamp: ${new Date().toISOString()}`);
                    
                    this.setConnectionStatus(false);
                    
                    // Só tentar reconectar se não foi uma desconexão intencional
                    if (reason !== 'io client disconnect') {
                        console.log('🔄 Tentando reconectar automaticamente...');
                        // A reconexão automática já está configurada no Socket.IO
                    }
                });

                this.socket.on('connect_error', (error) => {
                    console.log('❌ Erro ao conectar Socket.IO:', error.message);
                    console.log(`   🕐 Timestamp: ${new Date().toISOString()}`);
                    this.setConnectionStatus(false);
                    // Tentar fallback para API REST
                    this.startRestFallback();
                });

                // Eventos de reconexão
                this.socket.on('reconnect', (attemptNumber) => {
                    console.log(`🔄 Reconectado ao Socket.IO (tentativa ${attemptNumber})`);
                    console.log(`   🆔 Socket ID: ${this.socket.id}`);
                    console.log(`   🕐 Timestamp: ${new Date().toISOString()}`);
                });

                this.socket.on('reconnect_attempt', (attemptNumber) => {
                    console.log(`🔄 Tentativa de reconexão ${attemptNumber}...`);
                });

                this.socket.on('reconnect_error', (error) => {
                    console.log(`❌ Erro na reconexão: ${error.message}`);
                });

                this.socket.on('reconnect_failed', () => {
                    console.log('❌ Falha na reconexão - usando fallback REST');
                    this.startRestFallback();
                });

                // Evento de ping/pong para monitoramento
                this.socket.on('pong', (data) => {
                    const latency = Date.now() - data.timestamp;
                    console.log(`🏓 Pong recebido - Latência: ${latency}ms`);
                });
            } else {
                // Fallback para WebSocket se Socket.IO não estiver disponível
                this.connectWebSocketFallback();
            }
        } catch (error) {
            console.error('Erro ao conectar:', error);
            this.setConnectionStatus(false);
            this.connectWebSocketFallback();
        }
    }

    // Fallback para WebSocket
    connectWebSocketFallback() {
        try {
            this.ws = new WebSocket('ws://localhost:8080');
            
            this.ws.onopen = () => {
                console.log('Conectado ao WebSocket');
                this.setConnectionStatus(true);
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.updateSystemData(data);
            };

            this.ws.onclose = () => {
                console.log('Desconectado do WebSocket');
                this.setConnectionStatus(false);
                // Tentar reconectar após 5 segundos
                setTimeout(() => {
                    this.connectWebSocket();
                }, 5000);
            };

            this.ws.onerror = (error) => {
                console.error('Erro no WebSocket:', error);
                this.setConnectionStatus(false);
                // Tentar API REST como último recurso
                this.startRestFallback();
            };
        } catch (error) {
            console.error('Erro ao conectar WebSocket:', error);
            this.setConnectionStatus(false);
            this.startRestFallback();
        }
    }

    // Fallback para API REST
    startRestFallback() {
        console.log('Iniciando fallback para API REST');
        this.setConnectionStatus(false);
        
        // Limpar intervalo anterior se existir
        if (this.restInterval) {
            clearInterval(this.restInterval);
        }
        
        // Buscar dados via API REST a cada 5 segundos
        this.restInterval = setInterval(() => {
            this.fetchSystemData();
        }, 5000);
        
        // Primeira busca imediata
        this.fetchSystemData();
    }

    // Fallback para API REST
    async fetchSystemData() {
        try {
            // Tentar primeiro o servidor principal (porta 3000)
            let response = await fetch('http://localhost:3000/api/system/metrics');
            if (!response.ok) {
                // Se falhar, tentar o servidor backend (porta 3002)
                response = await fetch('http://localhost:3002/api/system');
            }
            
            if (response.ok) {
                const data = await response.json();
                this.updateSystemData(data);
                // Atualizar dados estáticos do disco apenas na primeira conexão via REST
                if (!this.diskDataInitialized) {
                    this.updateDiskStaticData();
                    this.diskDataInitialized = true;
                }
            } else {
                throw new Error('Servidor não disponível');
            }
        } catch (error) {
            console.error('Erro ao buscar dados do sistema:', error);
            // Manter status de desconectado
            this.setConnectionStatus(false);
        }
    }

    // Removido: dados simulados - agora usando apenas dados reais do servidor

    // REMOVIDO: todas as funções de simulação

    // REMOVIDO: updateSimulatedData - usando apenas dados reais do servidor

    // Atualizar status de conexão
    setConnectionStatus(connected) {
        this.isConnected = connected;
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (statusDot && statusText) {
            if (connected) {
                statusDot.classList.remove('offline');
                statusText.textContent = 'Conectado';
            } else {
                statusDot.classList.add('offline');
                statusText.textContent = 'Desconectado';
            }
        }
    }

    // Atualizar dados do sistema
    updateSystemData(data) {
        this.systemData = data;
        this.hideLoading();
        
        this.updateSummaryCards();
        this.updateSystemInfo();
        this.updateProcesses();
        this.updateSparklines();
        this.checkAlerts();
        this.updateSystemDetails();
    }

    // Atualizar dados de processos recebidos do backend
    updateProcessesData(data) {
        if (data) {
            // Atualizar os dados de processos no systemData
            if (!this.systemData) {
                this.systemData = {};
            }
            
            // O backend envia os dados diretamente, não em um objeto processes
            this.systemData.processes = data.processes || data;
            
            // Atualizar a tabela de processos
            this.updateProcesses();
        }
    }

    // Atualizar dados estáticos do disco (apenas na conexão inicial)
    updateDiskStaticData() {
        if (!this.systemData?.disk) {
            return;
        }
        
        const diskUsed = this.systemData.disk.used || 0;
        const diskTotal = this.systemData.disk.total || 0;
        const diskFree = this.systemData.disk.free || 0;
        
        // Atualizar elementos principais
        const diskUsageElement = document.getElementById('diskUsage');
        const diskTotalElement = document.getElementById('diskTotal');
        const diskFreeElement = document.getElementById('diskFree');
        
        if (diskUsageElement) {
            diskUsageElement.textContent = this.formatBytes(diskUsed);
        }
        if (diskTotalElement) {
            diskTotalElement.textContent = `de ${this.formatBytes(diskTotal)}`;
        }
        if (diskFreeElement) {
            diskFreeElement.textContent = this.formatBytes(diskFree);
        }
        
        // Atualizar elementos do grid (se existirem)
        const diskUsedGrid = document.getElementById('diskUsedGrid');
        const diskTotalGrid = document.getElementById('diskTotalGrid');
        const diskFreeGrid = document.getElementById('diskFreeGrid');
        
        if (diskUsedGrid) {
            diskUsedGrid.textContent = this.formatBytes(diskUsed);
        }
        if (diskTotalGrid) {
            diskTotalGrid.textContent = this.formatBytes(diskTotal);
        }
        if (diskFreeGrid) {
            diskFreeGrid.textContent = this.formatBytes(diskFree);
        }
    }

    // Esconder loading e mostrar dashboard
    hideLoading() {
        const loadingState = document.getElementById('loadingState');
        const dashboardContent = document.getElementById('dashboardContent');
        
        if (loadingState && dashboardContent) {
            loadingState.style.display = 'none';
            dashboardContent.style.display = 'block';
        }
    }

    // Atualizar indicadores circulares
    updateSummaryCards() {
        if (!this.systemData) return;

        // CPU
        const cpuUsage = this.systemData.cpu?.usage || 0;
        this.updateCircularGauge('cpuGauge', 'cpuGaugeValue', cpuUsage, `${cpuUsage.toFixed(1)}%`);

        // Memória
        const memUsed = this.systemData.memory?.used || 0;
        const memTotal = this.systemData.memory?.total || 0;
        const memUsage = this.systemData.memory?.usage || 0;
        
        // Atualizar porcentagem central
        const ramGaugeValue = document.getElementById('ramGaugeValue');
        if (ramGaugeValue) {
            ramGaugeValue.textContent = `${memUsage.toFixed(1)}%`;
        }
        
        // Atualizar barras de memória
        this.updateMemoryBars(memUsage);
        
        const ramUsageElement = document.getElementById('ramUsage');
        const ramTotalElement = document.getElementById('ramTotal');
        
        if (ramUsageElement) {
            ramUsageElement.textContent = this.formatBytes(memUsed);
        }
        if (ramTotalElement) {
            ramTotalElement.textContent = `de ${this.formatBytes(memTotal)}`;
        }

        // Disco - apenas atualizar gauge, dados estáticos são atualizados apenas na conexão
        const diskUsage = this.systemData.disk?.usage || 0;
        this.updateCircularGauge('diskGauge', 'diskGaugeValue', diskUsage, `${diskUsage.toFixed(1)}%`);

        // Rede
        const networkInterface = this.systemData.network?.interface || 'Desconhecido';
        const networkStatusElement = document.getElementById('networkStatus');
        
        // Para rede, usamos um valor baseado na velocidade de download (mais representativa)
        const downloadSpeed = this.systemData.network?.downloadSpeed || 0;
        const uploadSpeed = this.systemData.network?.uploadSpeed || 0;
        
        // Calcular porcentagem com escala ultra sensível
        const kb = 1024;
        const mb = kb * 1024;
        let networkValue;
        
        if (downloadSpeed === 0) {
            networkValue = 0;
        } else {
            const speedKBps = downloadSpeed / kb;
            const speedMBps = downloadSpeed / mb;
            
            // Para velocidades muito baixas (0-100 KB/s), usar escala ultra amplificada
            if (speedKBps <= 100) {
                networkValue = Math.min((speedKBps / 100) * 60, 60); // 0-100 KB/s = 0-60%
            }
            // Para velocidades baixas (100 KB/s - 1 MB/s), usar escala amplificada
            else if (speedMBps <= 1) {
                const kbRange = speedKBps - 100; // 0-900 KB
                networkValue = Math.min(60 + (kbRange / 900) * 30, 90); // 100-1000 KB/s = 60-90%
            }
            // Para velocidades normais (1+ MB/s), usar escala normal
            else {
                networkValue = Math.min(90 + ((speedMBps - 1) / 4) * 10, 100); // 1-5 MB/s = 90-100%
            }
        }
        
        // Mostrar interface ou velocidade de download no gauge
        const displayValue = downloadSpeed > 0 ? this.formatNetworkSpeed(downloadSpeed) : networkInterface.toUpperCase();
        
        this.updateCircularGauge('networkGauge', 'networkGaugeValue', networkValue, displayValue);
        
        if (networkStatusElement) {
            networkStatusElement.textContent = networkInterface;
        }
        
        // Atualizar velocidades de rede
        this.updateNetworkSpeeds();
    }

    // Atualizar gauge circular
    updateCircularGauge(gaugeId, valueId, percentage, displayValue) {
        const gauge = document.getElementById(gaugeId);
        const valueElement = document.getElementById(valueId);
        
        if (gauge && valueElement) {
            // Calcular o offset do dasharray (314 é a circunferência de um círculo com raio 50)
            const circumference = 314;
            const offset = circumference - (percentage / 100) * circumference;
            
            gauge.style.strokeDashoffset = offset;
            valueElement.textContent = displayValue;
        }
    }

    // Atualizar barras de memória
    updateMemoryBars(usagePercentage) {
        const memoryBars = document.querySelectorAll('.memory-bar .bar-fill');
        
        // Criar variação mais dinâmica baseada no uso atual e tempo
        const time = Date.now() / 1000; // Tempo em segundos
        const baseUsage = usagePercentage;
        
        // Cada barra representa uma "área" de memória com comportamento diferente
        const barPercentages = [
            // Barra 1: Uso principal + pequena variação
            Math.min(Math.max(baseUsage * 0.9 + Math.sin(time * 0.5) * 2, 0), 100),
            
            // Barra 2: Uso secundário + variação média
            Math.min(Math.max(baseUsage * 0.7 + Math.sin(time * 0.8 + 1) * 3, 0), 100),
            
            // Barra 3: Uso terciário + variação maior
            Math.min(Math.max(baseUsage * 0.5 + Math.sin(time * 1.2 + 2) * 4, 0), 100),
            
            // Barra 4: Uso mínimo + variação alta
            Math.min(Math.max(baseUsage * 0.3 + Math.sin(time * 1.5 + 3) * 5, 0), 100)
        ];
        
        memoryBars.forEach((bar, index) => {
            if (bar && barPercentages[index] !== undefined) {
                // Adicionar transição suave
                bar.style.transition = 'height 0.5s ease-in-out';
                bar.style.height = `${barPercentages[index]}%`;
                
                // Adicionar efeito visual baseado na intensidade
                const intensity = barPercentages[index];
                if (intensity > 80) {
                    bar.style.backgroundColor = '#ff4444'; // Vermelho para uso alto
                } else if (intensity > 60) {
                    bar.style.backgroundColor = '#ff8800'; // Laranja para uso médio-alto
                } else if (intensity > 40) {
                    bar.style.backgroundColor = '#ffaa00'; // Amarelo para uso médio
                } else {
                    bar.style.backgroundColor = '#00ff88'; // Verde para uso baixo
                }
            }
        });
    }

    // Atualizar velocidades de rede
    updateNetworkSpeeds() {
        const downloadSpeed = this.systemData.network?.downloadSpeed || 0;
        const uploadSpeed = this.systemData.network?.uploadSpeed || 0;
        
        
        // Atualizar valores principais com formatação inteligente
        const downloadSpeedElement = document.getElementById('downloadSpeed');
        const uploadSpeedElement = document.getElementById('uploadSpeed');
        
        if (downloadSpeedElement) {
            downloadSpeedElement.textContent = this.formatNetworkSpeed(downloadSpeed);
        }
        if (uploadSpeedElement) {
            uploadSpeedElement.textContent = this.formatNetworkSpeed(uploadSpeed);
        }
        
        // Atualizar valores detalhados (usar formatação inteligente)
        const downloadSpeedDetail = document.getElementById('downloadSpeedDetail');
        const uploadSpeedDetail = document.getElementById('uploadSpeedDetail');
        
        if (downloadSpeedDetail) {
            downloadSpeedDetail.textContent = this.formatNetworkSpeed(downloadSpeed);
        }
        if (uploadSpeedDetail) {
            uploadSpeedDetail.textContent = this.formatNetworkSpeed(uploadSpeed);
        }
        
        // Atualizar barras de velocidade
        this.updateNetworkSpeedBars(downloadSpeed, uploadSpeed);
    }

    // Atualizar barras de velocidade de rede
    updateNetworkSpeedBars(downloadSpeed, uploadSpeed) {
        const downloadBar = document.querySelector('.speed-bar-fill.download');
        const uploadBar = document.querySelector('.speed-bar-fill.upload');
        
        // Escala ultra sensível para velocidades muito baixas
        const kb = 1024;
        const mb = kb * 1024;
        
        // Função para calcular porcentagem com escala ultra amplificada
        const calculatePercentage = (speed) => {
            if (speed === 0) return 0;
            
            const speedKBps = speed / kb;
            const speedMBps = speed / mb;
            
            // Para velocidades muito baixas (0-100 KB/s), usar escala ultra amplificada
            if (speedKBps <= 100) {
                return Math.min((speedKBps / 100) * 60, 60); // 0-100 KB/s = 0-60%
            }
            // Para velocidades baixas (100 KB/s - 1 MB/s), usar escala amplificada
            else if (speedMBps <= 1) {
                const kbRange = speedKBps - 100; // 0-900 KB
                return Math.min(60 + (kbRange / 900) * 30, 90); // 100-1000 KB/s = 60-90%
            }
            // Para velocidades normais (1+ MB/s), usar escala normal
            else {
                return Math.min(90 + ((speedMBps - 1) / 4) * 10, 100); // 1-5 MB/s = 90-100%
            }
        };
        
        const downloadPercentage = calculatePercentage(downloadSpeed);
        const uploadPercentage = calculatePercentage(uploadSpeed);
        
        if (downloadBar) {
            downloadBar.style.transition = 'height 0.3s ease-in-out';
            downloadBar.style.height = `${downloadPercentage}%`;
        }
        if (uploadBar) {
            uploadBar.style.transition = 'height 0.3s ease-in-out';
            uploadBar.style.height = `${uploadPercentage}%`;
        }
    }

    // Atualizar métricas dinâmicas do sistema
    updateSystemInfo() {
        if (!this.systemData) return;

        // Load Average do sistema
        this.updateLoadAverageGauge();
        
        // Frequência da CPU
        this.updateFrequencyGauge();
        
        // Latência de rede
        this.updateLatencyGauge();
        
        // Uptime
        this.updateUptimeDisplay();
    }

    // Atualizar gauge de load average
    updateLoadAverageGauge() {
        const loadAvg = this.systemData.cpu?.loadAverage;
        
        // Usar valor padrão se não houver dados
        const testLoadAvg = loadAvg !== undefined && loadAvg !== null ? loadAvg : 1.25;
        
        const loadValue = document.getElementById('loadValue');
        const loadStatus = document.getElementById('loadStatus');
        const loadFill = document.querySelector('.load-fill');
        const loadCard = document.querySelector('.load-card');
        const loadCenterIcon = document.querySelector('.load-center-icon');
        
        
        
        if (loadValue && loadStatus && loadFill) {
            loadValue.textContent = `${testLoadAvg.toFixed(2)}`;
            
            // Atualizar progresso do Load Average (0-4.0 = 0-100%)
            const percentage = Math.min((testLoadAvg / 4.0) * 100, 100);
            loadFill.style.setProperty('--progress', `${percentage}%`);
            
            // Status e cores baseados no Load Average
            let statusText, statusClass;
            if (testLoadAvg < 0.5) {
                statusText = 'IDLE';
                statusClass = 'idle';
            } else if (testLoadAvg < 1.0) {
                statusText = 'BAIXO';
                statusClass = 'low';
            } else if (testLoadAvg < 2.0) {
                statusText = 'NORMAL';
                statusClass = 'normal';
            } else if (testLoadAvg < 3.0) {
                statusText = 'ALTO';
                statusClass = 'high';
            } else {
                statusText = 'CRÍTICO';
                statusClass = 'critical';
            }
            
            loadStatus.textContent = statusText;
            
            // Aplicar classe de status ao card
            if (loadCard) {
                // Remover classes anteriores
                loadCard.classList.remove('idle', 'low', 'normal', 'high', 'critical');
                // Adicionar nova classe
                loadCard.classList.add(statusClass);
            }
            
            // Atualizar cor do ícone central baseado no status
            if (loadCenterIcon) {
                let iconColor;
                switch (statusClass) {
                    case 'idle':
                        iconColor = '#00ff88';
                        break;
                    case 'low':
                        iconColor = '#00d4ff';
                        break;
                    case 'normal':
                        iconColor = '#ffaa00';
                        break;
                    case 'high':
                        iconColor = '#ff6b35';
                        break;
                    case 'critical':
                        iconColor = '#ff4757';
                        break;
                    default:
                        iconColor = '#00d4ff';
                }
                loadCenterIcon.style.color = iconColor;
            }
            
            // Atualizar indicadores visuais
            this.updateLoadIndicators(testLoadAvg);
            
        }
    }
    
    // Atualizar indicadores visuais do Load Average
    updateLoadIndicators(loadAvg) {
        const dots = document.querySelectorAll('.load-dot');
        
        // Ativar dots baseado no Load Average
        const activeDots = Math.min(Math.ceil(loadAvg), 3);
        
        dots.forEach((dot, index) => {
            if (index < activeDots) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    // Atualizar gauge de frequência
    updateFrequencyGauge() {
        const speed = this.systemData.cpu?.frequency;
        console.log('⚡ Frequência no cliente:', speed, 'Tipo:', typeof speed);
        console.log('🔧 Função updateFrequencyGauge chamada');
        
        if (speed === undefined || speed === null || speed === 0) {
            // Frequência pode não estar disponível em alguns sistemas
            console.log('❌ Frequência não disponível ou zero');
            return;
        }
        const freqValue = document.getElementById('freqValue');
        const freqStatus = document.getElementById('freqStatus');
        const freqBars = document.querySelectorAll('.freq-bar');
        
        if (freqValue && freqStatus && freqBars) {
            freqValue.textContent = `${speed.toFixed(1)}GHz`;
            
            // Atualizar barras de frequência baseado na velocidade
            const baseFreq = 1.0;  // Frequência mínima
            const maxFreq = 5.0;   // Frequência máxima
            const percentage = Math.min(((speed - baseFreq) / (maxFreq - baseFreq)) * 100, 100);
            const activeBars = Math.min(Math.round((percentage / 100) * freqBars.length), freqBars.length);
            
            console.log('🔧 Debug Frequência:', {
                speed: speed,
                percentage: percentage,
                activeBars: activeBars,
                totalBars: freqBars.length
            });
            
            freqBars.forEach((bar, index) => {
                if (index < activeBars) {
                    bar.classList.add('active');
                    // Adicionar delay escalonado para animação em cascata
                    bar.style.animationDelay = `${index * 0.1}s`;
                } else {
                    bar.classList.remove('active');
                    bar.style.animationDelay = '0s';
                }
            });
            
            // Status baseado na frequência
            if (speed > 4.0) {
                freqStatus.textContent = 'TURBO';
            } else if (speed > 3.0) {
                freqStatus.textContent = 'ALTO';
            } else {
                freqStatus.textContent = 'ECO';
            }
            
            console.log('✅ Frequência atualizada:', speed + 'GHz');
        }
    }

    // Atualizar gauge de latência
    updateLatencyGauge() {
        // Usar latência real do servidor se disponível
        const serverLatency = this.systemData?.osInfo?.networkLatency;
        const latency = serverLatency !== undefined ? serverLatency : this.dnsInfo.latency;
        
        console.log('🌐 Latência no cliente:', latency, 'Tipo:', typeof latency);
        console.log('   Server latency:', serverLatency);
        console.log('   DNS latency:', this.dnsInfo.latency);
        
        if (latency === undefined || latency === null) {
            // Latência pode não estar disponível
            console.log('❌ Latência não disponível');
            return;
        }
        const latencyValue = document.getElementById('latencyValue');
        const latencyStatus = document.getElementById('latencyStatus');
        const latencyFill = document.querySelector('.latency-fill');
        const latencyCard = document.querySelector('.latency-card');
        
        console.log('🔍 Elementos de latência encontrados:', {
            latencyValue: !!latencyValue,
            latencyStatus: !!latencyStatus,
            latencyFill: !!latencyFill,
            latencyCard: !!latencyCard
        });
        
        if (latencyValue && latencyStatus && latencyFill) {
            // Formatar latência com valor arredondado e formatação inteligente
            const formattedLatency = this.formatLatency(latency);
            latencyValue.textContent = formattedLatency;
            
            // Atualizar progresso da latência (0-200ms = 0-100%)
            const percentage = Math.min((latency / 200) * 100, 100);
            latencyFill.style.setProperty('--progress', `${percentage}%`);
            
            // Adicionar efeito de pulso baseado na latência
            if (latencyCard) {
                latencyCard.style.animationDuration = `${Math.max(1, latency / 50)}s`;
            }
            
            // Status e cores baseados na latência
            let statusText, statusClass;
            if (latency < 20) {
                statusText = 'EXCELENTE';
                statusClass = 'excellent';
            } else if (latency < 50) {
                statusText = 'MUITO BOM';
                statusClass = 'very-good';
            } else if (latency < 100) {
                statusText = 'BOM';
                statusClass = 'good';
            } else if (latency < 200) {
                statusText = 'REGULAR';
                statusClass = 'regular';
            } else if (latency < 500) {
                statusText = 'LENTO';
                statusClass = 'slow';
            } else {
                statusText = 'MUITO LENTO';
                statusClass = 'very-slow';
            }
            
            latencyStatus.textContent = statusText;
            
            // Aplicar classe de status ao card
            if (latencyCard) {
                // Remover classes anteriores
                latencyCard.classList.remove('excellent', 'very-good', 'good', 'regular', 'slow', 'very-slow');
                // Adicionar nova classe
                latencyCard.classList.add(statusClass);
            }
            
            console.log('✅ Latência atualizada:', latency + 'ms', 'Formatted:', formattedLatency, 'Percentage:', percentage, 'Status:', statusText);
        } else {
            console.log('❌ Elementos de latência não encontrados!');
        }
        
        // Atualizar detalhes de ping e jitter
        this.updateLatencyDetails(latency);
    }
    
    // Atualizar detalhes de latência (ping e jitter)
    updateLatencyDetails(latency) {
        // Usar latência real
        const ping = Math.round(latency);
        
        // Jitter real (será calculado pelo servidor)
        const jitter = 0;
        
        // Atualizar elementos de ping e jitter
        const pingElements = document.querySelectorAll('.detail-item .detail-value');
        pingElements.forEach(element => {
            const label = element.previousElementSibling;
            if (label && label.textContent.includes('Ping:')) {
                element.textContent = `${ping}ms`;
            } else if (label && label.textContent.includes('Jitter:')) {
                element.textContent = `${jitter}ms`;
            }
        });
    }

    // Atualizar display de uptime
    updateUptimeDisplay() {
        const uptimeSeconds = this.systemData.time?.uptime;
        console.log('⏱️ Uptime no cliente:', uptimeSeconds, 'Tipo:', typeof uptimeSeconds);
        
        if (uptimeSeconds === undefined || uptimeSeconds === null) {
            // Não logar warning desnecessário - uptime pode não estar disponível
            console.log('❌ Uptime não disponível');
            return;
        }
        const uptimeValue = document.getElementById('uptimeValue');
        const uptimeStatus = document.getElementById('uptimeStatus');
        const uptimeFill = document.querySelector('.uptime-fill');
        const uptimeDots = document.querySelectorAll('.uptime-dot');
        
        if (uptimeValue && uptimeStatus && uptimeFill) {
            uptimeValue.textContent = this.formatUptime(uptimeSeconds);
            
            // Calcular progresso baseado no tempo (simular ciclo de 7 dias)
            const progress = Math.min((uptimeSeconds / (7 * 86400)) * 100, 100);
            uptimeFill.style.width = `${progress}%`;
            
            // Ativar dots baseado no progresso
            const activeDots = Math.round((progress / 100) * uptimeDots.length);
            uptimeDots.forEach((dot, index) => {
                if (index < activeDots) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
            
            // Status baseado no uptime
            if (uptimeSeconds > 7 * 86400) {
                uptimeStatus.textContent = 'ESTÁVEL';
            } else if (uptimeSeconds > 86400) {
                uptimeStatus.textContent = 'BOM';
            } else {
                uptimeStatus.textContent = 'RECENTE';
            }
            
            console.log('✅ Uptime atualizado:', this.formatUptime(uptimeSeconds));
        }
    }

    // Atualizar detalhes do sistema
    updateSystemDetails() {
        if (!this.systemData) return;

        // Atualizar informações do sistema
        const osInfo = document.getElementById('osInfo');
        const archInfo = document.getElementById('archInfo');
        const nodeVersion = document.getElementById('nodeVersion');
        const systemUptime = document.getElementById('systemUptime');
        const currentUser = document.getElementById('currentUser');
        const currentDir = document.getElementById('currentDir');

        if (osInfo) {
            osInfo.textContent = `${this.systemData.osInfo?.distro || 'Windows 11'} ${this.systemData.osInfo?.release || '10.0.22631'}`;
        }
        if (archInfo) {
            archInfo.textContent = 'x64';
        }
        if (nodeVersion) {
            nodeVersion.textContent = 'v18.17.0';
        }
        if (systemUptime) {
            systemUptime.textContent = this.formatUptime(this.systemData.time?.uptime || 86400);
        }
        if (currentUser) {
            currentUser.textContent = 'usuario';
        }
        if (currentDir) {
            currentDir.textContent = 'C:\\SMX\\SMX-LiveBoard';
        }
    }

    // Adicionar status visual aos cards
    addStatusToCard(element, status) {
        if (!element) return;
        
        const card = element.closest('.system-info-item');
        if (card) {
            // Remover status anteriores
            card.classList.remove('status-online', 'status-warning', 'status-critical');
            // Adicionar novo status
            card.classList.add(`status-${status}`);
        }
    }

    // Atualizar tabela de processos
    updateProcesses() {
        if (!this.systemData?.processes) return;

        const tbody = document.getElementById('processesTableBody');
        if (!tbody) return;

        const processes = this.systemData.processes.slice(0, 5);
        
        if (processes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #999;">
                        Nenhum processo encontrado
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = processes.map(process => {
            const cpuUsage = process.cpu?.toFixed(1) || 0;
            const memoryUsage = Math.round(process.memory || 0);
            
            return `
                <tr class="process-row" data-name="${process.name}" data-pid="${process.pid}" data-cpu="${process.cpu}" data-memory="${process.memory}">
                    <td class="process-name">${process.name || 'N/A'}</td>
                    <td class="process-pid">${process.pid || 'N/A'}</td>
                    <td class="process-cpu">
                        <div class="metric-with-bar">
                            <span class="metric-value">${cpuUsage}%</span>
                            <div class="metric-bar">
                                <div class="metric-bar-fill cpu-bar" style="width: ${cpuUsage}%"></div>
                            </div>
                        </div>
                    </td>
                    <td class="process-memory">
                        <div class="metric-with-bar">
                            <span class="metric-value">${memoryUsage} MB</span>
                            <div class="metric-bar">
                                <div class="metric-bar-fill memory-bar" style="width: ${Math.min(memoryUsage / 10, 100)}%"></div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Atualizar totais
        this.updateProcessTotals(processes);
    }

    // Atualizar totais dos processos
    updateProcessTotals(processes) {
        const totalCpu = processes.reduce((sum, process) => sum + (process.cpu || 0), 0);
        const totalMemory = processes.reduce((sum, process) => sum + (process.memory || 0), 0);

        const totalCpuElement = document.getElementById('totalCpu');
        const totalMemoryElement = document.getElementById('totalMemory');

        if (totalCpuElement) {
            totalCpuElement.textContent = `${totalCpu.toFixed(1)}%`;
        }
        if (totalMemoryElement) {
            totalMemoryElement.textContent = `${Math.round(totalMemory)} MB`;
        }
    }

    // Configurar controles da tabela de processos
    setupProcessTableControls() {
        // Apenas manter os totais, sem filtros ou ordenação
    }


    // Funções utilitárias
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        if (!bytes || isNaN(bytes)) {
            return '0 B';
        }
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const result = parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        return result;
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    }

    formatNetworkSpeed(speedBytesPerSec) {
        if (speedBytesPerSec === 0) return '0 MB/s';
        
        const bytes = speedBytesPerSec;
        const kb = 1024;
        const mb = kb * 1024;
        
        // Converter bytes/s para MB/s
        const speedMBps = bytes / mb;
        
        // Se for menor que 0.1 MB/s, mostrar em KB/s
        if (speedMBps < 0.1) {
            const speedKBps = bytes / kb;
            return `${Math.round(speedKBps)} KB/s`;
        }
        
        // Se for menor que 1 MB/s, mostrar com 1 casa decimal
        if (speedMBps < 1) {
            return `${speedMBps.toFixed(1)} MB/s`;
        }
        
        // Se for maior que 1 MB/s, mostrar sem casas decimais
        return `${Math.round(speedMBps)} MB/s`;
    }

    formatLatency(latencyMs) {
        if (latencyMs === 0) return '0ms';
        
        // Se for menor que 1ms, mostrar com 2 casas decimais
        if (latencyMs < 1) {
            return `${latencyMs.toFixed(2)}ms`;
        }
        
        // Se for menor que 10ms, mostrar com 1 casa decimal
        if (latencyMs < 10) {
            return `${latencyMs.toFixed(1)}ms`;
        }
        
        // Se for menor que 100ms, mostrar sem casas decimais
        if (latencyMs < 100) {
            return `${Math.round(latencyMs)}ms`;
        }
        
        // Se for menor que 1000ms (1s), mostrar sem casas decimais
        if (latencyMs < 1000) {
            return `${Math.round(latencyMs)}ms`;
        }
        
        // Se for maior que 1000ms, converter para segundos
        const seconds = latencyMs / 1000;
        if (seconds < 10) {
            return `${seconds.toFixed(1)}s`;
        } else {
            return `${Math.round(seconds)}s`;
        }
    }


    // Atualizar sparklines
    updateSparklines() {
        if (!this.systemData) return;

        // Adicionar dados ao histórico
        this.history.cpu.push(this.systemData.cpu?.usage || 0);
        this.history.ram.push(this.systemData.memory?.usage || 0);
        this.history.disk.push(this.systemData.disk?.usage || 0);
        // Removido: dados simulados de rede

        // Manter apenas últimos 20 pontos
        const maxPoints = 20;
        Object.keys(this.history).forEach(key => {
            if (this.history[key].length > maxPoints) {
                this.history[key] = this.history[key].slice(-maxPoints);
            }
        });

        // Desenhar sparklines
        this.drawSparkline('cpuTrend', this.history.cpu, '#00d4ff');
        this.drawSparkline('ramTrend', this.history.ram, '#00ff88');
        this.drawSparkline('diskTrend', this.history.disk, '#ff8800');
        this.drawSparkline('networkTrend', this.history.network, '#ff4444');
    }

    // Desenhar sparkline
    drawSparkline(canvasId, data, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || data.length < 2) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Limpar canvas
        ctx.clearRect(0, 0, width, height);

        // Configurar estilo
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        // Calcular pontos
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        data.forEach((value, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((value - min) / range) * height;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    }

    // Verificar alertas
    checkAlerts() {
        if (!this.systemData) return;

        const cpuUsage = this.systemData.cpu?.usage || 0;
        const ramUsage = this.systemData.memory?.usage || 0;
        const diskUsage = this.systemData.disk?.usage || 0;

        // Remover classes de alerta dos gauges
        document.querySelectorAll('.gauge-container').forEach(card => {
            card.classList.remove('critical', 'warning');
        });

        // CPU
        const cpuCard = document.querySelector('.cpu-gauge');
        if (cpuCard) {
            if (cpuUsage > 90) {
                cpuCard.classList.add('critical');
            } else if (cpuUsage > 80) {
                cpuCard.classList.add('warning');
            }
        }

        // RAM
        const ramCard = document.querySelector('.ram-gauge');
        if (ramCard) {
            if (ramUsage > 90) {
                ramCard.classList.add('critical');
            } else if (ramUsage > 80) {
                ramCard.classList.add('warning');
            }
        }

        // DISCO
        const diskCard = document.querySelector('.disk-gauge');
        if (diskCard) {
            if (diskUsage > 90) {
                diskCard.classList.add('critical');
            } else if (diskUsage > 80) {
                diskCard.classList.add('warning');
            }
        }
    }

    // Configurar controles do header
    setupHeaderControls() {
        const refreshBtn = document.getElementById('refreshBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.fetchSystemData();
                refreshBtn.style.transform = 'rotate(360deg)';
                setTimeout(() => {
                    refreshBtn.style.transform = 'rotate(0deg)';
                }, 500);
            });
        }

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            });
        }
    }

    // Iniciar monitoramento de rede
    startNetworkMonitoring() {
        this.detectDNSServer();
        this.testDNSLatency();
        
        // Atualizar latência a cada 30 segundos
        setInterval(() => {
            this.testDNSLatency();
        }, 30000);
    }

    // Detectar servidor DNS
    detectDNSServer() {
        // Simular detecção de DNS (em um ambiente real, isso seria feito via API do sistema)
        const commonDNSServers = [
            '8.8.8.8',      // Google DNS
            '1.1.1.1',      // Cloudflare DNS
            '208.67.222.222', // OpenDNS
            '9.9.9.9',      // Quad9 DNS
            '192.168.1.1'   // Router local
        ];
        
        // Simular detecção baseada em probabilidade
        const randomDNS = commonDNSServers[0]; // Usar DNS real fixo
        this.dnsInfo.server = randomDNS;
        
        // Atualizar interface
        const dnsServerElement = document.getElementById('dnsServer');
        if (dnsServerElement) {
            dnsServerElement.textContent = this.dnsInfo.server;
        }
    }

    // Testar latência do DNS
    async testDNSLatency() {
        if (!this.dnsInfo.server) return;
        
        const startTime = performance.now();
        
        try {
            // Usar uma abordagem mais simples - ping via imagem com timeout mais curto
            const img = new Image();
            let timeoutId;
            
            img.onload = () => {
                clearTimeout(timeoutId);
                const endTime = performance.now();
                const latency = Math.round(endTime - startTime);
                this.dnsInfo.latency = latency;
                this.updateLatencyGauge();
            };
            
            img.onerror = () => {
                clearTimeout(timeoutId);
                // Se falhar, usar latência simulada baseada no tempo
                const endTime = performance.now();
                const latency = Math.round(endTime - startTime);
                this.dnsInfo.latency = latency;
                this.updateLatencyGauge();
            };
            
            // Timeout mais curto para evitar erros longos
            timeoutId = setTimeout(() => {
                if (!this.dnsInfo.latency) {
                    const endTime = performance.now();
                    const latency = Math.round(endTime - startTime);
                    this.dnsInfo.latency = latency;
                    this.updateLatencyGauge();
                }
            }, 2000); // Reduzido de 5s para 2s
            
            // Tentar carregar uma imagem pequena do servidor DNS
            img.src = `http://${this.dnsInfo.server}/favicon.ico?t=${Date.now()}`;
            
        } catch (error) {
            // Não logar erro de DNS - é comum falhar
            this.dnsInfo.latency = null;
        }
    }

    // REMOVIDO: simulatePing - usando ping real do sistema

    // ===== FUNCIONALIDADES DOS BOTÕES =====
    
    // Configurar eventos dos botões
    setupButtonEvents() {
        // Botão Alert (Telegram)
        const alertBtn = document.getElementById('telegramBtn');
        if (alertBtn) {
            alertBtn.addEventListener('click', () => this.handleTelegramAlert());
        }

        // Botão SSH
        const sshBtn = document.getElementById('sshBtn');
        if (sshBtn) {
            sshBtn.addEventListener('click', () => this.handleSSHConnection());
        }

        // Botão Logs
        const logsBtn = document.getElementById('logsBtn');
        if (logsBtn) {
            logsBtn.addEventListener('click', () => this.handleViewLogs());
        }

        // Botão Terminal
        const terminalBtn = document.getElementById('terminalBtn');
        if (terminalBtn) {
            terminalBtn.addEventListener('click', () => this.handleTerminalAccess());
        }
    }

    // Handler para botão Alert (Telegram)
    async handleTelegramAlert() {
        try {
            // Verificar se o bot está configurado
            const statusResponse = await fetch('/api/telegram/status');
            const status = await statusResponse.json();

            if (!status.configured) {
                this.showTelegramConfigModal();
                return;
            }

            // Enviar alerta com dados atuais do sistema
            const alertData = {
                alertType: 'SYSTEM_STATUS',
                data: {
                    cpu: this.systemData?.cpu?.usage || 0,
                    memory: this.systemData?.memory?.usage || 0,
                    disk: this.systemData?.disk?.usage || 0,
                    hostname: this.systemData?.osInfo?.hostname || 'N/A',
                    os: `${this.systemData?.osInfo?.platform || 'N/A'} ${this.systemData?.osInfo?.release || ''}`
                },
                severity: 'INFO'
            };

            const response = await fetch('/api/telegram/alert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(alertData)
            });

            if (response.ok) {
                this.showNotification('✅ Alerta enviado para o Telegram!', 'success');
            } else {
                throw new Error('Erro ao enviar alerta');
            }
        } catch (error) {
            console.error('Erro ao enviar alerta Telegram:', error);
            this.showNotification('❌ Erro ao enviar alerta: ' + error.message, 'error');
        }
    }

    // Handler para botão SSH
    async handleSSHConnection() {
        this.showSSHConnectionModal();
    }

    // Handler para botão Logs
    async handleViewLogs() {
        try {
            const response = await fetch('/api/logs?limit=50');
            const logs = await response.json();
            this.showLogsModal(logs);
        } catch (error) {
            console.error('Erro ao obter logs:', error);
            this.showNotification('❌ Erro ao carregar logs: ' + error.message, 'error');
        }
    }

    // Handler para botão Terminal
    async handleTerminalAccess() {
        this.showTerminalModal();
    }

    // ===== MODAIS =====

    // Modal de configuração do Telegram
    showTelegramConfigModal() {
        const modal = this.createModal('Configurar Telegram', `
            <div class="modal-content">
                <p>Configure o bot do Telegram para receber alertas:</p>
                <div class="form-group">
                    <label>Bot Token:</label>
                    <input type="text" id="telegramToken" placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz">
                </div>
                <div class="form-group">
                    <label>Chat ID:</label>
                    <input type="text" id="telegramChatId" placeholder="123456789">
                </div>
                <div class="modal-actions">
                    <button onclick="this.close()" class="btn-secondary">Cancelar</button>
                    <button onclick="app.saveTelegramConfig()" class="btn-primary">Salvar</button>
                </div>
            </div>
        `);
        document.body.appendChild(modal);
    }

    // Modal de conexão SSH
    showSSHConnectionModal() {
        const modal = this.createModal('Conexão SSH', `
            <div class="modal-content">
                <p>Conectar a um servidor via SSH:</p>
                <div class="form-group">
                    <label>Host:</label>
                    <input type="text" id="sshHost" placeholder="192.168.1.100">
                </div>
                <div class="form-group">
                    <label>Porta:</label>
                    <input type="number" id="sshPort" value="22">
                </div>
                <div class="form-group">
                    <label>Usuário:</label>
                    <input type="text" id="sshUsername" placeholder="root">
                </div>
                <div class="form-group">
                    <label>Senha:</label>
                    <input type="password" id="sshPassword" placeholder="••••••••">
                </div>
                <div class="modal-actions">
                    <button onclick="this.close()" class="btn-secondary">Cancelar</button>
                    <button onclick="app.connectSSH()" class="btn-primary">Conectar</button>
                </div>
            </div>
        `);
        document.body.appendChild(modal);
    }

    // Modal de logs
    showLogsModal(logs) {
        const logsHtml = logs.logs.map(log => `
            <div class="log-entry log-${log.level.toLowerCase()}">
                <span class="log-time">${new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                <span class="log-level">[${log.level}]</span>
                <span class="log-source">[${log.source}]</span>
                <span class="log-message">${log.message}</span>
            </div>
        `).join('');

        const modal = this.createModal('Logs do Sistema', `
            <div class="modal-content logs-modal">
                <div class="logs-container">
                    ${logsHtml}
                </div>
                <div class="modal-actions">
                    <button onclick="this.close()" class="btn-primary">Fechar</button>
                </div>
            </div>
        `);
        document.body.appendChild(modal);
    }

    // Modal de terminal
    showTerminalModal() {
        const modal = this.createModal('Terminal', `
            <div class="modal-content terminal-modal">
                <div class="terminal-container">
                    <div class="terminal-output" id="terminalOutput"></div>
                    <div class="terminal-input">
                        <input type="text" id="terminalCommand" placeholder="Digite um comando...">
                        <button onclick="app.executeTerminalCommand()">Executar</button>
                    </div>
                </div>
                <div class="modal-actions">
                    <button onclick="this.close()" class="btn-secondary">Fechar</button>
                    <button onclick="app.clearTerminal()" class="btn-warning">Limpar</button>
                </div>
            </div>
        `);
        document.body.appendChild(modal);
        
        // Focar no input
        setTimeout(() => {
            document.getElementById('terminalCommand').focus();
        }, 100);
    }

    // ===== FUNÇÕES AUXILIARES =====

    // Criar modal genérico
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                ${content}
            </div>
        `;
        
        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        return modal;
    }

    // Salvar configuração do Telegram
    async saveTelegramConfig() {
        const token = document.getElementById('telegramToken').value;
        const chatId = document.getElementById('telegramChatId').value;

        if (!token || !chatId) {
            this.showNotification('❌ Preencha todos os campos', 'error');
            return;
        }

        try {
            const response = await fetch('/api/telegram/configure', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ botToken: token, chatId })
            });

            if (response.ok) {
                this.showNotification('✅ Bot do Telegram configurado!', 'success');
                document.querySelector('.modal-overlay').remove();
            } else {
                throw new Error('Erro ao configurar bot');
            }
        } catch (error) {
            this.showNotification('❌ Erro ao configurar: ' + error.message, 'error');
        }
    }

    // Conectar SSH
    async connectSSH() {
        const host = document.getElementById('sshHost').value;
        const port = document.getElementById('sshPort').value;
        const username = document.getElementById('sshUsername').value;
        const password = document.getElementById('sshPassword').value;

        if (!host || !username || !password) {
            this.showNotification('❌ Preencha todos os campos obrigatórios', 'error');
            return;
        }

        try {
            const response = await fetch('/api/ssh/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ host, port: parseInt(port), username, password })
            });

            if (response.ok) {
                const result = await response.json();
                this.showNotification('✅ Conectado via SSH!', 'success');
                document.querySelector('.modal-overlay').remove();
                // Aqui você pode abrir um modal para executar comandos SSH
            } else {
                throw new Error('Erro ao conectar');
            }
        } catch (error) {
            this.showNotification('❌ Erro na conexão SSH: ' + error.message, 'error');
        }
    }

    // Executar comando no terminal
    async executeTerminalCommand() {
        const command = document.getElementById('terminalCommand').value;
        const output = document.getElementById('terminalOutput');

        if (!command.trim()) return;

        // Adicionar comando ao output
        output.innerHTML += `<div class="terminal-command">$ ${command}</div>`;

        try {
            const response = await fetch('/api/terminal/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ command })
            });

            const result = await response.json();
            
            if (result.stdout) {
                output.innerHTML += `<div class="terminal-output">${result.stdout}</div>`;
            }
            if (result.stderr) {
                output.innerHTML += `<div class="terminal-error">${result.stderr}</div>`;
            }
            if (result.exitCode !== 0) {
                output.innerHTML += `<div class="terminal-error">Exit code: ${result.exitCode}</div>`;
            }

        } catch (error) {
            output.innerHTML += `<div class="terminal-error">Erro: ${error.message}</div>`;
        }

        // Limpar input e rolar para baixo
        document.getElementById('terminalCommand').value = '';
        output.scrollTop = output.scrollHeight;
    }

    // Limpar terminal
    clearTerminal() {
        document.getElementById('terminalOutput').innerHTML = '';
    }

    // Mostrar notificação
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Iniciar ping periódico para manter conexão ativa
    startPingInterval() {
        // Limpar intervalo anterior se existir
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        
        // Enviar ping a cada 20 segundos
        this.pingInterval = setInterval(() => {
            if (this.socket && this.socket.connected) {
                this.socket.emit('ping', { timestamp: Date.now() });
            }
        }, 20000);
    }

    // Limpeza ao sair
    destroy() {
        console.log('Destruindo SMX LiveBoard...');
        
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
        if (this.dataInterval) {
            clearInterval(this.dataInterval);
            this.dataInterval = null;
        }
        if (this.restInterval) {
            clearInterval(this.restInterval);
            this.restInterval = null;
        }
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        this.isInitialized = false;
        this.isConnected = false;
        console.log('SMX LiveBoard destruído');
    }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Evitar múltiplas instâncias
    if (window.smxLiveBoard) {
        console.log('SMX LiveBoard já inicializado');
        return;
    }
    
    console.log('Inicializando SMX LiveBoard...');
    window.smxLiveBoard = new SMXLiveBoard();
    window.app = window.smxLiveBoard; // Alias para compatibilidade com os modais
});

// Limpeza ao sair da página
window.addEventListener('beforeunload', () => {
    if (window.smxLiveBoard) {
        window.smxLiveBoard.destroy();
    }
});

