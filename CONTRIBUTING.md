# 🚀 SMX LiveBoard - Guia de Contribuição

## 📋 Visão Geral

O SMX LiveBoard é um dashboard de monitoramento de sistema em tempo real. Este documento apresenta como contribuir e as oportunidades de desenvolvimento disponíveis.

## 🛠️ Setup do Ambiente

### Pré-requisitos
- Node.js 18+
- Git
- Conhecimento em JavaScript

### Como Rodar Localmente

1. **Clone o repositório:**
```bash
git clone https://github.com/mathsilva7717/SMX-LiveBoard.git
cd SMX-LiveBoard
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
# Copie o template de configuração
cp env.example .env

# Edite o arquivo .env com suas configurações
# IMPORTANTE: Configure pelo menos TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID
```

4. **Inicie o servidor:**
```bash
npm start
```

5. **Acesse no navegador:**
```
http://localhost:3000
```

### Estrutura do Projeto
```
SMX-LiveBoard/
├── backend/           # Servidor Node.js
│   ├── services/      # Serviços (SSH, Monitor, etc.)
│   ├── utils/         # Utilitários e logs
│   └── index.js       # Servidor principal
├── js/               # Frontend JavaScript
│   ├── app.js        # Aplicação principal
│   ├── logs.js       # Gerenciamento de logs
│   └── ssh.js        # Interface SSH
├── styles/           # CSS
├── assets/           # Ícones e imagens
└── index.html        # Página principal
```

## 🎯 Oportunidades de Desenvolvimento

*Seguindo a ordem do [Roadmap](ROADMAP.md)*

### 1. 🚀 **Fase 1: Multi-Host**

**Descrição:** Monitorar múltiplos servidores simultaneamente.

**Benefícios:**
- Visão centralizada
- Comparação entre hosts
- Alertas consolidados

**Tecnologias:** Node.js, WebSocket, SQLite

**Tarefas:**
- [ ] Interface para adicionar hosts
- [ ] Sistema de conexões múltiplas
- [ ] Dashboard com múltiplos hosts
- [ ] Comparação de métricas
- [ ] Sistema de autenticação básico
- [ ] Configuração via arquivo JSON/YAML
- [ ] Testes de conectividade
- [ ] Gerenciamento de conexões ativas

**Complexidade:** ⭐⭐⭐ (Média)

---

### 2. 🎨 **Fase 1.5: Melhorias Core**

**Descrição:** Melhorias na interface e funcionalidades básicas.

**Benefícios:**
- Interface mais moderna
- Melhor experiência do usuário
- Funcionalidades essenciais
- **Sistema de segurança implementado**

**Tecnologias:** HTML5, CSS3, JavaScript ES6+

**Tarefas:**
- [ ] Interface mais responsiva
- [ ] Temas (dark/light mode)
- [ ] Configurações avançadas
- [ ] Logs mais detalhados
- [ ] Filtros e busca nos logs
- [ ] Exportação de dados
- [ ] Configurações de notificação
- [x] **Sistema de variáveis de ambiente** (✅ Concluído)
- [x] **Configuração segura de tokens** (✅ Concluído)
- [x] **Arquivo .gitignore completo** (✅ Concluído)
- [x] **Template de configuração (.env.example)** (✅ Concluído)

**Complexidade:** ⭐⭐ (Baixa)

---

### 3. 🖥️ **Fase 2: App Desktop**

**Descrição:** Aplicativo desktop nativo com Electron.

**Benefícios:**
- Notificações do sistema
- Acesso offline
- Auto-atualização
- Tray icon

**Tecnologias:** Electron.js, Node.js

**Tarefas:**
- [ ] App Electron
- [ ] Notificações nativas
- [ ] Instaladores (Windows/Mac/Linux)
- [ ] Tray icon com status
- [ ] Atalhos de teclado
- [ ] Auto-start com sistema
- [ ] Modo sempre visível
- [ ] Configurações do app

**Complexidade:** ⭐⭐⭐ (Média)

---

### 4. 📱 **Fase 3: App Mobile**

**Descrição:** App Android/iOS para monitoramento móvel.

