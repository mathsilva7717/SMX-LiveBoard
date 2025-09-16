const https = require('https');
const EventEmitter = require('events');

class TelegramService extends EventEmitter {
  constructor() {
    super();
    this.botToken = null;
    this.chatId = null;
    this.isConfigured = false;
    this.messageHistory = [];
    this.maxHistory = 1000;
  }

  // Configurar bot do Telegram
  configure(botToken, chatId) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.isConfigured = true;
    
    this.emit('configured', { botToken: botToken.substring(0, 10) + '...', chatId });
    return { success: true, message: 'Bot configurado com sucesso' };
  }

  // Verificar se está configurado
  isBotConfigured() {
    return this.isConfigured && this.botToken && this.chatId;
  }

  // Enviar mensagem
  async sendMessage(message, options = {}) {
    if (!this.isBotConfigured()) {
      throw new Error('Bot do Telegram não configurado');
    }

    const messageData = {
      chat_id: this.chatId,
      text: message,
      parse_mode: options.parseMode || 'HTML',
      disable_web_page_preview: options.disablePreview || true,
      disable_notification: options.silent || false
    };

    // Adicionar opções extras se fornecidas
    if (options.replyToMessageId) {
      messageData.reply_to_message_id = options.replyToMessageId;
    }

    if (options.keyboard) {
      messageData.reply_markup = JSON.stringify({
        inline_keyboard: options.keyboard
      });
    }

    return this.makeRequest('sendMessage', messageData);
  }

  // Enviar alerta de sistema
  async sendSystemAlert(alertType, data, severity = 'INFO') {
    const emoji = this.getSeverityEmoji(severity);
    const timestamp = new Date().toLocaleString('pt-BR');
    
    let message = `${emoji} <b>ALERTA DO SISTEMA</b>\n\n`;
    message += `<b>Tipo:</b> ${alertType}\n`;
    message += `<b>Severidade:</b> ${severity}\n`;
    message += `<b>Data/Hora:</b> ${timestamp}\n\n`;

    // Adicionar dados específicos baseado no tipo
    switch (alertType) {
      case 'CPU':
        message += `<b>Uso da CPU:</b> ${data.usage}%\n`;
        break;
      
      case 'MEMORY':
        message += `<b>Uso da Memória:</b> ${data.usage}%\n`;
        message += `<b>Memória Usada:</b> ${data.used}\n`;
        message += `<b>Memória Total:</b> ${data.total}\n`;
        break;
      
      case 'DISK':
        message += `<b>Uso do Disco:</b> ${data.usage}%\n`;
        message += `<b>Espaço Usado:</b> ${data.used}\n`;
        message += `<b>Espaço Total:</b> ${data.total}\n`;
        break;
      
      case 'NETWORK':
        message += `<b>Status:</b> ${data.status}\n`;
        message += `<b>Latência:</b> ${data.latency}ms\n`;
        break;
      
      case 'PROCESS':
        message += `<b>Processo:</b> ${data.name}\n`;
        message += `<b>PID:</b> ${data.pid}\n`;
        message += `<b>CPU:</b> ${data.cpu}%\n`;
        message += `<b>Memória:</b> ${data.memory}MB\n`;
        break;
      
      default:
        message += `<b>Dados:</b>\n<code>${JSON.stringify(data, null, 2)}</code>\n`;
    }

    // Adicionar informações do sistema
    message += `\n<b>Hostname:</b> ${data.hostname || 'N/A'}\n`;
    message += `<b>Sistema:</b> ${data.os || 'N/A'}`;

    const result = await this.sendMessage(message, {
      parseMode: 'HTML',
      silent: severity === 'INFO'
    });

    // Adicionar ao histórico
    this.addToHistory({
      type: 'system_alert',
      alertType,
      severity,
      data,
      timestamp: new Date().toISOString(),
      messageId: result.message_id
    });

    return result;
  }

  // Enviar relatório de status
  async sendStatusReport(systemData) {
    const timestamp = new Date().toLocaleString('pt-BR');
    
    let message = `📊 <b>RELATÓRIO DE STATUS DO SISTEMA</b>\n\n`;
    message += `<b>Data/Hora:</b> ${timestamp}\n\n`;
    
    // CPU
    message += `🖥️ <b>CPU:</b> ${systemData.cpu?.usage || 0}%\n`;
    
    // Memória
    message += `💾 <b>Memória:</b> ${systemData.mem?.usage || 0}%\n`;
    message += `📊 <b>Usado:</b> ${this.formatBytes(systemData.mem?.used || 0)}\n`;
    message += `📊 <b>Total:</b> ${this.formatBytes(systemData.mem?.total || 0)}\n\n`;
    
    // Disco
    if (systemData.fsSize?.[0]) {
      const disk = systemData.fsSize[0];
      message += `💿 <b>Disco:</b> ${disk.use || 0}%\n`;
      message += `📊 <b>Usado:</b> ${this.formatBytes(disk.used || 0)}\n`;
      message += `📊 <b>Total:</b> ${this.formatBytes(disk.size || 0)}\n\n`;
    }
    
    // Rede
    message += `🌐 <b>Rede:</b> ${systemData.networkStats?.[0]?.operstate || 'N/A'}\n`;
    message += `⏱️ <b>Uptime:</b> ${this.formatUptime(systemData.time?.uptime || 0)}\n\n`;
    
    // Top processos
    if (systemData.processes?.length > 0) {
      message += `🔝 <b>Top 3 Processos:</b>\n`;
      systemData.processes.slice(0, 3).forEach((proc, index) => {
        message += `${index + 1}. ${proc.name} (${proc.cpu}% CPU)\n`;
      });
    }

    const result = await this.sendMessage(message, {
      parseMode: 'HTML'
    });

    this.addToHistory({
      type: 'status_report',
      systemData,
      timestamp: new Date().toISOString(),
      messageId: result.message_id
    });

    return result;
  }

  // Enviar comando de terminal
  async sendTerminalOutput(command, output, exitCode) {
    const timestamp = new Date().toLocaleString('pt-BR');
    const status = exitCode === 0 ? '✅' : '❌';
    
    let message = `${status} <b>COMANDO EXECUTADO</b>\n\n`;
    message += `<b>Comando:</b> <code>${command}</code>\n`;
    message += `<b>Status:</b> ${exitCode === 0 ? 'Sucesso' : 'Erro'}\n`;
    message += `<b>Data/Hora:</b> ${timestamp}\n\n`;
    
    if (output.stdout) {
      message += `<b>Saída:</b>\n<pre>${output.stdout.substring(0, 1000)}</pre>\n`;
    }
    
    if (output.stderr) {
      message += `<b>Erro:</b>\n<pre>${output.stderr.substring(0, 1000)}</pre>\n`;
    }

    const result = await this.sendMessage(message, {
      parseMode: 'HTML'
    });

    this.addToHistory({
      type: 'terminal_output',
      command,
      output,
      exitCode,
      timestamp: new Date().toISOString(),
      messageId: result.message_id
    });

    return result;
  }

  // Fazer requisição para API do Telegram
  makeRequest(method, data) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      
      const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${this.botToken}/${method}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(responseData);
            if (response.ok) {
              resolve(response.result);
            } else {
              reject(new Error(`Telegram API Error: ${response.description}`));
            }
          } catch (error) {
            reject(new Error(`Erro ao processar resposta: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  // Obter emoji baseado na severidade
  getSeverityEmoji(severity) {
    const emojis = {
      'INFO': 'ℹ️',
      'WARNING': '⚠️',
      'ERROR': '❌',
      'CRITICAL': '🚨'
    };
    return emojis[severity] || 'ℹ️';
  }

  // Formatar bytes
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Formatar uptime
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }

  // Adicionar ao histórico
  addToHistory(entry) {
    this.messageHistory.push(entry);
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory.shift();
    }
  }

  // Obter histórico de mensagens
  getMessageHistory(limit = 50) {
    return this.messageHistory.slice(-limit);
  }

  // Testar conexão
  async testConnection() {
    if (!this.isBotConfigured()) {
      throw new Error('Bot não configurado');
    }

    try {
      const result = await this.makeRequest('getMe', {});
      return {
        success: true,
        bot: {
          id: result.id,
          username: result.username,
          firstName: result.first_name
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter informações do chat
  async getChatInfo() {
    if (!this.isBotConfigured()) {
      throw new Error('Bot não configurado');
    }

    try {
      const result = await this.makeRequest('getChat', { chat_id: this.chatId });
      return {
        success: true,
        chat: {
          id: result.id,
          type: result.type,
          title: result.title,
          username: result.username
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = TelegramService;
