# 🚀 SMX LiveBoard - Dashboard de Monitoramento

Dashboard profissional de monitoramento de sistema em tempo real, inspirado no Grafana e Zabbix.

## ✨ Funcionalidades

- 📊 **Métricas em Tempo Real**: CPU, RAM, Disco, Rede
- 🔄 **Gráficos Históricos**: Tendências e análise temporal
- 🔍 **Monitoramento de Serviços**: HTTP, TCP, UDP
- 📈 **Processos Ativos**: Top processos por CPU/Memória
- 🖥️ **Terminal Integrado**: Execução de comandos
- ⚡ **WebSocket**: Dados em tempo real
- 📱 **Responsivo**: Funciona em desktop e mobile

## 🛠️ Instalação Rápida

### Pré-requisitos
- Node.js 16+ ([Download](https://nodejs.org/))
- Windows 10/11 ou Linux/macOS

### Instalação Automática
```bash
# Clone ou baixe o projeto
cd SMX-LiveBoard

# Execute o script de inicialização
start.bat  # Windows
# ou
chmod +x start.sh && ./start.sh  # Linux/macOS
```

### Instalação Manual
```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor
npm start

# 3. Acessar dashboard
# http://localhost:3000
```

## 📦 Dependências Principais

| Pacote | Versão | Descrição |
|--------|--------|-----------|
| `systeminformation` | ^5.21.15 | Coleta de métricas do sistema |
| `socket.io` | ^4.7.4 | WebSocket para tempo real |
| `express` | ^4.18.2 | Servidor web |
| `axios` | ^1.6.2 | Cliente HTTP para health checks |
| `ps-list` | ^8.1.1 | Lista de processos |

## 🔧 Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
NODE_ENV=development
PORT=3000
METRICS_INTERVAL=2000
PROCESSES_INTERVAL=5000
SERVICES_INTERVAL=30000
```

### Personalização
- **Intervalos**: Ajuste a frequência de coleta de dados
- **Serviços**: Adicione/remova serviços para monitorar
- **Permissões**: Configure comandos permitidos no terminal

## 📊 Dados Coletados

### Métricas do Sistema
- **CPU**: Uso, frequência, cores
- **Memória**: Total, usado, livre, percentual
- **Disco**: Espaço total, usado, livre, I/O
- **Rede**: Download/upload, velocidade, interface

### Processos
- **Top 10**: Por uso de CPU
- **Detalhes**: PID, nome, memória, usuário
- **Histórico**: Tendências de uso

### Serviços
- **HTTP/HTTPS**: Status codes, tempo de resposta
- **TCP**: Conectividade, latência
- **UDP**: Disponibilidade, tempo de resposta

## 🚀 Uso

### Dashboard Principal
- Acesse `http://localhost:3000`
- Visualize métricas em tempo real
- Navegue pelos gráficos históricos

### API REST
```bash
# Health check
GET /api/health

# Métricas do sistema
GET /api/system/metrics

# Processos
GET /api/processes

# Serviços
GET /api/services
```

### WebSocket
```javascript
const socket = io('http://localhost:3000');

// Escutar métricas
socket.on('system:metrics', (data) => {
    console.log('Métricas:', data);
});

// Escutar processos
socket.on('processes:update', (data) => {
    console.log('Processos:', data);
});
```

## 🔒 Segurança

### Comandos Permitidos
O terminal integrado permite apenas comandos seguros:
- `dir`, `ls`, `pwd`, `cd`
- `ping`, `tracert`, `netstat`
- `tasklist`, `ps`, `top`
- `systeminfo`, `uname`, `df`

### Comandos Bloqueados
- `rm`, `del`, `format`
- `shutdown`, `reboot`
- `sudo`, `su`

## 🐛 Troubleshooting

### Problemas Comuns

**Erro: "Module not found"**
```bash
npm install
```

**Erro: "Permission denied"**
```bash
# Windows: Execute como administrador
# Linux: sudo npm start
```

**Dashboard não carrega**
- Verifique se a porta 3000 está livre
- Confirme se o servidor está rodando
- Verifique o console do navegador

### Logs
```bash
# Modo desenvolvimento
npm run dev

# Logs detalhados
DEBUG=* npm start
```

## 📈 Performance

### Otimizações
- **Cache**: Dados históricos em memória
- **Compressão**: Gzip habilitado
- **WebSocket**: Conexão persistente
- **Lazy Loading**: Carregamento sob demanda

### Limites
- **Histórico**: 60 pontos por métrica
- **Processos**: Top 10 por padrão
- **Serviços**: Máximo 20 simultâneos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/SMX-LiveBoard/issues)
- **Email**: suporte@smx.com.br
- **Documentação**: [Wiki](https://github.com/seu-usuario/SMX-LiveBoard/wiki)

---

**SMX LiveBoard** - Monitoramento profissional feito simples! 🎉