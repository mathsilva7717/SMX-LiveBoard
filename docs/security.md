# 🔒 Segurança - SMX LiveBoard

Documentação completa sobre práticas de segurança, configurações e recomendações para o SMX LiveBoard.

## 📋 Índice

- [Visão Geral de Segurança](#visão-geral-de-segurança)
- [Configurações de Segurança](#configurações-de-segurança)
- [Autenticação e Autorização](#autenticação-e-autorização)
- [Configurações de Rede](#configurações-de-rede)
- [Auditoria e Logs](#auditoria-e-logs)
- [Práticas Recomendadas](#práticas-recomendadas)
- [Vulnerabilidades Conhecidas](#vulnerabilidades-conhecidas)
- [Resposta a Incidentes](#resposta-a-incidentes)

## 🛡️ Visão Geral de Segurança

### Princípios de Segurança

O SMX LiveBoard foi desenvolvido seguindo os princípios de segurança:

1. **Defesa em Profundidade**: Múltiplas camadas de segurança
2. **Princípio do Menor Privilégio**: Acesso mínimo necessário
3. **Segurança por Design**: Segurança integrada desde o início
4. **Transparência**: Logs e auditoria completos
5. **Atualização Contínua**: Manutenção de dependências

### Modelo de Ameaças

#### Ameaças Identificadas
- **Acesso Não Autorizado**: Tentativas de acesso sem permissão
- **Execução de Comandos Maliciosos**: Comandos perigosos via terminal
- **Vazamento de Dados**: Exposição de informações sensíveis
- **Ataques de Rede**: DDoS, man-in-the-middle
- **Injeção de Código**: XSS, SQL injection (se aplicável)

#### Contramedidas
- Validação rigorosa de entrada
- Sanitização de comandos
- Criptografia de dados sensíveis
- Firewall e proxy reverso
- Logs de auditoria

## ⚙️ Configurações de Segurança

### Configuração do Servidor

#### Headers de Segurança
```javascript
// Configuração do Helmet.js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
```

#### Configuração CORS
```javascript
// Configuração CORS restritiva
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    // Lista de domínios permitidos
    const allowedOrigins = [
      'https://smx.example.com',
      'https://admin.example.com'
    ];
    
    // Permitir requisições sem origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
```

### Configuração de Ambiente

#### Variáveis de Segurança
```bash
# .env.production
NODE_ENV=production
PORT=3000

# Segurança
CORS_ORIGIN=https://seu-dominio.com
ENABLE_AUTH=true
AUTH_TOKEN=seu_token_super_secreto_aqui
SESSION_SECRET=outro_secret_muito_seguro
JWT_SECRET=jwt_secret_ultra_seguro

# Logs de segurança
SECURITY_LOG_LEVEL=info
AUDIT_LOG_ENABLED=true
LOG_SENSITIVE_DATA=false

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Timeouts
REQUEST_TIMEOUT=30000
SSH_TIMEOUT=30000
WEBSOCKET_TIMEOUT=30000

# Criptografia
ENCRYPTION_KEY=sua_chave_de_criptografia_32_chars
```

### Configuração de Firewall

#### UFW (Ubuntu)
```bash
# Configuração básica do firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir apenas IPs específicos para SSH (opcional)
sudo ufw allow from 192.168.1.0/24 to any port 22

# Ativar firewall
sudo ufw enable

# Verificar status
sudo ufw status verbose
```

#### iptables (CentOS/RHEL)
```bash
# Limpar regras existentes
sudo iptables -F
sudo iptables -X
sudo iptables -t nat -F
sudo iptables -t nat -X
sudo iptables -t mangle -F
sudo iptables -t mangle -X

# Política padrão
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# Permitir loopback
sudo iptables -A INPUT -i lo -j ACCEPT

# Permitir conexões estabelecidas
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Permitir SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Permitir HTTP/HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Salvar regras
sudo iptables-save > /etc/iptables/rules.v4
```

## 🔐 Autenticação e Autorização

### Sistema de Autenticação

#### Middleware de Autenticação
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthMiddleware {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'default-secret';
    this.tokenExpiry = '24h';
  }

  // Gerar token JWT
  generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.secret, { 
      expiresIn: this.tokenExpiry 
    });
  }

  // Verificar token
  verifyToken(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso requerido' 
      });
    }

    try {
      const decoded = jwt.verify(token, this.secret);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ 
        error: 'Token inválido' 
      });
    }
  }

  // Verificar permissões
  requireRole(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Usuário não autenticado' 
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'Permissão insuficiente' 
        });
      }

      next();
    };
  }
}

