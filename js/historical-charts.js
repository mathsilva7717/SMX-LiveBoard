// Gráficos Históricos - SMX LiveBoard
class HistoricalCharts {
    constructor() {
        this.charts = {};
        this.historicalData = {
            cpu: [],
            memory: [],
            network: { download: [], upload: [] },
            disk: []
        };
        this.currentPeriod = '1h';
        this.maxDataPoints = 60; // 60 pontos para 1 hora (1 por minuto)
        this.lastUpdateTime = 0;
        this.updateThrottle = 1000; // Atualizar no máximo a cada 1 segundo
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeCharts();
        this.connectToBackend();
    }

    setupEventListeners() {
        // Controles de período
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPeriod = e.target.dataset.period;
                this.updateChartPeriod();
            });
        });
    }

    initializeCharts() {
        // Configuração comum para todos os gráficos
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false
                }
            },
            elements: {
                point: {
                    radius: 0
                },
                line: {
                    tension: 0.4
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        };

        // Gráfico de CPU
        this.charts.cpu = new Chart(document.getElementById('cpuHistoricalChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'CPU',
                    data: [],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: (context) => `CPU: ${context.parsed.y.toFixed(1)}%`
                        }
                    }
                }
            }
        });

        // Gráfico de Memória
        this.charts.memory = new Chart(document.getElementById('memoryHistoricalChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Memory',
                    data: [],
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: (context) => `RAM: ${(context.parsed.y / 1024 / 1024 / 1024).toFixed(2)} GB`
                        }
                    }
                }
            }
        });

        // Gráfico de Rede
        this.charts.network = new Chart(document.getElementById('networkHistoricalChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Download',
                        data: [],
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderWidth: 2,
                        fill: false
                    },
                    {
                        label: 'Upload',
                        data: [],
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        borderWidth: 2,
                        fill: false
                    }
                ]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = (context.parsed.y / 1024 / 1024).toFixed(2);
                                return `${context.dataset.label}: ${value} MB/s`;
                            }
                        }
                    }
                }
            }
        });

        // Gráfico de Disco
        this.charts.disk = new Chart(document.getElementById('diskHistoricalChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Disk',
                    data: [],
                    borderColor: '#ffaa00',
                    backgroundColor: 'rgba(255, 170, 0, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: (context) => `Disco: ${(context.parsed.y / 1024 / 1024 / 1024).toFixed(2)} GB`
                        }
                    }
                }
            }
        });
    }

    connectToBackend() {
        // Conectar com o Socket.IO para receber dados históricos
        if (window.smxLiveBoard && window.smxLiveBoard.socket) {
            const socket = window.smxLiveBoard.socket;
            
            // Escutar dados históricos do backend
            socket.on('historical:data', (data) => {
                // Verificar se os dados mudaram para evitar atualizações desnecessárias
                if (this.hasDataChanged(data)) {
                    this.historicalData = data;
                    this.updateCharts();
                }
            });
        } else {
            // Fallback: tentar conectar novamente em 1 segundo
            setTimeout(() => this.connectToBackend(), 1000);
        }
    }

    hasDataChanged(newData) {
        // Verificar se os dados realmente mudaram para otimizar performance
        if (!this.historicalData.cpu.length || !newData.cpu.length) {
            return true;
        }
        
        const lastCpu = this.historicalData.cpu[this.historicalData.cpu.length - 1];
        const newCpu = newData.cpu[newData.cpu.length - 1];
        
        return lastCpu.timestamp !== newCpu.timestamp;
    }

    generateHistoricalData() {
        // Removido: geração de dados simulados
        // Agora os dados históricos vêm do servidor real
        // Dados históricos serão carregados do servidor real
    }

    updateHistoricalData() {
        const now = new Date();
        
        // REMOVIDO: dados simulados
        // Os dados históricos agora vêm do servidor real

        // Manter apenas os dados do período atual
        this.trimDataToPeriod();
    }

    updateCharts() {
        const now = Date.now();
        
        // Throttling: só atualizar se passou tempo suficiente
        if (now - this.lastUpdateTime < this.updateThrottle) {
            return;
        }
        
        this.lastUpdateTime = now;
        const dataPoints = this.getDataPointsForPeriod();
        
        // Atualizar gráfico de CPU
        const cpuData = this.historicalData.cpu.slice(-dataPoints);
        if (cpuData.length > 0) {
            this.charts.cpu.data.labels = cpuData.map(d => this.formatTime(d.timestamp));
            this.charts.cpu.data.datasets[0].data = cpuData.map(d => d.value);
            this.charts.cpu.update('none');
        }

        // Atualizar gráfico de Memória
        const memoryData = this.historicalData.memory.slice(-dataPoints);
        if (memoryData.length > 0) {
            this.charts.memory.data.labels = memoryData.map(d => this.formatTime(d.timestamp));
            this.charts.memory.data.datasets[0].data = memoryData.map(d => d.value);
            this.charts.memory.update('none');
        }

        // Atualizar gráfico de Rede
        const downloadData = this.historicalData.network.download.slice(-dataPoints);
        const uploadData = this.historicalData.network.upload.slice(-dataPoints);
        if (downloadData.length > 0) {
            this.charts.network.data.labels = downloadData.map(d => this.formatTime(d.timestamp));
            this.charts.network.data.datasets[0].data = downloadData.map(d => d.value);
            this.charts.network.data.datasets[1].data = uploadData.map(d => d.value);
            this.charts.network.update('none');
        }

        // Atualizar gráfico de Disco
        const diskData = this.historicalData.disk.slice(-dataPoints);
        if (diskData.length > 0) {
            this.charts.disk.data.labels = diskData.map(d => this.formatTime(d.timestamp));
            this.charts.disk.data.datasets[0].data = diskData.map(d => d.value);
            this.charts.disk.update('none');
        }

        // Atualizar estatísticas
        this.updateStatistics();
    }

    updateStatistics() {
        const dataPoints = this.getDataPointsForPeriod();
        
        // Verificar se há dados suficientes
        if (this.historicalData.cpu.length === 0) {
            return;
        }
        
        // Estatísticas de CPU
        const cpuData = this.historicalData.cpu.slice(-dataPoints).map(d => d.value);
        const cpuStats = this.calculateAdvancedStats(cpuData);
        
        document.getElementById('cpuAvg').textContent = `${cpuStats.avg.toFixed(1)}%`;
        document.getElementById('cpuPeak').textContent = `${cpuStats.peak.toFixed(1)}%`;
        document.getElementById('cpuTrend').textContent = cpuStats.trend;

        // Estatísticas de Memória
        if (this.historicalData.memory.length > 0) {
            const memoryData = this.historicalData.memory.slice(-dataPoints).map(d => d.value);
            const memoryStats = this.calculateAdvancedStats(memoryData);
            
            document.getElementById('memoryAvg').textContent = `${memoryStats.avg.toFixed(1)}%`;
            document.getElementById('memoryPeak').textContent = `${memoryStats.peak.toFixed(1)}%`;
            document.getElementById('memoryTrend').textContent = memoryStats.trend;
        }

        // Estatísticas de Rede
        if (this.historicalData.network.download.length > 0) {
            const downloadData = this.historicalData.network.download.slice(-dataPoints).map(d => d.value);
            const uploadData = this.historicalData.network.upload.slice(-dataPoints).map(d => d.value);
            const downloadStats = this.calculateAdvancedStats(downloadData);
            const uploadStats = this.calculateAdvancedStats(uploadData);
            
            const totalDownload = downloadData.reduce((a, b) => a + b, 0);
            const totalUpload = uploadData.reduce((a, b) => a + b, 0);
            const avgSpeed = (downloadStats.avg + uploadStats.avg) / 2;
            
            document.getElementById('totalDownload').textContent = `${totalDownload.toFixed(1)} MB`;
            document.getElementById('totalUpload').textContent = `${totalUpload.toFixed(1)} MB`;
            document.getElementById('avgSpeed').textContent = `${avgSpeed.toFixed(2)} MB/s`;
        }

        // Estatísticas de Disco
        if (this.historicalData.disk.length > 0) {
            const diskData = this.historicalData.disk.slice(-dataPoints).map(d => d.value);
            const diskStats = this.calculateAdvancedStats(diskData);
            const diskUsed = diskData[diskData.length - 1] || 0;
            const diskGrowth = diskData.length > 1 ? (diskData[diskData.length - 1] - diskData[0]) / (dataPoints / 24) : 0;
            
            document.getElementById('diskUsed').textContent = `${diskUsed.toFixed(1)}%`;
            document.getElementById('diskFree').textContent = `${(100 - diskUsed).toFixed(1)}%`;
            document.getElementById('diskGrowth').textContent = `${diskGrowth.toFixed(2)}%/dia`;
        }
    }

    updateChartPeriod() {
        this.maxDataPoints = this.getDataPointsForPeriod();
        this.trimDataToPeriod();
        this.updateCharts();
    }

    getDataPointsForPeriod() {
        switch (this.currentPeriod) {
            case '1h': return 60;   // 1 ponto por minuto
            case '6h': return 360;  // 1 ponto por minuto
            case '24h': return 1440; // 1 ponto por minuto
            case '7d': return 168;  // 1 ponto por hora
            default: return 60;
        }
    }

    getIntervalMs() {
        switch (this.currentPeriod) {
            case '1h': return 60000;   // 1 minuto
            case '6h': return 60000;   // 1 minuto
            case '24h': return 60000;  // 1 minuto
            case '7d': return 3600000; // 1 hora
            default: return 60000;
        }
    }

    trimDataToPeriod() {
        const maxPoints = this.getDataPointsForPeriod();
        
        if (this.historicalData.cpu.length > maxPoints) {
            this.historicalData.cpu = this.historicalData.cpu.slice(-maxPoints);
        }
        if (this.historicalData.memory.length > maxPoints) {
            this.historicalData.memory = this.historicalData.memory.slice(-maxPoints);
        }
        if (this.historicalData.network.download.length > maxPoints) {
            this.historicalData.network.download = this.historicalData.network.download.slice(-maxPoints);
        }
        if (this.historicalData.network.upload.length > maxPoints) {
            this.historicalData.network.upload = this.historicalData.network.upload.slice(-maxPoints);
        }
        if (this.historicalData.disk.length > maxPoints) {
            this.historicalData.disk = this.historicalData.disk.slice(-maxPoints);
        }
    }

    calculateTrend(data) {
        if (data.length < 2) return '→';
        
        const first = data[0];
        const last = data[data.length - 1];
        const change = ((last - first) / first) * 100;
        
        if (change > 5) return '↗️';
        if (change < -5) return '↘️';
        return '→';
    }

    calculateAdvancedStats(data) {
        if (data.length === 0) return { avg: 0, peak: 0, min: 0, std: 0, trend: '→' };
        
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const peak = Math.max(...data);
        const min = Math.min(...data);
        
        // Calcular desvio padrão
        const variance = data.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / data.length;
        const std = Math.sqrt(variance);
        
        // Calcular tendência mais precisa
        const trend = this.calculateTrend(data);
        
        return { avg, peak, min, std, trend };
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        switch (this.currentPeriod) {
            case '1h':
            case '6h':
            case '24h':
                return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            case '7d':
                return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            default:
                return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
    }

    // REMOVIDO: métodos simulados - usando dados reais do servidor
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.historicalCharts = new HistoricalCharts();
});
