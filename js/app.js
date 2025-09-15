// SMX LiveBoard - JavaScript Vanilla
class SMXLiveBoard {
    constructor() {
        this.systemData = null;
        this.isConnected = false;
        this.ws = null;
        this.timeInterval = null;
        this.dataInterval = null;
        
        // Histórico para sparklines
        this.history = {
            cpu: [],
            ram: [],
            disk: [],
            network: []
        };
        
        this.init();
    }

    init() {
        this.updateTime();
        this.startTimeInterval();
        this.connectWebSocket();
        this.startDataFetch();
        this.setupHeaderControls();
    }

    // Atualizar relógio
    updateTime() {
        const now = new Date();
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('pt-BR');
        }
    }

    startTimeInterval() {
        this.timeInterval = setInterval(() => {
            this.updateTime();
        }, 1000);
    }

    // Conectar ao WebSocket
    connectWebSocket() {
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
            };
        } catch (error) {
            console.error('Erro ao conectar WebSocket:', error);
            this.setConnectionStatus(false);
            // Carregar dados de exemplo quando WebSocket falha
            setTimeout(() => {
                this.loadMockData();
            }, 1000);
        }
    }

    // Fallback para API REST
    async fetchSystemData() {
        try {
            const response = await fetch('http://localhost:3002/api/system');
            const data = await response.json();
            this.updateSystemData(data);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            // Dados de exemplo quando backend não está rodando
            this.loadMockData();
        }
    }

    // Carregar dados de exemplo
    loadMockData() {
        const mockData = {
            timestamp: Date.now(),
            cpu: {
                usage: 45.2,
                manufacturer: "Intel",
                brand: "Intel Core i7-10700K",
                speed: 3.8,
                cores: 8,
                temperature: 65
            },
            mem: {
                total: 17179869184, // 16GB
                used: 8589934592,   // 8GB
                free: 8589934592,   // 8GB
                usage: 50
            },
            fsSize: [{
                mount: "C:",
                size: 1073741824000, // 1TB
                used: 536870912000,  // 500GB
                available: 536870912000, // 500GB
                use: 50
            }],
            networkStats: [{
                operstate: "up"
            }],
            osInfo: {
                platform: "Windows",
                distro: "Windows 10",
                release: "10.0.19042",
                hostname: "DESKTOP-ABC123"
            },
            time: {
                uptime: 86400 // 1 dia
            },
            processes: [
                { pid: 1234, name: "chrome.exe", cpu: 15.2, mem: 512, user: "usuario" },
                { pid: 5678, name: "code.exe", cpu: 8.5, mem: 256, user: "usuario" },
                { pid: 9012, name: "node.exe", cpu: 5.1, mem: 128, user: "usuario" },
                { pid: 3456, name: "explorer.exe", cpu: 2.3, mem: 64, user: "usuario" },
                { pid: 7890, name: "firefox.exe", cpu: 12.8, mem: 384, user: "usuario" }
            ]
        };
        
        this.updateSystemData(mockData);
    }

    startDataFetch() {
        // Buscar dados iniciais
        this.fetchSystemData();
        
        // Atualizar a cada 5 segundos como fallback
        this.dataInterval = setInterval(() => {
            this.fetchSystemData();
        }, 5000);
    }

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
        this.updateCPUDetails();
        this.updateSparklines();
        this.checkAlerts();
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

    // Atualizar cards de resumo
    updateSummaryCards() {
        if (!this.systemData) return;

        // CPU
        const cpuUsage = this.systemData.cpu?.usage?.toFixed(1) || 0;
        const cpuUsageElement = document.getElementById('cpuUsage');
        const cpuProgressBar = document.getElementById('cpuProgressBar');
        
        if (cpuUsageElement) {
            cpuUsageElement.textContent = `${cpuUsage}%`;
        }
        if (cpuProgressBar) {
            cpuProgressBar.style.width = `${cpuUsage}%`;
        }

        // Memória
        const memUsed = this.systemData.mem?.used || 0;
        const memTotal = this.systemData.mem?.total || 0;
        const memUsage = this.systemData.mem?.usage || 0;
        
        const ramUsageElement = document.getElementById('ramUsage');
        const ramTotalElement = document.getElementById('ramTotal');
        const ramProgressBar = document.getElementById('ramProgressBar');
        
        if (ramUsageElement) {
            ramUsageElement.textContent = this.formatBytes(memUsed);
        }
        if (ramTotalElement) {
            ramTotalElement.textContent = `de ${this.formatBytes(memTotal)}`;
        }
        if (ramProgressBar) {
            ramProgressBar.style.width = `${memUsage}%`;
        }

        // Disco
        const diskUsed = this.systemData.fsSize?.[0]?.used || 0;
        const diskTotal = this.systemData.fsSize?.[0]?.size || 0;
        const diskUsage = this.systemData.fsSize?.[0]?.use || 0;
        
        const diskUsageElement = document.getElementById('diskUsage');
        const diskTotalElement = document.getElementById('diskTotal');
        const diskProgressBar = document.getElementById('diskProgressBar');
        
        if (diskUsageElement) {
            diskUsageElement.textContent = this.formatBytes(diskUsed);
        }
        if (diskTotalElement) {
            diskTotalElement.textContent = `de ${this.formatBytes(diskTotal)}`;
        }
        if (diskProgressBar) {
            diskProgressBar.style.width = `${diskUsage}%`;
        }

        // Rede
        const networkStatus = this.systemData.networkStats?.[0]?.operstate || 'Desconhecido';
        const networkStatusElement = document.getElementById('networkStatus');
        
        if (networkStatusElement) {
            networkStatusElement.textContent = networkStatus;
        }
    }

    // Atualizar informações do sistema
    updateSystemInfo() {
        if (!this.systemData) return;

        const osInfo = document.getElementById('osInfo');
        const osVersion = document.getElementById('osVersion');
        const uptime = document.getElementById('uptime');
        const hostname = document.getElementById('hostname');

        if (osInfo) {
            const platform = this.systemData.osInfo?.platform || 'Desconhecido';
            const distro = this.systemData.osInfo?.distro || '';
            osInfo.textContent = `${platform} ${distro}`.trim();
        }

        if (osVersion) {
            osVersion.textContent = this.systemData.osInfo?.release || 'Desconhecido';
        }

        if (uptime) {
            const uptimeSeconds = this.systemData.time?.uptime || 0;
            uptime.textContent = this.formatUptime(uptimeSeconds);
        }

        if (hostname) {
            hostname.textContent = this.systemData.osInfo?.hostname || 'Desconhecido';
        }
    }

    // Atualizar tabela de processos
    updateProcesses() {
        if (!this.systemData?.processes) return;

        const tbody = document.getElementById('processesTableBody');
        if (!tbody) return;

        const processes = this.systemData.processes.slice(0, 10);
        
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

        tbody.innerHTML = processes.map(process => `
            <tr>
                <td class="process-name">${process.name || 'N/A'}</td>
                <td class="process-pid">${process.pid || 'N/A'}</td>
                <td class="process-cpu">${(process.cpu?.toFixed(1) || 0)}%</td>
                <td class="process-memory">
                    ${process.mem ? this.formatBytes(process.mem * 1024 * 1024) : 'N/A'}
                </td>
            </tr>
        `).join('');
    }

    // Atualizar detalhes da CPU
    updateCPUDetails() {
        if (!this.systemData?.cpu) return;

        const cpuModel = document.getElementById('cpuModel');
        const cpuSpeed = document.getElementById('cpuSpeed');
        const cpuCores = document.getElementById('cpuCores');
        const cpuTemp = document.getElementById('cpuTemp');

        if (cpuModel) {
            const manufacturer = this.systemData.cpu.manufacturer || 'Desconhecido';
            const brand = this.systemData.cpu.brand || '';
            cpuModel.textContent = `${manufacturer} ${brand}`.trim();
        }

        if (cpuSpeed) {
            const speed = this.systemData.cpu.speed;
            cpuSpeed.textContent = speed ? `${speed} GHz` : 'Desconhecido';
        }

        if (cpuCores) {
            cpuCores.textContent = this.systemData.cpu.cores || 'Desconhecido';
        }

        if (cpuTemp) {
            const temp = this.systemData.cpu.temperature;
            cpuTemp.textContent = temp ? `${temp}°C` : 'N/A';
        }
    }

    // Funções utilitárias
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    }


    // Atualizar sparklines
    updateSparklines() {
        if (!this.systemData) return;

        // Adicionar dados ao histórico
        this.history.cpu.push(this.systemData.cpu?.usage || 0);
        this.history.ram.push(this.systemData.mem?.usage || 0);
        this.history.disk.push(this.systemData.fsSize?.[0]?.use || 0);
        this.history.network.push(Math.random() * 100); // Simulado

        // Manter apenas últimos 20 pontos
        const maxPoints = 20;
        Object.keys(this.history).forEach(key => {
            if (this.history[key].length > maxPoints) {
                this.history[key] = this.history[key].slice(-maxPoints);
            }
        });

        // Desenhar sparklines
        this.drawSparkline('cpuSparkline', this.history.cpu, '#00d4ff');
        this.drawSparkline('ramSparkline', this.history.ram, '#00ff88');
        this.drawSparkline('diskSparkline', this.history.disk, '#ff8800');
        this.drawSparkline('networkSparkline', this.history.network, '#ff4444');
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
        const ramUsage = this.systemData.mem?.usage || 0;
        const diskUsage = this.systemData.fsSize?.[0]?.use || 0;

        // Remover classes de alerta
        document.querySelectorAll('.summary-card').forEach(card => {
            card.classList.remove('critical', 'warning');
        });

        // CPU
        const cpuCard = document.querySelector('.cpu-card');
        if (cpuUsage > 90) {
            cpuCard.classList.add('critical');
        } else if (cpuUsage > 80) {
            cpuCard.classList.add('warning');
        }

        // RAM
        const ramCard = document.querySelector('.ram-card');
        if (ramUsage > 90) {
            ramCard.classList.add('critical');
        } else if (ramUsage > 80) {
            ramCard.classList.add('warning');
        }

        // DISCO
        const diskCard = document.querySelector('.disk-card');
        if (diskUsage > 90) {
            diskCard.classList.add('critical');
        } else if (diskUsage > 80) {
            diskCard.classList.add('warning');
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

    // Limpeza ao sair
    destroy() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
        if (this.dataInterval) {
            clearInterval(this.dataInterval);
        }
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.smxLiveBoard = new SMXLiveBoard();
});

// Limpeza ao sair da página
window.addEventListener('beforeunload', () => {
    if (window.smxLiveBoard) {
        window.smxLiveBoard.destroy();
    }
});

