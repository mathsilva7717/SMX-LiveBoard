# 🔌 API Reference - SMX LiveBoard

Documentação completa das APIs REST e WebSocket do SMX LiveBoard.

## 📋 Índice

- [API REST](#api-rest)
- [WebSocket Events](#websocket-events)
- [Códigos de Status](#códigos-de-status)
- [Exemplos de Uso](#exemplos-de-uso)
- [Rate Limiting](#rate-limiting)
- [Autenticação](#autenticação)

## 🌐 API REST

### Base URL
```
http://localhost:3000/api
```

### Headers Padrão
```http
Content-Type: application/json
Accept: application/json
```

---

## 📊 Sistema

### GET /api/health
Verifica a saúde do sistema.

**Resposta:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "memory": {
    "rss": 45678912,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1234567
  }
}
```

### GET /api/system/metrics
Obtém métricas completas do sistema.

**Resposta:**
```json
{
  "cpu": {
    "usage": 45.2,
    "cores": 8,
    "temperature": 65.5,
    "frequency": 3200
  },
  "memory": {
    "usage": 67.8,
    "used": 1089536000,
    "total": 1600000000,
    "free": 510464000
  },
  "disk": {
    "usage": 78.5,
    "used": 785000000000,
    "total": 1000000000000,
    "free": 215000000000
  },
  "network": {
    "interfaces": [
      {
        "name": "eth0",
        "rx": 1024000,
        "tx": 512000,
        "speed": 1000
      }
    ]
  },
  "processes": [
    {
      "pid": 1234,
      "name": "node",
      "cpu": 15.2,
      "memory": 128000000,
      "status": "running"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/system/cache-stats
Estatísticas do sistema de cache.

**Resposta:**
```json
{
  "cache": {
    "basicInfo": {
      "hits": 150,
      "misses": 5,
      "hitRate": 96.8,
      "lastUpdate": "2024-01-15T10:29:45.000Z"
    },
    "fullInfo": {
      "hits": 89,
      "misses": 12,
      "hitRate": 88.1,
      "lastUpdate": "2024-01-15T10:29:50.000Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST /api/system/clear-cache
Limpa o cache do sistema.

**Body:**
```json
{
  "cacheType": "all"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Cache all limpo com sucesso",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/system/performance
Estatísticas de performance.

**Resposta:**
```json
{
  "metrics": {
    "avgResponseTime": 45.2,
    "requestsPerSecond": 12.5,
    "errorRate": 0.1,
    "uptime": 3600.5
  },
  "alerts": [
    {
      "type": "HIGH_CPU",
      "message": "CPU usage above 80%",
      "severity": "WARNING",
      "timestamp": "2024-01-15T10:25:00.000Z"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/system/connections
Status das conexões WebSocket.

**Resposta:**
```json
{
  "totalConnections": 3,
  "uniqueClients": 2,
  "connections": [
    {
      "socketId": "abc123",
      "clientIP": "192.168.1.100",
      "transport": "websocket",
      "connected": true,
      "connectedAt": 1705312200000,
      "userAgent": "Chrome/120.0.0.0",
      "lastHeartbeat": 1705312200000,
      "timeSinceHeartbeat": 5000,
      "timeSinceHeartbeatSeconds": 5
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## ⚙️ Processos

### GET /api/processes
Lista os processos do sistema.

**Query Parameters:**
- `limit` (opcional): Número máximo de processos (padrão: 10)

**Resposta:**
```json
[
  {
    "pid": 1234,
    "name": "node",
    "cpu": 15.2,
    "memory": 128000000,
    "status": "running",
    "startTime": "2024-01-15T09:00:00.000Z",
    "command": "/usr/bin/node index.js"
  }
]
```

---

## 💻 Terminal

### POST /api/terminal/execute
Executa um comando no terminal.

**Body:**
```json
{
  "command": "ls -la"
}
```

**Resposta:**
```json
{
  "success": true,
  "output": "total 48\ndrwxr-xr-x  5 user user 4096 Jan 15 10:30 .\ndrwxr-xr-x 10 user user 4096 Jan 15 09:00 ..",
  "error": null,
  "exitCode": 0,
  "executionTime": 45
}
```

### POST /api/terminal/session
Cria uma nova sessão de terminal.

**Resposta:**
```json
{
  "sessionId": "rest_1705312200000",
  "status": "created"
}
```

### GET /api/terminal/autocomplete
Obtém sugestões de autocompletar.

**Query Parameters:**
- `q`: Comando parcial
- `type`: Tipo de sugestão (`command` ou `path`)

**Resposta:**
```json
{
  "suggestions": ["ls", "ls -la", "ls -l"],
  "partialCommand": "l",
  "type": "command"
}
```

### DELETE /api/terminal/session/:sessionId
Fecha uma sessão de terminal.

**Resposta:**
```json
{
  "success": true,
  "message": "Sessão fechada com sucesso"
}
```

---

## 📋 Logs

### GET /api/logs
Obtém logs do sistema.

**Query Parameters:**
- `level`: Nível do log (`info`, `warning`, `error`, `critical`)
- `source`: Fonte do log
- `search`: Termo de busca
- `startDate`: Data de início (ISO 8601)
- `endDate`: Data de fim (ISO 8601)
- `limit`: Número máximo de logs (padrão: 100)
- `offset`: Offset para paginação (padrão: 0)

**Resposta:**
```json
{
  "logs": [
    {
      "id": "log_123",
      "level": "INFO",
      "message": "Sistema iniciado",
      "source": "SYSTEM",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "data": {
        "port": 3000,
        "environment": "production"
      }
    }
  ],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

### GET /api/logs/stats
Estatísticas dos logs.

**Resposta:**
```json
{
  "total": 1500,
  "byLevel": {
    "INFO": 1200,
    "WARNING": 200,
    "ERROR": 80,
    "CRITICAL": 20
  },
  "bySource": {
    "SYSTEM": 800,
    "MONITOR": 400,
    "SSH": 200,
    "TELEGRAM": 100
  },
  "last24Hours": 150,
  "lastHour": 12
}
```

### POST /api/logs/export
Exporta logs em diferentes formatos.

**Body:**
```json
{
  "format": "json",
  "level": "error",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-15T23:59:59.999Z"
}
```

**Resposta:** Arquivo de exportação (JSON, CSV ou TXT)

### DELETE /api/logs/clear
Limpa logs antigos.

**Body:**
```json
{
  "daysToKeep": 30
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "150 logs removidos, 1350 mantidos",
  "removed": 150,
  "remaining": 1350
}
```

---

## 📱 Telegram

### GET /api/telegram/status
Status da configuração do bot.

**Resposta:**
```json
{
  "configured": true,
  "message": "Bot configurado"
}
```

### POST /api/telegram/configure
Configura o bot do Telegram.

**Body:**
```json
{
  "token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
  "chatId": "-123456789"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Bot configurado com sucesso",
  "test": {
    "success": true,
    "message": "Teste de conexão bem-sucedido"
  }
}
```

### POST /api/telegram/send
Envia uma mensagem.

**Body:**
```json
{
  "message": "Alerta: CPU alta - 85%"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Mensagem enviada com sucesso",
  "messageId": 123
}
```

### POST /api/telegram/alert
Envia um alerta específico.

**Body:**
```json
{
  "alertType": "SYSTEM_STATUS",
  "data": {
    "cpu": 85.2,
    "memory": 78.5,
    "disk": 65.0
  },
  "severity": "WARNING"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Alerta enviado com sucesso",
  "messageId": 124
}
```

### GET /api/telegram/test
Testa a conexão com o Telegram.

**Resposta:**
```json
{
  "success": true,
  "message": "Conexão com Telegram OK",
  "botInfo": {
    "id": 123456789,
    "username": "smx_liveboard_bot",
    "firstName": "SMX LiveBoard Bot"
  }
}
```

---

## 🔐 SSH

### POST /api/ssh/test
Testa uma conexão SSH.

**Body:**
```json
{
  "host": "192.168.1.100",
  "port": 22,
  "username": "user",
  "password": "password"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Conexão SSH testada com sucesso",
  "connectionTime": 1250
}
```

### POST /api/ssh/connect
Estabelece uma conexão SSH.

**Body:**
```json
{
  "host": "192.168.1.100",
  "port": 22,
  "username": "user",
  "password": "password"
}
```

**Resposta:**
```json
{
  "success": true,
  "connectionId": "ssh_1705312200000_192.168.1.100",
  "message": "Conexão SSH estabelecida"
}
```

### POST /api/ssh/disconnect
Desconecta uma conexão SSH.

**Body:**
```json
{
  "host": "192.168.1.100",
  "port": 22,
  "username": "user"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Conexão SSH desconectada"
}
```

### GET /api/ssh/connections
Lista conexões SSH ativas.

**Resposta:**
```json
{
  "success": true,
  "connections": [
    {
      "connectionId": "ssh_1705312200000_192.168.1.100",
      "host": "192.168.1.100",
      "port": 22,
      "username": "user",
      "connectedAt": "2024-01-15T10:30:00.000Z",
      "status": "connected"
    }
  ],
  "count": 1
}
```

---

## 🔌 WebSocket Events

### Conexão
```javascript
const socket = io('http://localhost:3000');
```

### Eventos do Cliente → Servidor

#### Dados Iniciais
```javascript
// Solicitar dados iniciais
socket.emit('request_initial_data');

// Solicitar métricas atuais
socket.emit('request_current_metrics');

// Solicitar processos atuais
socket.emit('request_current_processes');
```

#### Terminal
```javascript
// Criar sessão de terminal
socket.emit('terminal:create', {});

// Enviar comando
socket.emit('terminal:command', {
  command: 'ls -la',
  sessionId: 'socket_123_terminal'
});

// Autocompletar
socket.emit('terminal:autocomplete', {
  partialCommand: 'ls',
  type: 'command'
});

// Fechar sessão
socket.emit('terminal:close', {
  sessionId: 'socket_123_terminal'
});
```

#### Logs
```javascript
// Solicitar logs
socket.emit('logs:request', {
  level: 'error',
  limit: 50
});

// Solicitar estatísticas
socket.emit('logs:stats');

// Iniciar monitoramento em tempo real
socket.emit('logs:start_realtime');
```

#### SSH
```javascript
// Conectar SSH
socket.emit('ssh-connect', {
  host: '192.168.1.100',
  port: 22,
  username: 'user',
  password: 'password'
});

// Executar comando SSH
socket.emit('ssh-command', {
  command: 'top',
  connection: {
    host: '192.168.1.100',
    port: 22,
    username: 'user'
  }
});

// Desconectar SSH
socket.emit('ssh-disconnect', {
  host: '192.168.1.100',
  port: 22,
  username: 'user'
});
```

#### Sistema
```javascript
// Heartbeat
socket.emit('heartbeat', {
  timestamp: Date.now()
});

// Ping
socket.emit('ping');
```

### Eventos do Servidor → Cliente

#### Dados do Sistema
```javascript
// Dados iniciais
socket.on('initial:data', (data) => {
  console.log('Dados iniciais:', data);
});

// Métricas do sistema
socket.on('system:metrics', (metrics) => {
  console.log('Métricas:', metrics);
});

// Atualização de processos
socket.on('processes:update', (processes) => {
  console.log('Processos:', processes);
});
```

#### Terminal
```javascript
// Sessão criada
socket.on('terminal:created', (data) => {
  console.log('Terminal criado:', data.sessionId);
});

// Output do terminal
socket.on('terminal:output', (data) => {
  console.log('Output:', data.output);
});

// Erro do terminal
socket.on('terminal:error', (data) => {
  console.error('Erro:', data.error);
});

// Sugestões de autocompletar
socket.on('terminal:suggestions', (data) => {
  console.log('Sugestões:', data.suggestions);
});

// Sessão fechada
socket.on('terminal:closed', (data) => {
  console.log('Terminal fechado:', data.sessionId);
});
```

#### Logs
```javascript
// Dados de logs
socket.on('logs:data', (data) => {
  console.log('Logs:', data);
});

// Estatísticas de logs
socket.on('logs:stats', (stats) => {
  console.log('Stats:', stats);
});

// Monitoramento iniciado
socket.on('logs:realtime_started', (data) => {
  console.log('Monitoramento iniciado');
});

// Erro de logs
socket.on('logs:error', (data) => {
  console.error('Erro de logs:', data.error);
});
```

#### SSH
```javascript
// Status da conexão SSH
socket.on('ssh-connection-status', (status) => {
  console.log('Status SSH:', status);
});

// Output SSH
socket.on('ssh-output', (data) => {
  console.log('Output SSH:', data.output);
});

// Erro SSH
socket.on('ssh-error', (data) => {
  console.error('Erro SSH:', data.error);
});
```

#### Sistema
```javascript
// Heartbeat acknowledgment
socket.on('heartbeat_ack', (data) => {
  console.log('Heartbeat ACK:', data.timestamp);
});

// Health check
socket.on('health_check', (data) => {
  console.log('Health check:', data.timestamp);
});

// Pong
socket.on('pong', (data) => {
  console.log('Pong:', data.timestamp);
});

// Erro inicial
socket.on('initial:error', (data) => {
  console.error('Erro inicial:', data.error);
});
```

---

## 📊 Códigos de Status

### HTTP Status Codes

| Código | Descrição |
|--------|-----------|
| 200 | OK - Requisição bem-sucedida |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Não autorizado |
| 403 | Forbidden - Acesso negado |
| 404 | Not Found - Recurso não encontrado |
| 500 | Internal Server Error - Erro interno |
| 503 | Service Unavailable - Serviço indisponível |

### WebSocket Status

| Status | Descrição |
|--------|-----------|
| `connected` | Conectado e funcionando |
| `connecting` | Tentando conectar |
| `disconnected` | Desconectado |
| `reconnecting` | Tentando reconectar |
| `error` | Erro de conexão |

---

## 💡 Exemplos de Uso

### JavaScript (Frontend)

```javascript
// Conectar ao WebSocket
const socket = io('http://localhost:3000');

// Solicitar métricas
socket.emit('request_current_metrics');

// Escutar métricas
socket.on('system:metrics', (metrics) => {
  updateDashboard(metrics);
});

// Executar comando
socket.emit('terminal:command', {
  command: 'ps aux',
  sessionId: 'my_terminal'
});

// Escutar output
socket.on('terminal:output', (data) => {
  appendToTerminal(data.output);
});
```

### cURL (API REST)

```bash
# Obter métricas do sistema
curl -X GET http://localhost:3000/api/system/metrics

# Executar comando
curl -X POST http://localhost:3000/api/terminal/execute \
  -H "Content-Type: application/json" \
  -d '{"command": "ls -la"}'

# Obter logs
curl -X GET "http://localhost:3000/api/logs?level=error&limit=10"

# Enviar mensagem Telegram
curl -X POST http://localhost:3000/api/telegram/send \
  -H "Content-Type: application/json" \
  -d '{"message": "Alerta: Sistema funcionando"}'
```

### Python

```python
import requests
import socketio

# API REST
response = requests.get('http://localhost:3000/api/system/metrics')
metrics = response.json()

# WebSocket
sio = socketio.Client()

@sio.event
def connect():
    print('Conectado!')
    sio.emit('request_current_metrics')

@sio.event
def system_metrics(data):
    print('Métricas:', data)

sio.connect('http://localhost:3000')
```

---

## 🚦 Rate Limiting

### Limites por Endpoint

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/api/system/metrics` | 60 req/min | 1 minuto |
| `/api/terminal/execute` | 30 req/min | 1 minuto |
| `/api/logs` | 100 req/min | 1 minuto |
| `/api/telegram/send` | 20 req/min | 1 minuto |

### Headers de Rate Limit

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1705312260
```

---

## 🔐 Autenticação

Atualmente, o SMX LiveBoard não implementa autenticação por padrão. Para ambientes de produção, recomenda-se:

1. **Proxy Reverso**: Nginx com autenticação básica
2. **VPN**: Acesso apenas através de VPN
3. **Firewall**: Restrição de IPs
4. **Autenticação Customizada**: Implementar middleware de autenticação

### Exemplo de Middleware de Autenticação

```javascript
// middleware/auth.js
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token || !isValidToken(token)) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  next();
};

// Usar no Express
app.use('/api', authenticate);
```

---

Esta documentação cobre todas as APIs disponíveis no SMX LiveBoard. Para mais informações sobre implementação específica, consulte a [documentação de arquitetura](./architecture.md).
