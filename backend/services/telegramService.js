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
    const timestamp = new Date().toLocaleString('pt-BR');
    const hostname = data.hostname || 'UNKNOWN';
    
    let message = '';
    
    // Formato estiloso baseado no tipo
    switch (alertType) {
      case 'CPU':
        const cpuStatus = data.usage > 80 ? '[HIGH]' : data.usage > 60 ? '[MEDIUM]' : '[NORMAL]';
        message = `🔥 <b>SMX CPU Alert</b>\n`;
        message += `============\n`;
        message += `🖥️ <b>CPU:</b> ${data.usage}% ${cpuStatus}\n`;
        message += `⚡ <b>CORES:</b> ${data.cores || 'N/A'}\n`;
        message += `🖥️ <b>HOST:</b> ${hostname}\n`;
        message += `⏱️ <b>TIME:</b> ${timestamp}\n\n`;
        message += `➡️ CPU monitor ativo 🔥`;
        break;
      
      case 'MEMORY':
        const memStatus = data.usage > 85 ? '[HIGH]' : data.usage > 70 ? '[MEDIUM]' : '[NORMAL]';
        message = `💾 <b>SMX Memory Alert</b>\n`;
        message += `============\n`;
        message += `💾 <b>RAM:</b> ${data.usage}% ${memStatus}\n`;
        message += `📊 <b>USED:</b> ${this.formatBytes(data.used || 0)}\n`;
        message += `📊 <b>TOTAL:</b> ${this.formatBytes(data.total || 0)}\n`;
        message += `🖥️ <b>HOST:</b> ${hostname}\n`;
        message += `⏱️ <b>TIME:</b> ${timestamp}\n\n`;
        message += `➡️ Memory monitor ativo 💾`;
        break;
      
      case 'DISK':
        const diskStatus = data.usage > 90 ? '[HIGH]' : data.usage > 80 ? '[MEDIUM]' : '[NORMAL]';
        message = `💿 <b>SMX Disk Alert</b>\n`;
        message += `============\n`;
        message += `💿 <b>DISK:</b> ${data.usage}% ${diskStatus}\n`;
        message += `📊 <b>USED:</b> ${this.formatBytes(data.used || 0)}\n`;
        message += `📊 <b>TOTAL:</b> ${this.formatBytes(data.total || 0)}\n`;
        message += `🖥️ <b>HOST:</b> ${hostname}\n`;
        message += `⏱️ <b>TIME:</b> ${timestamp}\n\n`;
        message += `➡️ Disk monitor ativo 💿`;
        break;
      
      case 'PROCESSES':
        message = `⚙️ <b>SMX Processes Alert</b>\n`;
        message += `============\n`;
        message += `🔝 <b>TOP 5 PROCESSOS ATIVOS:</b>\n\n`;
        
        if (data.processes && data.processes.length > 0) {
          data.processes.forEach((proc, index) => {
            const cpuEmoji = proc.cpu > 50 ? '🔥' : proc.cpu > 20 ? '⚡' : '💤';
            message += `${index + 1}. ${cpuEmoji} ${proc.name}\n`;
            message += `   <b>CPU:</b> ${proc.cpu}% • <b>RAM:</b> ${proc.memory}MB • <b>PID:</b> ${proc.pid}\n\n`;
          });
        } else {
          message += `❌ Nenhum processo encontrado\n\n`;
        }
        
        message += `🖥️ <b>HOST:</b> ${hostname}\n`;
        message += `⏱️ <b>TIME:</b> ${timestamp}\n\n`;
        message += `➡️ Process monitor ativo ⚙️`;
        break;
      
      default:
        message = `📊 <b>SMX System Alert</b>\n`;
        message += `============\n`;
        message += `⚠️ <b>TIPO:</b> ${alertType}\n`;
        message += `📊 <b>DADOS:</b> ${JSON.stringify(data, null, 2)}\n`;
        message += `🖥️ <b>HOST:</b> ${hostname}\n`;
        message += `⏱️ <b>TIME:</b> ${timestamp}\n\n`;
        message += `➡️ System monitor ativo 📊`;
    }

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
    
    
    // Determinar status do sistema
    const cpuUsage = systemData.cpu?.usage || 0;
    const memUsed = systemData.memory?.used || 0;
    const memTotal = systemData.memory?.total || 0;
    const memUsage = memTotal > 0 ? Math.round((memUsed / memTotal) * 100) : (systemData.memory?.usage || 0);
    const diskUsage = systemData.fsSize?.[0]?.use || 0;
    const networkStatus = systemData.network?.operstate || 'unknown';
    const networkLatency = systemData.network?.latency || 0;
    
    // Determinar status de CPU
    const cpuStatus = cpuUsage > 80 ? '[HIGH]' : cpuUsage > 60 ? '[MEDIUM]' : '[NORMAL]';
    
    // Determinar status de uptime
    const uptimeSeconds = systemData.time?.uptime || 0;
    const uptimeStatus = uptimeSeconds > 86400 ? 'STABLE' : 'RECENT';
    
    let message = `⚡ <b>SMX LiveBoard Report</b>\n`;
    message += `=================\n`;
    message += `⚡ <b>CPU:</b> ${cpuUsage}%  ${cpuStatus}\n`;
    
    // Rede
    const statusEmoji = networkStatus === 'up' ? '🟢' : '🔴';
    const statusText = networkStatus === 'up' ? 'UP' : 'DOWN';
    message += `🌐 <b>REDE:</b> ${statusText} ${statusEmoji} • LAT: ${networkLatency}ms\n`;
    
    // Memória
    message += `💾 <b>RAM:</b> ${memUsage}% [${this.formatBytes(memUsed)} | ${this.formatBytes(memTotal)}]\n`;
    
    // Uptime
    message += `⏱️ <b>UPTIME:</b> ${this.formatUptime(uptimeSeconds)} • [${uptimeStatus}]\n`;
    
    // Hostname
    const hostname = systemData.osInfo?.hostname || 'UNKNOWN';
    message += `🖥️ <b>HOST:</b> ${hostname}\n\n`;
    
    // Status final
    message += `➡️ processes em activity system <b>on</b> ${statusEmoji}`;

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
