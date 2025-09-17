# 📊 SMX LiveBoard - Sistema de Coleta de Dados

## 🎯 Visão Geral

Este documento descreve o sistema de coleta de dados do SMX LiveBoard, incluindo arquitetura, configurações, problemas conhecidos e oportunidades de melhoria para contribuidores.

## 🏗️ Arquitetura do Sistema

### Fluxo de Dados
```
Frontend (WebSocket) ←→ Backend (Express + Socket.IO) ←→ MonitorService ←→ SystemInformation
```

### Componentes Principais

1. **MonitorService** (`backend/services/monitorService.js`)
   - Coleta dados do sistema usando `systeminformation`
   - Implementa sistema de cache inteligente
   - Gerencia métricas de performance

2. **SMXLiveBoardServer** (`backend/index.js`)
   - Servidor principal com Express + Socket.IO
   - Sistema de intervalos adaptativos
   - Throttling e otimizações

3. **Frontend** (`js/app.js`)
   - Interface de usuário
   - Recebe dados via WebSocket
   - Atualizações em tempo real

## ⚙️ Configurações Atuais

### Intervalos de Coleta
```javascript
// Configurações base (muito conservadoras)
baseMetricsInterval: 10000,    // 10 segundos
baseProcessesInterval: 45000,  // 45 segundos
minMetricsInterval: 8000,      // 8 segundos mínimo
maxMetricsInterval: 20000,     // 20 segundos máximo
```

### Cache TTL (Time To Live)
```javascript
// MonitorService cache
basicTtl: 30000,        // 30 segundos
fullTtl: 15000,         // 15 segundos
pingTtl: 60000,         // 60 segundos
networkTtl: 30000,      // 30 segundos
```

### Throttling
```javascript
// Backend throttling
if (now - this.lastMetricsSent > 5000) { // 5 segundos mínimo entre envios
    this.io.emit('system:metrics', metrics);
}
```

## 🎯 Oportunidades de Otimização

### 1. **Intervalos Adaptativos**
- **Atual:** Métricas atualizam a cada 8-20 segundos
- **Oportunidade:** Implementar intervalos mais responsivos (2-5 segundos)
- **Benefício:** Interface mais fluida e responsiva

### 2. **Cache Inteligente**
- **Atual:** Dados ficam em cache por 15-60 segundos
- **Oportunidade:** Sistema de cache baseado em mudanças
- **Benefício:** Atualizações mais precisas e eficientes

### 3. **Throttling Dinâmico**
- **Atual:** 5 segundos mínimo entre envios
- **Oportunidade:** Throttling adaptativo baseado na carga
- **Benefício:** Melhor balanceamento entre performance e responsividade

### 4. **Coleta Assíncrona**
- **Atual:** Ping executa a cada 60 segundos
- **Oportunidade:** Implementar coleta paralela e não-bloqueante
- **Benefício:** Atualizações mais frequentes sem impacto na performance

### 5. **Atualizações Diferenciais**
- **Atual:** Sistema envia todos os dados a cada atualização
- **Oportunidade:** Enviar apenas dados que mudaram
- **Benefício:** Redução de bandwidth e processamento

## 🚀 Implementações Sugeridas

### 1. **Sistema de Prioridades**
```javascript
// Implementar prioridades de coleta
const collectionPriorities = {
    critical: ['cpu', 'memory'],     // 1-2 segundos
    important: ['network', 'disk'],  // 3-5 segundos
    normal: ['processes'],           // 10-15 segundos
    low: ['static_info']             // 60+ segundos
};
```

### 2. **Coleta Assíncrona**
```javascript
// Coletar dados em paralelo
const [cpu, memory, network, disk] = await Promise.all([
    this.getCpuMetrics(),
    this.getMemoryMetrics(),
    this.getNetworkMetrics(),
    this.getDiskMetrics()
]);
```

### 3. **Cache Inteligente**
```javascript
// Cache baseado em mudanças
if (this.hasDataChanged(newData, cachedData)) {
    this.updateCache(newData);
    this.notifyClients(newData);
}
```

### 4. **WebSocket Otimizado**
```javascript
// Enviar apenas dados que mudaram
const diff = this.calculateDiff(oldData, newData);
if (Object.keys(diff).length > 0) {
    this.io.emit('system:metrics:diff', diff);
}
```

