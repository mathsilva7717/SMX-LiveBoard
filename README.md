# 🚀 SMX LiveBoard

> **Dashboard de monitoramento de sistema em tempo real com interface moderna e funcionalidades avançadas**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-green.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/smx/liveboard)
[![Open Source](https://img.shields.io/badge/Open%20Source-✅-brightgreen.svg)](https://github.com/smx/liveboard)

## ✨ O que é o SMX LiveBoard?

O **SMX LiveBoard** é um dashboard moderno e intuitivo para monitoramento de sistemas em tempo real. Ele oferece uma interface limpa e funcionalidades avançadas para administradores de sistema, desenvolvedores e entusiastas de tecnologia.

## 🎯 Principais Funcionalidades

### 📊 **Monitoramento em Tempo Real**
- **CPU**: Uso, temperatura, cores ativos
- **Memória**: RAM utilizada, disponível, histórico
- **Disco**: Espaço usado, velocidade de leitura/escrita
- **Rede**: Latência, status de conexão, throughput

### 🤖 **Integração com Telegram**
- Alertas automáticos quando recursos estão altos
- Relatórios de status personalizados
- Notificações de comandos executados
- Mensagens formatadas com emojis e negrito

### 💻 **Terminal Integrado**
- Execução segura de comandos do sistema
- Histórico de comandos
- Validação de segurança (comandos perigosos bloqueados)
- Suporte para Windows e Linux

### 🔐 **Conexões SSH**
- Conecte-se a servidores remotos
- Execute comandos em múltiplas máquinas
- Gerenciamento de conexões ativas
- Autenticação por senha ou chave privada

### 📈 **Gráficos e Histórico**
- Visualização de dados históricos
- Gráficos interativos e responsivos
- Exportação de dados
- Análise de tendências

### 🖥️ **Aplicativo Desktop**
- Interface nativa multiplataforma
- Notificações do sistema
- Inicialização automática
- Instalador profissional

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Descrição |
|------------|-----------|
| **Node.js** | Backend e API REST |
| **Express** | Framework web |
| **Socket.io** | Comunicação em tempo real |
| **Electron** | Aplicativo desktop |
| **HTML5/CSS3** | Interface moderna |
| **JavaScript** | Lógica frontend |
| **System Information** | Coleta de dados do sistema |

## 🚀 Instalação Rápida

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn
- Git

### 1. Clone o repositório
```bash
git clone https://github.com/smx/liveboard.git
cd liveboard
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o ambiente (opcional)
```bash
# Copie o arquivo de configuração
cp config.env.example config.env

# Edite as configurações se necessário
nano config.env
```

### 4. Execute o projeto
```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm start
```

### 5. Acesse o dashboard
Abra seu navegador em: `http://localhost:3000`

## 📱 Como Usar

### Monitoramento Básico
1. **Inicie o aplicativo** - O dashboard carrega automaticamente
2. **Visualize os dados** - CPU, RAM, Disk e Network em tempo real
3. **Configure alertas** - Defina limites para notificações

### Integração com Telegram
1. **Crie um bot** - Use @BotFather no Telegram
2. **Configure no dashboard** - Adicione token e chat ID
3. **Receba alertas** - Notificações automáticas quando recursos estão altos

### Terminal Integrado
1. **Acesse a aba Terminal** - Interface segura de comandos
2. **Execute comandos** - Digite comandos do sistema
3. **Visualize histórico** - Todos os comandos ficam salvos

### Conexões SSH
1. **Adicione servidor** - Host, usuário e senha/chave
2. **Conecte** - Estabeleça conexão segura
3. **Execute remotamente** - Comandos em servidores remotos

## ⚙️ Configuração Avançada

### Variáveis de Ambiente
```env
# Servidor
NODE_ENV=production
PORT=3000

# Monitoramento
METRICS_INTERVAL=10000
PROCESSES_INTERVAL=60000

# Telegram (opcional)
TELEGRAM_BOT_TOKEN=seu_bot_token
TELEGRAM_CHAT_ID=seu_chat_id

# Segurança
CORS_ORIGIN=*
LOG_LEVEL=info
```

### Build para Desktop
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 📸 Screenshots

> *Screenshots serão adicionados em breve*

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Veja nosso [Guia de Contribuição](CONTRIBUTING.md) para mais detalhes.

### Como contribuir:
1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

## 🐛 Reportando Bugs

Encontrou um bug? Abra uma [issue](https://github.com/smx/liveboard/issues) com:
- Descrição detalhada do problema
- Passos para reproduzir
- Screenshots (se aplicável)
- Informações do sistema

## 💡 Sugerindo Features

Tem uma ideia? Abra uma [issue](https://github.com/smx/liveboard/issues) com:
- Descrição da feature
- Casos de uso
- Benefícios esperados

## 📋 Roadmap

- [ ] **v1.1**: Suporte a Docker
- [ ] **v1.2**: Dashboard mobile
- [ ] **v1.3**: Integração com Slack
- [ ] **v1.4**: Alertas por email
- [ ] **v1.5**: API pública

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- [System Information](https://github.com/sebhildebrandt/systeminformation) - Coleta de dados do sistema
- [Socket.io](https://socket.io/) - Comunicação em tempo real
- [Electron](https://www.electronjs.org/) - Framework desktop
- [Express](https://expressjs.com/) - Framework web

## 👨‍💻 Autor

**Matheus Silva** - Desenvolvedor Full Stack

- 🔗 **LinkedIn**: [@mathsilvass](https://www.linkedin.com/in/mathsilvass)
- 📧 **Email**: matheus.silva1097@gmail.com
- 🐙 **GitHub**: [@mathsilvass](https://github.com/mathsilvass)

## 📞 Suporte

- **GitHub Issues**: [Reportar problemas](https://github.com/smx/liveboard/issues)
- **LinkedIn**: [Matheus Silva](https://www.linkedin.com/in/mathsilvass)
- **Email**: matheus.silva1097@gmail.com
- **Documentação**: [Wiki do projeto](https://github.com/smx/liveboard/wiki)

---

<div align="center">

**⭐ Se este projeto te ajudou, considere dar uma estrela! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/smx/liveboard?style=social)](https://github.com/smx/liveboard/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/smx/liveboard?style=social)](https://github.com/smx/liveboard/network)

**Feito com ❤️ por [Matheus Silva](https://www.linkedin.com/in/mathsilvass)**

</div>
