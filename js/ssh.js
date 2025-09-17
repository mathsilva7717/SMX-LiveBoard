/**
 * SMX LiveBoard - SSH Connection Manager
 * Gerencia conexões SSH através de um modal interativo
 */

class SSHManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentConnection = null;
        this.terminalHistory = [];
        this.historyIndex = -1;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupSocketConnection();
    }

    bindEvents() {
        // Botão SSH no header
        const sshBtn = document.getElementById('sshBtn');
        if (sshBtn) {
            sshBtn.addEventListener('click', () => this.openSSHModal());
        }

        // Modal SSH
        const sshModal = document.getElementById('sshModal');
        const sshModalClose = document.getElementById('sshModalClose');
        
        if (sshModalClose) {
            sshModalClose.addEventListener('click', () => this.closeSSHModal());
        }

        // Fechar modal ao clicar fora
        if (sshModal) {
            sshModal.addEventListener('click', (e) => {
                if (e.target === sshModal) {
                    this.closeSSHModal();
                }
            });
        }

        // Formulário SSH
        const sshForm = document.getElementById('sshForm');
        if (sshForm) {
            sshForm.addEventListener('submit', (e) => this.handleSSHConnect(e));
        }

        // Botão testar conexão
        const testConnectionBtn = document.getElementById('sshTestConnection');
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', () => this.testSSHConnection());
        }

        // Toggle senha
        const passwordToggle = document.getElementById('sshPasswordToggle');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Controles do terminal
        const disconnectBtn = document.getElementById('sshDisconnect');
        const clearBtn = document.getElementById('sshClear');
        const terminalInput = document.getElementById('sshTerminalInput');

        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.disconnectSSH());
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearTerminal());
        }

        if (terminalInput) {
            terminalInput.addEventListener('keydown', (e) => this.handleTerminalInput(e));
        }

        // ESC para fechar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sshModal && sshModal.classList.contains('show')) {
                this.closeSSHModal();
            }
        });
    }

    setupSocketConnection() {
        // Conectar ao socket se disponível
        if (typeof io !== 'undefined') {
            this.socket = io();
            
            this.socket.on('ssh-output', (data) => {
                this.handleSSHOutput(data);
            });

            this.socket.on('ssh-error', (data) => {
                this.handleSSHError(data);
            });

            this.socket.on('ssh-connection-status', (data) => {
                this.handleConnectionStatus(data);
            });
        }
    }

    openSSHModal() {
        const modal = document.getElementById('sshModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Focar no primeiro campo
            const hostInput = document.getElementById('sshHost');
            if (hostInput) {
                setTimeout(() => hostInput.focus(), 100);
            }
        }
    }

    closeSSHModal() {
        const modal = document.getElementById('sshModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            
            // Se conectado, desconectar
            if (this.isConnected) {
                this.disconnectSSH();
            }
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('sshPassword');
        const toggleBtn = document.getElementById('sshPasswordToggle');
        
        if (passwordInput && toggleBtn) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleBtn.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                `;
            } else {
                passwordInput.type = 'password';
                toggleBtn.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                `;
            }
        }
    }

    async testSSHConnection() {
        const formData = this.getFormData();
        if (!formData) return;

        const testBtn = document.getElementById('sshTestConnection');
        if (testBtn) {
            testBtn.disabled = true;
            testBtn.innerHTML = `
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                </svg>
                Testando...
            `;
        }

        try {
            const response = await fetch('/api/ssh/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Conexão SSH testada com sucesso!', 'success');
            } else {
                this.showToast(`Erro na conexão: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showToast('Erro ao testar conexão SSH', 'error');
            console.error('SSH Test Error:', error);
        } finally {
            if (testBtn) {
                testBtn.disabled = false;
                testBtn.innerHTML = `
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    Testar
                `;
            }
        }
    }

    async handleSSHConnect(e) {
        e.preventDefault();
        
        const formData = this.getFormData();
        if (!formData) return;

        const connectBtn = document.getElementById('sshConnect');
        if (connectBtn) {
            connectBtn.disabled = true;
            connectBtn.innerHTML = `
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                </svg>
                Conectando...
            `;
        }

        try {
            const response = await fetch('/api/ssh/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                this.isConnected = true;
                this.currentConnection = formData;
                this.showTerminal();
                this.updateConnectionStatus('Conectado', true);
                this.showToast('Conectado via SSH com sucesso!', 'success');
            } else {
                this.showToast(`Erro na conexão: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showToast('Erro ao conectar via SSH', 'error');
            console.error('SSH Connect Error:', error);
        } finally {
            if (connectBtn) {
                connectBtn.disabled = false;
                connectBtn.innerHTML = `
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 2v4"/>
                        <path d="M16 2v4"/>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <path d="M3 10h18"/>
                    </svg>
                    Conectar
                `;
            }
        }
    }

    getFormData() {
        const host = document.getElementById('sshHost')?.value?.trim();
        const port = document.getElementById('sshPort')?.value?.trim();
        const username = document.getElementById('sshUsername')?.value?.trim();
        const password = document.getElementById('sshPassword')?.value?.trim();
        const keyPath = document.getElementById('sshKeyPath')?.files?.[0];

        if (!host || !port || !username || !password) {
            this.showToast('Preencha todos os campos obrigatórios', 'error');
            return null;
        }

        const formData = {
            host,
            port: parseInt(port),
            username,
            password
        };

        if (keyPath) {
            formData.keyPath = keyPath.name;
        }

        return formData;
    }

    showTerminal() {
        const formContainer = document.getElementById('sshFormContainer');
        const terminalContainer = document.getElementById('sshTerminalContainer');
        
        if (formContainer && terminalContainer) {
            formContainer.style.display = 'none';
            terminalContainer.style.display = 'block';
            
            // Focar no input do terminal
            const terminalInput = document.getElementById('sshTerminalInput');
            if (terminalInput) {
                terminalInput.disabled = false;
                setTimeout(() => terminalInput.focus(), 100);
            }
        }
    }

    hideTerminal() {
        const formContainer = document.getElementById('sshFormContainer');
        const terminalContainer = document.getElementById('sshTerminalContainer');
        
        if (formContainer && terminalContainer) {
            formContainer.style.display = 'block';
            terminalContainer.style.display = 'none';
        }
    }

    updateConnectionStatus(status, isConnected) {
        const statusElement = document.getElementById('sshConnectionStatus');
        const detailsElement = document.getElementById('sshConnectionDetails');
        
        if (statusElement) {
            const statusDot = statusElement.querySelector('.ssh-status-dot');
            const statusText = statusElement.querySelector('.ssh-status-text');
            
            if (statusText) {
                statusText.textContent = status;
            }
            
            if (statusDot) {
                statusDot.className = `ssh-status-dot ${isConnected ? 'connected' : 'disconnected'}`;
            }
        }

        if (detailsElement && this.currentConnection) {
            detailsElement.textContent = `${this.currentConnection.username}@${this.currentConnection.host}:${this.currentConnection.port}`;
        }
    }

    handleTerminalInput(e) {
        if (!this.isConnected) return;

        if (e.key === 'Enter') {
            const input = e.target;
            const command = input.value.trim();
            
            if (command) {
                this.terminalHistory.push(command);
                this.historyIndex = this.terminalHistory.length;
                
                // Adicionar comando ao output
                this.addTerminalLine(`$ ${command}`, 'command');
                
                // Enviar comando via socket
                if (this.socket) {
                    this.socket.emit('ssh-command', {
                        command: command,
                        connection: this.currentConnection
                    });
                }
                
                input.value = '';
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                e.target.value = this.terminalHistory[this.historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.historyIndex < this.terminalHistory.length - 1) {
                this.historyIndex++;
                e.target.value = this.terminalHistory[this.historyIndex];
            } else {
                this.historyIndex = this.terminalHistory.length;
                e.target.value = '';
            }
        }
    }

    addTerminalLine(text, type = 'output') {
        const output = document.getElementById('sshTerminalOutput');
        if (!output) return;

        const line = document.createElement('div');
        line.className = `ssh-terminal-line ${type}`;
        
        if (type === 'command') {
            line.innerHTML = `<span class="ssh-terminal-prompt">$</span><span class="ssh-terminal-text">${text}</span>`;
        } else {
            line.innerHTML = `<span class="ssh-terminal-text">${text}</span>`;
        }
        
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }

    handleSSHOutput(data) {
        this.addTerminalLine(data.output, 'output');
    }

    handleSSHError(data) {
        this.addTerminalLine(`Erro: ${data.error}`, 'error');
    }

    handleConnectionStatus(data) {
        this.updateConnectionStatus(data.status, data.connected);
        
        if (!data.connected) {
            this.isConnected = false;
            this.currentConnection = null;
            this.hideTerminal();
        }
    }

    async disconnectSSH() {
        if (!this.isConnected) return;

        try {
            if (this.socket) {
                this.socket.emit('ssh-disconnect', this.currentConnection);
            }

            const response = await fetch('/api/ssh/disconnect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.currentConnection)
            });

            this.isConnected = false;
            this.currentConnection = null;
            this.hideTerminal();
            this.updateConnectionStatus('Desconectado', false);
            this.showToast('Desconectado do SSH', 'info');
            
        } catch (error) {
            console.error('SSH Disconnect Error:', error);
            this.showToast('Erro ao desconectar', 'error');
        }
    }

    clearTerminal() {
        const output = document.getElementById('sshTerminalOutput');
        if (output) {
            output.innerHTML = `
                <div class="ssh-terminal-line">
                    <span class="ssh-terminal-prompt">$</span>
                    <span class="ssh-terminal-text">Terminal limpo</span>
                </div>
            `;
        }
    }

    showToast(message, type = 'info') {
        // Usar o sistema de toast existente se disponível
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console.log(`Toast [${type}]: ${message}`);
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.sshManager = new SSHManager();
});

// Exportar para uso global
window.SSHManager = SSHManager;