**Benefícios:**
- Monitoramento remoto
- Notificações push
- Widgets
- Interface nativa

**Tecnologias:** React Native, Node.js

**Tarefas:**
- [ ] App React Native
- [ ] Interface responsiva
- [ ] Notificações push
- [ ] Widgets do sistema
- [ ] Modo offline
- [ ] Sincronização de dados

**Complexidade:** ⭐⭐⭐⭐ (Alta)

---

### 5. 🌐 **Fase 4: Extensões**

**Descrição:** Extensões para Chrome, Firefox e Edge.

**Benefícios:**
- Acesso rápido
- Notificações do navegador
- Widget na nova aba

**Tecnologias:** JavaScript, WebExtensions API

**Tarefas:**
- [ ] Extensão Chrome
- [ ] Extensão Firefox
- [ ] Extensão Edge
- [ ] Widget para nova aba
- [ ] Badge com status
- [ ] Notificações do navegador
- [ ] Popup rápido
- [ ] Integração com outros dashboards

**Complexidade:** ⭐⭐ (Baixa)

---

### 6. 🔌 **Fase 5: API Pública**

**Descrição:** API REST para integrações com outros sistemas.

**Benefícios:**
- Integração com outros sistemas
- Automação
- Webhooks
- SDK disponível

**Tecnologias:** Node.js, Express.js, JWT

**Tarefas:**
- [ ] API REST completa
- [ ] Documentação da API
- [ ] Autenticação via token
- [ ] Rate limiting
- [ ] Webhooks
- [ ] SDK para JavaScript
- [ ] Integração com Zapier
- [ ] Métricas de uso da API

**Complexidade:** ⭐⭐⭐ (Média)

---

## 🛠️ Como Contribuir

### Processo de Contribuição

1. **Fork do repositório**
2. **Clone seu fork:**
```bash
git clone https://github.com/SEU_USUARIO/SMX-LiveBoard.git
```
3. **Crie uma branch:**
```bash
git checkout -b feature/nome-da-feature
```
4. **Desenvolva sua feature**
5. **Teste suas alterações**
6. **Commit seguindo o padrão:**
```bash
git commit -m "feat: adiciona nova funcionalidade"
git commit -m "fix: corrige bug na interface"
git commit -m "docs: atualiza documentação"
```
7. **Push para sua branch:**
```bash
git push origin feature/nome-da-feature
```
8. **Abra um Pull Request**

### Padrões de Código

- **JavaScript:** Use ES6+ e async/await
- **CSS:** Use classes semânticas e variáveis CSS
- **Commits:** Use conventional commits (feat, fix, docs, style, refactor, test)
- **Nomes de arquivos:** Use kebab-case (ex: `user-service.js`)
- **Funções:** Use camelCase (ex: `getUserData()`)

### Como Testar

1. **Teste manual:**
   - Execute `npm start`
   - Teste todas as funcionalidades
   - Verifique em diferentes navegadores

2. **Teste de conectividade:**
   - Teste conexão SSH
   - Verifique logs em tempo real
   - Teste com diferentes sistemas

3. **Teste de interface:**
   - Verifique responsividade
   - Teste temas (se aplicável)
   - Verifique acessibilidade

## 📞 Contato

**Desenvolvedor Principal:**
- **Nome:** Matheus Silva
- **Email:** matheus.silva1097@gmail.com
- **Telefone:** +55 13 99709-6178
- **GitHub:** [@mathsilva7717](https://github.com/mathsilva7717)
- **LinkedIn:** [Matheus Silva](https://www.linkedin.com/in/mathsilvass)

**Para Contribuições:**
- **GitHub Issues:** Para bugs e sugestões
- **Discussions:** Para ideias e discussões
- **Pull Requests:** Para contribuições de código

### Primeiros Passos

Procurando por onde começar? Procure por issues marcadas com:
- `good first issue` - Ideal para iniciantes
- `help wanted` - Precisa de ajuda
- `documentation` - Melhorias na documentação

---

**Contribua e ajude a expandir o SMX LiveBoard! 🚀**
