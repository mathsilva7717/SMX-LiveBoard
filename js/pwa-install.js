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
        
        // Verificar se deve mostrar modal
        this.checkShouldShowModal();
    }

    checkIfInstalled() {
        // Verificar se está rodando como PWA
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('📱 SMX LiveBoard já está instalado como PWA');
            // Se já está instalado, marcar como mostrado para não aparecer novamente
            localStorage.setItem('pwa-modal-shown', 'true');
            localStorage.setItem('pwa-installed', 'true');
        }
    }

    checkShouldShowModal() {
        // Verificar se já está instalado
        if (this.isInstalled) {
            console.log('📱 PWA já instalado, não mostrando modal');
            return;
        }

        // Verificar se modal já foi mostrado e usuário fez uma escolha
        const modalShown = localStorage.getItem('pwa-modal-shown');
        const userChoice = localStorage.getItem('pwa-user-choice');
        
        if (modalShown === 'true' && userChoice) {
            console.log('📱 Modal já foi mostrado e usuário fez escolha:', userChoice);
            
            // Se escolheu "lembrar depois", verificar se já passou o tempo
            if (userChoice === 'later') {
                const nextShow = localStorage.getItem('pwa-modal-next-show');
                if (nextShow && Date.now() > parseInt(nextShow)) {
                    console.log('📱 Tempo para lembrar novamente chegou');
                    this.showInstallModal();
                } else {
                    console.log('📱 Ainda não é hora de lembrar novamente');
                }
            }
            return;
        }

        // Verificar se deve mostrar modal após delay
        setTimeout(() => {
            this.showInstallModal();
        }, 3000);
    }

    isTrustedOrigin() {
        const origin = window.location.origin;
        const trustedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://localhost:3000',
            'https://127.0.0.1:3000'
        ];
        
        // Para desenvolvimento local, sempre permitir
        if (trustedOrigins.includes(origin)) {
            return true;
        }
        
        // Para produção, requer HTTPS
        return origin.startsWith('https://');
    }

    isPWAInstallable() {
        // Verificar se todos os requisitos PWA estão atendidos
        const hasManifest = document.querySelector('link[rel="manifest"]');
        const hasServiceWorker = 'serviceWorker' in navigator;
        const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        console.log('🔍 Verificando requisitos PWA:', {
            hasManifest: !!hasManifest,
            hasServiceWorker,
            isSecureContext,
            origin: window.location.origin
        });
        
        return hasManifest && hasServiceWorker && isSecureContext;
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
        this.showToast(instructions, 'info', 15000);
        
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
            
            // Se o modal já foi mostrado mas não tinha prompt, mostrar novamente
            if (this.hasShownModal && !this.isInstalled) {
                console.log('📱 Prompt disponível agora, mostrando modal novamente');
                this.hasShownModal = false;
                localStorage.removeItem('pwa-modal-shown');
                setTimeout(() => this.showInstallModal(), 1000);
            }
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

        // Verificar periodicamente se o prompt se tornou disponível
        this.startPromptDetection();
    }

    startPromptDetection() {
        // Verificar a cada 2 segundos se o prompt se tornou disponível
        const checkInterval = setInterval(() => {
            if (this.deferredPrompt && !this.hasShownModal && !this.isInstalled) {
                console.log('📱 Prompt detectado via verificação periódica');
                clearInterval(checkInterval);
                this.showInstallModal();
            }
        }, 2000);

        // Parar a verificação após 30 segundos
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 30000);
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

        // Verificar se todos os requisitos PWA estão atendidos
        if (!this.isPWAInstallable()) {
            console.log('⚠️ Requisitos PWA não atendidos, mostrando instruções manuais');
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
        this.closeBtn.addEventListener('click', () => this.closeModal());

        // Mostrar modal com animação
        this.modal.style.display = 'flex';
        
        // Adicionar efeito de entrada
        setTimeout(() => {
            this.modal.classList.add('show');
        }, 100);

        console.log('📱 Modal de instalação PWA mostrado');
    }

    async installPWA() {
        console.log('📱 Tentando instalar PWA...');
        
        // Verificar se o navegador suporta instalação PWA
        if (!window.matchMedia('(display-mode: standalone)').matches && 
            !window.navigator.standalone && 
            !this.deferredPrompt) {
            
            console.log('⚠️ beforeinstallprompt não disponível, verificando alternativas...');
            
            // Tentar detectar se o navegador suporta instalação manual
            const userAgent = navigator.userAgent.toLowerCase();
            const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg');
            const isEdge = userAgent.includes('edg');
            const isFirefox = userAgent.includes('firefox');
            const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
            
            if (isChrome || isEdge) {
                console.log('🔍 Navegador Chrome/Edge detectado, mostrando instruções específicas');
                this.showChromeInstallInstructions();
            } else if (isFirefox) {
                console.log('🔍 Firefox detectado, mostrando instruções específicas');
                this.showFirefoxInstallInstructions();
            } else if (isSafari) {
                console.log('🔍 Safari detectado, mostrando instruções específicas');
                this.showSafariInstallInstructions();
            } else {
                console.log('🔍 Navegador não identificado, mostrando instruções genéricas');
                this.showInstallInstructions();
            }
            return;
        }

        try {
            console.log('📱 Mostrando prompt de instalação...');
            
            // Mostrar prompt de instalação
            this.deferredPrompt.prompt();
            
            // Aguardar resposta do usuário
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log(`📱 Resultado da instalação: ${outcome}`);
            
            if (outcome === 'accepted') {
                console.log('✅ Usuário aceitou a instalação');
                this.showInstallSuccessToast();
            } else {
                console.log('❌ Usuário rejeitou a instalação');
                this.showToast('Instalação cancelada. Sem pressa, você pode tentar quando quiser.', 'info', 3000);
            }
            
            // Limpar prompt
            this.deferredPrompt = null;
            this.hideModal();
            
        } catch (error) {
            console.error('❌ Erro ao instalar PWA:', error);
            this.showInstallInstructions();
        }
    }

    showChromeInstallInstructions() {
        const instructions = `
            <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 12px; border: 1px solid rgba(0, 212, 255, 0.2); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
                <h3 style="color: #00d4ff; margin-bottom: 12px; font-size: 16px; font-weight: 600;">🌐 Instalação Chrome/Edge</h3>
                <div style="text-align: left; color: #e0e0e0; font-size: 13px;">
                    <p style="margin: 6px 0;">1. <strong>Ícone de instalação</strong> na barra de endereços</p>
                    <p style="margin: 6px 0;">2. <strong>Menu</strong> (⋮) → "Instalar SMX LiveBoard"</p>
                    <p style="margin: 6px 0;">3. <strong>Confirmar</strong> a instalação</p>
                </div>
                <div style="background: rgba(0, 212, 255, 0.08); padding: 8px; border-radius: 6px; margin: 10px 0;">
                    <p style="color: #00d4ff; font-size: 12px; margin: 0;">💡 Recarregue se não aparecer</p>
                </div>
            </div>
        `;
        
        this.showToast(instructions, 'info', 12000);
        this.hideModal();
    }

    showFirefoxInstallInstructions() {
        const instructions = `
            <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 12px; border: 1px solid rgba(0, 212, 255, 0.2); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
                <h3 style="color: #00d4ff; margin-bottom: 12px; font-size: 16px; font-weight: 600;">🦊 Instalação Firefox</h3>
                <div style="text-align: left; color: #e0e0e0; font-size: 13px;">
                    <p style="margin: 6px 0;">1. <strong>Menu</strong> (☰) no canto superior direito</p>
                    <p style="margin: 6px 0;">2. <strong>"Instalar"</strong> ou "Adicionar à tela inicial"</p>
                    <p style="margin: 6px 0;">3. <strong>Confirmar</strong> a instalação</p>
                </div>
                <div style="background: rgba(255, 170, 0, 0.08); padding: 8px; border-radius: 6px; margin: 10px 0;">
                    <p style="color: #ffaa00; font-size: 12px; margin: 0;">⚠️ Suporte limitado no Firefox</p>
                </div>
            </div>
        `;
        
        this.showToast(instructions, 'warning', 12000);
        this.hideModal();
    }

    showSafariInstallInstructions() {
        const instructions = `
            <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 12px; border: 1px solid rgba(0, 212, 255, 0.2); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
                <h3 style="color: #00d4ff; margin-bottom: 12px; font-size: 16px; font-weight: 600;">🍎 Instalação Safari</h3>
                <div style="text-align: left; color: #e0e0e0; font-size: 13px;">
                    <p style="margin: 6px 0;">1. <strong>Botão Compartilhar</strong> (📤)</p>
                    <p style="margin: 6px 0;">2. <strong>"Adicionar à Tela Inicial"</strong></p>
                    <p style="margin: 6px 0;">3. <strong>Confirmar</strong> a instalação</p>
                </div>
                <div style="background: rgba(0, 212, 255, 0.08); padding: 8px; border-radius: 6px; margin: 10px 0;">
                    <p style="color: #00d4ff; font-size: 12px; margin: 0;">💡 Otimizado para iOS/iPadOS</p>
                </div>
            </div>
        `;
        
        this.showToast(instructions, 'info', 12000);
        this.hideModal();
    }

    showInstallInstructions() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        let instructions = '';
        
        if (isIOS) {
            instructions = `
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-radius: 12px; border: 1px solid rgba(0, 212, 255, 0.3);">
                    <h3 style="color: #00d4ff; margin-bottom: 16px;">📱 Instalar no iOS</h3>
                    <div style="text-align: left; color: #fff;">
                        <p style="margin: 8px 0;">1. <strong>Toque no botão Compartilhar</strong> (📤)</p>
                        <p style="margin: 8px 0;">2. <strong>Role para baixo</strong> e toque em "Adicionar à Tela Inicial"</p>
                        <p style="margin: 8px 0;">3. <strong>Toque em "Adicionar"</strong></p>
                    </div>
                </div>
            `;
        } else if (isAndroid) {
            instructions = `
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-radius: 12px; border: 1px solid rgba(0, 212, 255, 0.3);">
                    <h3 style="color: #00d4ff; margin-bottom: 16px;">📱 Instalar no Android</h3>
                    <div style="text-align: left; color: #fff;">
                        <p style="margin: 8px 0;">1. <strong>Toque no menu</strong> (⋮) do navegador</p>
                        <p style="margin: 8px 0;">2. <strong>Selecione "Instalar app"</strong> ou "Adicionar à tela inicial"</p>
                        <p style="margin: 8px 0;">3. <strong>Confirme a instalação</strong></p>
                    </div>
                </div>
            `;
        } else {
            instructions = `
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-radius: 12px; border: 1px solid rgba(0, 212, 255, 0.3);">
                    <h3 style="color: #00d4ff; margin-bottom: 16px;">💻 Instalar no Desktop</h3>
                    <div style="text-align: left; color: #fff;">
                        <p style="margin: 8px 0;">1. <strong>Procure o ícone de instalação</strong> na barra de endereços</p>
                        <p style="margin: 8px 0;">2. <strong>Ou use o menu do navegador</strong> (⋮) → "Instalar SMX LiveBoard"</p>
                        <p style="margin: 8px 0;">3. <strong>Confirme a instalação</strong></p>
                    </div>
                </div>
            `;
        }
        
        this.showToast(instructions, 'info', 15000);
        this.hideModal();
    }

    remindLater() {
        console.log('📱 Usuário escolheu "Lembrar Depois"');
        
        // Salvar que o usuário pediu para lembrar depois
        localStorage.setItem('pwa-modal-shown', 'true');
        localStorage.setItem('pwa-user-choice', 'later');
        
        // Agendar para mostrar novamente em 7 dias
        const nextShow = Date.now() + (7 * 24 * 60 * 60 * 1000);
        localStorage.setItem('pwa-modal-next-show', nextShow.toString());
        
        this.hideModal();
        this.showToast('Perfeito! Te lembramos em 7 dias para uma experiência ainda melhor.', 'info', 3000);
    }

    hideModal() {
        if (this.modal) {
            this.modal.classList.remove('show');
            setTimeout(() => {
                this.modal.style.display = 'none';
            }, 300);
        }
    }

    // Função para quando usuário fecha o modal (X)
    closeModal() {
        console.log('📱 Usuário fechou o modal');
        
        // Salvar que o usuário fechou o modal
        localStorage.setItem('pwa-modal-shown', 'true');
        localStorage.setItem('pwa-user-choice', 'closed');
        
        this.hideModal();
        this.showToast('Modal fechado. Sempre disponível quando precisar!', 'info', 3000);
    }

    showInstallSuccessToast() {
        this.showToast(
            '✨ SMX LiveBoard instalado com elegância! Agora você tem acesso direto ao seu centro de controle.',
            'success',
            4000
        );
    }

    showUpdateNotification() {
        this.showToast(
            '🚀 Nova versão disponível! Recarregue para ter a experiência mais refinada.',
            'info',
            6000
        );
    }

    // Método público para mostrar modal manualmente
    showModal() {
        console.log('📱 Mostrando modal PWA manualmente');
        this.hasShownModal = false;
        localStorage.removeItem('pwa-modal-shown');
        localStorage.removeItem('pwa-user-choice');
        localStorage.removeItem('pwa-modal-next-show');
        this.showInstallModal();
    }

    // Verificar se deve mostrar modal novamente
    checkReminder() {
        const nextShow = localStorage.getItem('pwa-modal-next-show');
        const userChoice = localStorage.getItem('pwa-user-choice');
        
        if (nextShow && Date.now() > parseInt(nextShow) && userChoice === 'later') {
            console.log('📱 Tempo para lembrar novamente chegou');
            localStorage.removeItem('pwa-modal-shown');
            localStorage.removeItem('pwa-user-choice');
            localStorage.removeItem('pwa-modal-next-show');
            this.hasShownModal = false;
            this.showInstallModal();
        }
    }

    // Função para resetar preferências (útil para debug)
    resetPreferences() {
        console.log('📱 Resetando preferências PWA');
        localStorage.removeItem('pwa-modal-shown');
        localStorage.removeItem('pwa-user-choice');
        localStorage.removeItem('pwa-modal-next-show');
        localStorage.removeItem('pwa-installed');
        this.hasShownModal = false;
        this.isInstalled = false;
    }

    showToast(message, type = 'info', duration = 5000) {
        // Tentar usar o sistema de toast existente
        if (window.toastManager && typeof window.toastManager.show === 'function') {
            window.toastManager.show(message, type, duration);
        } else if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            // Fallback: mostrar no console e criar um toast simples
            console.log(`Toast [${type}]: ${message}`);
            this.createSimpleToast(message, type, duration);
        }
    }

    createSimpleToast(message, type = 'info', duration = 5000) {
        // Criar um toast elegante e sutil
        const toast = document.createElement('div');
        
        // Cores e estilos baseados no tipo
        const styles = {
            info: {
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                icon: '💡',
                color: '#e0e0e0'
            },
            success: {
                background: 'linear-gradient(135deg, #0d2818 0%, #1a3d2e 100%)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                icon: '✨',
                color: '#d1fae5'
            },
            warning: {
                background: 'linear-gradient(135deg, #2d1b0e 0%, #3d2815 100%)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                icon: '⚠️',
                color: '#fef3c7'
            },
            error: {
                background: 'linear-gradient(135deg, #2d0e0e 0%, #3d1515 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                icon: '❌',
                color: '#fecaca'
            }
        };
        
        const style = styles[type] || styles.info;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${style.background};
            border: ${style.border};
            color: ${style.color};
            padding: 12px 16px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
            z-index: 10000;
            max-width: 320px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 13px;
            font-weight: 500;
            line-height: 1.4;
            opacity: 0;
            transform: translateX(100%) scale(0.95);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        `;
        
        // Criar conteúdo do toast com ícone
        const icon = style.icon;
        const isHTML = message.includes('<') && message.includes('>');
        
        if (isHTML) {
            toast.innerHTML = message;
        } else {
            toast.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 14px;">${icon}</span>
                    <span>${message}</span>
                </div>
            `;
        }
        
        document.body.appendChild(toast);
        
        // Animar entrada suave
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0) scale(1)';
        }, 100);
        
        // Remover após duração com animação suave
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%) scale(0.95)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 400);
        }, duration);
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para não interferir com o carregamento principal
    setTimeout(() => {
        window.pwaInstallManager = new PWAInstallManager();
    }, 1000);
});

