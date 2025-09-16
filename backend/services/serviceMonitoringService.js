const axios = require('axios');
const net = require('net');
const dgram = require('dgram');
const { URL } = require('url');

class ServiceMonitoringService {
    constructor() {
        this.services = new Map();
        this.checkIntervals = new Map();
        this.defaultServices = []; // REMOVIDO: serviços simulados

        this.initializeDefaultServices();
    }

    initializeDefaultServices() {
        this.defaultServices.forEach(service => {
            this.services.set(service.id, service);
            this.startServiceCheck(service.id);
        });
    }

    addService(serviceData) {
        const service = {
            id: `service-${Date.now()}`,
            name: serviceData.name,
            type: serviceData.type,
            url: serviceData.url,
            port: serviceData.port || null,
            interval: serviceData.interval || 60,
            timeout: serviceData.timeout || 5000,
            status: 'checking',
            responseTime: null,
            uptime: 0,
            lastCheck: new Date(),
            history: [],
            totalChecks: 0,
            successfulChecks: 0
        };

        this.services.set(service.id, service);
        this.startServiceCheck(service.id);
        return service;
    }

    removeService(serviceId) {
        if (this.checkIntervals.has(serviceId)) {
            clearInterval(this.checkIntervals.get(serviceId));
            this.checkIntervals.delete(serviceId);
        }
        return this.services.delete(serviceId);
    }

    getAllServices() {
        return Array.from(this.services.values());
    }

    getService(serviceId) {
        return this.services.get(serviceId);
    }

    startServiceCheck(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) return;

        // Limpar intervalo anterior se existir
        if (this.checkIntervals.has(serviceId)) {
            clearInterval(this.checkIntervals.get(serviceId));
        }

        // Executar verificação imediatamente
        this.checkService(serviceId);

        // Iniciar intervalo
        const interval = setInterval(() => {
            this.checkService(serviceId);
        }, service.interval * 1000);

        this.checkIntervals.set(serviceId, interval);
    }

    async checkService(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) return;

        const startTime = Date.now();
        let status = 'offline';
        let responseTime = null;

        try {
            if (service.type === 'http') {
                const result = await this.checkHttpService(service);
                status = result.status;
                responseTime = result.responseTime;
            } else if (service.type === 'tcp') {
                const result = await this.checkTcpService(service);
                status = result.status;
                responseTime = result.responseTime;
            } else if (service.type === 'udp') {
                const result = await this.checkUdpService(service);
                status = result.status;
                responseTime = result.responseTime;
            }
        } catch (error) {
            console.error(`Erro ao verificar serviço ${serviceId}:`, error);
            status = 'offline';
            responseTime = null;
        }

        // Atualizar dados do serviço
        service.status = status;
        service.responseTime = responseTime;
        service.lastCheck = new Date();
        service.totalChecks++;

        if (status === 'online') {
            service.successfulChecks++;
        }

        // Calcular uptime
        service.uptime = service.totalChecks > 0 
            ? Math.round((service.successfulChecks / service.totalChecks) * 100 * 100) / 100
            : 0;

        // Adicionar ao histórico
        service.history.push({
            timestamp: new Date().toISOString(),
            responseTime: responseTime,
            status: status
        });

        // Manter apenas os últimos 60 pontos
        if (service.history.length > 60) {
            service.history.shift();
        }
    }

    async checkHttpService(service) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({
                    status: 'offline',
                    responseTime: null
                });
            }, service.timeout);

            const startTime = Date.now();

            axios.get(service.url, {
                timeout: service.timeout,
                validateStatus: (status) => status < 500 // Aceitar 4xx como online
            })
            .then(response => {
                clearTimeout(timeout);
                const responseTime = Date.now() - startTime;
                resolve({
                    status: 'online',
                    responseTime: responseTime
                });
            })
            .catch(error => {
                clearTimeout(timeout);
                const responseTime = Date.now() - startTime;
                
                // Se for erro de timeout, considerar offline
                if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                    resolve({
                        status: 'offline',
                        responseTime: null
                    });
                } else {
                    // Outros erros podem ser considerados online (ex: 404)
                    resolve({
                        status: 'online',
                        responseTime: responseTime
                    });
                }
            });
        });
    }

    async checkTcpService(service) {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            const startTime = Date.now();

            const timeout = setTimeout(() => {
                socket.destroy();
                resolve({
                    status: 'offline',
                    responseTime: null
                });
            }, service.timeout);

            socket.connect(service.port, service.url, () => {
                clearTimeout(timeout);
                const responseTime = Date.now() - startTime;
                socket.destroy();
                resolve({
                    status: 'online',
                    responseTime: responseTime
                });
            });

            socket.on('error', (error) => {
                clearTimeout(timeout);
                socket.destroy();
                resolve({
                    status: 'offline',
                    responseTime: null
                });
            });
        });
    }

    async checkUdpService(service) {
        return new Promise((resolve) => {
            const client = dgram.createSocket('udp4');
            const startTime = Date.now();

            const timeout = setTimeout(() => {
                client.close();
                resolve({
                    status: 'offline',
                    responseTime: null
                });
            }, service.timeout);

            // Enviar um pacote UDP simples
            const message = Buffer.from('test');
            
            client.send(message, service.port, service.url, (error) => {
                if (error) {
                    clearTimeout(timeout);
                    client.close();
                    resolve({
                        status: 'offline',
                        responseTime: null
                    });
                } else {
                    // Para UDP, consideramos online se conseguimos enviar
                    clearTimeout(timeout);
                    const responseTime = Date.now() - startTime;
                    client.close();
                    resolve({
                        status: 'online',
                        responseTime: responseTime
                    });
                }
            });

            client.on('error', (error) => {
                clearTimeout(timeout);
                client.close();
                resolve({
                    status: 'offline',
                    responseTime: null
                });
            });
        });
    }

    // Métodos para estatísticas
    getSystemStats() {
        const services = Array.from(this.services.values());
        const totalServices = services.length;
        const onlineServices = services.filter(s => s.status === 'online').length;
        const offlineServices = services.filter(s => s.status === 'offline').length;
        const warningServices = services.filter(s => s.status === 'warning').length;

        const avgUptime = totalServices > 0 
            ? services.reduce((sum, s) => sum + s.uptime, 0) / totalServices
            : 0;

        return {
            totalServices,
            onlineServices,
            offlineServices,
            warningServices,
            avgUptime: Math.round(avgUptime * 100) / 100,
            systemStatus: onlineServices >= totalServices * 0.9 ? 'OPERACIONAL' : 'ATENÇÃO'
        };
    }

    // Parar todos os checks
    stopAllChecks() {
        this.checkIntervals.forEach((interval, serviceId) => {
            clearInterval(interval);
        });
        this.checkIntervals.clear();
    }

    // Reiniciar todos os checks
    restartAllChecks() {
        this.stopAllChecks();
        this.services.forEach((service, serviceId) => {
            this.startServiceCheck(serviceId);
        });
    }
}

module.exports = ServiceMonitoringService;