module.exports = new AuthMiddleware();
```

#### Sistema de Usuários
```javascript
// models/User.js
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class User {
  constructor() {
    this.users = new Map();
    this.saltRounds = 12;
  }

  // Criar usuário
  async createUser(username, password, role = 'user') {
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);
    const userId = crypto.randomUUID();
    
    const user = {
      id: userId,
      username,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      lastLogin: null,
      isActive: true
    };

    this.users.set(userId, user);
    return user;
  }

  // Autenticar usuário
  async authenticate(username, password) {
    const user = Array.from(this.users.values())
      .find(u => u.username === username && u.isActive);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Senha incorreta');
    }

    // Atualizar último login
    user.lastLogin = new Date();
    
    return user;
  }

  // Buscar usuário por ID
  getUserById(id) {
    return this.users.get(id);
  }
}

module.exports = new User();
```

### Configuração de Rotas Protegidas

```javascript
// Rotas protegidas
app.use('/api/admin', auth.verifyToken, auth.requireRole(['admin']));
app.use('/api/terminal', auth.verifyToken);
app.use('/api/ssh', auth.verifyToken);

// Rota de login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username e password são obrigatórios' 
      });
    }

    const user = await User.authenticate(username, password);
    const token = auth.generateToken(user);

    // Log de login
    logger.info('User login successful', {
      userId: user.id,
      username: user.username,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    logger.warning('Login failed', {
      username: req.body.username,
      ip: req.ip,
      error: error.message
    });

    res.status(401).json({ 
      error: 'Credenciais inválidas' 
    });
  }
});
```

## 🌐 Configurações de Rede

### Proxy Reverso Seguro

#### Nginx com SSL
```nginx
# /etc/nginx/sites-available/smx-liveboard-secure
server {
    listen 80;
    server_name smx.example.com;
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
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: ws:; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'none';" always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    # Login rate limiting
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    
    # Main application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### VPN e Acesso Remoto

#### Configuração OpenVPN
```bash
# Instalar OpenVPN
sudo apt install openvpn easy-rsa -y

# Configurar CA
make-cadir ~/openvpn-ca
cd ~/openvpn-ca
source vars
./clean-all
./build-ca

# Gerar certificado servidor
./build-key-server server

# Gerar certificado cliente
./build-key client1

# Configurar servidor
sudo cp ~/openvpn-ca/keys/server.crt /etc/openvpn/
sudo cp ~/openvpn-ca/keys/server.key /etc/openvpn/
sudo cp ~/openvpn-ca/keys/ca.crt /etc/openvpn/
```

## 📋 Auditoria e Logs

### Sistema de Auditoria

#### Eventos Auditados
```javascript
const auditEvents = {
  // Autenticação
  LOGIN_SUCCESS: 'Login bem-sucedido',
  LOGIN_FAILED: 'Tentativa de login falhada',
  LOGOUT: 'Logout realizado',
  TOKEN_EXPIRED: 'Token expirado',
  
  // Comandos
  COMMAND_EXECUTED: 'Comando executado',
  COMMAND_BLOCKED: 'Comando bloqueado',
  COMMAND_FAILED: 'Comando falhou',
  
  // SSH
  SSH_CONNECT: 'Conexão SSH estabelecida',
  SSH_DISCONNECT: 'Conexão SSH encerrada',
  SSH_COMMAND: 'Comando SSH executado',
  SSH_FAILED: 'Conexão SSH falhou',
  
  // Sistema
  CONFIG_CHANGED: 'Configuração alterada',
  SYSTEM_RESTART: 'Sistema reiniciado',
  ERROR_OCCURRED: 'Erro ocorreu',
  
  // Segurança
  UNAUTHORIZED_ACCESS: 'Tentativa de acesso não autorizado',
  RATE_LIMIT_EXCEEDED: 'Limite de taxa excedido',
  SUSPICIOUS_ACTIVITY: 'Atividade suspeita detectada'
};
```

#### Logger de Auditoria
```javascript
// utils/auditLogger.js
class AuditLogger {
  constructor() {
    this.logFile = '/var/log/smx-liveboard/audit.log';
  }

  log(event, details = {}) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
      userId: details.userId || 'anonymous',
      sessionId: details.sessionId || 'unknown'
    };

    // Log para arquivo
    const logLine = JSON.stringify(auditEntry) + '\n';
    require('fs').appendFileSync(this.logFile, logLine);

    // Log para console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('AUDIT:', auditEntry);
    }
  }

  // Métodos específicos
  logLogin(username, success, ip, userAgent) {
    this.log(success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED', {
      username,
      ip,
      userAgent
    });
  }

  logCommand(command, success, userId, ip) {
    this.log(success ? 'COMMAND_EXECUTED' : 'COMMAND_FAILED', {
      command,
      userId,
      ip
    });
  }

  logUnauthorizedAccess(ip, userAgent, endpoint) {
    this.log('UNAUTHORIZED_ACCESS', {
      ip,
      userAgent,
      endpoint
    });
  }
}

module.exports = new AuditLogger();
```

### Monitoramento de Segurança

#### Detecção de Intrusão
```javascript
// security/intrusionDetection.js
class IntrusionDetection {
  constructor() {
    this.failedLogins = new Map();
    this.suspiciousIPs = new Set();
    this.rateLimitViolations = new Map();
  }

  // Detectar tentativas de força bruta
  checkBruteForce(ip, success) {
    if (!success) {
      const attempts = this.failedLogins.get(ip) || 0;
      this.failedLogins.set(ip, attempts + 1);

      if (attempts + 1 >= 5) {
        this.suspiciousIPs.add(ip);
        logger.warning('Brute force attack detected', { ip });
        
        // Bloquear IP temporariamente
        this.blockIP(ip, 3600000); // 1 hora
      }
    } else {
      this.failedLogins.delete(ip);
    }
  }

  // Detectar atividade suspeita
  checkSuspiciousActivity(req, res, next) {
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    
    // Verificar se IP está bloqueado
    if (this.isIPBlocked(ip)) {
      return res.status(403).json({ 
        error: 'IP bloqueado por atividade suspeita' 
      });
    }

    // Verificar user agent suspeito
    if (this.isSuspiciousUserAgent(userAgent)) {
      logger.warning('Suspicious user agent detected', { ip, userAgent });
    }

    next();
  }

  // Verificar comandos perigosos
  checkDangerousCommand(command) {
    const dangerousCommands = [
      'rm -rf /',
      'format',
      'fdisk',
      'mkfs',
      'dd if=',
      'shutdown',
      'reboot',
      'halt',
      'poweroff'
    ];

    return dangerousCommands.some(dangerous => 
      command.toLowerCase().includes(dangerous)
    );
  }
}

module.exports = new IntrusionDetection();
```

## ✅ Práticas Recomendadas

### Desenvolvimento Seguro

#### Validação de Entrada
```javascript
// utils/validation.js
const validator = require('validator');
const xss = require('xss');

class InputValidator {
  // Validar e sanitizar comandos
  validateCommand(command) {
    if (!command || typeof command !== 'string') {
      throw new Error('Comando inválido');
    }

    // Remover caracteres perigosos
    const sanitized = command
      .replace(/[;&|`$(){}[\]]/g, '')
      .trim();

    // Verificar comprimento
    if (sanitized.length > 1000) {
      throw new Error('Comando muito longo');
    }

    // Verificar comandos perigosos
    const dangerousCommands = [
      'rm -rf', 'format', 'fdisk', 'mkfs', 'dd',
      'shutdown', 'reboot', 'halt', 'poweroff'
    ];

    const isDangerous = dangerousCommands.some(dangerous => 
      sanitized.toLowerCase().includes(dangerous)
    );

    if (isDangerous) {
      throw new Error('Comando não permitido por segurança');
    }

    return sanitized;
  }

  // Validar dados de entrada
  validateInput(data, schema) {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      if (rules.required && !value) {
        errors.push(`${field} é obrigatório`);
        continue;
      }

      if (value) {
        if (rules.type === 'string' && typeof value !== 'string') {
          errors.push(`${field} deve ser uma string`);
        }

        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} deve ter pelo menos ${rules.minLength} caracteres`);
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} deve ter no máximo ${rules.maxLength} caracteres`);
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} tem formato inválido`);
        }

        if (rules.sanitize) {
          data[field] = xss(value);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return data;
  }
}

module.exports = new InputValidator();
```

