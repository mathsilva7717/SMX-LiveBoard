const si = require('systeminformation');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const logger = require('../utils/logger');

class MonitorService {
    constructor() {
        this.data = {};
        this.isCollecting = false;
        this.cache = {
            // Cache de dados básicos (rápido)
            basicInfo: null,
            lastBasicUpdate: 0,
            basicTtl: 30000, // 30 segundos (OTIMIZADO)
            
            // Cache de dados completos
            fullInfo: null,
            lastFullUpdate: 0,
            fullTtl: 15000, // 15 segundos (OTIMIZADO)
            
            // Cache de dados estáticos (raramente mudam)
            staticInfo: null,
            lastStaticUpdate: 0,
            staticTtl: 300000, // 5 minutos
            
            // Cache de dados de sistema (mudam ocasionalmente)
            systemInfo: null,
            lastSystemUpdate: 0,
            systemTtl: 60000, // 1 minuto
            
            // Cache de dados de rede (mudam ocasionalmente)
            networkInfo: null,
            lastNetworkUpdate: 0,
            networkTtl: 30000, // 30 segundos
            
            // Cache específico para ping (mais longo)
            pingInfo: null,
            lastPingUpdate: 0,
            pingTtl: 60000, // 60 segundos (ping menos frequente)
            
            // Cache de dados de disco (mudam ocasionalmente)
            diskInfo: null,
            lastDiskUpdate: 0,
            diskTtl: 60000, // 1 minuto
            
            // Cache de dados de processos (mudam frequentemente, mas coletamos com menos frequência)
            processesInfo: null,
            lastProcessesUpdate: 0,
            processesTtl: 20000 // 20 segundos (OTIMIZADO)
        };
        
        // Métricas de performance do próprio sistema
        this.performanceMetrics = {
            collectionTimes: {
                basicInfo: [],
                fullInfo: [],
                processes: [],
                staticInfo: []
            },
            errorCounts: {
                total: 0,
                byType: {}
            },
            cacheHitRates: {
                basicInfo: { hits: 0, misses: 0 },
                fullInfo: { hits: 0, misses: 0 },
                staticInfo: { hits: 0, misses: 0 },
                systemInfo: { hits: 0, misses: 0 },
                networkInfo: { hits: 0, misses: 0 },
                diskInfo: { hits: 0, misses: 0 }
            },
            startTime: Date.now(),
            lastReset: Date.now()
        };
    }

    // Métodos para rastrear performance
    recordCollectionTime(type, duration) {
        if (!this.performanceMetrics.collectionTimes[type]) {
            this.performanceMetrics.collectionTimes[type] = [];
        }
        
        this.performanceMetrics.collectionTimes[type].push(duration);
        
        // Manter apenas os últimos 100 registros
        if (this.performanceMetrics.collectionTimes[type].length > 100) {
            this.performanceMetrics.collectionTimes[type].shift();
        }
    }

    recordCacheHit(cacheType, isHit) {
        if (!this.performanceMetrics.cacheHitRates[cacheType]) {
            this.performanceMetrics.cacheHitRates[cacheType] = { hits: 0, misses: 0 };
        }
        
        if (isHit) {
            this.performanceMetrics.cacheHitRates[cacheType].hits++;
        } else {
            this.performanceMetrics.cacheHitRates[cacheType].misses++;
        }
    }

    recordError(errorType, error) {
        this.performanceMetrics.errorCounts.total++;
        
        if (!this.performanceMetrics.errorCounts.byType[errorType]) {
            this.performanceMetrics.errorCounts.byType[errorType] = 0;
        }
        this.performanceMetrics.errorCounts.byType[errorType]++;
        
        // Log apenas erros críticos
        if (errorType.includes('critical') || errorType.includes('fatal')) {
            console.error(`🚨 Erro crítico [${errorType}]:`, error.message);
        }
    }

