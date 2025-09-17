# 🤖 SMX LiveBoard - Bot do Telegram

[![Telegram](https://img.shields.io/badge/Telegram-Bot-blue.svg)](https://telegram.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![API](https://img.shields.io/badge/API-Telegram%20Bot%20API-blue.svg)](https://core.telegram.org/bots/api)

> **Bot do Telegram integrado ao SMX LiveBoard** para receber notificações, alertas de sistema e relatórios em tempo real diretamente no seu chat do Telegram.

## 📸 Demonstração

![SMX Telegram Bot](https://via.placeholder.com/400x300/0088cc/ffffff?text=SMX+Telegram+Bot)
*Interface do bot com alertas de sistema*

![Alertas de CPU](https://via.placeholder.com/400x200/ff6b6b/ffffff?text=CPU+Alert)
*Alertas de CPU em tempo real*

![Relatório de Status](https://via.placeholder.com/400x200/4ecdc4/ffffff?text=Status+Report)
*Relatórios de status do sistema*

## 🚀 Funcionalidades

### 📊 **Alertas de Sistema**
- **CPU**: Alertas quando uso > 60% (médio) ou > 80% (alto)
- **Memória**: Alertas quando RAM > 70% (médio) ou > 85% (alto)
- **Disco**: Alertas quando espaço < 20% (médio) ou < 10% (alto)
- **Processos**: Top 5 processos mais ativos
- **Rede**: Status de conectividade e latência

### 📈 **Relatórios de Status**
- **Resumo completo** do sistema
- **Métricas principais** (CPU, RAM, Disco, Rede)
- **Uptime** e estabilidade
- **Hostname** e informações do servidor

### ⚡ **Notificações de Terminal**
- **Comandos executados** via terminal integrado
- **Saída de comandos** (stdout/stderr)
- **Status de execução** (sucesso/erro)
- **Timestamp** de execução

### 🎨 **Mensagens Estilizadas**
- **Formatação HTML** com emojis
- **Cores e status** visuais
- **Histórico de mensagens** (últimas 1000)
- **Parse mode** configurável

## 🛠️ Configuração

### 1. **Criar Bot no Telegram**

1. **Abra o Telegram** e procure por `@BotFather`
2. **Envie o comando** `/newbot`
3. **Escolha um nome** para seu bot (ex: "SMX LiveBoard Bot")
4. **Escolha um username** (ex: "smx_liveboard_bot")
5. **Copie o token** fornecido pelo BotFather

### 2. **Obter Chat ID**

#### **Método 1: Via Bot**
1. **Inicie uma conversa** com seu bot
2. **Envie qualquer mensagem** (ex: `/start`)
3. **Acesse a URL**: `https://api.telegram.org/bot<SEU_TOKEN>/getUpdates`
4. **Procure por** `"chat":{"id":` e copie o número

#### **Método 2: Via @userinfobot**
1. **Procure por** `@userinfobot` no Telegram
2. **Envie** `/start`
3. **Copie seu User ID**

### 3. **Configurar no SMX LiveBoard**

#### **Via Interface Web**
1. **Acesse** `http://localhost:3000`
2. **Vá para** a seção de configurações
3. **Preencha**:
   - **Bot Token**: Token do BotFather
   - **Chat ID**: Seu ID de chat
4. **Salve** as configurações

#### **Via API**
```bash
curl -X POST http://localhost:3000/api/telegram/configure \
  -H "Content-Type: application/json" \
  -d '{
    "botToken": "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz",
    "chatId": "123456789"
  }'
```

#### **Via Variáveis de Ambiente**
```bash
# .env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

## 📡 APIs Disponíveis

### **Configuração**
```http
POST /api/telegram/configure
Content-Type: application/json

{
  "botToken": "string",
  "chatId": "string"
}
```

### **Enviar Mensagem**
```http
POST /api/telegram/send
Content-Type: application/json

{
  "message": "Sua mensagem aqui"
}
```

### **Enviar Alerta**
```http
POST /api/telegram/alert
Content-Type: application/json

{
  "alertType": "CPU|MEMORY|DISK|PROCESSES",
  "data": {
    "usage": 85,
    "hostname": "servidor-01"
  },
  "severity": "INFO|WARNING|ERROR|CRITICAL"
}
```

### **Relatório de Status**
```http
POST /api/telegram/status
Content-Type: application/json

{
  "systemData": {
    "cpu": { "usage": 45 },
    "memory": { "used": 2048, "total": 8192 },
    "network": { "operstate": "up" }
  }
}
```

### **Testar Conexão**
```http
GET /api/telegram/test
```

### **Histórico de Mensagens**
```http
GET /api/telegram/history?limit=50
```

## 🎯 Exemplos de Uso

### **Alertas de CPU**
```
🔥 SMX CPU Alert
============
🖥️ CPU: 85% [HIGH]
⚡ CORES: 8
🖥️ HOST: servidor-01
⏱️ TIME: 15/01/2024 14:30:25

➡️ CPU monitor ativo 🔥
```

### **Alertas de Memória**
```
💾 SMX Memory Alert
============
💾 RAM: 78% [MEDIUM]
📊 USED: 6.2 GB
📊 TOTAL: 8.0 GB
🖥️ HOST: servidor-01
⏱️ TIME: 15/01/2024 14:30:25

➡️ Memory monitor ativo 💾
```

### **Relatório de Status**
```
⚡ SMX LiveBoard Report
=================
⚡ CPU: 45% [NORMAL]
🌐 REDE: UP 🟢 • LAT: 12ms
💾 RAM: 65% [4.2 GB | 8.0 GB]
⏱️ UPTIME: 5d 12h 30m • [STABLE]
🖥️ HOST: servidor-01

➡️ processes em activity system on 🟢
```

### **Saída de Terminal**
```
✅ COMANDO EXECUTADO

Comando: ls -la
Status: Sucesso
Data/Hora: 15/01/2024 14:30:25

Saída:
total 48
drwxr-xr-x  5 user user 4096 Jan 15 14:30 .
drwxr-xr-x  3 root root 4096 Jan 15 10:00 ..
-rw-r--r--  1 user user 1024 Jan 15 14:30 file.txt
```

## ⚙️ Configurações Avançadas

### **Opções de Mensagem**
```javascript
// Exemplo de envio com opções
await telegramService.sendMessage("Mensagem de teste", {
  parseMode: 'HTML',           // HTML, Markdown, MarkdownV2
  disablePreview: true,        // Desabilitar preview de links
  silent: false,               // Notificação silenciosa
  replyToMessageId: 123,       // Responder a mensagem específica
  keyboard: [                  // Teclado inline
    [
      { text: "Status", callback_data: "status" },
      { text: "Relatório", callback_data: "report" }
    ]
  ]
});
```

### **Severidades de Alerta**
- **INFO** ℹ️: Informações gerais
- **WARNING** ⚠️: Avisos importantes
- **ERROR** ❌: Erros do sistema
- **CRITICAL** 🚨: Situações críticas

### **Histórico de Mensagens**
```javascript
// Obter histórico
const history = telegramService.getMessageHistory(100);

// Limpar histórico
telegramService.messageHistory = [];
```

## 🔧 Integração com Monitoramento

### **Alertas Automáticos**
O bot é integrado automaticamente com o sistema de monitoramento:

```javascript
// No MonitorService
if (cpuUsage > 80) {
  await telegramService.sendSystemAlert('CPU', {
    usage: cpuUsage,
    cores: cpuCores,
    hostname: os.hostname()
  }, 'WARNING');
}
```

### **Configuração de Thresholds**
```javascript
// Configurações de alerta
const alertThresholds = {
  cpu: {
    warning: 60,
    critical: 80
  },
  memory: {
    warning: 70,
    critical: 85
  },
  disk: {
    warning: 80,
    critical: 90
  }
};
```

## 🚨 Troubleshooting

### **Problemas Comuns**

#### **Bot não envia mensagens**
```bash
# Verificar configuração
curl http://localhost:3000/api/telegram/test

# Verificar logs
tail -f backend/logs/system.log | grep telegram
```

#### **Erro 400: Bad Request**
- **Verifique** se o token está correto
- **Confirme** se o chat ID está válido
- **Teste** a conexão com o bot

#### **Erro 403: Forbidden**
- **Inicie** uma conversa com o bot
- **Envie** `/start` para o bot
- **Verifique** se o bot não foi bloqueado

#### **Mensagens não chegam**
- **Verifique** se o chat ID está correto
- **Confirme** se o bot tem permissão para enviar mensagens
- **Teste** enviando uma mensagem manual

### **Logs de Debug**
```bash
# Ativar logs detalhados
export LOG_LEVEL=debug
npm start

# Ver logs do Telegram
grep "telegram" backend/logs/system.log
```

### **Teste Manual**
```bash
# Testar envio de mensagem
curl -X POST http://localhost:3000/api/telegram/send \
  -H "Content-Type: application/json" \
  -d '{"message": "Teste de conexão"}'

# Testar alerta
curl -X POST http://localhost:3000/api/telegram/alert \
  -H "Content-Type: application/json" \
  -d '{
    "alertType": "CPU",
    "data": {"usage": 75, "hostname": "teste"},
    "severity": "WARNING"
  }'
```

## 📊 Monitoramento de Performance

### **Métricas do Bot**
- **Mensagens enviadas** por minuto
- **Taxa de sucesso** de envio
- **Latência** de resposta
- **Histórico** de mensagens

### **Otimizações**
- **Rate limiting** para evitar spam
- **Cache** de configurações
- **Retry** automático em falhas
- **Throttling** de alertas

## 🔒 Segurança

### **Boas Práticas**
- **Nunca** compartilhe seu bot token
- **Use** variáveis de ambiente para tokens
- **Configure** whitelist de chat IDs
- **Monitore** logs de acesso

### **Configuração Segura**
```bash
# .env (nunca commitar)
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui
TELEGRAM_ALLOWED_CHATS=123456789,987654321
```

## 🚀 Roadmap do Bot

### **Próximas Funcionalidades**
- [ ] **Comandos interativos** (`/status`, `/report`)
- [ ] **Teclados inline** para ações rápidas
- [ ] **Agendamento** de relatórios
- [ ] **Múltiplos chats** suportados
- [ ] **Templates** de mensagem personalizáveis
- [ ] **Integração** com webhooks
- [ ] **Dashboard** de métricas do bot

## 🤝 Contribuindo

### **Como Contribuir**
1. **Fork** o projeto
2. **Crie** uma branch: `git checkout -b feature/telegram-improvement`
3. **Desenvolva** sua melhoria
4. **Teste** com seu bot
5. **Submeta** um Pull Request

### **Ideias de Melhorias**
- **Novos tipos** de alerta
- **Templates** de mensagem
- **Integração** com outros serviços
- **Comandos** avançados
- **Interface** de configuração

## 📞 Suporte

### **Desenvolvedor Principal**
- **Nome**: Matheus Silva
- **Email**: [matheus.silva1097@gmail.com](mailto:matheus.silva1097@gmail.com)
- **Telefone**: [+55 13 99709-6178](https://wa.me/5513997096178)
- **GitHub**: [@mathsilva7717](https://github.com/mathsilva7717)

### **Canais de Suporte**
- **GitHub Issues**: Para bugs e sugestões
- **Email**: Suporte direto
- **WhatsApp**: Suporte rápido

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 🌟 **Dica de Uso**

Para uma experiência completa, configure o bot do Telegram junto com:
- **Alertas automáticos** de sistema
- **Relatórios periódicos** de status
- **Notificações** de comandos críticos
- **Monitoramento** 24/7 do seu servidor

**Mantenha-se sempre informado sobre o status do seu sistema!** 🚀

---

**Desenvolvido com ❤️ por [Matheus Silva](https://github.com/mathsilva7717)**

*SMX LiveBoard Bot - Monitoramento inteligente via Telegram* 🤖