#### Criptografia de Dados Sensíveis
```javascript
// utils/encryption.js
const crypto = require('crypto');

class Encryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
  }

  // Criptografar dados
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('smx-liveboard', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // Descriptografar dados
  decrypt(encryptedData) {
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('smx-liveboard', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Hash de senhas
  async hashPassword(password) {
    const bcrypt = require('bcrypt');
    return await bcrypt.hash(password, 12);
  }

  // Verificar senha
  async verifyPassword(password, hash) {
    const bcrypt = require('bcrypt');
    return await bcrypt.compare(password, hash);
  }
}

module.exports = new Encryption();
```

### Configuração de Produção

#### Checklist de Segurança
```markdown
## Checklist de Segurança para Produção

### Servidor
- [ ] Firewall configurado e ativo
- [ ] SSH configurado com chaves (sem senha)
- [ ] Usuário não-root para aplicação
- [ ] Logs de sistema configurados
- [ ] Atualizações de segurança aplicadas

### Aplicação
- [ ] Variáveis de ambiente configuradas
- [ ] Autenticação habilitada
- [ ] HTTPS configurado
- [ ] Headers de segurança configurados
- [ ] Rate limiting ativo
- [ ] Logs de auditoria habilitados

### Rede
- [ ] Proxy reverso configurado
- [ ] SSL/TLS configurado
- [ ] CORS configurado corretamente
- [ ] VPN configurada (se necessário)

### Monitoramento
- [ ] Logs centralizados
- [ ] Alertas de segurança configurados
- [ ] Monitoramento de intrusão ativo
- [ ] Backup de configurações

### Dados
- [ ] Dados sensíveis criptografados
- [ ] Backup regular configurado
- [ ] Retenção de logs configurada
- [ ] Limpeza de dados antigos
```