  // Obter estatísticas de performance
  getPerformanceStats() {
    const now = Date.now();
    const uptime = now - this.performanceMetrics.startTime;
    
    // Calcular tempos médios de coleta
    const avgCollectionTimes = {};
    Object.keys(this.performanceMetrics.collectionTimes).forEach(type => {
      const times = this.performanceMetrics.collectionTimes[type];
      if (times.length > 0) {
        avgCollectionTimes[type] = {
          average: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
          min: Math.min(...times),
          max: Math.max(...times),
          count: times.length
        };
      }
    });
    
    // Calcular taxas de cache hit
    const cacheHitRates = {};
    Object.keys(this.performanceMetrics.cacheHitRates).forEach(type => {
      const stats = this.performanceMetrics.cacheHitRates[type];
      const total = stats.hits + stats.misses;
      cacheHitRates[type] = {
        hitRate: total > 0 ? Math.round((stats.hits / total) * 100) : 0,
        hits: stats.hits,
        misses: stats.misses,
        total: total
      };
    });
    
    return {
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      collectionTimes: avgCollectionTimes,
      cacheHitRates: cacheHitRates,
      errorStats: {
        total: this.performanceMetrics.errorCounts.total,
        byType: this.performanceMetrics.errorCounts.byType,
        errorRate: Math.round((this.performanceMetrics.errorCounts.total / (uptime / 1000)) * 100) / 100
      },
      memoryUsage: process.memoryUsage(),
      lastReset: new Date(this.performanceMetrics.lastReset).toISOString(),
      timestamp: new Date().toISOString()
    };
  }

  // Formatar uptime
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // Resetar métricas de performance
  resetPerformanceMetrics() {
    this.performanceMetrics = {
      collectionTimes: {
        basicInfo: [],
        fullInfo: [],
        processes: [],
        staticInfo: []
      },
      errorCounts: {
        total: 0,
        byType: {}
      },
      cacheHitRates: {
        basicInfo: { hits: 0, misses: 0 },
        fullInfo: { hits: 0, misses: 0 },
        staticInfo: { hits: 0, misses: 0 },
        systemInfo: { hits: 0, misses: 0 },
        networkInfo: { hits: 0, misses: 0 },
        diskInfo: { hits: 0, misses: 0 }
      },
      startTime: Date.now(),
      lastReset: Date.now()
    };
  }

  // Verificar alertas de performance
  checkPerformanceAlerts() {
    const alerts = [];
    const stats = this.getPerformanceStats();
    
    // Alert: Tempo de coleta muito alto
    Object.keys(stats.collectionTimes).forEach(type => {
      const timeStats = stats.collectionTimes[type];
      if (timeStats.average > 5000) { // Mais de 5 segundos
        alerts.push({
          type: 'performance',
          severity: 'warning',
          message: `Coleta de ${type} está lenta: ${timeStats.average}ms (média)`,
          data: timeStats
        });
      }
    });
    
    // Alert: Taxa de cache hit muito baixa
    Object.keys(stats.cacheHitRates).forEach(type => {
      const cacheStats = stats.cacheHitRates[type];
      if (cacheStats.total > 10 && cacheStats.hitRate < 50) { // Menos de 50% hit rate
        alerts.push({
          type: 'cache',
          severity: 'info',
          message: `Cache ${type} com baixa eficiência: ${cacheStats.hitRate}% hit rate`,
          data: cacheStats
        });
      }
    });
    
    // Alert: Muitos erros
    if (stats.errorStats.total > 10) {
      alerts.push({
        type: 'error',
        severity: 'warning',
        message: `Muitos erros detectados: ${stats.errorStats.total} erros`,
        data: stats.errorStats
      });
    }
    
    // Alert: Uso de memória alto
    const memUsage = stats.memoryUsage;
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;
    if (memUsageMB > 100) { // Mais de 100MB
      alerts.push({
        type: 'memory',
        severity: 'warning',
        message: `Uso de memória alto: ${Math.round(memUsageMB)}MB`,
        data: { heapUsed: memUsageMB, heapTotal: memUsage.heapTotal / 1024 / 1024 }
      });
    }
    
    return alerts;
  }

