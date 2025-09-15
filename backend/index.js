const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const si = require('systeminformation');
const path = require('path');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '..')));

// WebSocket Server
const wss = new WebSocket.Server({ port: 8080 });

// Dados em cache para evitar múltiplas consultas
let systemData = {};
let clients = new Set();

// Função para coletar dados do sistema
async function collectSystemData() {
  try {
    const [
      memory,
      networkStats,
      processes,
      diskLayout,
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
      si.diskLayout(),
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
        temperature: cpuInfo.temperature?.main || null
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

    // Enviar dados para todos os clientes conectados
    broadcastData(systemData);
  } catch (error) {
    console.error('Erro ao coletar dados do sistema:', error);
  }
}

// Função para enviar dados para todos os clientes
function broadcastData(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Cliente conectado');
  clients.add(ws);

  // Enviar dados iniciais
  if (Object.keys(systemData).length > 0) {
    ws.send(JSON.stringify(systemData));
  }

  ws.on('close', () => {
    console.log('Cliente desconectado');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('Erro no WebSocket:', error);
    clients.delete(ws);
  });
});

// Rotas da API
app.get('/api/system', async (req, res) => {
  try {
    if (Object.keys(systemData).length === 0) {
      await collectSystemData();
    }
    res.json(systemData);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter dados do sistema' });
  }
});

app.get('/api/processes', async (req, res) => {
  try {
    const processes = await si.processes();
    const processList = processes.list
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 50)
      .map(proc => ({
        pid: proc.pid,
        name: proc.name,
        cpu: Math.round(proc.cpu * 100) / 100,
        memory: Math.round(proc.mem_rss / 1024 / 1024 * 100) / 100,
        user: proc.user
      }));
    
    res.json(processList);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter processos' });
  }
});

// Rota para servir o HTML app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Iniciar coleta de dados a cada 5 segundos (menos pesado)
setInterval(collectSystemData, 5000);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
  console.log(`WebSocket rodando na porta 8080`);
});

// Coletar dados iniciais
collectSystemData();
