const si = require('systeminformation');

class MonitorService {
  constructor() {
    this.data = {};
    this.isCollecting = false;
  }

  async getSystemInfo() {
    try {
      const [
        cpu,
        memory,
        networkStats,
        processes,
        diskLayout,
        temperature,
        currentLoad,
        networkInterfaces,
        fsSize
      ] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.networkStats(),
        si.processes(),
        si.diskLayout(),
        si.cpuTemperature(),
        si.currentLoad(),
        si.networkInterfaces(),
        si.fsSize()
      ]);

      // Encontrar interface de rede ativa
      const activeInterface = networkInterfaces.find(iface => 
        iface.default && iface.operstate === 'up'
      ) || networkInterfaces[0];

      const networkStatsData = networkStats.find(stat => 
        stat.iface === activeInterface?.iface
      ) || networkStats[0];

      return {
        timestamp: Date.now(),
        cpu: {
          usage: Math.round(currentLoad.currentload * 100) / 100,
          cores: cpu.cores,
          model: cpu.model,
          speed: cpu.speed,
          temperature: temperature.main || 0
        },
        memory: {
          total: memory.total,
          used: memory.used,
          free: memory.free,
          usage: Math.round((memory.used / memory.total) * 100)
        },
        network: {
          download: Math.round((networkStatsData?.rx_sec || 0) / 1024 / 1024 * 100) / 100, // MB/s
          upload: Math.round((networkStatsData?.tx_sec || 0) / 1024 / 1024 * 100) / 100, // MB/s
          interface: activeInterface?.iface || 'unknown',
          totalDownload: networkStatsData?.rx_bytes || 0,
          totalUpload: networkStatsData?.tx_bytes || 0
        },
        processes: processes.list
          .sort((a, b) => b.cpu - a.cpu)
          .slice(0, 20)
          .map(proc => ({
            pid: proc.pid,
            name: proc.name,
            cpu: Math.round(proc.cpu * 100) / 100,
            memory: Math.round(proc.mem_rss / 1024 / 1024 * 100) / 100, // MB
            user: proc.user
          })),
        storage: fsSize.map(disk => ({
          mount: disk.mount,
          size: disk.size,
          used: disk.used,
          available: disk.available,
          usage: Math.round((disk.used / disk.size) * 100)
        }))
      };
    } catch (error) {
      console.error('Erro ao coletar dados do sistema:', error);
      throw error;
    }
  }

  async getProcesses(limit = 50) {
    try {
      const processes = await si.processes();
      return processes.list
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, limit)
        .map(proc => ({
          pid: proc.pid,
          name: proc.name,
          cpu: Math.round(proc.cpu * 100) / 100,
          memory: Math.round(proc.mem_rss / 1024 / 1024 * 100) / 100,
          user: proc.user,
          command: proc.command
        }));
    } catch (error) {
      console.error('Erro ao obter processos:', error);
      throw error;
    }
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
        download: Math.round((stats?.rx_sec || 0) / 1024 / 1024 * 100) / 100,
        upload: Math.round((stats?.tx_sec || 0) / 1024 / 1024 * 100) / 100,
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

  async getTemperatureInfo() {
    try {
      const temperature = await si.cpuTemperature();
      return {
        cpu: temperature.main || 0,
        max: temperature.max || 0,
        cores: temperature.cores || []
      };
    } catch (error) {
      console.error('Erro ao obter informações de temperatura:', error);
      throw error;
    }
  }
}

module.exports = MonitorService;