  // Coleta básica e rápida para inicialização
  async getBasicSystemInfo() {
    const startTime = Date.now();
    try {
      // Verificar cache primeiro
      const now = Date.now();
      if (this.cache.basicInfo && (now - this.cache.lastBasicUpdate) < this.cache.basicTtl) {
        this.recordCacheHit('basicInfo', true);
        return this.cache.basicInfo;
      }
      
      this.recordCacheHit('basicInfo', false);

      // Coletar APENAS dados essenciais e rápidos
      const [memory, staticInfo] = await Promise.all([
        si.mem(),
        this.getStaticSystemInfo() // Usar cache de dados estáticos
      ]);

      const result = {
        timestamp: Date.now(),
        cpu: {
          model: staticInfo.cpu.model,
          cores: staticInfo.cpu.cores,
          usage: 0, // Será preenchido pelos dados completos
          frequency: 0,
          loadAverage: 0,
          status: 'loading' // Loading até receber dados completos
        },
        memory: {
          total: memory.total,
          used: memory.used,
          free: memory.free,
          usage: Math.round((memory.used / memory.total) * 100),
          status: memory.total ? 'ready' : 'loading'
        },
        network: {
          interface: 'loading...',
          ipAddress: 'loading...',
          status: 'loading'
        },
        disk: {
          total: 0,
          used: 0,
          free: 0,
          usage: 0,
          name: 'loading...',
          type: 'loading...',
          status: 'loading'
        },
        time: {
          uptime: os.uptime()
        },
        osInfo: {
          platform: staticInfo.os.platform,
          hostname: staticInfo.os.hostname,
          nodeVersion: staticInfo.os.nodeVersion,
          currentUser: os.userInfo().username
        },
        processes: {
          list: [],
          totals: { cpu: 0, memory: 0, count: 0 },
          status: 'loading' // Indicar que está carregando
        }
      };

      // Atualizar cache
      this.cache.basicInfo = result;
      this.cache.lastBasicUpdate = now;

      // Registrar tempo de coleta
      const duration = Date.now() - startTime;
      this.recordCollectionTime('basicInfo', duration);

      return result;
    } catch (error) {
      this.recordError('basicInfo_collection', error);
      console.error('Erro na coleta básica:', error);
      throw error;
    }
  }

  // Método para obter dados estáticos (CPU info, sistema, etc.)
  async getStaticSystemInfo() {
    try {
      const now = Date.now();
      if (this.cache.staticInfo && (now - this.cache.lastStaticUpdate) < this.cache.staticTtl) {
        return this.cache.staticInfo;
      }

      // Coletar apenas dados que raramente mudam
      const [cpuInfo, systemData, osInfo] = await Promise.all([
        si.cpu(),
        si.system(),
        si.osInfo()
      ]);

      const result = {
        cpu: {
          model: cpuInfo.model || 'Unknown',
          manufacturer: cpuInfo.manufacturer || 'Unknown',
          brand: cpuInfo.brand || 'Unknown',
          cores: cpuInfo.cores || os.cpus().length,
          physicalCores: cpuInfo.physicalCores || cpuInfo.cores || 1,
          speed: cpuInfo.speed || 0,
          cache: cpuInfo.cache || {}
        },
        system: {
          manufacturer: systemData.manufacturer || 'Unknown',
          model: systemData.model || 'Unknown',
          serial: systemData.serial || 'Unknown'
        },
        os: {
          platform: osInfo.platform,
          distro: osInfo.distro,
          release: osInfo.release,
          arch: osInfo.arch,
          hostname: osInfo.hostname,
          nodeVersion: process.version
        }
      };

      // Atualizar cache
      this.cache.staticInfo = result;
      this.cache.lastStaticUpdate = now;

      return result;
    } catch (error) {
      console.error('Erro ao coletar dados estáticos:', error);
      throw error;
    }
  }

  // Método para obter dados de sistema (mudam ocasionalmente)
  async getSystemInfoCached() {
    try {
      const now = Date.now();
      if (this.cache.systemInfo && (now - this.cache.lastSystemUpdate) < this.cache.systemTtl) {
        return this.cache.systemInfo;
      }

      const [timeData, memLayout] = await Promise.all([
        si.time(),
        si.memLayout()
      ]);

      const result = {
        time: {
          uptime: timeData.uptime,
          timezone: timeData.timezone
        },
        memory: {
          type: this.getMemoryType(memLayout)
        },
        currentUser: os.userInfo().username,
        currentDir: process.cwd()
      };

      // Atualizar cache
      this.cache.systemInfo = result;
      this.cache.lastSystemUpdate = now;

      return result;
    } catch (error) {
      console.error('Erro ao coletar dados de sistema:', error);
      throw error;
    }
  }

