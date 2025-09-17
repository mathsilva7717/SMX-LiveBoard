# ⚙️ Instalação e Configuração - SMX LiveBoard

Guia completo de instalação e configuração do SMX LiveBoard em diferentes ambientes.

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Instalação Básica](#instalação-básica)
- [Configuração Avançada](#configuração-avançada)
- [Configuração por Ambiente](#configuração-por-ambiente)
- [Configuração de Serviços](#configuração-de-serviços)
- [Troubleshooting](#troubleshooting)
- [Atualizações](#atualizações)

## 🔧 Pré-requisitos

### Sistema Operacional
- **Windows**: 10 ou superior (64-bit)
- **macOS**: 10.15 (Catalina) ou superior
- **Linux**: Ubuntu 18.04+, CentOS 7+, Debian 9+

### Software Necessário

#### Node.js
- **Versão**: 18.0.0 ou superior
- **Download**: [nodejs.org](https://nodejs.org/)
- **Verificação**:
```bash
node --version  # Deve retornar v18.0.0 ou superior
npm --version   # Deve retornar v8.0.0 ou superior
```

#### Git
- **Versão**: 2.0 ou superior
- **Download**: [git-scm.com](https://git-scm.com/)
- **Verificação**:
```bash
git --version
```

### Recursos do Sistema
- **RAM**: Mínimo 512MB, recomendado 1GB+
- **Disco**: 100MB para instalação + espaço para logs
- **CPU**: Qualquer processador moderno
- **Rede**: Porta 3000 disponível (configurável)

### Permissões
- **Linux/macOS**: Permissões de leitura para `/proc`, `/sys`
- **Windows**: Executar como administrador (opcional, para métricas completas)

## 🚀 Instalação Básica

### 1. Clone do Repositório

```bash
# Clone o repositório
git clone https://github.com/mathsilva7717/SMX-LiveBoard.git
cd SMX-LiveBoard

# Verificar estrutura
ls -la
```

### 2. Instalação de Dependências

```bash
# Instalar dependências
npm install

# Verificar instalação
npm list --depth=0
```

### 3. Configuração Inicial

```bash
# Copiar arquivo de configuração (opcional)
cp backend/config.json.example backend/config.json

# Criar arquivo de ambiente (opcional)
cp .env.example .env
```

### 4. Inicialização

```bash
# Iniciar o servidor
npm start

# Ou em modo desenvolvimento
npm run dev
```

### 5. Verificação

Acesse no navegador: `http://localhost:3000`

Você deve ver a interface do SMX LiveBoard com métricas do sistema.

## ⚙️ Configuração Avançada

### Arquivo de Configuração (`backend/config.json`)

```json
{
  "processMonitoring": {
    "maxHistoryPoints": 20,
    "defaultLimit": 10,
    "updateInterval": 5000,
    "fallbackEnabled": true
  },
  "systemInformation": {
    "timeout": 10000,
    "retries": 3
  },
  "logging": {
    "level": "info",
    "enableFileLogging": true
  },
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "cors": {
      "origin": "*",
      "credentials": true
    }
  },
  "websocket": {
    "pingTimeout": 30000,
    "pingInterval": 20000,
    "maxHttpBufferSize": 104857600
  },
  "cache": {
    "basicTtl": 30000,
    "fullTtl": 15000,
    "staticTtl": 300000,
    "systemTtl": 60000,
    "networkTtl": 30000,
    "processesTtl": 10000
  }
}
```

### Variáveis de Ambiente (`.env`)

```bash
# Servidor
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# Logs
LOG_LEVEL=info
LOG_FILE_PATH=./logs/system.log
LOG_CLEANUP_DAYS=7

# Performance
METRICS_INTERVAL=10000
PROCESSES_INTERVAL=60000
SERVICES_INTERVAL=30000
MAX_HISTORY_POINTS=60
MAX_PROCESSES=10
MAX_SERVICES=20

# Cache
CACHE_BASIC_TTL=30000
CACHE_FULL_TTL=15000
CACHE_STATIC_TTL=300000

# WebSocket
WS_PING_TIMEOUT=30000
WS_PING_INTERVAL=20000
WS_MAX_BUFFER_SIZE=104857600

# Telegram
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui

# SSH
SSH_TIMEOUT=30000
SSH_RETRIES=3
SSH_KEEPALIVE_INTERVAL=10000

# Segurança
CORS_ORIGIN=*
ENABLE_AUTH=false
AUTH_TOKEN=seu_token_secreto

# Desenvolvimento
ENABLE_MORGAN=false
DEBUG_MODE=false
VERBOSE_LOGGING=false
```

## 🌍 Configuração por Ambiente

### Desenvolvimento

```bash
# .env.development
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
ENABLE_MORGAN=true
DEBUG_MODE=true
VERBOSE_LOGGING=true
CACHE_BASIC_TTL=5000
CACHE_FULL_TTL=2000
```

### Produção

```bash
# .env.production
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
ENABLE_MORGAN=false
DEBUG_MODE=false
VERBOSE_LOGGING=false
CACHE_BASIC_TTL=30000
CACHE_FULL_TTL=15000
CORS_ORIGIN=https://seu-dominio.com
```

### Teste

```bash
# .env.test
NODE_ENV=test
PORT=3001
LOG_LEVEL=error
ENABLE_MORGAN=false
DEBUG_MODE=false
CACHE_BASIC_TTL=1000
CACHE_FULL_TTL=500
```

## 🔧 Configuração de Serviços

### 1. Telegram Bot

#### Criar Bot
1. Acesse [@BotFather](https://t.me/botfather) no Telegram
2. Execute `/newbot`
3. Siga as instruções para criar o bot
4. Copie o token fornecido

#### Obter Chat ID
1. Adicione o bot ao seu chat/grupo
2. Envie uma mensagem para o bot
3. Acesse: `https://api.telegram.org/bot<SEU_TOKEN>/getUpdates`
4. Copie o `chat.id` da resposta

#### Configurar
```bash
# Adicionar ao .env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-123456789
```

#### Testar
```bash
# Via API
curl -X GET http://localhost:3000/api/telegram/test

# Via interface web
# Acesse a aba "Telegram" e clique em "Testar Conexão"
```

### 2. SSH

#### Configuração Básica
```bash
# Para servidores Linux/macOS
# Certifique-se de que o SSH está instalado e rodando
sudo systemctl status ssh
sudo systemctl start ssh
sudo systemctl enable ssh
```

#### Chaves SSH (Recomendado)
```bash
# Gerar chave SSH
ssh-keygen -t rsa -b 4096 -C "smx-liveboard@example.com"

# Copiar chave pública para servidor
ssh-copy-id user@servidor.com

# Testar conexão
ssh user@servidor.com
```

#### Configuração no SMX LiveBoard
```bash
# Via interface web
# Acesse a aba "SSH" e configure:
# - Host: IP ou domínio do servidor
# - Porta: 22 (padrão)
# - Usuário: seu usuário
# - Senha ou chave privada
```

### 3. Logs

#### Configuração de Logs
```json
{
  "logging": {
    "level": "info",
    "enableFileLogging": true,
    "logDirectory": "./logs",
    "maxFileSize": "10MB",
    "maxFiles": 5,
    "datePattern": "YYYY-MM-DD"
  }
}
```

#### Rotação de Logs
```bash
# Configurar logrotate (Linux)
sudo nano /etc/logrotate.d/smx-liveboard

# Conteúdo:
/var/log/smx-liveboard/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 smx smx
    postrotate
        systemctl reload smx-liveboard
    endscript
}
```

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Porta 3000 em Uso
```bash
# Verificar processo usando a porta
netstat -tulpn | grep :3000
# ou
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou usar porta diferente
PORT=3001 npm start
```

#### 2. Permissões Insuficientes (Linux/macOS)
```bash
# Dar permissões para leitura de sistema
sudo chmod +r /proc/stat /proc/meminfo /proc/diskstats

# Ou executar com sudo (não recomendado)
sudo npm start
```

#### 3. Dependências Não Instaladas
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### 4. Erro de Memória
```bash
# Aumentar limite de memória do Node.js
node --max-old-space-size=4096 backend/index.js

# Ou adicionar ao package.json
"scripts": {
  "start": "node --max-old-space-size=4096 backend/index.js"
}
```

#### 5. WebSocket Não Conecta
```bash
# Verificar firewall
sudo ufw status
sudo ufw allow 3000

# Verificar proxy/reverso
# Certifique-se de que WebSocket está habilitado
```

### Logs de Debug

#### Habilitar Logs Detalhados
```bash
# Via variável de ambiente
DEBUG_MODE=true VERBOSE_LOGGING=true npm start

# Via arquivo de configuração
# Editar backend/config.json
{
  "logging": {
    "level": "debug"
  }
}
```

#### Verificar Logs
```bash
# Logs do sistema
tail -f logs/system.log

# Logs em tempo real
npm run dev  # Mostra logs no console
```

### Verificação de Saúde

#### Endpoint de Health Check
```bash
# Verificar status do sistema
curl http://localhost:3000/api/health

# Resposta esperada:
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "memory": { ... }
}
```

#### Verificar Serviços
```bash
# Status dos serviços
curl http://localhost:3000/api/system/connections
curl http://localhost:3000/api/telegram/status
curl http://localhost:3000/api/ssh/connections
```

## 🔄 Atualizações

### Atualização Manual

```bash
# Fazer backup da configuração
cp backend/config.json config.json.backup
cp .env .env.backup

# Atualizar código
git pull origin main

# Reinstalar dependências (se necessário)
npm install

# Restaurar configuração
cp config.json.backup backend/config.json
cp .env.backup .env

# Reiniciar serviço
npm start
```

### Atualização Automática

```bash
# Script de atualização
#!/bin/bash
# update-smx.sh

echo "🔄 Atualizando SMX LiveBoard..."

# Backup
cp backend/config.json config.json.backup
cp .env .env.backup

# Atualizar
git pull origin main
npm install

# Restaurar
cp config.json.backup backend/config.json
cp .env.backup .env

# Reiniciar
pm2 restart smx-liveboard

echo "✅ Atualização concluída!"
```

### Versionamento

```bash
# Verificar versão atual
npm list smx-liveboard

# Verificar versão disponível
npm view smx-liveboard version

# Atualizar para versão específica
git checkout v1.2.0
npm install
```

## 📦 Instalação via Package Manager

### NPM Global
```bash
# Instalar globalmente
npm install -g smx-liveboard

# Executar
smx-liveboard

# Configurar
smx-liveboard --config
```

### Docker
```bash
# Build da imagem
docker build -t smx-liveboard .

# Executar container
docker run -d \
  --name smx-liveboard \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  smx-liveboard

# Com configuração personalizada
docker run -d \
  --name smx-liveboard \
  -p 3000:3000 \
  -v $(pwd)/config.json:/app/backend/config.json \
  -v $(pwd)/.env:/app/.env \
  smx-liveboard
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  smx-liveboard:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./config.json:/app/backend/config.json
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
```

## 🔒 Configuração de Segurança

### Firewall
```bash
# UFW (Ubuntu)
sudo ufw allow 3000/tcp
sudo ufw enable

# iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4
```

### Proxy Reverso (Nginx)
```nginx
# /etc/nginx/sites-available/smx-liveboard
server {
    listen 80;
    server_name smx.example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL/TLS
```bash
# Certificado Let's Encrypt
sudo certbot --nginx -d smx.example.com

# Ou certificado auto-assinado
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

---

Com esta configuração, o SMX LiveBoard estará pronto para uso em qualquer ambiente. Para mais informações sobre desenvolvimento, consulte a [documentação de desenvolvimento](./development.md).
