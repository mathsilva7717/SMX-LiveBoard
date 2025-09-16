# Serviços do Backend SMX LiveBoard

Este diretório contém os serviços modulares do backend do SMX LiveBoard.

## Serviços Disponíveis

### 1. Terminal Service (`terminalService.js`)
**Funcionalidade**: Execução segura de comandos do sistema operacional.

**Recursos**:
- Execução de comandos únicos
- Sessões de terminal interativas
- Histórico de comandos
- Validação de segurança (comandos perigosos bloqueados)
- Suporte para Windows e Linux

**Endpoints**:
- `POST /api/terminal/execute` - Executar comando
- `GET /api/terminal/history` - Obter histórico
- `GET /api/terminal/safe-commands` - Listar comandos seguros

### 2. SSH Service (`sshService.js`)
**Funcionalidade**: Conexões SSH para servidores remotos.

**Recursos**:
- Conexões SSH com autenticação por senha ou chave privada
- Execução de comandos remotos
- Shells interativos
- Gerenciamento de múltiplas conexões
- Histórico de conexões

**Endpoints**:
- `POST /api/ssh/connect` - Conectar via SSH
- `POST /api/ssh/:connectionId/execute` - Executar comando remoto
- `GET /api/ssh/connections` - Listar conexões ativas
- `DELETE /api/ssh/:connectionId` - Desconectar

### 3. Logs Service (`logsService.js`)
**Funcionalidade**: Sistema de logging e monitoramento de eventos.

**Recursos**:
- Logs estruturados com níveis (INFO, WARNING, ERROR, CRITICAL)
- Armazenamento em arquivo e memória
- Filtros por nível, fonte, período e texto
- Estatísticas de logs
- Exportação em múltiplos formatos (JSON, CSV, TXT)
- Rotação automática de arquivos
- Monitoramento em tempo real via WebSocket

**Endpoints**:
- `GET /api/logs` - Obter logs com filtros
- `GET /api/logs/stats` - Estatísticas dos logs
- `POST /api/logs/clear` - Limpar logs antigos
- `GET /api/logs/export` - Exportar logs

### 4. Telegram Service (`telegramService.js`)
**Funcionalidade**: Integração com Telegram para alertas e notificações.

**Recursos**:
- Envio de mensagens personalizadas
- Alertas automáticos do sistema
- Relatórios de status
- Notificações de comandos executados
- Histórico de mensagens enviadas
- Teste de conectividade

**Endpoints**:
- `POST /api/telegram/configure` - Configurar bot
- `POST /api/telegram/send` - Enviar mensagem
- `POST /api/telegram/alert` - Enviar alerta do sistema
- `GET /api/telegram/test` - Testar conexão
- `GET /api/telegram/status` - Status do bot

## Configuração

### Dependências
```bash
npm install ssh2
```

### Variáveis de Ambiente (Opcional)
```env
TELEGRAM_BOT_TOKEN=seu_bot_token
TELEGRAM_CHAT_ID=seu_chat_id
```

## Uso

### Terminal
```javascript
// Executar comando
const result = await terminalService.executeCommand('dir');
console.log(result.stdout);
```

### SSH
```javascript
// Conectar
const connection = await sshService.connect({
  host: '192.168.1.100',
  username: 'user',
  password: 'password'
});

// Executar comando
const result = await sshService.executeCommand(connection.connectionId, 'ls -la');
```

### Logs
```javascript
// Adicionar log
await logsService.info('Sistema iniciado', 'SYSTEM');

// Obter logs
const logs = logsService.getLogs({
  level: 'WARNING',
  limit: 50
});
```

### Telegram
```javascript
// Configurar
telegramService.configure('bot_token', 'chat_id');

// Enviar alerta
await telegramService.sendSystemAlert('CPU', {
  usage: 95,
  temperature: 85
}, 'WARNING');
```

## Segurança

- **Terminal**: Comandos perigosos são bloqueados automaticamente
- **SSH**: Conexões são validadas e gerenciadas com timeout
- **Logs**: Dados sensíveis são mascarados nos logs
- **Telegram**: Tokens são parcialmente mascarados nos logs

## Monitoramento

Todos os serviços são integrados com o sistema de logs e podem enviar alertas automáticos via Telegram quando configurado.

## Arquivos de Log

Os logs são armazenados em:
- **Memória**: Para acesso rápido (últimos 10.000 logs)
- **Arquivo**: `backend/logs/system.log`
- **Rotação**: Arquivos antigos são renomeados automaticamente