  // Método para obter dados de rede (mudam ocasionalmente)
  async getNetworkInfoCached() {
    try {
      const now = Date.now();
      if (this.cache.networkInfo && (now - this.cache.lastNetworkUpdate) < this.cache.networkTtl) {
        return this.cache.networkInfo;
      }

      const [networkStats, networkInterfaces] = await Promise.all([
        si.networkStats(),
        si.networkInterfaces()
      ]);

      // Encontrar interface de rede ativa
      const activeInterface = networkInterfaces.find(iface => 
        iface.default && iface.operstate === 'up'
      ) || networkInterfaces.find(iface => 
        iface.operstate === 'up' && !iface.internal
      ) || networkInterfaces[0];

      const networkStatsData = networkStats.find(stat => 
        stat.iface === activeInterface?.iface
      ) || networkStats[0];

      const result = {
        interface: activeInterface?.iface || 'unknown',
        ipAddress: activeInterface?.ip4 || activeInterface?.ip6 || 'N/A',
        type: activeInterface?.type || 'unknown',
        operstate: activeInterface?.operstate || 'unknown',
        latency: await this.measureNetworkLatency(),
        download: Math.round((networkStatsData?.rx_sec || 0) / 1024 / 1024 * 8 * 100) / 100, // Mbps
        upload: Math.round((networkStatsData?.tx_sec || 0) / 1024 / 1024 * 8 * 100) / 100, // Mbps
        totalDownload: networkStatsData?.rx_bytes || 0,
        totalUpload: networkStatsData?.tx_bytes || 0
      };

      // Atualizar cache
      this.cache.networkInfo = result;
      this.cache.lastNetworkUpdate = now;

      return result;
    } catch (error) {
      console.error('Erro ao coletar dados de rede:', error);
      throw error;
    }
  }

  // Método para obter dados de disco (mudam ocasionalmente)
  async getDiskInfoCached() {
    try {
      const now = Date.now();
      if (this.cache.diskInfo && (now - this.cache.lastDiskUpdate) < this.cache.diskTtl) {
        return this.cache.diskInfo;
      }

      const [diskLayout, fsSize] = await Promise.all([
        si.diskLayout(),
        si.fsSize()
      ]);

      const result = this.getDiskInfo(diskLayout, fsSize);

      // Atualizar cache
      this.cache.diskInfo = result;
      this.cache.lastDiskUpdate = now;

      return result;
    } catch (error) {
      console.error('Erro ao coletar dados de disco:', error);
      throw error;
    }
  }

  // Método para coletar apenas processos (usado em background) com cache
  async getProcessesOnly(limit = 5) {
    const startTime = Date.now();
    try {
      // Verificar cache primeiro
      const now = Date.now();
      if (this.cache.processesInfo && (now - this.cache.lastProcessesUpdate) < this.cache.processesTtl) {
        return {
          processes: this.cache.processesInfo,
          timestamp: this.cache.lastProcessesUpdate,
          fromCache: true
        };
      }
      
      const processes = await this.getProcessesSafe(limit);
      
      // Atualizar cache
      this.cache.processesInfo = processes;
      this.cache.lastProcessesUpdate = now;
      
      // Registrar tempo de coleta
      const duration = Date.now() - startTime;
      this.recordCollectionTime('processes', duration);
      
      return {
        processes: processes,
        timestamp: Date.now(),
        fromCache: false
      };
    } catch (error) {
      this.recordError('processes_collection', error);
      console.error('Erro ao coletar processos:', error);
      return {
        processes: {
          list: [],
          totals: { cpu: 0, memory: 0, count: 0 }
        },
        timestamp: Date.now(),
        fromCache: false
      };
    }
  }

  async getSystemInfo() {
    const startTime = Date.now();
    try {
      // Verificar cache primeiro
      const now = Date.now();
      if (this.cache.fullInfo && (now - this.cache.lastFullUpdate) < this.cache.fullTtl) {
        this.recordCacheHit('fullInfo', true);
        return this.cache.fullInfo;
      }
      
      this.recordCacheHit('fullInfo', false);

      // Coletar dados dinâmicos (que mudam frequentemente)
      const [memory, cpuData] = await Promise.all([
        si.mem(),
        this.getCpuMetrics()
      ]);

      // Coletar dados em cache (que mudam ocasionalmente)
      const [staticInfo, systemInfo, networkInfo, diskInfo] = await Promise.all([
        this.getStaticSystemInfo(),
        this.getSystemInfoCached(),
        this.getNetworkInfoCached(),
        this.getDiskInfoCached()
      ]);

      // Coletar processos (mais pesado, fazer por último)
      const processes = await this.getProcessesSafe(5);
      
      const result = {
        timestamp: Date.now(),
        cpu: {
          ...staticInfo.cpu,
          usage: cpuData.usage,
          loadAverage: cpuData.loadAverage,
          frequency: cpuData.frequency,
          frequencyDetails: cpuData.frequencyDetails
        },
        memory: {
          total: memory.total,
          used: memory.used,
          free: memory.free,
          usage: Math.round((memory.used / memory.total) * 100),
          type: systemInfo.memory.type
        },
        network: networkInfo,
        disk: diskInfo,
        time: systemInfo.time,
        osInfo: {
          ...staticInfo.os,
          ...staticInfo.system,
          currentUser: systemInfo.currentUser,
          currentDir: systemInfo.currentDir,
          networkLatency: networkInfo.latency
        },
        processes: processes
      };
      
      // Atualizar cache
      this.cache.fullInfo = result;
      this.cache.lastFullUpdate = Date.now();
      
      // Registrar tempo de coleta
      const duration = Date.now() - startTime;
      this.recordCollectionTime('fullInfo', duration);
      
      return result;
    } catch (error) {
      this.recordError('fullInfo_collection', error);
      console.error('Erro ao coletar dados do sistema:', error);
      throw error;
    }
  }

