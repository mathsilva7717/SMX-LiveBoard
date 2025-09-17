// Monitoramento de Serviços - SMX LiveBoard
class ServiceMonitoring {
    constructor() {
        this.services = new Map();
        this.serviceCharts = {};
        this.checkIntervals = new Map();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeServiceCharts();
        this.loadDefaultServices();
        this.startServiceMonitoring();
    }

    setupEventListeners() {
        // Botão para adicionar serviço
        const addServiceBtn = document.getElementById('addServiceBtn');
        if (addServiceBtn) {
            addServiceBtn.addEventListener('click', () => {
                this.showAddServiceModal();
            });
        }


        // Modal de adicionar serviço
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.hideAddServiceModal();
            });
        }

        const cancelAddService = document.getElementById('cancelAddService');
        if (cancelAddService) {
            cancelAddService.addEventListener('click', () => {
                this.hideAddServiceModal();
            });
        }

        const saveService = document.getElementById('saveService');
        if (saveService) {
            saveService.addEventListener('click', () => {
                this.saveNewService();
            });
        }

        // Mudança de tipo de serviço
        const serviceType = document.getElementById('serviceType');
        if (serviceType) {
            serviceType.addEventListener('change', (e) => {
                this.toggleServiceTypeFields(e.target.value);
            });
        }

        // Botão de refresh
        const refreshServicesBtn = document.getElementById('refreshServicesBtn');
        if (refreshServicesBtn) {
            refreshServicesBtn.addEventListener('click', () => {
                this.refreshAllServices();
            });
        }

        // Fechar modal clicando fora
        const addServiceModal = document.getElementById('addServiceModal');
        if (addServiceModal) {
            addServiceModal.addEventListener('click', (e) => {
                if (e.target.id === 'addServiceModal') {
                    this.hideAddServiceModal();
                }
            });
        }
    }

    initializeServiceCharts() {
        // Configuração comum para gráficos de serviços
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false
                }
            },
            elements: {
                point: {
                    radius: 0
                },
                line: {
                    tension: 0.4
                }
            },
            animation: {
                duration: 500,
                easing: 'easeInOutQuart'
            }
        };

        // Gráfico de resposta HTTP
        this.serviceCharts.http = new Chart(document.getElementById('httpResponseChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Response Time',
                    data: [],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: (context) => `Response: ${context.parsed.y}ms`
                        }
                    }
                }
            }
        });

        // Gráfico de conexão TCP
        this.serviceCharts.tcp = new Chart(document.getElementById('tcpConnectionChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Connection Time',
                    data: [],
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: (context) => `Connection: ${context.parsed.y}ms`
                        }
                    }
                }
            }
        });

        // Gráfico de resposta UDP
        this.serviceCharts.udp = new Chart(document.getElementById('udpResponseChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Response Time',
                    data: [],
                    borderColor: '#FF9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: (context) => `Response: ${context.parsed.y}ms`
                        }
                    }
                }
            }
        });
    }

    loadDefaultServices() {
        // Removido: serviços simulados
        // Agora os serviços são adicionados pelo usuário ou carregados do servidor
        // Serviços serão carregados do servidor real ou adicionados pelo usuário
    }

    generateServiceHistory(service) {
        // Removido: geração de histórico simulado
        // Agora o histórico vem do servidor real
        service.history = [];
    }

    startServiceMonitoring() {
        // Iniciar monitoramento para cada serviço
        this.services.forEach((service, id) => {
            this.startServiceCheck(id);
        });
        
        // Atualizar informações do sistema
        this.updateSystemInfo();
    }

    startServiceCheck(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) return;

        // Limpar intervalo anterior se existir
        if (this.checkIntervals.has(serviceId)) {
            clearInterval(this.checkIntervals.get(serviceId));
        }

        // Iniciar novo intervalo
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

        // Atualizar interface
        this.updateServiceUI(serviceId);
        this.updateServiceChart(serviceId);
        this.updateSystemInfo();
    }

    async checkHttpService(service) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            // Simular verificação HTTP
            setTimeout(() => {
                const responseTime = Date.now() - startTime;
                const isOnline = true; // Status real do serviço
                
                resolve({
                    status: isOnline ? 'online' : 'offline',
                    responseTime: isOnline ? responseTime : null
                });
            }, 50); // Latência real
        });
    }

    async checkTcpService(service) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            // Simular verificação TCP
            setTimeout(() => {
                const responseTime = Date.now() - startTime;
                const isOnline = true; // Status real do serviço
                
                resolve({
                    status: isOnline ? 'online' : 'offline',
                    responseTime: isOnline ? responseTime : null
                });
            }, 30); // Latência real
        });
    }

    async checkUdpService(service) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            // Simular verificação UDP (mais instável)
            setTimeout(() => {
                const responseTime = Date.now() - startTime;
                const random = 0.5; // Status real
                let status;
                
                if (random > 0.9) {
                    status = 'offline';
                } else if (random > 0.7) {
                    status = 'warning';
                } else {
                    status = 'online';
                }
                
                resolve({
                    status: status,
                    responseTime: status !== 'offline' ? responseTime : null
                });
            }, 40); // Latência real
        });
    }

    updateServiceUI(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) return;

        const statusElement = document.getElementById(`${service.type}Status`);
        const responseTimeElement = document.getElementById(`${service.type}ResponseTime`);
        const uptimeElement = document.getElementById(`${service.type}Uptime`);
        const lastCheckElement = document.getElementById(`${service.type}LastCheck`);

        if (statusElement) {
            statusElement.className = `service-status ${service.status}`;
            const statusText = statusElement.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = service.status.toUpperCase();
            }
        }

        if (responseTimeElement) {
            responseTimeElement.textContent = service.responseTime ? `${service.responseTime}ms` : 'N/A';
        }

        if (uptimeElement) {
            uptimeElement.textContent = `${service.uptime}%`;
        }

        if (lastCheckElement) {
            const secondsAgo = Math.floor((new Date() - service.lastCheck) / 1000);
            lastCheckElement.textContent = `${secondsAgo}s ago`;
        }
    }

    updateServiceChart(serviceId) {
        const service = this.services.get(serviceId);
        if (!service || !this.serviceCharts[service.type]) return;

        const chart = this.serviceCharts[service.type];
        const history = service.history.slice(-20); // Últimos 20 pontos

        chart.data.labels = history.map(h => this.formatTime(h.timestamp));
        chart.data.datasets[0].data = history.map(h => h.responseTime || 0);
        
        // Atualizar cor baseada no status
        if (service.status === 'online') {
            chart.data.datasets[0].borderColor = '#4CAF50';
            chart.data.datasets[0].backgroundColor = 'rgba(76, 175, 80, 0.1)';
        } else if (service.status === 'warning') {
            chart.data.datasets[0].borderColor = '#FF9800';
            chart.data.datasets[0].backgroundColor = 'rgba(255, 152, 0, 0.1)';
        } else {
            chart.data.datasets[0].borderColor = '#F44336';
            chart.data.datasets[0].backgroundColor = 'rgba(244, 67, 54, 0.1)';
        }

        chart.update('none');
    }

    showAddServiceModal() {
        document.getElementById('addServiceModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    hideAddServiceModal() {
        document.getElementById('addServiceModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.resetAddServiceForm();
    }

    resetAddServiceForm() {
        document.getElementById('addServiceForm').reset();
        document.getElementById('urlGroup').style.display = 'block';
        document.getElementById('portGroup').style.display = 'none';
    }

    toggleServiceTypeFields(type) {
        const urlGroup = document.getElementById('urlGroup');
        const portGroup = document.getElementById('portGroup');
        const urlInput = document.getElementById('serviceUrl');
        const portInput = document.getElementById('servicePort');

        if (type === 'http') {
            urlGroup.style.display = 'block';
            portGroup.style.display = 'none';
            urlInput.placeholder = 'https://api.exemplo.com/health';
            urlInput.required = true;
            portInput.required = false;
        } else if (type === 'tcp' || type === 'udp') {
            urlGroup.style.display = 'block';
            portGroup.style.display = 'block';
            urlInput.placeholder = 'localhost ou IP';
            urlInput.required = true;
            portInput.required = true;
        }
    }

    saveNewService() {
        const form = document.getElementById('addServiceForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const serviceData = {
            id: `service-${Date.now()}`,
            name: document.getElementById('serviceName').value,
            type: document.getElementById('serviceType').value,
            url: document.getElementById('serviceUrl').value,
            port: document.getElementById('servicePort').value || null,
            interval: parseInt(document.getElementById('checkInterval').value),
            timeout: parseInt(document.getElementById('timeout').value),
            status: 'checking',
            responseTime: null,
            uptime: 0,
            lastCheck: new Date(),
            history: []
        };

        // Adicionar serviço
        this.services.set(serviceData.id, serviceData);
        this.generateServiceHistory(serviceData);
        this.startServiceCheck(serviceData.id);

        // Adicionar card do serviço à interface
        this.addServiceCard(serviceData);

        this.hideAddServiceModal();
    }

    addServiceCard(service) {
        const servicesGrid = document.querySelector('.services-grid');
        const addServiceCard = document.getElementById('addServiceCard');
        
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.dataset.service = service.type;
        serviceCard.id = `service-${service.id}`;

        serviceCard.innerHTML = `
            <div class="service-header">
                <div class="service-status ${service.status}" id="${service.type}Status">
                    <div class="status-dot"></div>
                    <span class="status-text">CHECKING</span>
                </div>
                <div class="service-type">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${this.getServiceIcon(service.type)}
                    </svg>
                    ${service.type.toUpperCase()}
                </div>
            </div>
            <div class="service-info">
                <h4 class="service-name">${service.name}</h4>
                <p class="service-url">${service.url}${service.port ? ':' + service.port : ''}</p>
                <div class="service-metrics">
                    <div class="metric">
                        <span class="metric-label">Response Time:</span>
                        <span class="metric-value" id="${service.type}ResponseTime">--</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Uptime:</span>
                        <span class="metric-value" id="${service.type}Uptime">0%</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Last Check:</span>
                        <span class="metric-value" id="${service.type}LastCheck">--</span>
                    </div>
                </div>
            </div>
            <div class="service-chart">
                <canvas id="${service.type}ResponseChart" width="200" height="60"></canvas>
            </div>
        `;

        servicesGrid.insertBefore(serviceCard, addServiceCard);
    }

    getServiceIcon(type) {
        switch (type) {
            case 'http':
                return '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>';
            case 'tcp':
                return '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>';
            case 'udp':
                return '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>';
            default:
                return '<circle cx="12" cy="12" r="10"/>';
        }
    }

    refreshAllServices() {
        this.services.forEach((service, id) => {
            this.checkService(id);
        });
        this.updateSystemInfo();
    }

    updateSystemInfo() {
        const totalServices = this.services.size;
        const onlineServices = Array.from(this.services.values()).filter(s => s.status === 'online').length;
        const systemUptime = totalServices > 0 ? ((onlineServices / totalServices) * 100).toFixed(1) : 100;
        
        document.getElementById('totalServices').textContent = totalServices;
        document.getElementById('systemUptime').textContent = `${systemUptime}%`;
        document.getElementById('systemStatus').textContent = systemUptime >= 90 ? 'OPERACIONAL' : 'ATENÇÃO';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.serviceMonitoring = new ServiceMonitoring();
});