// Funções globais para controle do PWA
window.showPWAInstallModal = function() {
    if (window.pwaInstallManager) {
        window.pwaInstallManager.showModal();
    }
};

window.resetPWAPreferences = function() {
    if (window.pwaInstallManager) {
        window.pwaInstallManager.resetPreferences();
    }
};

window.checkPWAStatus = function() {
    if (window.pwaInstallManager) {
        const status = {
            isInstalled: window.pwaInstallManager.isInstalled,
            hasShownModal: window.pwaInstallManager.hasShownModal,
            hasDeferredPrompt: !!window.pwaInstallManager.deferredPrompt,
            modalShown: localStorage.getItem('pwa-modal-shown'),
            userChoice: localStorage.getItem('pwa-user-choice'),
            nextShow: localStorage.getItem('pwa-modal-next-show'),
            installed: localStorage.getItem('pwa-installed'),
            isTrustedOrigin: window.pwaInstallManager.isTrustedOrigin(),
            isPWAInstallable: window.pwaInstallManager.isPWAInstallable(),
            userAgent: navigator.userAgent,
            origin: window.location.origin,
            protocol: window.location.protocol,
            isSecureContext: window.isSecureContext
        };
        console.log('📱 Status PWA Completo:', status);
        return status;
    }
};

// Função para forçar verificação do prompt
window.forcePWACheck = function() {
    if (window.pwaInstallManager) {
        console.log('📱 Forçando verificação PWA...');
        window.pwaInstallManager.hasShownModal = false;
        localStorage.removeItem('pwa-modal-shown');
        window.pwaInstallManager.showInstallModal();
    }
};

// Função para simular beforeinstallprompt (para debug)
window.simulateInstallPrompt = function() {
    if (window.pwaInstallManager) {
        console.log('📱 Simulando beforeinstallprompt...');
        const fakeEvent = {
            preventDefault: () => {},
            prompt: () => Promise.resolve({ outcome: 'accepted' }),
            userChoice: Promise.resolve({ outcome: 'accepted' })
        };
        window.pwaInstallManager.deferredPrompt = fakeEvent;
        window.pwaInstallManager.showInstallModal();
    }
};