  // Método para limpar cache específico ou todo o cache
  clearCache(cacheType = 'all') {
    const now = Date.now();
    
    if (cacheType === 'all') {
      // Limpar todo o cache
      Object.keys(this.cache).forEach(key => {
        if (key.endsWith('Info')) {
          this.cache[key] = null;
        }
        if (key.startsWith('last') && key.endsWith('Update')) {
          this.cache[key] = 0;
        }
      });
    } else {
      // Limpar cache específico
      const cacheKey = cacheType + 'Info';
      const lastUpdateKey = 'last' + cacheType.charAt(0).toUpperCase() + cacheType.slice(1) + 'Update';
      
      if (this.cache[cacheKey]) {
        this.cache[cacheKey] = null;
        this.cache[lastUpdateKey] = 0;
      }
    }
  }

  // Método para obter estatísticas do cache
  getCacheStats() {
    const now = Date.now();
    const stats = {};
    
    Object.keys(this.cache).forEach(key => {
      if (key.endsWith('Info') && this.cache[key]) {
        const lastUpdateKey = 'last' + key.replace('Info', 'Update');
        const ttlKey = key.replace('Info', 'Ttl');
        
        const lastUpdate = this.cache[lastUpdateKey] || 0;
        const ttl = this.cache[ttlKey] || 0;
        const age = now - lastUpdate;
        const isExpired = age > ttl;
        
        stats[key] = {
          hasData: !!this.cache[key],
          age: age,
          ttl: ttl,
          isExpired: isExpired,
          lastUpdate: new Date(lastUpdate).toISOString()
        };
      }
    });
    
    return stats;
  }

  getDiskInfo(diskLayout, fsSize) {
    try {
      // Se não há discos, retornar dados padrão
      if (!diskLayout || diskLayout.length === 0 || !fsSize || fsSize.length === 0) {
        return {
          total: 0,
          used: 0,
          free: 0,
          usage: 0,
          name: 'Disco Desconhecido',
          type: 'Desconhecido',
          totalDisks: 0
        };
      }

      // Se há apenas um disco, usar ele
      if (diskLayout.length === 1) {
        return {
          total: fsSize[0]?.size || 0,
          used: fsSize[0]?.used || 0,
          free: fsSize[0]?.available || 0,
          usage: fsSize[0] ? Math.round((fsSize[0].used / fsSize[0].size) * 100) : 0,
          name: diskLayout[0]?.name || 'Disco Desconhecido',
          type: diskLayout[0]?.type || 'Desconhecido',
          totalDisks: 1
        };
      }

      // Para múltiplos discos, implementar lógica de seleção inteligente
      const mainDisk = this.selectMainDisk(diskLayout, fsSize);
      
      return {
        total: mainDisk.fsSize?.size || 0,
        used: mainDisk.fsSize?.used || 0,
        free: mainDisk.fsSize?.available || 0,
        usage: mainDisk.fsSize ? Math.round((mainDisk.fsSize.used / mainDisk.fsSize.size) * 100) : 0,
        name: mainDisk.diskLayout?.name || 'Disco Desconhecido',
        type: mainDisk.diskLayout?.type || 'Desconhecido',
        totalDisks: diskLayout.length,
        allDisks: diskLayout.map((disk, index) => ({
          name: disk.name || 'Disco Desconhecido',
          type: disk.type || 'Desconhecido',
          size: disk.size || 0,
          isMain: index === mainDisk.index
        }))
      };
    } catch (error) {
      console.error('Erro ao processar informações de disco:', error);
      return {
        total: 0,
        used: 0,
        free: 0,
        usage: 0,
        name: 'Erro ao carregar',
        type: 'Erro',
        totalDisks: 0
      };
    }
  }

