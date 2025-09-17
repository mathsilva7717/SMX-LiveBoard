# 🖥️ SMX LiveBoard - Electron

Este diretório contém os arquivos do aplicativo desktop SMX LiveBoard.

## 📁 Estrutura

```
electron/
├── main.js          # Processo principal do Electron
├── preload.js       # Script de preload (comunicação segura)
├── splash.html      # Tela de boas-vindas
└── README.md        # Este arquivo
```

## 🚀 Como Executar

### Desenvolvimento
```bash
npm run electron:dev
```

### Produção
```bash
npm run electron
```

## 🏗️ Como Compilar

### Executável Portable (Recomendado)
```bash
npm run build:portable
```

### Instalador Windows
```bash
npm run build:win
```

### Build Completo
```bash
npm run dist
```

## ✨ Funcionalidades

### 🎨 Splash Screen
- Tela de boas-vindas animada
- Carregamento com barra de progresso
- Design moderno e responsivo
- Fecha automaticamente quando o app está pronto

### 🔒 Segurança
- Context isolation habilitado
- Node integration desabilitado
- Preload script para comunicação segura
- Prevenção de navegação externa

### 🎛️ Menu
- Menu nativo do sistema
- Atalhos de teclado
- Opções de visualização
- Controles de janela

## 📦 Build Output

Os executáveis são gerados na pasta `dist/`:

- **Portable**: `SMX-LiveBoard-1.0.0-x64.exe` (não precisa instalar)
- **Instalador**: `SMX-LiveBoard-Setup-1.0.0.exe` (instalação completa)

## 🔧 Configuração

### electron-builder.json
- Configuração de build multiplataforma
- Ícones personalizados
- Metadados do aplicativo
- Configurações de instalação

### package.json
- Scripts de build
- Dependências do Electron
- Configurações de homepage

## 🐛 Troubleshooting

### Erro de Dependências
```bash
# Reinstalar dependências
npm install
npm install electron electron-builder --save-dev
```

### Erro de Build
```bash
# Limpar cache
npm run clean
npm install
```

### Executável não funciona
- Verificar se todas as dependências estão instaladas
- Executar como administrador (se necessário)
- Verificar antivírus (pode bloquear executáveis)

## 📱 Plataformas Suportadas

- ✅ Windows 10/11 (x64)
- ✅ macOS 10.14+ (x64, ARM64)
- ✅ Linux (x64)

## 🎯 Próximas Features

- [ ] Auto-updater
- [ ] Notificações nativas
- [ ] Tray icon
- [ ] Atalhos globais
- [ ] Temas personalizados
