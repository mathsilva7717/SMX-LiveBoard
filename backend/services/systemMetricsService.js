const si = require('systeminformation');
const os = require('os');

class SystemMetricsService {
    constructor() {
        this.cpuHistory = [];
        this.memoryHistory = [];
        this.networkHistory = { download: [], upload: [] };
        this.diskHistory = [];
        this.maxHistoryPoints = 60; // 1 hora de dados (1 ponto por minuto)
    }

    async getAllMetrics() {
        try {
            // Coletar todas as métricas em paralelo
            const [
                cpu,
                memory,
                networkStats,
                diskStats,
                systemInfo
            ] = await Promise.all([
                this.getCpuMetrics(),
                this.getMemoryMetrics(),
                this.getNetworkMetrics(),
                this.getDiskMetrics(),
                this.getSystemInfo()
            ]);

            const result = {
                cpu,
                memory,
                network: networkStats,
                disk: diskStats,
                time: {
                    uptime: systemInfo.uptime
                },
                osInfo: {
                    networkLatency: systemInfo.networkLatency
                },
                timestamp: new Date().toISOString()
            };
            
            
            return result;
        } catch (error) {
            console.error('Erro ao coletar métricas:', error);
            throw error;
        }
    }

    async getCpuMetrics() {
        try {
            const cpuData = await si.currentLoad();
            let loadAverage = { avgLoad: 0 };
            let cpuFreq = { avg: 0 };
            
            try {
                // Coletar Load Average (carga média do sistema)
                loadAverage = await si.currentLoad();
            } catch (loadError) {
                console.warn('❌ Erro ao obter load average:', loadError.message);
            }
            
            try {
                cpuFreq = await si.cpuCurrentSpeed();
            } catch (freqError) {
                console.warn('❌ Erro ao obter frequência da CPU:', freqError.message);
            }

            const cpuUsage = Math.round(cpuData.currentLoad || 0);
            const loadAvg = loadAverage?.avgLoad || 0;
            const frequency = cpuFreq?.avg || 0;

            // Adicionar ao histórico
            this.cpuHistory.push({
                timestamp: new Date().toISOString(),
                usage: cpuUsage,
                loadAverage: loadAvg,
                frequency: frequency
            });

            // Manter apenas os últimos pontos
            if (this.cpuHistory.length > this.maxHistoryPoints) {
                this.cpuHistory.shift();
            }

            const result = {
                usage: cpuUsage,
                loadAverage: loadAvg,
                frequency: frequency,
                cores: cpuData.cpus?.length || os.cpus().length,
                history: this.cpuHistory.slice(-20) // Últimos 20 pontos
            };
            
            return result;
        } catch (error) {
            console.error('Erro ao coletar métricas de CPU:', error);
            return {
                usage: 0,
                loadAverage: 0,
                frequency: 0,
                cores: 1,
                history: []
            };
        }
    }

    async getMemoryMetrics() {
        try {
            const memData = await si.mem();
            
            const totalMemory = memData.total;
            const usedMemory = memData.used;
            const freeMemory = memData.free;
            const memoryUsage = Math.round((usedMemory / totalMemory) * 100);

            // Adicionar ao histórico
            this.memoryHistory.push({
                timestamp: new Date().toISOString(),
                used: usedMemory,
                total: totalMemory,
                usage: memoryUsage
            });

            // Manter apenas os últimos pontos
            if (this.memoryHistory.length > this.maxHistoryPoints) {
                this.memoryHistory.shift();
            }

            return {
                total: totalMemory,
                used: usedMemory,
                free: freeMemory,
                usage: memoryUsage,
                history: this.memoryHistory.slice(-20)
            };
        } catch (error) {
            console.error('Erro ao coletar métricas de memória:', error);
            return {
                total: 0,
                used: 0,
                free: 0,
                usage: 0,
                history: []
            };
        }
    }

    async getNetworkMetrics() {
        try {
            const networkStats = await si.networkStats();
            const networkInterfaces = await si.networkInterfaces();
            
            // Encontrar interface ativa (não loopback)
            const activeInterface = networkInterfaces.find(iface => 
                !iface.internal && iface.operstate === 'up'
            );

            if (!activeInterface || !networkStats.length) {
                return {
                    download: 0,
                    upload: 0,
                    downloadSpeed: 0,
                    uploadSpeed: 0,
                    interface: 'N/A',
                    history: { download: [], upload: [] }
                };
            }

            const stats = networkStats[0];
            const downloadSpeed = Math.round((stats.rx_sec || 0) * 100) / 100; // Manter em bytes/s
            const uploadSpeed = Math.round((stats.tx_sec || 0) * 100) / 100; // Manter em bytes/s

            // Adicionar ao histórico
            this.networkHistory.download.push({
                timestamp: new Date().toISOString(),
                speed: downloadSpeed
            });
            this.networkHistory.upload.push({
                timestamp: new Date().toISOString(),
                speed: uploadSpeed
            });

            // Manter apenas os últimos pontos
            if (this.networkHistory.download.length > this.maxHistoryPoints) {
                this.networkHistory.download.shift();
                this.networkHistory.upload.shift();
            }

            return {
                download: stats.rx_bytes || 0,
                upload: stats.tx_bytes || 0,
                downloadSpeed: downloadSpeed,
                uploadSpeed: uploadSpeed,
                interface: activeInterface.iface,
                history: {
                    download: this.networkHistory.download.slice(-20),
                    upload: this.networkHistory.upload.slice(-20)
                }
            };
        } catch (error) {
            console.error('Erro ao coletar métricas de rede:', error);
            return {
                download: 0,
                upload: 0,
                downloadSpeed: 0,
                uploadSpeed: 0,
                interface: 'N/A',
                history: { download: [], upload: [] }
            };
        }
    }