  selectMainDisk(diskLayout, fsSize) {
    // Prioridades para seleção do disco principal:
    // 1. Disco do sistema (C: no Windows)
    // 2. SSD sobre HDD
    // 3. Disco maior
    // 4. Primeiro disco disponível

    let bestDisk = { index: 0, score: 0 };
    
    diskLayout.forEach((disk, index) => {
      let score = 0;
      
      // Priorizar disco do sistema (C:)
      if (disk.mount === 'C:' || disk.mount === '/' || disk.mountpoint === 'C:' || disk.mountpoint === '/') {
        score += 1000;
      }
      
      // Priorizar SSDs
      const diskType = (disk.type || '').toLowerCase();
      if (diskType.includes('ssd') || diskType.includes('nvme') || diskType.includes('m.2')) {
        score += 500;
      } else if (diskType.includes('hdd') || diskType.includes('hard')) {
        score += 100;
      }
      
      // Priorizar discos maiores
      const size = disk.size || 0;
      if (size > 0) {
        score += Math.log10(size / (1024 * 1024 * 1024)) * 100; // Log do tamanho em GB
      }
      
      // Priorizar discos com informações completas
      if (disk.name && disk.name !== 'Unknown') {
        score += 50;
      }
      
      if (score > bestDisk.score) {
        bestDisk = { index, score };
      }
    });
    
    return {
      index: bestDisk.index,
      diskLayout: diskLayout[bestDisk.index],
      fsSize: fsSize[bestDisk.index] || fsSize[0]
    };
  }

  getMemoryType(memLayout) {
    try {
      if (!memLayout || memLayout.length === 0) {
        return 'Desconhecido';
      }

      // Pegar o primeiro módulo de memória (geralmente todos são do mesmo tipo)
      const firstModule = memLayout[0];
      
      if (firstModule && firstModule.type) {
        return firstModule.type;
      }

      // Fallback: tentar encontrar qualquer módulo com tipo
      const moduleWithType = memLayout.find(module => module.type && module.type !== 'Unknown');
      if (moduleWithType) {
        return moduleWithType.type;
      }

      return 'Desconhecido';
    } catch (error) {
      console.error('Erro ao obter tipo de memória:', error);
      return 'Desconhecido';
    }
  }

  // Método alternativo para obter uso da CPU no Windows
  async getCpuUsageAlternative() {
    try {
      // Método 1: Usar si.cpu() com cálculo manual
      const cpuInfo = await si.cpu();
      const cpus = os.cpus();
      
      if (cpus && cpus.length > 0) {
        // Calcular uso baseado nos tempos de CPU
        let totalIdle = 0;
        let totalTick = 0;
        
        cpus.forEach(cpu => {
          for (let type in cpu.times) {
            totalTick += cpu.times[type];
          }
          totalIdle += cpu.times.idle;
        });
        
        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        const usage = 100 - Math.round(100 * idle / total);
        
        return {
          currentload: Math.max(0, Math.min(100, usage)),
          avgLoad: 0 // Não temos load average real
        };
      }
      
      // Método 2: Usar wmic no Windows
      try {
        const { stdout } = await execAsync('wmic cpu get loadpercentage /value');
        const match = stdout.match(/LoadPercentage=(\d+)/);
        if (match) {
          const usage = parseInt(match[1]);
          return {
            currentload: usage,
            avgLoad: 0
          };
        }
      } catch (wmicError) {
        // Silenciar erro do wmic
      }
      
      // Método 3: Usar PowerShell
      try {
        const { stdout } = await execAsync('powershell "Get-Counter \'\\Processor(_Total)\\% Processor Time\' | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue"');
        const usage = parseFloat(stdout.trim());
        if (!isNaN(usage)) {
          return {
            currentload: Math.round(usage),
            avgLoad: 0
          };
        }
      } catch (psError) {
        // Silenciar erro do PowerShell
      }
      
      // Fallback: retornar 0
      return { currentload: 0, avgLoad: 0 };
      
    } catch (error) {
      console.error('❌ Erro no método alternativo de CPU:', error.message);
      return { currentload: 0, avgLoad: 0 };
    }
  }

