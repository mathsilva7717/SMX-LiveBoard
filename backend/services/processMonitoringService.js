const si = require('systeminformation');
const psList = require('ps-list');

class ProcessMonitoringService {
    constructor() {
        this.processHistory = new Map();
        this.maxHistoryPoints = 20;
    }

    async getTopProcesses(limit = 10) {
        try {
            // Usar systeminformation para dados mais detalhados
            const processes = await si.processes();
            
            // Verificar se temos dados válidos
            if (!processes.list || !Array.isArray(processes.list)) {
                throw new Error('Dados de processos inválidos');
            }

            // Ordenar por uso de CPU e pegar os top processos
            const topProcesses = processes.list
                .filter(process => process && process.pid) // Filtrar processos válidos
                .sort((a, b) => (b.cpu || 0) - (a.cpu || 0))
                .slice(0, limit)
                .map(process => ({
                    pid: process.pid,
                    name: process.name || 'Unknown',
                    cpu: Math.round((process.cpu || 0) * 100) / 100,
                    memory: Math.round((process.mem_rss || 0) / 1024 / 1024), // MB
                    memoryPercent: Math.round((process.mem_percent || 0) * 100) / 100,
                    command: process.command || '',
                    user: process.user || 'unknown',
                    started: process.started || '',
                    state: process.state || 'unknown',
                    priority: process.priority || 0
                }));

            // Calcular totais
            const totalCpu = processes.list.reduce((sum, p) => sum + (p.cpu || 0), 0);
            const totalMemory = processes.list.reduce((sum, p) => sum + (p.mem_rss || 0), 0);

            return {
                processes: topProcesses,
                totalCpu: Math.round(totalCpu * 100) / 100,
                totalMemory: Math.round(totalMemory / 1024 / 1024), // MB
                totalProcesses: processes.list.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erro ao coletar processos:', error);
            
            // Fallback usando ps-list
            try {
                const processes = await psList();
                const topProcesses = processes
                    .sort((a, b) => (b.cpu || 0) - (a.cpu || 0))
                    .slice(0, limit)
                    .map(process => ({
                        pid: process.pid,
                        name: process.name,
                        cpu: process.cpu || 0,
                        memory: Math.round((process.memory || 0) / 1024 / 1024), // MB
                        memoryPercent: 0,
                        command: process.cmd || '',
                        user: process.uid || 'unknown',
                        started: '',
                        state: 'running',
                        priority: 0
                    }));

                return {
                    processes: topProcesses,
                    totalCpu: topProcesses.reduce((sum, p) => sum + p.cpu, 0),
                    totalMemory: topProcesses.reduce((sum, p) => sum + p.memory, 0),
                    totalProcesses: processes.length,
                    timestamp: new Date().toISOString()
                };
            } catch (fallbackError) {
                console.error('Erro no fallback de processos:', fallbackError);
                return {
                    processes: [],
                    totalCpu: 0,
                    totalMemory: 0,
                    totalProcesses: 0,
                    timestamp: new Date().toISOString()
                };
            }
        }
    }

    async getProcessDetails(pid) {
        try {
            const process = await si.processLoad(pid);
            return {
                pid: process.pid,
                name: process.name,
                cpu: process.cpu,
                memory: process.mem,
                command: process.command,
                user: process.user,
                started: process.started,
                state: process.state,
                priority: process.priority,
                threads: process.threads,
                handles: process.handles,
                parentPid: process.parentPid
            };
        } catch (error) {
            console.error(`Erro ao obter detalhes do processo ${pid}:`, error);
            return null;
        }
    }

    async killProcess(pid, signal = 'SIGTERM') {
        try {
            const { spawn } = require('child_process');
            const os = require('os');
            
            let command;
            if (os.platform() === 'win32') {
                command = `taskkill /PID ${pid} /F`;
            } else {
                command = `kill -${signal} ${pid}`;
            }

            return new Promise((resolve, reject) => {
                const child = spawn(command, { shell: true });
                
                child.on('close', (code) => {
                    if (code === 0) {
                        resolve({ success: true, message: `Processo ${pid} encerrado com sucesso` });
                    } else {
                        reject(new Error(`Falha ao encerrar processo ${pid}`));
                    }
                });

                child.on('error', (error) => {
                    reject(error);
                });
            });
        } catch (error) {
            console.error(`Erro ao encerrar processo ${pid}:`, error);
            throw error;
        }
    }

    async getProcessHistory(pid) {
        if (!this.processHistory.has(pid)) {
            this.processHistory.set(pid, []);
        }
        return this.processHistory.get(pid);
    }

    updateProcessHistory(pid, data) {
        if (!this.processHistory.has(pid)) {
            this.processHistory.set(pid, []);
        }
        
        const history = this.processHistory.get(pid);
        history.push({
            timestamp: new Date().toISOString(),
            cpu: data.cpu,
            memory: data.memory
        });

        // Manter apenas os últimos pontos
        if (history.length > this.maxHistoryPoints) {
            history.shift();
        }
    }

    // Métodos para monitoramento contínuo
    startProcessMonitoring(interval = 5000) {
        this.monitoringInterval = setInterval(async () => {
            try {
                const processes = await this.getTopProcesses();
                
                // Atualizar histórico para cada processo
                processes.processes.forEach(process => {
                    this.updateProcessHistory(process.pid, {
                        cpu: process.cpu,
                        memory: process.memory
                    });
                });
            } catch (error) {
                console.error('Erro no monitoramento de processos:', error);
            }
        }, interval);
    }

    stopProcessMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    // Obter estatísticas gerais
    async getSystemStats() {
        try {
            const stats = await si.processes();
            return {
                totalProcesses: stats.list.length,
                runningProcesses: stats.list.filter(p => p.state === 'running').length,
                sleepingProcesses: stats.list.filter(p => p.state === 'sleeping').length,
                zombieProcesses: stats.list.filter(p => p.state === 'zombie').length,
                totalCpu: stats.list.reduce((sum, p) => sum + (p.cpu || 0), 0),
                totalMemory: stats.list.reduce((sum, p) => sum + (p.mem_rss || 0), 0)
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas do sistema:', error);
            return {
                totalProcesses: 0,
                runningProcesses: 0,
                sleepingProcesses: 0,
                zombieProcesses: 0,
                totalCpu: 0,
                totalMemory: 0
            };
        }
    }
}

module.exports = ProcessMonitoringService;
