// SMX LiveBoard - Electron Entry Point
// Este arquivo é o ponto de entrada para o Electron

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

// Variável para armazenar o processo do servidor backend
let backendProcess = null;

// Manter uma referência global das janelas
let mainWindow;
let splashWindow;

// Função para iniciar o servidor backend
function startBackendServer() {
  return new Promise((resolve, reject) => {
    const backendPath = path.join(__dirname, 'backend', 'index.js');
    
    // Iniciar o servidor backend
    backendProcess = spawn('node', [backendPath], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
      // Verificar se o servidor está pronto
      if (data.toString().includes('SMX LiveBoard rodando na porta')) {
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('error', (error) => {
      console.error('Erro ao iniciar backend:', error);
      reject(error);
    });

    // Timeout de segurança
    setTimeout(() => {
      resolve(); // Continuar mesmo se não detectar a mensagem
    }, 5000);
  });
}

function createSplashWindow() {
  // Criar janela de splash screen
  splashWindow = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'electron', 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#0f0f0f',
    show: false
  });

  // Carregar splash screen
  splashWindow.loadFile(path.join(__dirname, 'electron', 'splash.html'));
  
  // Mostrar splash screen quando estiver pronto
  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
  });

  // Centralizar splash screen
  splashWindow.center();
}

function createWindow() {
  // Criar a janela principal
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'electron', 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: 'default',
    show: false, // Não mostrar até estar pronto
    backgroundColor: '#0f0f0f'
  });

  // Carregar o aplicativo - sempre começar com arquivo local
  const localUrl = `file://${path.join(__dirname, 'index.html')}`;
  console.log('Carregando arquivo HTML local:', localUrl);
  mainWindow.loadURL(localUrl);

  // Mostrar a janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    console.log('Janela principal pronta para mostrar');
    
    // Fechar splash screen e mostrar janela principal
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    
    // Sempre abrir DevTools para debug
    mainWindow.webContents.openDevTools();
    
    console.log('Janela principal exibida com sucesso');
  });
  
  // Adicionar logs de erro
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Erro ao carregar:', errorDescription, 'URL:', validatedURL);
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
app.whenReady().then(async () => {
  console.log('Electron app ready - iniciando processo...');
  
  // 1. Criar splash screen primeiro
  console.log('1. Criando splash screen...');
  createSplashWindow();
  
  // 2. Criar janela principal após 2 segundos (carregar HTML/CSS)
  setTimeout(() => {
    console.log('2. Criando janela principal (HTML/CSS)...');
    createWindow();
  }, 2000);
  
  // 3. Iniciar servidor backend após 4 segundos (depois do frontend)
  setTimeout(async () => {
    try {
      console.log('3. Iniciando servidor backend...');
      await startBackendServer();
      console.log('Servidor backend iniciado com sucesso!');
      
      // 4. Reconectar a janela ao servidor quando estiver pronto
      if (mainWindow) {
        console.log('4. Reconectando ao servidor backend...');
        mainWindow.loadURL('http://localhost:3000');
      }
    } catch (error) {
      console.error('Erro ao iniciar servidor backend:', error);
    }
  }, 4000);
});

// Função para encerrar o servidor backend
function stopBackendServer() {
  if (backendProcess) {
    console.log('Encerrando servidor backend...');
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
}

// Sair quando todas as janelas estiverem fechadas
app.on('window-all-closed', () => {
  // Encerrar o servidor backend
  stopBackendServer();
  
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

// Handler para splash screen
ipcMain.on('splash-ready', () => {
  // Splash screen está pronta, pode fechar após um delay
  setTimeout(() => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
  }, 2000);
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
