const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Obter versão do app
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Obter informações do sistema
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Eventos do sistema
  onSystemUpdate: (callback) => {
    ipcRenderer.on('system-update', callback);
  },
  
  // Remover listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // Splash screen
  splashReady: () => ipcRenderer.send('splash-ready')
});

// Log para debug
console.log('Preload script carregado');
