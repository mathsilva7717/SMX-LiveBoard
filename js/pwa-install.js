// SMX LiveBoard - PWA Install Modal
class PWAInstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.hasShownModal = false;
        this.modal = null;
        this.installBtn = null;
        this.laterBtn = null;
        this.closeBtn = null;
        
        this.init();
    }

    init() {
        // Verificar se já está instalado
        this.checkIfInstalled();
        
        // Registrar Service Worker
        this.registerServiceWorker();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Mostrar modal após delay
        setTimeout(() => {
            this.showInstallModal();
        }, 3000);
    }

    checkIfInstalled() {
        // Verificar se está rodando como PWA
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('📱 SMX LiveBoard já está instalado como PWA');
        }
    }

    isTrustedOrigin() {
        const origin = window.location.origin;
        const trustedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://localhost:3000',
            'https://127.0.0.1:3000'
        ];
        
        return trustedOrigins.includes(origin) || origin.startsWith('https://');
    }

    showManualInstallInstructions() {
        const currentOrigin = window.location.origin;
        const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
        
        let instructions = '';
        
        if (isLocalhost) {
            instructions = `
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-radius: 12px; border: 1px solid rgba(0, 212, 255, 0.3);">
                    <h3 style="color: #00d4ff; margin-bottom: 16px;">📱 Instalar SMX LiveBoard</h3>
                    <p style="color: #fff; margin-bottom: 12px;">Para instalar como PWA, use uma das URLs confiáveis:</p>
                    <div style="background: rgba(0, 212, 255, 0.1); padding: 12px; border-radius: 8px; margin: 12px 0;">
                        <p style="color: #00d4ff; font-weight: 600; margin: 4px 0;">✅ http://localhost:3000</p>
                        <p style="color: #00d4ff; font-weight: 600; margin: 4px 0;">✅ http://127.0.0.1:3000</p>
                    </div>
                    <p style="color: #aaa; font-size: 0.9rem;">Depois acesse uma dessas URLs e o modal de instalação aparecerá automaticamente.</p>
                </div>
            `;
        } else {
            instructions = `
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-radius: 12px; border: 1px solid rgba(0, 212, 255, 0.3);">
                    <h3 style="color: #00d4ff; margin-bottom: 16px;">📱 Instalar SMX LiveBoard</h3>
                    <p style="color: #fff; margin-bottom: 12px;">Para instalar como PWA, você precisa usar HTTPS ou localhost:</p>
                    <div style="background: rgba(255, 170, 0, 0.1); padding: 12px; border-radius: 8px; margin: 12px 0;">
                        <p style="color: #ffaa00; font-weight: 600; margin: 4px 0;">⚠️ URL atual: ${currentOrigin}</p>
                        <p style="color: #ffaa00; font-weight: 600; margin: 4px 0;">⚠️ Não é uma origem confiável para PWA</p>
                    </div>
                    <p style="color: #aaa; font-size: 0.9rem;">Use localhost:3000 ou configure HTTPS para instalar como PWA.</p>
                </div>
            `;
        }
        
        // Mostrar toast com instruções
        if (window.toastManager) {
            window.toastManager.show(instructions, 'info', 15000);
        }
        
        // Marcar como mostrado para não aparecer novamente
        this.hasShownModal = true;
        localStorage.setItem('pwa-modal-shown', 'true');
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('🔧 Service Worker registrado:', registration);
                
                // Verificar atualizações
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
            } catch (error) {
                console.error('❌ Erro ao registrar Service Worker:', error);
            }
        }
    }

    setupEventListeners() {
        // Evento beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 PWA install prompt disponível');
            e.preventDefault();
            this.deferredPrompt = e;
        });

        // Evento appinstalled
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA instalado com sucesso!');
            this.isInstalled = true;
            this.hideModal();
            this.showInstallSuccessToast();
        });

        // Verificar se modal já foi mostrado
        const hasShown = localStorage.getItem('pwa-modal-shown');
        if (hasShown === 'true') {
            this.hasShownModal = true;
        }
    }

    showInstallModal() {
        // Não mostrar se já está instalado ou já foi mostrado
        if (this.isInstalled || this.hasShownModal) {
            return;
        }

        // Verificar se a origem é confiável para PWA
        if (!this.isTrustedOrigin()) {
            console.log('⚠️ Origem não confiável para PWA, mostrando instruções manuais');
            this.showManualInstallInstructions();
            return;
        }

        this.modal = document.getElementById('pwaInstallModal');
        this.installBtn = document.getElementById('pwaInstallBtn');
        this.laterBtn = document.getElementById('pwaModalLater');
        this.closeBtn = document.getElementById('pwaModalClose');

        if (!this.modal) {
            console.warn('⚠️ Modal PWA não encontrado');
            return;
        }

        // Configurar eventos dos botões
        this.installBtn.addEventListener('click', () => this.installPWA());
        this.laterBtn.addEventListener('click', () => this.remindLater());
        this.closeBtn.addEventListener('click', () => this.hideModal());

        // Mostrar modal com animação
        this.modal.style.display = 'flex';
        
        // Adicionar efeito de entrada
        setTimeout(() => {
            this.modal.classList.add('show');
        }, 100);

        console.log('📱 Modal de instalação PWA mostrado');
    }

    async installPWA() {
        if (!this.deferredPrompt) {
            // Fallback para navegadores que não suportam beforeinstallprompt
            this.showInstallInstructions();
            return;
        }

        try {
            // Mostrar prompt de instalação
            this.deferredPrompt.prompt();
            
            // Aguardar resposta do usuário
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log(`📱 Resultado da instalação: ${outcome}`);
            
            if (outcome === 'accepted') {
                this.showInstallSuccessToast();
            }
            
            // Limpar prompt
            this.deferredPrompt = null;
            this.hideModal();
            
        } catch (error) {
            console.error('❌ Erro ao instalar PWA:', error);
            this.showInstallInstructions();
        }
    }

    showInstallInstructions() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        let instructions = '';
        
        if (isIOS) {
            instructions = `
                <div style="text-align: center; padding: 20px;">
                    <h3>📱 Instalar no iOS</h3>
                    <p>1. Toque no botão <strong>Compartilhar</strong> (📤)</p>
                    <p>2. Role para baixo e toque em <strong>"Adicionar à Tela Inicial"</strong></p>
                    <p>3. Toque em <strong>"Adicionar"</strong></p>
                </div>
            `;
        } else if (isAndroid) {
            instructions = `
                <div style="text-align: center; padding: 20px;">
                    <h3>📱 Instalar no Android</h3>
                    <p>1. Toque no menu (⋮) do navegador</p>
                    <p>2. Selecione <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong></p>
                    <p>3. Confirme a instalação</p>
                </div>
            `;
        } else {
            instructions = `
                <div style="text-align: center; padding: 20px;">
                    <h3>💻 Instalar no Desktop</h3>
                    <p>1. Clique no ícone de instalação na barra de endereços</p>
                    <p>2. Ou use o menu do navegador (⋮) → <strong>"Instalar SMX LiveBoard"</strong></p>
                    <p>3. Confirme a instalação</p>
                </div>
            `;
        }
        
        // Mostrar toast com instruções
        if (window.toastManager) {
            window.toastManager.show(instructions, 'info', 10000);
        }
        
        this.hideModal();
    }

    remindLater() {
        // Salvar que o usuário pediu para lembrar depois
        localStorage.setItem('pwa-modal-shown', 'true');
        
        // Agendar para mostrar novamente em 7 dias
        const nextShow = Date.now() + (7 * 24 * 60 * 60 * 1000);
        localStorage.setItem('pwa-modal-next-show', nextShow.toString());
        
        this.hideModal();
        
        if (window.toastManager) {
            window.toastManager.show('Lembraremos você em 7 dias! 📅', 'info', 3000);
        }
    }

    hideModal() {
        if (this.modal) {
            this.modal.classList.remove('show');
            setTimeout(() => {
                this.modal.style.display = 'none';
            }, 300);
        }
    }

    showInstallSuccessToast() {
        if (window.toastManager) {
            window.toastManager.show(
                '🎉 SMX LiveBoard instalado com sucesso! Agora você pode acessá-lo diretamente do seu desktop.',
                'success',
                5000
            );
        }
    }

    showUpdateNotification() {
        if (window.toastManager) {
            window.toastManager.show(
                '🔄 Nova versão disponível! Recarregue a página para atualizar.',
                'info',
                8000
            );
        }
    }

    // Método público para mostrar modal manualmente
    showModal() {
        this.hasShownModal = false;
        localStorage.removeItem('pwa-modal-shown');
        this.showInstallModal();
    }

    // Verificar se deve mostrar modal novamente
    checkReminder() {
        const nextShow = localStorage.getItem('pwa-modal-next-show');
        if (nextShow && Date.now() > parseInt(nextShow)) {
            localStorage.removeItem('pwa-modal-shown');
            localStorage.removeItem('pwa-modal-next-show');
            this.hasShownModal = false;
            this.showInstallModal();
        }
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para não interferir com o carregamento principal
    setTimeout(() => {
        window.pwaInstallManager = new PWAInstallManager();
    }, 1000);
});

// Função global para mostrar modal manualmente
window.showPWAInstallModal = function() {
    if (window.pwaInstallManager) {
        window.pwaInstallManager.showModal();
    }
};