    async getDiskMetrics() {
        try {
            const diskStats = await si.fsSize();
            let diskIO = null;
            
            try {
                diskIO = await si.disksIO();
            } catch (ioError) {
                console.warn('Erro ao obter estatísticas de I/O do disco:', ioError.message);
            }

            if (!diskStats.length) {
                return {
                    total: 0,
                    used: 0,
                    free: 0,
                    usage: 0,
                    readSpeed: 0,
                    writeSpeed: 0,
                    history: []
                };
            }

            const mainDisk = diskStats[0]; // Disco principal
            const totalSpace = mainDisk.size;
            const usedSpace = mainDisk.used;
            // Calcular espaço livre como total - usado para consistência
            const freeSpace = totalSpace - usedSpace;
            const diskUsage = Math.round((usedSpace / totalSpace) * 100);
            

            // Adicionar ao histórico
            this.diskHistory.push({
                timestamp: new Date().toISOString(),
                used: usedSpace,
                total: totalSpace,
                usage: diskUsage
            });

            // Manter apenas os últimos pontos
            if (this.diskHistory.length > this.maxHistoryPoints) {
                this.diskHistory.shift();
            }

            return {
                total: totalSpace,
                used: usedSpace,
                free: freeSpace,
                usage: diskUsage,
                readSpeed: diskIO?.rIO_sec || 0,
                writeSpeed: diskIO?.wIO_sec || 0,
                history: this.diskHistory.slice(-20)
            };
        } catch (error) {
            console.error('Erro ao coletar métricas de disco:', error);
            return {
                total: 0,
                used: 0,
                free: 0,
                usage: 0,
                readSpeed: 0,
                writeSpeed: 0,
                history: []
            };
        }
    }

    async getSystemInfo() {
        try {
            const systemData = await si.system();
            const osInfo = await si.osInfo();
            const timeData = await si.time();
            
            // Medir latência de rede real
            const networkLatency = await this.measureNetworkLatency();

            const uptimeHours = Math.floor(timeData.uptime / 3600);
            const uptimeDays = Math.floor(uptimeHours / 24);
            const remainingHours = uptimeHours % 24;
            
            const result = {
                platform: osInfo.platform,
                distro: osInfo.distro,
                release: osInfo.release,
                arch: osInfo.arch,
                hostname: systemData.model || os.hostname(),
                manufacturer: systemData.manufacturer || 'Unknown',
                model: systemData.model || 'Unknown',
                serial: systemData.serial || 'Unknown',
                uptime: timeData.uptime,
                timezone: timeData.timezone,
                nodeVersion: process.version,
                currentUser: os.userInfo().username,
                currentDir: process.cwd(),
                networkLatency: networkLatency
            };
            
            return result;
        } catch (error) {
            console.error('Erro ao coletar informações do sistema:', error);
            return {
                platform: os.platform(),
                distro: 'Unknown',
                release: os.release(),
                arch: os.arch(),
                hostname: os.hostname(),
                manufacturer: 'Unknown',
                model: 'Unknown',
                serial: 'Unknown',
                uptime: os.uptime(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                nodeVersion: process.version,
                currentUser: os.userInfo().username,
                currentDir: process.cwd(),
                networkLatency: 0
            };
        }
    }

    // Medir latência de rede real
    async measureNetworkLatency() {
        try {
            const dns = require('dns');
            const { promisify } = require('util');
            const dnsLookup = promisify(dns.lookup);
            
            const startTime = process.hrtime.bigint();
            
            // Tentar resolver um DNS público
            await dnsLookup('google.com');
            
            const endTime = process.hrtime.bigint();
            const latencyMs = Number(endTime - startTime) / 1000000; // Converter para milissegundos
            const roundedLatency = Math.round(latencyMs);
            
            return roundedLatency;
        } catch (error) {
            console.warn('❌ Erro ao medir latência de rede:', error.message);
            return 0;
        }
    }

    // Métodos para obter histórico
    getCpuHistory() {
        return this.cpuHistory;
    }

    getMemoryHistory() {
        return this.memoryHistory;
    }

    getNetworkHistory() {
        return this.networkHistory;
    }

    getDiskHistory() {
        return this.diskHistory;
    }

    // Limpar histórico
    clearHistory() {
        this.cpuHistory = [];
        this.memoryHistory = [];
        this.networkHistory = { download: [], upload: [] };
        this.diskHistory = [];
    }
}

module.exports = SystemMetricsService;