## ⚠️ Vulnerabilidades Conhecidas

### Vulnerabilidades Comuns

#### 1. Execução de Comandos
**Risco**: Alto
**Descrição**: Terminal permite execução de comandos do sistema
**Mitigação**: 
- Validação rigorosa de comandos
- Lista de comandos permitidos
- Execução em ambiente isolado
- Logs de auditoria

#### 2. Acesso SSH
**Risco**: Alto
**Descrição**: Conexões SSH para servidores remotos
**Mitigação**:
- Validação de credenciais
- Timeout de conexão
- Logs de todas as operações
- Limitação de comandos

#### 3. Exposição de Dados
**Risco**: Médio
**Descrição**: Métricas do sistema podem conter informações sensíveis
**Mitigação**:
- Filtragem de dados sensíveis
- Criptografia de dados em trânsito
- Controle de acesso baseado em roles

#### 4. WebSocket
**Risco**: Médio
**Descrição**: Comunicação em tempo real sem autenticação
**Mitigação**:
- Autenticação via token
- Rate limiting
- Validação de mensagens
- Logs de conexão

### Atualizações de Segurança

#### Processo de Atualização
```bash
# Script de atualização de segurança
#!/bin/bash
# security-update.sh

echo "🔒 Iniciando atualização de segurança..."

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Atualizar dependências Node.js
npm audit
npm audit fix

# Verificar vulnerabilidades
npm audit --audit-level moderate

# Atualizar certificados SSL
sudo certbot renew

# Verificar configurações de segurança
sudo ufw status
sudo fail2ban-client status

echo "✅ Atualização de segurança concluída"
```

## 🚨 Resposta a Incidentes

### Plano de Resposta

#### 1. Detecção
- Monitoramento automático de logs
- Alertas em tempo real
- Análise de padrões suspeitos

#### 2. Contenção
- Bloqueio de IPs suspeitos
- Desconexão de sessões ativas
- Isolamento de sistemas afetados

#### 3. Investigação
- Análise de logs
- Identificação do vetor de ataque
- Avaliação de danos

#### 4. Recuperação
- Restauração de backups
- Aplicação de patches
- Reconfiguração de segurança

#### 5. Lições Aprendidas
- Documentação do incidente
- Atualização de procedimentos
- Treinamento da equipe

### Scripts de Emergência

#### Bloqueio de IP
```bash
#!/bin/bash
# block-ip.sh

IP=$1
if [ -z "$IP" ]; then
    echo "Uso: $0 <IP>"
    exit 1
fi

# Bloquear no firewall
sudo ufw deny from $IP

# Bloquear no iptables
sudo iptables -A INPUT -s $IP -j DROP

# Log do bloqueio
echo "$(date): IP $IP bloqueado por atividade suspeita" >> /var/log/security.log

echo "IP $IP bloqueado com sucesso"
```

#### Desconexão de Sessões
```bash
#!/bin/bash
# disconnect-sessions.sh

# Desconectar todas as sessões SSH
sudo pkill -f ssh

# Reiniciar serviço SSH
sudo systemctl restart ssh

# Limpar sessões WebSocket
curl -X POST http://localhost:3000/api/system/cleanup-connections

echo "Sessões desconectadas"
```

---

Esta documentação cobre todos os aspectos de segurança do SMX LiveBoard. Para mais informações sobre monitoramento, consulte a [documentação de monitoramento](./monitoring.md).
