/**
 * SMX LiveBoard - SSH Service
 * Gerencia conexões SSH e execução de comandos remotos
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class SSHService {
    constructor() {
        this.connections = new Map();
        this.activeConnections = new Set();
    }

    /**
     * Testa uma conexão SSH sem estabelecer sessão completa
     */
    async testConnection(connectionData) {
        return new Promise((resolve) => {
            const client = new Client();
            let resolved = false;

            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    client.end();
                    resolve({
                        success: false,
                        error: 'Timeout na conexão SSH'
                    });
                }
            }, 10000); // 10 segundos timeout

            client.on('ready', () => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    client.end();
                    resolve({
                        success: true,
                        message: 'Conexão SSH testada com sucesso'
                    });
                }
            });

            client.on('error', (err) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    resolve({
                        success: false,
                        error: err.message
                    });
                }
            });

            // Configuração da conexão
            const config = {
                host: connectionData.host,
                port: connectionData.port || 22,
                username: connectionData.username,
                password: connectionData.password,
                readyTimeout: 10000,
                keepaliveInterval: 30000
            };

            // Se chave privada for fornecida
            if (connectionData.keyPath && fs.existsSync(connectionData.keyPath)) {
                config.privateKey = fs.readFileSync(connectionData.keyPath);
                delete config.password;
            }

            client.connect(config);
        });
    }

    /**
     * Estabelece uma conexão SSH completa
     */
    async connect(connectionData, socket) {
        return new Promise((resolve) => {
            const connectionId = this.generateConnectionId(connectionData);
            
            // Verificar se já existe uma conexão ativa
            if (this.connections.has(connectionId)) {
                resolve({
                    success: false,
                    error: 'Já existe uma conexão ativa para este host'
                });
                return;
            }

            const client = new Client();
            let resolved = false;

            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    client.end();
                    resolve({
                        success: false,
                        error: 'Timeout na conexão SSH'
                    });
                }
            }, 15000); // 15 segundos timeout

            client.on('ready', () => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    
                    // Armazenar conexão
                    this.connections.set(connectionId, {
                        client,
                        connectionData,
                        socket,
                        createdAt: new Date()
                    });
                    
                    this.activeConnections.add(connectionId);

                    logger.info(`SSH conectado: ${connectionData.username}@${connectionData.host}:${connectionData.port}`);

                    // Notificar cliente sobre conexão bem-sucedida
                    if (socket) {
                        socket.emit('ssh-connection-status', {
                            connected: true,
                            status: 'Conectado',
                            connectionId
                        });
                    }

                    resolve({
                        success: true,
                        connectionId,
                        message: 'Conectado via SSH com sucesso'
                    });
                }
            });

            client.on('error', (err) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    
                    logger.error(`Erro na conexão SSH: ${err.message}`);
                    
                    if (socket) {
                        socket.emit('ssh-connection-status', {
                            connected: false,
                            status: 'Erro na conexão',
                            error: err.message
                        });
                    }

                    resolve({
                        success: false,
                        error: err.message
                    });
                }
            });

            // Configuração da conexão
            const config = {
                host: connectionData.host,
                port: connectionData.port || 22,
                username: connectionData.username,
                password: connectionData.password,
                readyTimeout: 15000,
                keepaliveInterval: 30000
            };

            // Se chave privada for fornecida
            if (connectionData.keyPath && fs.existsSync(connectionData.keyPath)) {
                config.privateKey = fs.readFileSync(connectionData.keyPath);
                delete config.password;
            }

            client.connect(config);
        });
    }

    /**
     * Executa um comando SSH
     */
    async executeCommand(connectionId, command, socket) {
        const connection = this.connections.get(connectionId);
        
        if (!connection) {
            if (socket) {
                socket.emit('ssh-error', {
                    error: 'Conexão SSH não encontrada'
                });
            }
            return;
        }

        return new Promise((resolve) => {
            connection.client.exec(command, (err, stream) => {
                if (err) {
                    logger.error(`Erro ao executar comando SSH: ${err.message}`);
                    
                    if (socket) {
                        socket.emit('ssh-error', {
                            error: err.message
                        });
                    }
                    
                    resolve({
                        success: false,
                        error: err.message
                    });
                    return;
                }

                let output = '';
                let errorOutput = '';

                stream.on('close', (code, signal) => {
                    const result = {
                        success: code === 0,
                        output: output.trim(),
                        error: errorOutput.trim(),
                        exitCode: code,
                        signal
                    };

                    if (socket) {
                        socket.emit('ssh-output', {
                            output: result.output || result.error,
                            exitCode: code
                        });
                    }

                    resolve(result);
                });

                stream.on('data', (data) => {
                    output += data.toString();
                });

                stream.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });
            });
        });
    }

    /**
     * Desconecta uma conexão SSH
     */
    async disconnect(connectionId) {
        const connection = this.connections.get(connectionId);
        
        if (!connection) {
            return {
                success: false,
                error: 'Conexão SSH não encontrada'
            };
        }

        try {
            connection.client.end();
            this.connections.delete(connectionId);
            this.activeConnections.delete(connectionId);
            
            logger.info(`SSH desconectado: ${connection.connectionData.username}@${connection.connectionData.host}:${connection.connectionData.port}`);

            return {
                success: true,
                message: 'Desconectado com sucesso'
            };
        } catch (error) {
            logger.error(`Erro ao desconectar SSH: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Desconecta todas as conexões SSH
     */
    async disconnectAll() {
        const promises = [];
        
        for (const [connectionId, connection] of this.connections) {
            promises.push(this.disconnect(connectionId));
        }

        await Promise.all(promises);
        
        logger.info('Todas as conexões SSH foram desconectadas');
    }

    /**
     * Lista conexões ativas
     */
    getActiveConnections() {
        const connections = [];
        
        for (const [connectionId, connection] of this.connections) {
            connections.push({
                connectionId,
                host: connection.connectionData.host,
                port: connection.connectionData.port,
                username: connection.connectionData.username,
                createdAt: connection.createdAt
            });
        }

        return connections;
    }

    /**
     * Gera um ID único para a conexão
     */
    generateConnectionId(connectionData) {
        return `${connectionData.username}@${connectionData.host}:${connectionData.port}`;
    }

    /**
     * Verifica se uma conexão está ativa
     */
    isConnectionActive(connectionId) {
        return this.connections.has(connectionId);
    }

    /**
     * Limpa conexões inativas
     */
    cleanupInactiveConnections() {
        const now = new Date();
        const maxAge = 30 * 60 * 1000; // 30 minutos

        for (const [connectionId, connection] of this.connections) {
            const age = now - connection.createdAt;
            
            if (age > maxAge) {
                logger.info(`Limpando conexão SSH inativa: ${connectionId}`);
                this.disconnect(connectionId);
            }
        }
    }

    /**
     * Inicia limpeza automática de conexões
     */
    startCleanupInterval() {
        // Limpar conexões inativas a cada 10 minutos
        setInterval(() => {
            this.cleanupInactiveConnections();
        }, 10 * 60 * 1000);
    }
}

// Instância singleton
const sshService = new SSHService();

// Iniciar limpeza automática
sshService.startCleanupInterval();

module.exports = sshService;
