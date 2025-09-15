const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Manter uma referência global da janela
let mainWindow;

function createWindow() {
  // Criar a janela do navegador
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: 'default',
    show: false, // Não mostrar até estar pronto
    backgroundColor: '#0f0f0f'
  });

  // Carregar o aplicativo
  const startUrl = isDev 
    ? 'http://localhost:3002' 
    : `file://${path.join(__dirname, '../index.html')}`;
  
  // Aguardar o servidor estar pronto
  if (isDev) {
    // Aguardar um pouco para o servidor carregar
    setTimeout(() => {
      mainWindow.loadURL(startUrl);
    }, 3000);
  } else {
    mainWindow.loadURL(startUrl);
  }

  // Mostrar a janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Abrir DevTools em desenvolvimento
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Fechar a janela quando clicar no X
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Configurar menu da aplicação
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'SMX LiveBoard',
      submenu: [
        {
          label: 'Sobre SMX LiveBoard',
          click: () => {
            // Implementar janela sobre
          }
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Visualizar',
      submenu: [
        {
          label: 'Recarregar',
          accelerator: 'CmdOrCtrl+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.reload();
          }
        },
        {
          label: 'Alternar Tela Cheia',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
            }
          }
        },
        {
          label: 'Alternar Ferramentas do Desenvolvedor',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Janela',
      submenu: [
        {
          label: 'Minimizar',
          accelerator: 'CmdOrCtrl+M',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.minimize();
          }
        },
        {
          label: 'Fechar',
          accelerator: 'CmdOrCtrl+W',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.close();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Este método será chamado quando o Electron terminar de inicializar
app.whenReady().then(createWindow);

// Sair quando todas as janelas estiverem fechadas
app.on('window-all-closed', () => {
  // No macOS, é comum que aplicativos e suas barras de menu
  // permaneçam ativos até que o usuário saia explicitamente com Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // No macOS, é comum recriar uma janela no app quando o
  // ícone do dock é clicado e não há outras janelas abertas
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers para comunicação com o frontend
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-system-info', async () => {
  // Aqui você pode adicionar lógica para obter informações do sistema
  // diretamente do Electron se necessário
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version
  };
});

// Prevenir navegação para URLs externas
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
  
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:3002' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
});
