# 🛠️ Desenvolvimento - SMX LiveBoard

Guia completo para desenvolvimento e contribuição no projeto SMX LiveBoard.

## 📋 Índice

- [Setup do Ambiente](#setup-do-ambiente)
- [Estrutura do Código](#estrutura-do-código)
- [Padrões de Codificação](#padrões-de-codificação)
- [Processo de Desenvolvimento](#processo-de-desenvolvimento)
- [Testes](#testes)
- [Debugging](#debugging)
- [Contribuição](#contribuição)
- [Release Process](#release-process)

## 🔧 Setup do Ambiente

### Pré-requisitos de Desenvolvimento

```bash
# Node.js 18+
node --version  # v18.0.0+

# NPM 8+
npm --version   # v8.0.0+

# Git 2.0+
git --version   # v2.0.0+

# Editor recomendado: VS Code
# Extensões recomendadas:
# - ESLint
# - Prettier
# - Node.js Extension Pack
# - GitLens
```

### Configuração Inicial

```bash
# 1. Clone o repositório
git clone https://github.com/mathsilva7717/SMX-LiveBoard.git
cd SMX-LiveBoard

# 2. Instalar dependências
npm install

# 3. Instalar dependências de desenvolvimento
npm install --save-dev

# 4. Configurar ambiente de desenvolvimento
cp .env.example .env.development

# 5. Configurar Git hooks (opcional)
npm run setup-hooks
```

### Configuração do Editor (VS Code)

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.workingDirectories": ["."],
  "prettier.configPath": ".prettierrc",
  "files.associations": {
    "*.js": "javascript"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

### Scripts de Desenvolvimento

```bash
# Desenvolvimento com hot reload
npm run dev

# Desenvolvimento com debug
npm run dev:debug

# Linting
npm run lint
npm run lint:fix

# Formatação
npm run format

# Testes
npm test
npm run test:watch
npm run test:coverage

# Build
npm run build
npm run build:dev

# Electron (desktop)
npm run electron:dev
```

## 📁 Estrutura do Código

### Organização de Arquivos

```
SMX-LiveBoard/
├── 📁 backend/                    # Servidor Node.js
│   ├── 📁 services/              # Serviços principais
│   │   ├── 📄 monitorService.js  # Monitoramento do sistema
│   │   ├── 📄 sshService.js      # Conexões SSH
│   │   ├── 📄 telegramService.js # Notificações Telegram
│   │   ├── 📄 terminalService.js # Terminal integrado
│   │   ├── 📄 logsService.js     # Sistema de logs
│   │   └── 📄 processMonitoringService.js
│   ├── 📁 utils/                 # Utilitários
│   │   ├── 📄 logger.js          # Sistema de logging
│   │   └── 📄 httpLogger.js      # Logs HTTP
│   ├── 📁 logs/                  # Arquivos de log
│   ├── 📄 index.js               # Servidor principal
│   └── 📄 config.json            # Configurações
├── 📁 js/                        # Frontend JavaScript
│   ├── 📄 app.js                 # Aplicação principal
│   ├── 📄 logs.js                # Gerenciamento de logs
│   ├── 📄 ssh.js                 # Interface SSH
│   └── 📄 pwa-install.js         # Instalação PWA
├── 📁 styles/                    # Estilos CSS
│   ├── 📄 main.css               # Estilos principais
│   └── 📄 pwa-modal.css          # Modal PWA
├── 📁 assets/                    # Recursos estáticos
├── 📁 docs/                      # Documentação
├── 📁 tests/                     # Testes (futuro)
├── 📄 index.html                 # Página principal
├── 📄 manifest.json              # Manifest PWA
├── 📄 sw.js                      # Service Worker
└── 📄 package.json               # Dependências
```

### Convenções de Nomenclatura

#### Arquivos e Diretórios
- **Arquivos**: `camelCase.js` (ex: `monitorService.js`)
- **Diretórios**: `camelCase` (ex: `services/`)
- **Constantes**: `UPPER_SNAKE_CASE` (ex: `MAX_RETRIES`)
- **Classes**: `PascalCase` (ex: `MonitorService`)

#### Variáveis e Funções
- **Variáveis**: `camelCase` (ex: `systemMetrics`)
- **Funções**: `camelCase` (ex: `getSystemInfo()`)
- **Métodos privados**: `_camelCase` (ex: `_validateConfig()`)
- **Eventos**: `kebab-case` (ex: `system:metrics`)

## 📝 Padrões de Codificação

### JavaScript (ES6+)

#### Estrutura de Classe
```javascript
class MonitorService {
    constructor() {
        this.data = {};
        this.isCollecting = false;
        this._initializeCache();
    }

    // Métodos públicos
    async getSystemInfo() {
        try {
            const data = await this._collectData();
            return this._formatData(data);
        } catch (error) {
            this._handleError(error);
            throw error;
        }
    }

    // Métodos privados
    _initializeCache() {
        this.cache = {
            basicInfo: null,
            lastUpdate: 0,
            ttl: 30000
        };
    }

    _handleError(error) {
        logger.error('MonitorService error:', error);
    }
}
```

#### Async/Await
```javascript
// ✅ Correto
async function fetchData() {
    try {
        const response = await api.get('/data');
        return response.data;
    } catch (error) {
        logger.error('Failed to fetch data:', error);
        throw error;
    }
}

// ❌ Evitar
function fetchData() {
    return api.get('/data')
        .then(response => response.data)
        .catch(error => {
            logger.error('Failed to fetch data:', error);
            throw error;
        });
}
```

#### Error Handling
```javascript
// ✅ Correto
async function processData(data) {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid data provided');
    }

    try {
        const result = await validateData(data);
        return result;
    } catch (error) {
        logger.error('Data processing failed:', {
            error: error.message,
            data: data,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}
```

#### Logging
```javascript
// ✅ Correto
logger.info('System metrics collected', {
    cpu: metrics.cpu.usage,
    memory: metrics.memory.usage,
    timestamp: new Date().toISOString()
});

// ❌ Evitar
console.log('Metrics:', metrics);
```

### CSS

#### Organização
```css
/* ✅ Correto - Organizado por seção */
/* ===== VARIABLES ===== */
:root {
    --primary-color: #00d4ff;
    --secondary-color: #1a1a2e;
    --text-color: #ffffff;
}

/* ===== LAYOUT ===== */
.dashboard {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

/* ===== COMPONENTS ===== */
.metric-card {
    background: var(--secondary-color);
    border-radius: 8px;
    padding: 1rem;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
    .dashboard {
        grid-template-columns: 1fr;
    }
}
```

#### Nomenclatura
```css
/* ✅ Correto - BEM methodology */
.metric-card {}
.metric-card__title {}
.metric-card__value {}
.metric-card--highlighted {}

/* ❌ Evitar */
.metricCard {}
.metric-card-title {}
.metricCard.highlighted {}
```

### HTML

#### Estrutura Semântica
```html
<!-- ✅ Correto -->
<main class="dashboard">
    <section class="metrics-section">
        <h2 class="metrics-section__title">System Metrics</h2>
        <div class="metrics-grid">
            <article class="metric-card">
                <h3 class="metric-card__title">CPU Usage</h3>
                <div class="metric-card__value" id="cpu-usage">0%</div>
            </article>
        </div>
    </section>
</main>

<!-- ❌ Evitar -->
<div class="dashboard">
    <div class="metrics">
        <div class="title">System Metrics</div>
        <div class="grid">
            <div class="card">
                <div class="title">CPU Usage</div>
                <div class="value">0%</div>
            </div>
        </div>
    </div>
</div>
```

## 🔄 Processo de Desenvolvimento

### Workflow Git

#### Branching Strategy
```bash
# Branch principal
main                    # Produção
develop                 # Desenvolvimento

# Branches de feature
feature/nova-funcionalidade
feature/correcao-bug
feature/melhoria-performance

# Branches de release
release/v1.2.0

# Branches de hotfix
hotfix/correcao-critica
```

#### Commits
```bash
# Formato: tipo(escopo): descrição
git commit -m "feat(monitor): adiciona coleta de temperatura CPU"
git commit -m "fix(ssh): corrige timeout de conexão"
git commit -m "docs(api): atualiza documentação de endpoints"
git commit -m "style(css): melhora responsividade do dashboard"
git commit -m "refactor(services): reorganiza estrutura de cache"
git commit -m "test(monitor): adiciona testes para coleta de métricas"
```

#### Tipos de Commit
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação, sem mudança de código
- `refactor`: Refatoração de código
- `test`: Adição ou correção de testes
- `chore`: Tarefas de manutenção

### Desenvolvimento de Features

#### 1. Criação de Branch
```bash
# Criar e mudar para nova branch
git checkout -b feature/nova-funcionalidade

# Ou baseada em develop
git checkout develop
git pull origin develop
git checkout -b feature/nova-funcionalidade
```

#### 2. Desenvolvimento
```bash
# Fazer mudanças
# Testar localmente
npm run dev
npm test

# Commits frequentes
git add .
git commit -m "feat(service): implementa coleta básica"
git commit -m "feat(service): adiciona validação de dados"
git commit -m "test(service): adiciona testes unitários"
```

#### 3. Pull Request
```bash
# Push da branch
git push origin feature/nova-funcionalidade

# Criar PR no GitHub
# - Título descritivo
# - Descrição detalhada
# - Screenshots se aplicável
# - Checklist de testes
```

#### 4. Code Review
- Revisar código
- Testar funcionalidade
- Verificar documentação
- Aprovar ou solicitar mudanças

#### 5. Merge
```bash
# Após aprovação
git checkout develop
git pull origin develop
git merge feature/nova-funcionalidade
git push origin develop

# Deletar branch
git branch -d feature/nova-funcionalidade
git push origin --delete feature/nova-funcionalidade
```

## 🧪 Testes

### Estrutura de Testes

```
tests/
├── 📁 unit/                    # Testes unitários
│   ├── 📁 services/
│   │   ├── 📄 monitorService.test.js
│   │   ├── 📄 sshService.test.js
│   │   └── 📄 telegramService.test.js
│   └── 📁 utils/
│       ├── 📄 logger.test.js
│       └── 📄 httpLogger.test.js
├── 📁 integration/             # Testes de integração
│   ├── 📄 api.test.js
│   ├── 📄 websocket.test.js
│   └── 📄 ssh.test.js
├── 📁 e2e/                     # Testes end-to-end
│   ├── 📄 dashboard.test.js
│   ├── 📄 terminal.test.js
│   └── 📄 ssh.test.js
└── 📁 fixtures/                # Dados de teste
    ├── 📄 systemData.json
    └── 📄 mockResponses.json
```

### Testes Unitários

```javascript
// tests/unit/services/monitorService.test.js
const MonitorService = require('../../backend/services/monitorService');
const logger = require('../../backend/utils/logger');

describe('MonitorService', () => {
    let monitorService;

    beforeEach(() => {
        monitorService = new MonitorService();
        // Mock logger
        jest.spyOn(logger, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getSystemInfo', () => {
        it('should return system information', async () => {
            const result = await monitorService.getSystemInfo();
            
            expect(result).toHaveProperty('cpu');
            expect(result).toHaveProperty('memory');
            expect(result).toHaveProperty('disk');
            expect(result).toHaveProperty('timestamp');
        });

        it('should handle errors gracefully', async () => {
            // Mock systeminformation to throw error
            jest.spyOn(require('systeminformation'), 'cpu')
                .mockRejectedValue(new Error('CPU info failed'));

            await expect(monitorService.getSystemInfo())
                .rejects.toThrow('CPU info failed');
        });
    });

    describe('cache', () => {
        it('should use cached data when available', async () => {
            const firstCall = await monitorService.getSystemInfo();
            const secondCall = await monitorService.getSystemInfo();
            
            expect(firstCall.timestamp).toBe(secondCall.timestamp);
        });
    });
});
```

### Testes de Integração

```javascript
// tests/integration/api.test.js
const request = require('supertest');
const app = require('../../backend/index');

describe('API Integration Tests', () => {
    describe('GET /api/health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'OK');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('memory');
        });
    });

    describe('GET /api/system/metrics', () => {
        it('should return system metrics', async () => {
            const response = await request(app)
                .get('/api/system/metrics')
                .expect(200);

            expect(response.body).toHaveProperty('cpu');
            expect(response.body).toHaveProperty('memory');
            expect(response.body).toHaveProperty('disk');
        });
    });
});
```

### Execução de Testes

```bash
# Todos os testes
npm test

# Testes específicos
npm test -- --grep "MonitorService"

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch

# Testes de integração
npm run test:integration

# Testes e2e
npm run test:e2e
```

## 🐛 Debugging

### Configuração de Debug

#### VS Code Launch Configuration
```json
// .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug SMX LiveBoard",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/backend/index.js",
            "env": {
                "NODE_ENV": "development",
                "DEBUG_MODE": "true",
                "VERBOSE_LOGGING": "true"
            },
            "console": "integratedTerminal",
            "restart": true,
            "runtimeArgs": ["--inspect"]
        },
        {
            "name": "Debug Tests",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/node_modules/.bin/jest",
            "args": ["--runInBand", "--no-cache"],
            "console": "integratedTerminal",
            "internalConsoleOptions": "neverOpen"
        }
    ]
}
```

#### Debug com Node.js
```bash
# Debug com inspector
node --inspect backend/index.js

# Debug com breakpoint
node --inspect-brk backend/index.js

# Debug com Chrome DevTools
# Acesse: chrome://inspect
```

### Logging de Debug

```javascript
// Habilitar debug específico
const debug = require('debug')('smx:monitor');

// Usar debug
debug('Collecting system metrics...');
debug('Metrics collected:', metrics);

// Executar com debug
DEBUG=smx:* npm run dev
```

### Ferramentas de Debug

#### Console Debugging
```javascript
// Logs estruturados
console.log('Debug info:', {
    timestamp: new Date().toISOString(),
    data: metrics,
    context: 'MonitorService'
});

// Performance timing
console.time('metrics-collection');
const metrics = await collectMetrics();
console.timeEnd('metrics-collection');
```

#### Network Debugging
```javascript
// Interceptar requisições
const originalFetch = window.fetch;
window.fetch = function(...args) {
    console.log('Fetch request:', args);
    return originalFetch.apply(this, args)
        .then(response => {
            console.log('Fetch response:', response);
            return response;
        });
};
```

## 🤝 Contribuição

### Como Contribuir

#### 1. Fork e Clone
```bash
# Fork no GitHub
# Clone seu fork
git clone https://github.com/SEU_USUARIO/SMX-LiveBoard.git
cd SMX-LiveBoard

# Adicionar upstream
git remote add upstream https://github.com/mathsilva7717/SMX-LiveBoard.git
```

#### 2. Desenvolvimento
```bash
# Sincronizar com upstream
git fetch upstream
git checkout main
git merge upstream/main

# Criar branch para feature
git checkout -b feature/sua-feature

# Desenvolver e testar
npm run dev
npm test

# Commits
git add .
git commit -m "feat: sua feature"
```

#### 3. Pull Request
- Título descritivo
- Descrição detalhada
- Screenshots se aplicável
- Checklist de testes
- Referência a issues

### Guidelines de Contribuição

#### Código
- Seguir padrões estabelecidos
- Adicionar testes para novas funcionalidades
- Documentar mudanças na API
- Manter compatibilidade com versões anteriores

#### Documentação
- Atualizar README se necessário
- Documentar novas APIs
- Adicionar exemplos de uso
- Traduzir para português

#### Issues
- Usar templates fornecidos
- Fornecer informações detalhadas
- Incluir logs e screenshots
- Verificar issues duplicadas

### Code Review

#### Checklist do Revisor
- [ ] Código segue padrões estabelecidos
- [ ] Testes passam
- [ ] Documentação atualizada
- [ ] Performance não degradada
- [ ] Segurança mantida
- [ ] Compatibilidade preservada

#### Checklist do Autor
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Código formatado
- [ ] Linting passou
- [ ] Funcionalidade testada
- [ ] PR descrição completa

## 🚀 Release Process

### Versionamento

#### Semantic Versioning
```
MAJOR.MINOR.PATCH
1.2.3

MAJOR: Mudanças incompatíveis
MINOR: Novas funcionalidades compatíveis
PATCH: Correções de bugs
```

#### Changelog
```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- Nova funcionalidade de monitoramento de temperatura
- Suporte a múltiplas conexões SSH
- Sistema de alertas por email

### Changed
- Melhorada performance de coleta de métricas
- Atualizada interface do dashboard

### Fixed
- Corrigido bug de timeout em conexões SSH
- Resolvido problema de memória em longas execuções

### Removed
- Removido suporte ao Node.js 16
```

### Processo de Release

#### 1. Preparação
```bash
# Atualizar versão
npm version patch  # ou minor, major

# Atualizar changelog
# Testes finais
npm test
npm run build
```

#### 2. Release
```bash
# Tag da versão
git tag v1.2.0
git push origin v1.2.0

# Publicar no npm (se aplicável)
npm publish
```

#### 3. Documentação
- Atualizar README
- Criar release notes
- Comunicar mudanças
- Atualizar documentação

---

Este guia cobre todos os aspectos do desenvolvimento no SMX LiveBoard. Para mais informações sobre deploy, consulte a [documentação de deployment](./deployment.md).
