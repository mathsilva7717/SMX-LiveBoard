const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const si = require('systeminformation');

// Servidor Express integrado
const server = express();
const PORT = 3002;

// Dados do sistema
let systemData = {};
let isCollecting = false;

// Função para coletar dados (otimizada)
async function collectSystemData() {
  if (isCollecting) return; // Evitar múltiplas coletas simultâneas
  isCollecting = true;

  try {
    const [
      memory,
      networkStats,
      processes,
      currentLoad,
      networkInterfaces,
      systemTime,
      osInfo,
      services,
      networkConnections
    ] = await Promise.all([
      si.mem(),
      si.networkStats(),
      si.processes(),
      si.currentLoad(),
      si.networkInterfaces(),
      si.time(),
      si.osInfo(),
      si.services('*'),
      si.networkConnections()
    ]);

    // Calcular uso de rede
    const networkInterface = networkInterfaces.find(iface => 
      iface.default && iface.operstate === 'up'
    ) || networkInterfaces[0];

    const networkStatsData = networkStats.find(stat => 
      stat.iface === networkInterface?.iface
    ) || networkStats[0];

    // Calcular uso de disco (storage)
    const diskUsage = await si.fsSize();
    const mainDisk = diskUsage.find(disk => disk.mount === 'C:') || diskUsage[0];

    // Buscar informações adicionais da CPU
    const cpuInfo = await si.cpu();

    systemData = {
      timestamp: Date.now(),
      // Dados no formato esperado pelo frontend
      cpu: {
        usage: currentLoad.currentload,
        manufacturer: cpuInfo.manufacturer,
        brand: cpuInfo.brand,
        speed: cpuInfo.speed,
        cores: cpuInfo.cores,
      },
      mem: {
        total: memory.total,
        used: memory.used,
        free: memory.free,
        usage: Math.round((memory.used / memory.total) * 100)
      },
      fsSize: [{
        mount: mainDisk?.mount || 'C:',
        size: mainDisk?.size || 0,
        used: mainDisk?.used || 0,
        available: mainDisk?.available || 0,
        use: mainDisk ? Math.round((mainDisk.used / mainDisk.size) * 100) : 0
      }],
      networkStats: [{
        operstate: networkInterface?.operstate || 'unknown'
      }],
      osInfo: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        hostname: osInfo.hostname
      },
      time: {
        uptime: systemTime.uptime
      },
      processes: processes.list
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, 10)
        .map(proc => ({
          pid: proc.pid,
          name: proc.name,
          cpu: proc.cpu,
          mem: proc.mem_rss / 1024 / 1024, // MB
          user: proc.user
        }))
    };

    console.log(`📊 Dados atualizados: CPU ${systemData.cpu.usage}%, RAM ${systemData.mem.usage}%`);
  } catch (error) {
    console.error('Erro ao coletar dados:', error.message);
  } finally {
    isCollecting = false;
  }
}

// Configurar servidor
server.use(express.static(path.join(__dirname, '..')));
server.get('/api/system', (req, res) => res.json(systemData));
server.get('*', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

// Janela principal
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, '../assets/icon.ico'),
    show: false
  });

  // Carregar aplicação
  mainWindow.loadURL('http://localhost:3002');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Iniciar aplicação
app.whenReady().then(() => {
  // Iniciar servidor
  server.listen(PORT, () => {
    console.log('🚀 SMX LiveBoard iniciado na porta 3002');
  });
  
  // Coletar dados iniciais
  collectSystemData();
  
  // Coletar dados a cada 8 segundos (otimizado para não ficar pesado)
  setInterval(collectSystemData, 8000);
  
  // Criar janela
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