  async getCpuMetrics() {
    try {
      // Coletar dados básicos da CPU
      const cpuInfo = await si.cpu();
      
      // Coletar uso da CPU
      let cpuUsage = 0;
      try {
        const loadData = await si.currentLoad();
        // Usar currentLoad (com L maiúsculo) que é o campo correto
        cpuUsage = Math.round(loadData?.currentLoad || 0);
        
        // Se currentLoad está undefined, usar método alternativo
        if (loadData?.currentLoad === undefined || loadData?.currentLoad === null) {
          const altData = await this.getCpuUsageAlternative();
          cpuUsage = Math.round(altData?.currentload || 0);
        }
      } catch (loadError) {
        console.warn('❌ Erro ao obter uso da CPU:', loadError.message);
        const altData = await this.getCpuUsageAlternative();
        cpuUsage = Math.round(altData?.currentload || 0);
      }

      // Coletar frequência da CPU
      let cpuFreq = { avg: 0, min: 0, max: 0 };
      try {
        cpuFreq = await si.cpuCurrentSpeed();
      } catch (freqError) {
        console.warn('❌ Erro ao obter frequência da CPU:', freqError.message);
        if (cpuInfo && cpuInfo.speed) {
          cpuFreq = { avg: cpuInfo.speed, min: cpuInfo.speed, max: cpuInfo.speed };
        }
      }

      // Calcular load average
      let loadAvg = 0;
      try {
        const loadData = await si.currentLoad();
        loadAvg = loadData?.avgLoad || 0;
        
        // Se avgLoad é 0 (comum no Windows), calcular baseado no uso da CPU
        if (loadAvg === 0 && cpuUsage > 0) {
          const cores = cpuInfo.cores || os.cpus().length || 1;
          // Aproximação: load average ≈ (CPU usage / 100) * número de cores
          loadAvg = Math.round((cpuUsage / 100) * cores * 100) / 100;
        }
      } catch (loadError) {
        console.warn('❌ Erro ao calcular load average:', loadError.message);
      }

      const result = {
        usage: cpuUsage,
        loadAverage: loadAvg,
        frequency: cpuFreq?.avg || 0,
        frequencyDetails: {
          avg: cpuFreq?.avg || 0,
          min: cpuFreq?.min || 0,
          max: cpuFreq?.max || 0
        },
        model: cpuInfo.model || 'Unknown',
        manufacturer: cpuInfo.manufacturer || 'Unknown',
        brand: cpuInfo.brand || 'Unknown',
        cores: cpuInfo.cores || os.cpus().length,
        physicalCores: cpuInfo.physicalCores || cpuInfo.cores || 1,
        speed: cpuInfo.speed || 0,
        cache: cpuInfo.cache || {}
      };
      
      return result;
    } catch (error) {
      console.error('Erro ao coletar métricas de CPU:', error);
      return {
        usage: 0,
        loadAverage: 0,
        frequency: 0,
        frequencyDetails: { avg: 0, min: 0, max: 0 },
        model: 'Unknown',
        manufacturer: 'Unknown',
        cores: 1,
        physicalCores: 1,
        speed: 0,
        cache: {}
      };
    }
  }

  // Método otimizado e seguro para coletar processos
  async getProcessesSafe(limit = 5) {
    try {
      // Usar apenas systeminformation (sem comandos Windows)
      return await this.getProcessesSystemInfo(limit);
    } catch (error) {
      console.error('❌ Erro na coleta de processos:', error.message);
      return {
        list: [],
        totals: { cpu: 0, memory: 0, count: 0 }
      };
    }
  }


  // Método original usando systeminformation (fallback)
  async getProcessesSystemInfo(limit = 5) {
    try {
      const processes = await si.processes();
      
      if (!processes || !processes.list || !Array.isArray(processes.list)) {
        console.warn('⚠️ Dados de processos inválidos');
        return {
          list: [],
          totals: { cpu: 0, memory: 0, count: 0 }
        };
      }

      // Processar apenas os top processos para evitar sobrecarga
      const validProcesses = processes.list.filter(process => process && process.pid && process.name);
      
      // Ordenar por memória se CPU for 0, senão por CPU
      const sortedProcesses = validProcesses.sort((a, b) => {
        const cpuA = a.cpu || 0;
        const cpuB = b.cpu || 0;
        const memA = a.mem || a.memRss || 0;
        const memB = b.mem || b.memRss || 0;
        
        // Se ambos têm CPU 0, ordenar por memória
        if (cpuA === 0 && cpuB === 0) {
          return memB - memA;
        }
        // Senão, ordenar por CPU
        return cpuB - cpuA;
      });
      
      const topProcesses = sortedProcesses.slice(0, limit).map(process => {
        // No Windows, usar os campos corretos de memória
        const memMB = process.mem || 0;  // Memória em MB (campo principal)
        const memVszKB = process.memVsz || 0;  // Memória virtual em KB
        const memRssKB = process.memRss || 0;  // Memória residente em KB
        
        // Usar memMB como principal, fallback para memRssKB convertido para MB
        const memoryMB = memMB || Math.round(memRssKB / 1024 * 100) / 100;
        
        return {
          pid: process.pid,
          name: process.name,
          cpu: Math.round((process.cpu || 0) * 100) / 100,  // CPU em %
          memory: memoryMB,  // Memória em MB
          memoryPercent: 0,  // Não temos % de memória total
          user: process.user || 'unknown',
          command: process.command || ''
        };
      });

      // Calcular totais de forma segura
      const totalCpu = topProcesses.reduce((sum, p) => sum + (p.cpu || 0), 0);
      const totalMemory = topProcesses.reduce((sum, p) => sum + (p.memory || 0), 0);

      return {
        list: topProcesses,
        totals: {
          cpu: totalCpu,
          memory: totalMemory,
          count: processes.list.length
        }
      };
    } catch (error) {
      console.error('❌ Erro no método systeminformation de processos:', error.message);
      return {
        list: [],
        totals: { cpu: 0, memory: 0, count: 0 }
      };
    }
  }


