# SMX LiveBoard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/smx/liveboard)

Dashboard de monitoramento de sistema em tempo real desenvolvido com Node.js, React e Electron.

## 🌟 Open Source

Este projeto é **100% open source** e está disponível sob a licença MIT. Contribuições são bem-vindas!

## 🚀 Funcionalidades

- **Monitoramento em Tempo Real**: CPU, RAM, Rede, Disco e Processos
- **Interface Moderna**: Design escuro e responsivo
- **Gráficos Interativos**: Visualização de dados com Recharts
- **Tabela de Processos**: Lista de processos com filtros e ordenação
- **WebSocket**: Atualização em tempo real sem recarregar a página
- **Aplicativo Desktop**: Empacotado com Electron

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd SMX-LiveBoard
```

2. Instale todas as dependências:
```bash
npm run install:all
```

## 🚀 Como Executar

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

### Apenas Frontend
```bash
npm run frontend
```

### Apenas Backend
```bash
npm run backend
```

## 📦 Build para Produção

### Windows
```bash
npm run build:win
```

### macOS
```bash
npm run build:mac
```

### Linux
```bash
npm run build:linux
```

## 🏗️ Estrutura do Projeto

```
SMX-LiveBoard/
├── frontend/          # Aplicação React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── styles/        # Estilos CSS
│   │   └── App.js         # Componente principal
│   └── package.json
├── backend/           # Servidor Node.js
│   ├── services/          # Serviços de monitoramento
│   ├── index.js           # Servidor principal
│   └── package.json
├── electron/          # Aplicativo Electron
│   ├── main.js            # Processo principal
│   └── preload.js         # Script de preload
└── package.json       # Configuração principal
```

## 🔧 Tecnologias Utilizadas

### Frontend
- **React 18**: Framework JavaScript
- **Recharts**: Biblioteca de gráficos
- **Lucide React**: Ícones modernos
- **CSS3**: Estilos customizados

### Backend
- **Node.js**: Runtime JavaScript
- **Express**: Framework web
- **SystemInformation**: Coleta de dados do sistema
- **WebSocket**: Comunicação em tempo real

### Desktop
- **Electron**: Framework para aplicativos desktop
- **Electron Builder**: Empacotamento

## 📊 Dados Monitorados

- **CPU**: Uso percentual, temperatura, modelo
- **RAM**: Uso total, disponível, percentual
- **Rede**: Velocidade de download/upload, interface
- **Disco**: Espaço usado/disponível, partições
- **Processos**: Lista de processos ativos com CPU/RAM

## 🎨 Interface

- **Tema Escuro**: Design moderno e elegante
- **Responsivo**: Adaptável a diferentes tamanhos de tela
- **Gráficos em Tempo Real**: Visualização dinâmica dos dados
- **Cards de Resumo**: Informações principais em destaque
- **Tabela de Processos**: Lista completa com filtros

## 🔄 Atualização de Dados

- **WebSocket**: Atualização em tempo real (2 segundos)
- **Fallback REST**: API REST como backup (5 segundos)
- **Indicador de Status**: Mostra se está conectado

## 🚀 Scripts Disponíveis

- `npm start`: Executa o aplicativo completo
- `npm run dev`: Modo desenvolvimento
- `npm run build`: Build para produção
- `npm run build:win`: Build para Windows
- `npm run install:all`: Instala todas as dependências

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

### 🐛 Reportando Bugs

Encontrou um bug? Abra uma [issue](https://github.com/smx/liveboard/issues) com:
- Descrição detalhada do problema
- Passos para reproduzir
- Screenshots (se aplicável)
- Informações do sistema (OS, versão, etc.)

### 💡 Sugerindo Features

Tem uma ideia? Abra uma [issue](https://github.com/smx/liveboard/issues) com:
- Descrição da feature
- Casos de uso
- Mockups ou exemplos (se aplicável)

## 📝 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Desenvolvido por

**SMX Team** - [GitHub](https://github.com/smx)

## 🙏 Agradecimentos

- [SystemInformation](https://github.com/sebhildebrandt/systeminformation) - Coleta de dados do sistema
- [React](https://reactjs.org/) - Framework frontend
- [Electron](https://electronjs.org/) - Framework desktop
- [Recharts](https://recharts.org/) - Biblioteca de gráficos
- [Lucide React](https://lucide.dev/) - Ícones