### 5. **Sistema de Buffer**
```javascript
// Buffer de atualizações para evitar spam
class UpdateBuffer {
    constructor(maxSize = 10, flushInterval = 1000) {
        this.buffer = [];
        this.maxSize = maxSize;
        this.flushInterval = flushInterval;
    }
}
```

## 🔧 Configurações Recomendadas

### Para Desenvolvimento (Responsivo)
```javascript
baseMetricsInterval: 2000,     // 2 segundos
baseProcessesInterval: 5000,   // 5 segundos
minMetricsInterval: 1000,      // 1 segundo
maxMetricsInterval: 5000,      // 5 segundos
throttling: 500,               // 0.5 segundos
```

### Para Produção (Balanceado)
```javascript
baseMetricsInterval: 5000,     // 5 segundos
baseProcessesInterval: 15000,  // 15 segundos
minMetricsInterval: 3000,      // 3 segundos
maxMetricsInterval: 10000,     // 10 segundos
throttling: 1000,              // 1 segundo
```

### Para Alta Performance (Mínimo)
```javascript
baseMetricsInterval: 1000,     // 1 segundo
baseProcessesInterval: 3000,   // 3 segundos
minMetricsInterval: 500,       // 0.5 segundos
maxMetricsInterval: 2000,      // 2 segundos
throttling: 100,               // 0.1 segundos
```

## 📈 Métricas de Performance

### Estado Atual
- **Tempo de coleta:** 100-500ms
- **Tamanho dos dados:** 2-5KB por atualização
- **Frequência:** 0.05-0.125 Hz
- **Latência:** 8-20 segundos

### Objetivos de Otimização
- **Tempo de coleta:** 50-200ms (melhoria de 2-5x)
- **Tamanho dos dados:** 1-3KB por atualização (redução de 40-60%)
- **Frequência:** 0.2-1 Hz (aumento de 4-20x)
- **Latência:** 1-5 segundos (melhoria de 4-20x)

## 🛠️ Como Contribuir

### 1. **Analisar Performance**
```bash
# Adicionar logs de performance
console.time('data-collection');
const data = await this.collectData();
console.timeEnd('data-collection');
```

### 2. **Testar Configurações**
```javascript
// Testar diferentes intervalos
const testIntervals = [1000, 2000, 5000, 10000];
for (const interval of testIntervals) {
    await this.testPerformance(interval);
}
```

### 3. **Implementar Otimizações**
- Cache inteligente
- Coleta assíncrona
- Atualizações diferenciais
- Sistema de prioridades

### 4. **Monitorar Impacto**
- CPU usage do servidor
- Memory usage
- Network bandwidth
- Client responsiveness

## 🧪 Testes Recomendados

### 1. **Teste de Carga**
```javascript
// Simular múltiplos clientes
for (let i = 0; i < 100; i++) {
    this.simulateClient();
}
```

### 2. **Teste de Latência**
```javascript
// Medir tempo entre coleta e exibição
const startTime = Date.now();
this.collectData().then(() => {
    const latency = Date.now() - startTime;
    console.log(`Latência: ${latency}ms`);
});
```

### 3. **Teste de Memória**
```javascript
// Monitorar uso de memória
setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log(`Memória: ${memUsage.heapUsed / 1024 / 1024}MB`);
}, 5000);
```

## 📝 TODO List

### Prioridade Alta
- [ ] Reduzir intervalos base para 2-5 segundos
- [ ] Implementar coleta assíncrona
- [ ] Reduzir throttling para 1 segundo
- [ ] Otimizar cache TTL

### Prioridade Média
- [ ] Implementar atualizações diferenciais
- [ ] Sistema de prioridades de coleta
- [ ] Buffer de atualizações
- [ ] Métricas de performance

### Prioridade Baixa
- [ ] Cache inteligente baseado em mudanças
- [ ] Compressão de dados
- [ ] Lazy loading de dados não críticos
- [ ] Sistema de fallback para coleta

## 🤝 Contribuindo

1. **Fork** o repositório
2. **Crie** uma branch para sua feature
3. **Implemente** as melhorias
4. **Teste** com diferentes configurações
5. **Documente** as mudanças
6. **Submeta** um Pull Request

## 📞 Suporte

Para dúvidas sobre o sistema de coleta:
- Abra uma **Issue** no GitHub
- Consulte a **documentação** do systeminformation
- Teste com **configurações diferentes**
- Monitore **métricas de performance**

---

**Última atualização:** Setembro 2025  
**Versão:** 1.0.0  
**Status:** Em desenvolvimento ativo