  // Método legado mantido para compatibilidade
  async getProcesses(limit = 50) {
    console.warn('⚠️ Usando método legado getProcesses - considere usar getProcessesSafe');
    return this.getProcessesSafe(limit);
  }

  async getNetworkInfo() {
    try {
      const [networkStats, networkInterfaces] = await Promise.all([
        si.networkStats(),
        si.networkInterfaces()
      ]);

      const activeInterface = networkInterfaces.find(iface => 
        iface.default && iface.operstate === 'up'
      ) || networkInterfaces[0];

      const stats = networkStats.find(stat => 
        stat.iface === activeInterface?.iface
      ) || networkStats[0];

      return {
        interface: activeInterface?.iface || 'unknown',
        download: Math.round((stats?.rx_sec || 0) / 1024 / 1024 * 8 * 100) / 100, // Convertido para Mbps
        upload: Math.round((stats?.tx_sec || 0) / 1024 / 1024 * 8 * 100) / 100, // Convertido para Mbps
        totalDownload: stats?.rx_bytes || 0,
        totalUpload: stats?.tx_bytes || 0
      };
    } catch (error) {
      console.error('Erro ao obter informações de rede:', error);
      throw error;
    }
  }

  async getStorageInfo() {
    try {
      const fsSize = await si.fsSize();
      return fsSize.map(disk => ({
        mount: disk.mount,
        size: disk.size,
        used: disk.used,
        available: disk.available,
        usage: Math.round((disk.used / disk.size) * 100),
        type: disk.type
      }));
    } catch (error) {
      console.error('Erro ao obter informações de armazenamento:', error);
      throw error;
    }
  }

  // Medir latência de rede usando ping do Windows (OTIMIZADO)
  async measureNetworkLatency() {
    try {
      // Verificar cache primeiro
      const now = Date.now();
      if (this.cache.pingInfo && (now - this.cache.lastPingUpdate) < this.cache.pingTtl) {
        return this.cache.pingInfo;
      }
      
      // Comando ping mais simples e rápido
      const command = 'ping -n 1 -w 2000 8.8.8.8';
      const { stdout, stderr } = await execAsync(command);
      
      // Verificar se houve erro
      if (stderr && stderr.trim()) {
        // Log removido - erro silencioso
        return 0;
      }
      
      // Extrair tempo de resposta do output do ping
      // Formato típico: "Tempo = 15ms" ou "time=15ms" ou "time<1ms"
      const timeMatch = stdout.match(/tempo[=<]\s*(\d+)ms/i);
      const timeLessMatch = stdout.match(/tempo[=<]\s*<1ms/i);
      
      let latency = 0;
      
      if (timeLessMatch) {
        latency = 1; // Menos de 1ms, retornar 1ms
      } else if (timeMatch && timeMatch[1]) {
        latency = parseInt(timeMatch[1]);
      } else {
        // Tentar outros padrões de resposta
        const altMatch = stdout.match(/(\d+)ms/i);
        if (altMatch && altMatch[1]) {
          latency = parseInt(altMatch[1]);
        }
      }
      
      // Salvar no cache
      this.cache.pingInfo = latency;
      this.cache.lastPingUpdate = now;
      
      return latency;
    } catch (error) {
      console.warn('❌ Erro ao medir latência de rede:', error.message);
      return 0;
    }
  }

}

module.exports = MonitorService;
