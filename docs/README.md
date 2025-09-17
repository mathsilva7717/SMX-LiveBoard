# 📚 Documentação Técnica - SMX LiveBoard

Bem-vindo à documentação técnica completa do **SMX LiveBoard** - um sistema avançado de monitoramento de sistema em tempo real.

## 📋 Índice da Documentação

### 🏗️ [Arquitetura do Sistema](./architecture.md)
- Visão geral da arquitetura
- Componentes principais
- Fluxo de dados
- Padrões de design utilizados

### 🔌 [APIs e Integrações](./api-reference.md)
- API REST completa
- WebSocket events
- Integração SSH
- Sistema de notificações Telegram

### ⚙️ [Instalação e Configuração](./installation.md)
- Pré-requisitos do sistema
- Instalação passo a passo
- Configuração avançada
- Variáveis de ambiente

### 🛠️ [Desenvolvimento](./development.md)
- Setup do ambiente de desenvolvimento
- Estrutura do código
- Padrões de codificação
- Testes e debugging

### 🚀 [Deploy e Produção](./deployment.md)
- Estratégias de deploy
- Configuração de produção
- Monitoramento e logs
- Backup e recuperação

### 📊 [Monitoramento e Métricas](./monitoring.md)
- Métricas coletadas
- Alertas e notificações
- Performance e otimização
- Troubleshooting

### 🔒 [Segurança](./security.md)
- Práticas de segurança
- Autenticação e autorização
- Configurações de rede
- Auditoria e logs

## 🎯 Visão Geral do Projeto

O **SMX LiveBoard** é uma aplicação web moderna para monitoramento de sistemas em tempo real, desenvolvida com tecnologias web atuais e foco em performance e usabilidade.

### Características Principais

- **Monitoramento em Tempo Real**: CPU, memória, disco, rede e processos
- **Interface Moderna**: Design responsivo com tema escuro futurista
- **Terminal Integrado**: Execução de comandos diretamente na interface
- **Conexões SSH**: Gerenciamento de servidores remotos
- **Notificações**: Integração com Telegram para alertas
- **PWA**: Aplicativo web progressivo instalável
- **Multi-plataforma**: Suporte para Windows, macOS e Linux

### Stack Tecnológica

#### Backend
- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Framework web
- **Socket.IO** - Comunicação em tempo real
- **SystemInformation** - Coleta de dados do sistema
- **SSH2** - Conexões SSH seguras

#### Frontend
- **HTML5/CSS3** - Interface moderna
- **JavaScript ES6+** - Lógica da aplicação
- **Chart.js** - Gráficos interativos
- **PWA** - Service Worker e Manifest

#### Ferramentas
- **Electron** - Aplicativo desktop
- **Nodemon** - Desenvolvimento
- **Electron Builder** - Build e distribuição

## 🚀 Início Rápido

### Instalação Básica

```bash
# Clone o repositório
git clone https://github.com/mathsilva7717/SMX-LiveBoard.git
cd SMX-LiveBoard

# Instale as dependências
npm install

# Inicie o servidor
npm start

# Acesse no navegador
http://localhost:3000
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev            # Modo desenvolvimento com nodemon

# Electron (Desktop)
npm run electron       # Inicia app desktop
npm run electron:dev   # Modo desenvolvimento

# Build e Distribuição
npm run build:win      # Build para Windows
npm run build:mac      # Build para macOS
npm run build:linux    # Build para Linux
npm run dist           # Build completo + distribuição
```

## 📁 Estrutura do Projeto

```
SMX-LiveBoard/
├── 📁 backend/                    # Servidor Node.js
│   ├── 📁 services/              # Serviços principais
│   ├── 📁 utils/                 # Utilitários
│   ├── 📁 logs/                  # Arquivos de log
│   ├── 📄 index.js               # Servidor principal
│   └── 📄 config.json            # Configurações
├── 📁 js/                        # Frontend JavaScript
├── 📁 styles/                    # Estilos CSS
├── 📁 assets/                    # Recursos estáticos
├── 📁 docs/                      # Documentação técnica
├── 📄 index.html                 # Página principal
├── 📄 manifest.json              # Manifest PWA
└── 📄 package.json               # Dependências e scripts
```

## 🔧 Configuração Básica

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Servidor
PORT=3000
NODE_ENV=production

# Telegram
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui

# Logs
LOG_LEVEL=info
LOG_FILE_PATH=./logs/system.log
```

### Configuração Avançada

Edite `backend/config.json` para ajustes específicos:

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
  }
}
```

## 📞 Suporte

### Desenvolvedor Principal
- **Nome**: Matheus Silva
- **Email**: [matheus.silva1097@gmail.com](mailto:matheus.silva1097@gmail.com)
- **GitHub**: [@mathsilva7717](https://github.com/mathsilva7717)

### Canais de Suporte
- **GitHub Issues**: Para bugs e sugestões
- **GitHub Discussions**: Para ideias e discussões
- **Email**: Suporte direto por email

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](../LICENSE) para detalhes.

---

**Desenvolvido por [Matheus Silva](https://github.com/mathsilva7717)**

*SMX LiveBoard - Monitoramento de sistema feito simples e poderoso* 🚀
