# 📊 Monitoramento e Métricas - SMX LiveBoard

Documentação completa sobre o sistema de monitoramento, métricas e alertas do SMX LiveBoard.

## 📋 Índice

- [Métricas Coletadas](#métricas-coletadas)
- [Sistema de Alertas](#sistema-de-alertas)
- [Performance e Otimização](#performance-e-otimização)
- [Logs e Auditoria](#logs-e-auditoria)
- [Troubleshooting](#troubleshooting)
- [Integração com Ferramentas Externas](#integração-com-ferramentas-externas)

## 📈 Métricas Coletadas

### Métricas do Sistema

#### CPU (Processador)
```javascript
{
  "cpu": {
    "usage": 45.2,           // Uso percentual
    "cores": 8,              // Número de cores
    "temperature": 65.5,     // Temperatura em °C
    "frequency": 3200,       // Frequência em MHz
    "load": [1.2, 1.5, 1.8], // Load average (1m, 5m, 15m)
    "model": "Intel Core i7-10700K"
  }
}
```

#### Memória (RAM)
```javascript
{
  "memory": {
    "usage": 67.8,           // Uso percentual
    "used": 1089536000,      // Bytes usados
    "total": 1600000000,     // Total de bytes
    "free": 510464000,       // Bytes livres
    "available": 600000000,  // Bytes disponíveis
    "swap": {
      "used": 0,
      "total": 0,
      "usage": 0
    }
  }
}
```

#### Disco
```javascript
{
  "disk": {
    "usage": 78.5,           // Uso percentual
    "used": 785000000000,    // Bytes usados
    "total": 1000000000000,  // Total de bytes
    "free": 215000000000,    // Bytes livres
    "readSpeed": 150.5,      // MB/s
    "writeSpeed": 89.2,      // MB/s
    "iops": 1250             // I/O operations per second
  }
}
```

#### Rede
```javascript
{
  "network": {
    "interfaces": [
      {
        "name": "eth0",
        "rx": 1024000,       // Bytes recebidos
        "tx": 512000,        // Bytes enviados
        "rxSpeed": 15.2,     // MB/s recebidos
        "txSpeed": 8.5,      // MB/s enviados
        "speed": 1000,       // Velocidade da interface
        "status": "up"
      }
    ],
    "totalRx": 1024000,
    "totalTx": 512000
  }
}
```

#### Processos
```javascript
{
  "processes": [
    {
      "pid": 1234,
      "name": "node",
      "cpu": 15.2,           // Uso de CPU %
      "memory": 128000000,   // Uso de memória em bytes
      "status": "running",
      "startTime": "2024-01-15T09:00:00.000Z",
      "command": "/usr/bin/node index.js",
      "user": "smx"
    }
  ]
}
```

#### Sistema Operacional
```javascript
{
  "os": {
    "platform": "linux",
    "distro": "Ubuntu 20.04.3 LTS",
    "release": "5.4.0-89-generic",
    "arch": "x64",
    "hostname": "smx-server",
    "uptime": 86400,         // Segundos
    "bootTime": "2024-01-14T10:00:00.000Z"
  }
}
```

### Métricas da Aplicação

#### Performance
```javascript
{
  "performance": {
    "responseTime": 45.2,    // Tempo de resposta médio (ms)
    "requestsPerSecond": 12.5,
    "errorRate": 0.1,        // Taxa de erro %
    "uptime": 3600.5,        // Uptime em segundos
    "memoryUsage": {
      "rss": 45678912,       // Resident Set Size
      "heapTotal": 20971520,
      "heapUsed": 15728640,
      "external": 1234567
    }
  }
}
```

#### WebSocket
```javascript
{
  "websocket": {
    "totalConnections": 5,
    "uniqueClients": 3,
    "messagesPerSecond": 25.5,
    "averageLatency": 12.3,  // ms
    "connectionErrors": 0,
    "reconnections": 2
  }
}
```

#### Cache
```javascript
{
  "cache": {
    "basicInfo": {
      "hits": 150,
      "misses": 5,
      "hitRate": 96.8,       // %
      "lastUpdate": "2024-01-15T10:29:45.000Z"
    },
    "fullInfo": {
      "hits": 89,
      "misses": 12,
      "hitRate": 88.1,
      "lastUpdate": "2024-01-15T10:29:50.000Z"
    }
  }
}
```

## 🚨 Sistema de Alertas

### Configuração de Alertas

#### Limites Padrão
```javascript
const alertThresholds = {
  cpu: {
    warning: 70,    // 70%
    critical: 85    // 85%
  },
  memory: {
    warning: 80,    // 80%
    critical: 90    // 90%
  },
  disk: {
    warning: 85,    // 85%
    critical: 95    // 95%
  },
  responseTime: {
    warning: 1000,  // 1s
    critical: 3000  // 3s
  },
  errorRate: {
    warning: 5,     // 5%
    critical: 10    // 10%
  }
};
```

#### Tipos de Alertas
```javascript
const alertTypes = {
  SYSTEM_STATUS: 'Status geral do sistema',
  HIGH_CPU: 'CPU alta',
  HIGH_MEMORY: 'Memória alta',
  DISK_FULL: 'Disco cheio',
  NETWORK_ERROR: 'Erro de rede',
  PROCESS_CRASH: 'Processo travou',
  WEBSOCKET_ERROR: 'Erro WebSocket',
  API_ERROR: 'Erro de API',
  CACHE_ERROR: 'Erro de cache'
};
```

### Notificações

#### Telegram
```javascript
// Exemplo de alerta via Telegram
const alertMessage = `
🚨 <b>ALERTA CRÍTICO - SMX LiveBoard</b>

📊 <b>Tipo:</b> ${alertType}
⏰ <b>Timestamp:</b> ${new Date().toLocaleString('pt-BR')}
🖥️ <b>Hostname:</b> ${systemData.hostname}

📈 <b>Métricas:</b>
• CPU: ${systemData.cpu?.usage || 0}%
• Memória: ${systemData.memory?.usage || 0}%
• Disco: ${systemData.disk?.usage || 0}%

🔧 <b>Ação Recomendada:</b>
${getRecommendedAction(alertType)}
`;
```

#### Email (Futuro)
```javascript
// Configuração de email
const emailConfig = {
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'alerts@example.com',
      pass: 'password'
    }
  },
  from: 'SMX LiveBoard <alerts@example.com>',
  to: ['admin@example.com', 'ops@example.com']
};
```

### Relatórios Automáticos

#### Relatório Diário
```javascript
// Enviado às 7h e 23h
const dailyReport = `
📊 <b>RELATÓRIO DIÁRIO - SMX LiveBoard</b>

📅 <b>Data:</b> ${new Date().toLocaleDateString('pt-BR')}
⏱️ <b>Uptime:</b> ${formatUptime(systemUptime)}

📈 <b>Métricas Médias:</b>
• CPU: ${avgCpu}%
• Memória: ${avgMemory}%
• Disco: ${avgDisk}%

🔝 <b>Top 3 Processos:</b>
${topProcesses.map((proc, i) => 
  `${i + 1}. ${proc.name} (${proc.cpu}% CPU)`
).join('\n')}

📋 <b>Logs (24h):</b>
• Total: ${logStats.total}
• Info: ${logStats.byLevel.INFO || 0}
• Warning: ${logStats.byLevel.WARNING || 0}
• Error: ${logStats.byLevel.ERROR || 0}
• Critical: ${logStats.byLevel.CRITICAL || 0}

✅ <b>Sistema funcionando normalmente</b>
`;
```

## ⚡ Performance e Otimização

### Otimizações Implementadas

#### Cache Inteligente
```javascript
// Sistema de cache multi-camada
const cacheConfig = {
  basicInfo: {
    ttl: 30000,      // 30s - dados básicos
    priority: 'high'
  },
  fullInfo: {
    ttl: 15000,      // 15s - dados completos
    priority: 'high'
  },
  staticInfo: {
    ttl: 300000,     // 5min - dados estáticos
    priority: 'low'
  },
  processesInfo: {
    ttl: 10000,      // 10s - processos
    priority: 'medium'
  }
};
```

#### Intervalos Adaptativos
```javascript
// Ajuste automático baseado em clientes conectados
const adaptiveIntervals = {
  baseMetricsInterval: 10000,    // 10s base
  baseProcessesInterval: 45000,  // 45s base
  minMetricsInterval: 8000,      // 8s mínimo
  maxMetricsInterval: 20000,     // 20s máximo
  minProcessesInterval: 30000,   // 30s mínimo
  maxProcessesInterval: 90000    // 90s máximo
};
```

#### Throttling
```javascript
// Evitar envios muito frequentes
const throttlingConfig = {
  minIntervalBetweenSends: 5000,  // 5s mínimo entre envios
  maxMessagesPerSecond: 10,       // Máximo 10 mensagens/s
  burstLimit: 20                  // Limite de burst
};
```

### Métricas de Performance

#### Tempo de Resposta
```javascript
// Medição de tempo de resposta
const measureResponseTime = async (operation) => {
  const start = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - start;
    
    // Log de performance
    logger.performance(`Operation completed in ${duration}ms`, {
      operation: operation.name,
      duration,
      success: true
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.performance(`Operation failed in ${duration}ms`, {
      operation: operation.name,
      duration,
      success: false,
      error: error.message
    });
    throw error;
  }
};
```

#### Uso de Memória
```javascript
// Monitoramento de memória
const monitorMemory = () => {
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  };
  
  // Alertar se uso de memória > 80%
  const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  if (heapUsagePercent > 80) {
    logger.warning('High memory usage detected', {
      heapUsagePercent: heapUsagePercent.toFixed(2),
      memUsageMB
    });
  }
  
  return memUsageMB;
};
```

## 📋 Logs e Auditoria

### Sistema de Logging

#### Níveis de Log
```javascript
const logLevels = {
  DEBUG: 0,     // Informações detalhadas para debug
  INFO: 1,      // Informações gerais
  WARNING: 2,   // Avisos
  ERROR: 3,     // Erros
  CRITICAL: 4   // Erros críticos
};
```

#### Estrutura de Logs
```javascript
// Formato de log estruturado
const logEntry = {
  timestamp: new Date().toISOString(),
  level: 'INFO',
  message: 'System metrics collected',
  source: 'MONITOR',
  data: {
    cpu: 45.2,
    memory: 67.8,
    disk: 78.5
  },
  context: {
    requestId: 'req_123',
    userId: 'user_456',
    sessionId: 'sess_789'
  }
};
```

#### Rotação de Logs
```javascript
// Configuração de rotação
const logRotation = {
  maxFileSize: '10MB',
  maxFiles: 5,
  datePattern: 'YYYY-MM-DD',
  compress: true,
  retention: '30d'
};
```

### Auditoria

#### Eventos Auditados
```javascript
const auditEvents = {
  USER_LOGIN: 'Usuário fez login',
  USER_LOGOUT: 'Usuário fez logout',
  COMMAND_EXECUTED: 'Comando executado',
  SSH_CONNECTION: 'Conexão SSH estabelecida',
  SSH_DISCONNECTION: 'Conexão SSH encerrada',
  CONFIG_CHANGED: 'Configuração alterada',
  SYSTEM_RESTART: 'Sistema reiniciado',
  ERROR_OCCURRED: 'Erro ocorreu'
};
```

#### Log de Auditoria
```javascript
// Exemplo de log de auditoria
const auditLog = {
  timestamp: new Date().toISOString(),
  event: 'COMMAND_EXECUTED',
  user: 'admin',
  source: 'terminal',
  details: {
    command: 'ls -la',
    result: 'success',
    executionTime: 45
  },
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...'
};
```

## 🔍 Troubleshooting

### Diagnóstico de Problemas

#### Health Check
```javascript
// Verificação de saúde do sistema
const healthCheck = async () => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    checks: {}
  };
  
  // Verificar CPU
  const cpu = await si.currentLoad();
  health.checks.cpu = {
    status: cpu.currentload < 90 ? 'OK' : 'WARNING',
    value: cpu.currentload
  };
  
  // Verificar memória
  const mem = await si.mem();
  const memUsage = (mem.used / mem.total) * 100;
  health.checks.memory = {
    status: memUsage < 90 ? 'OK' : 'WARNING',
    value: memUsage
  };
  
  // Verificar disco
  const disk = await si.fsSize();
  const diskUsage = (disk[0].used / disk[0].size) * 100;
  health.checks.disk = {
    status: diskUsage < 95 ? 'OK' : 'WARNING',
    value: diskUsage
  };
  
  // Status geral
  const hasWarning = Object.values(health.checks)
    .some(check => check.status === 'WARNING');
  health.status = hasWarning ? 'WARNING' : 'OK';
  
  return health;
};
```

#### Diagnóstico de Performance
```javascript
// Análise de performance
const performanceDiagnosis = {
  slowQueries: [],
  memoryLeaks: [],
  highCpuProcesses: [],
  networkIssues: [],
  
  analyze: async function() {
    // Analisar queries lentas
    this.slowQueries = await this.findSlowQueries();
    
    // Detectar vazamentos de memória
    this.memoryLeaks = await this.detectMemoryLeaks();
    
    // Identificar processos com alta CPU
    this.highCpuProcesses = await this.findHighCpuProcesses();
    
    // Verificar problemas de rede
    this.networkIssues = await this.checkNetworkIssues();
    
    return this.generateReport();
  }
};
```

### Ferramentas de Debug

#### Debug Mode
```javascript
// Modo debug ativado
const debugMode = process.env.DEBUG_MODE === 'true';

if (debugMode) {
  // Logs detalhados
  logger.debug('Debug mode enabled');
  
  // Métricas detalhadas
  setInterval(() => {
    const memUsage = process.memoryUsage();
    logger.debug('Memory usage:', memUsage);
  }, 10000);
  
  // Performance profiling
  const profiler = require('v8-profiler-next');
  profiler.startProfiling('smx-liveboard');
}
```

#### Profiling
```javascript
// Profiling de performance
const startProfiling = () => {
  const profiler = require('v8-profiler-next');
  const title = `smx-liveboard-${Date.now()}`;
  
  profiler.startProfiling(title);
  
  // Parar profiling após 30 segundos
  setTimeout(() => {
    const profile = profiler.stopProfiling(title);
    profile.export()
      .pipe(require('fs').createWriteStream(`profile-${title}.cpuprofile`))
      .on('finish', () => {
        console.log(`Profile saved: profile-${title}.cpuprofile`);
        profile.delete();
      });
  }, 30000);
};
```

## 🔌 Integração com Ferramentas Externas

### Prometheus

#### Métricas Customizadas
```javascript
// Exporter para Prometheus
const prometheus = require('prom-client');

// Métricas customizadas
const cpuUsage = new prometheus.Gauge({
  name: 'smx_cpu_usage_percent',
  help: 'CPU usage percentage',
  labelNames: ['core']
});

const memoryUsage = new prometheus.Gauge({
  name: 'smx_memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type']
});

const responseTime = new prometheus.Histogram({
  name: 'smx_response_time_seconds',
  help: 'Response time in seconds',
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Endpoint para métricas
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

### Grafana

#### Dashboard JSON
```json
{
  "dashboard": {
    "title": "SMX LiveBoard",
    "panels": [
      {
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "smx_cpu_usage_percent",
            "legendFormat": "CPU {{core}}"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "smx_memory_usage_bytes",
            "legendFormat": "Memory {{type}}"
          }
        ]
      }
    ]
  }
}
```

### ELK Stack

#### Logstash Configuration
```ruby
# logstash.conf
input {
  file {
    path => "/var/log/smx-liveboard/*.log"
    type => "smx-liveboard"
  }
}

filter {
  if [type] == "smx-liveboard" {
    json {
      source => "message"
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "smx-liveboard-%{+YYYY.MM.dd}"
  }
}
```

### Zabbix

#### Template Zabbix
```xml
<!-- smx-liveboard.xml -->
<zabbix_export>
  <templates>
    <template>
      <name>SMX LiveBoard</name>
      <items>
        <item>
          <name>CPU Usage</name>
          <key>smx.cpu.usage</key>
          <type>0</type>
          <value_type>0</value_type>
        </item>
        <item>
          <name>Memory Usage</name>
          <key>smx.memory.usage</key>
          <type>0</type>
          <value_type>0</value_type>
        </item>
      </items>
      <triggers>
        <trigger>
          <name>High CPU Usage</name>
          <expression>{SMX LiveBoard:smx.cpu.usage.last()}>80</expression>
          <priority>3</priority>
        </trigger>
      </triggers>
    </template>
  </templates>
</zabbix_export>
```

---

Esta documentação cobre todos os aspectos de monitoramento e métricas do SMX LiveBoard. Para mais informações sobre deploy, consulte a [documentação de deployment](./deployment.md).
