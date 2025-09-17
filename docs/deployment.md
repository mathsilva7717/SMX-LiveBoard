# 🚀 Deploy e Produção - SMX LiveBoard

Guia completo para deploy e configuração do SMX LiveBoard em ambientes de produção.

## 📋 Índice

- [Estratégias de Deploy](#estratégias-de-deploy)
- [Deploy Manual](#deploy-manual)
- [Deploy com PM2](#deploy-com-pm2)
- [Deploy com Docker](#deploy-com-docker)
- [Deploy com Nginx](#deploy-com-nginx)
- [Deploy na Nuvem](#deploy-na-nuvem)
- [Monitoramento de Produção](#monitoramento-de-produção)
- [Backup e Recuperação](#backup-e-recuperação)
- [Troubleshooting de Produção](#troubleshooting-de-produção)

## 🎯 Estratégias de Deploy

### Opções de Deploy

1. **Deploy Manual**: Instalação direta no servidor
2. **PM2**: Process manager para Node.js
3. **Docker**: Containerização
4. **Nginx**: Proxy reverso + SSL
5. **Cloud**: AWS, DigitalOcean, etc.

### Considerações de Produção

- **Segurança**: Firewall, SSL, autenticação
- **Performance**: Cache, otimizações, CDN
- **Monitoramento**: Logs, métricas, alertas
- **Backup**: Dados, configurações, logs
- **Escalabilidade**: Load balancing, clustering

## 🔧 Deploy Manual

### Preparação do Servidor

#### Ubuntu/Debian
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Git
sudo apt install git -y

# Criar usuário para aplicação
sudo useradd -m -s /bin/bash smx
sudo usermod -aG sudo smx
```

#### CentOS/RHEL
```bash
# Atualizar sistema
sudo yum update -y

# Instalar Node.js 18+
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Instalar Git
sudo yum install git -y

# Criar usuário
sudo useradd -m -s /bin/bash smx
sudo usermod -aG wheel smx
```

### Instalação da Aplicação

```bash
# Mudar para usuário da aplicação
sudo su - smx

# Clone do repositório
git clone https://github.com/mathsilva7717/SMX-LiveBoard.git
cd SMX-LiveBoard

# Instalar dependências
npm install --production

# Configurar ambiente
cp .env.example .env
nano .env
```

### Configuração de Produção

```bash
# .env para produção
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/smx-liveboard/system.log
CORS_ORIGIN=https://seu-dominio.com
```

### Configuração de Logs

```bash
# Criar diretório de logs
sudo mkdir -p /var/log/smx-liveboard
sudo chown smx:smx /var/log/smx-liveboard

# Configurar logrotate
sudo nano /etc/logrotate.d/smx-liveboard
```

```bash
# /etc/logrotate.d/smx-liveboard
/var/log/smx-liveboard/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 smx smx
    postrotate
        systemctl reload smx-liveboard
    endscript
}
```

### Configuração de Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# iptables (CentOS)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4
```

## ⚡ Deploy com PM2

### Instalação do PM2

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Configurar PM2 para iniciar com sistema
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u smx --hp /home/smx
```

### Configuração do PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'smx-liveboard',
    script: 'backend/index.js',
    cwd: '/home/smx/SMX-LiveBoard',
    user: 'smx',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    log_file: '/var/log/smx-liveboard/combined.log',
    out_file: '/var/log/smx-liveboard/out.log',
    error_file: '/var/log/smx-liveboard/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    kill_timeout: 5000,
    listen_timeout: 3000,
    wait_ready: true,
    ready_timeout: 10000
  }]
};
```

### Comandos PM2

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Parar aplicação
pm2 stop smx-liveboard

# Reiniciar aplicação
pm2 restart smx-liveboard

# Recarregar aplicação (zero-downtime)
pm2 reload smx-liveboard

# Ver status
pm2 status

# Ver logs
pm2 logs smx-liveboard

# Monitorar
pm2 monit

# Salvar configuração
pm2 save

# Configurar para iniciar com sistema
pm2 startup
```

### Monitoramento PM2

```bash
# Instalar PM2 Plus (opcional)
pm2 install pm2-server-monit

# Configurar alertas
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

## 🐳 Deploy com Docker

### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    dumb-init \
    curl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S smx -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código da aplicação
COPY --chown=smx:nodejs . .

# Criar diretório de logs
RUN mkdir -p logs && chown smx:nodejs logs

# Mudar para usuário não-root
USER smx

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de inicialização
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/index.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  smx-liveboard:
    build: .
    container_name: smx-liveboard
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOST=0.0.0.0
      - LOG_LEVEL=info
    volumes:
      - ./logs:/app/logs
      - ./config.json:/app/backend/config.json:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - smx-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: smx-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - smx-liveboard
    networks:
      - smx-network

networks:
  smx-network:
    driver: bridge

volumes:
  logs:
    driver: local
```

### Comandos Docker

```bash
# Build da imagem
docker build -t smx-liveboard .

# Executar container
docker run -d \
  --name smx-liveboard \
  -p 3000:3000 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/.env:/app/.env \
  smx-liveboard

# Docker Compose
docker-compose up -d

# Ver logs
docker logs -f smx-liveboard

# Executar comandos
docker exec -it smx-liveboard sh

# Parar e remover
docker-compose down
```

## 🌐 Deploy com Nginx

### Configuração do Nginx

```nginx
# /etc/nginx/sites-available/smx-liveboard
upstream smx_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=websocket:10m rate=5r/s;

server {
    listen 80;
    server_name smx.example.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name smx.example.com;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static Files
    location /assets/ {
        alias /home/smx/SMX-LiveBoard/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /styles/ {
        alias /home/smx/SMX-LiveBoard/styles/;
        expires 1h;
        add_header Cache-Control "public";
    }
    
    location /js/ {
        alias /home/smx/SMX-LiveBoard/js/;
        expires 1h;
        add_header Cache-Control "public";
    }
    
    # API Routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://smx_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # WebSocket
    location /socket.io/ {
        limit_req zone=websocket burst=10 nodelay;
        
        proxy_pass http://smx_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    
    # Main Application
    location / {
        proxy_pass http://smx_backend;
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

### Configuração SSL

```bash
# Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d smx.example.com

# Certificado auto-assinado (desenvolvimento)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem
```

### Ativação do Site

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/smx-liveboard /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

## ☁️ Deploy na Nuvem

### AWS EC2

#### Configuração da Instância
```bash
# Criar instância EC2 (Ubuntu 20.04 LTS)
# Tipo: t3.medium ou superior
# Security Group: HTTP (80), HTTPS (443), SSH (22)

# Conectar via SSH
ssh -i key.pem ubuntu@ec2-ip-address

# Instalar dependências
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

#### Deploy Automatizado
```bash
# Script de deploy
#!/bin/bash
# deploy-aws.sh

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Clone do repositório
git clone https://github.com/mathsilva7717/SMX-LiveBoard.git
cd SMX-LiveBoard

# Instalar dependências
npm install --production

# Configurar PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Configurar Nginx
sudo cp nginx.conf /etc/nginx/sites-available/smx-liveboard
sudo ln -s /etc/nginx/sites-available/smx-liveboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configurar SSL
sudo certbot --nginx -d seu-dominio.com
```

### DigitalOcean

#### Droplet Configuration
```bash
# Criar droplet (Ubuntu 20.04)
# Tipo: Basic $12/mo ou superior
# Adicionar SSH key

# Conectar
ssh root@droplet-ip

# Executar script de deploy
curl -fsSL https://raw.githubusercontent.com/mathsilva7717/SMX-LiveBoard/main/scripts/deploy.sh | bash
```

### Heroku

#### Configuração
```bash
# Instalar Heroku CLI
npm install -g heroku

# Login
heroku login

# Criar app
heroku create smx-liveboard-prod

# Configurar variáveis
heroku config:set NODE_ENV=production
heroku config:set PORT=3000

# Deploy
git push heroku main
```

#### Procfile
```
web: node backend/index.js
```

### Vercel

#### Configuração
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "backend/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 📊 Monitoramento de Produção

### Métricas do Sistema

#### Prometheus + Grafana
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana

volumes:
  grafana-storage:
```

#### Configuração Prometheus
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'smx-liveboard'
    static_configs:
      - targets: ['smx-liveboard:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 5s
```

### Logs Centralizados

#### ELK Stack
```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:7.15.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"

  kibana:
    image: docker.elastic.co/kibana/kibana:7.15.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
```

### Alertas

#### Configuração de Alertas
```javascript
// alerts.js
const alerts = {
  highCpu: {
    threshold: 80,
    duration: 300, // 5 minutos
    action: 'telegram'
  },
  highMemory: {
    threshold: 85,
    duration: 300,
    action: 'email'
  },
  diskSpace: {
    threshold: 90,
    duration: 0,
    action: 'telegram'
  }
};
```

## 💾 Backup e Recuperação

### Estratégia de Backup

#### Dados Importantes
- Configurações (`config.json`, `.env`)
- Logs (`logs/`)
- Dados de cache (se persistente)
- Certificados SSL

#### Script de Backup
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/smx-liveboard"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="smx-liveboard_${DATE}.tar.gz"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup dos arquivos
tar -czf $BACKUP_DIR/$BACKUP_FILE \
    /home/smx/SMX-LiveBoard/config.json \
    /home/smx/SMX-LiveBoard/.env \
    /home/smx/SMX-LiveBoard/logs \
    /etc/nginx/sites-available/smx-liveboard

# Backup do banco de dados (se houver)
# pg_dump smx_liveboard > $BACKUP_DIR/db_${DATE}.sql

# Limpar backups antigos (manter 30 dias)
find $BACKUP_DIR -name "smx-liveboard_*.tar.gz" -mtime +30 -delete

echo "Backup criado: $BACKUP_FILE"
```

#### Agendamento
```bash
# Crontab
0 2 * * * /home/smx/scripts/backup.sh
```

### Recuperação

#### Script de Recuperação
```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <arquivo_backup>"
    exit 1
fi

# Parar aplicação
pm2 stop smx-liveboard

# Extrair backup
tar -xzf $BACKUP_FILE -C /

# Restaurar permissões
chown -R smx:smx /home/smx/SMX-LiveBoard

# Reiniciar aplicação
pm2 start smx-liveboard

echo "Recuperação concluída"
```

## 🐛 Troubleshooting de Produção

### Problemas Comuns

#### 1. Aplicação Não Inicia
```bash
# Verificar logs
pm2 logs smx-liveboard
journalctl -u smx-liveboard -f

# Verificar configuração
node -c backend/index.js

# Verificar dependências
npm list --production
```

#### 2. Alto Uso de Memória
```bash
# Verificar uso de memória
pm2 monit
htop

# Ajustar limite de memória
pm2 restart smx-liveboard --max-memory-restart 1G
```

#### 3. Conexões WebSocket Instáveis
```bash
# Verificar configuração Nginx
sudo nginx -t

# Verificar logs Nginx
sudo tail -f /var/log/nginx/error.log

# Testar WebSocket
wscat -c wss://seu-dominio.com/socket.io/
```

#### 4. SSL/TLS Issues
```bash
# Verificar certificado
openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout

# Testar SSL
curl -I https://seu-dominio.com

# Renovar certificado Let's Encrypt
sudo certbot renew
```

### Monitoramento de Saúde

#### Health Check Script
```bash
#!/bin/bash
# health-check.sh

URL="https://seu-dominio.com/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -eq 200 ]; then
    echo "✅ Aplicação funcionando"
    exit 0
else
    echo "❌ Aplicação com problemas (HTTP $RESPONSE)"
    # Enviar alerta
    curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
        -d "chat_id=$TELEGRAM_CHAT_ID" \
        -d "text=🚨 SMX LiveBoard está com problemas!"
    exit 1
fi
```

#### Agendamento de Health Check
```bash
# Crontab - verificar a cada 5 minutos
*/5 * * * * /home/smx/scripts/health-check.sh
```

---

Com este guia, você terá todas as informações necessárias para fazer deploy do SMX LiveBoard em produção de forma segura e eficiente. Para mais informações sobre desenvolvimento, consulte a [documentação de desenvolvimento](./development.md).
