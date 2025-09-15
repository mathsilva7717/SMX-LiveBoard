# 🤝 Guia de Contribuição

Obrigado por considerar contribuir com o SMX LiveBoard! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Código](#padrões-de-código)
- [Reportando Bugs](#reportando-bugs)
- [Sugerindo Features](#sugerindo-features)
- [Pull Requests](#pull-requests)

## 📜 Código de Conduta

Este projeto segue o [Código de Conduta do Contributor Covenant](https://www.contributor-covenant.org/). Ao participar, você concorda em manter este código.

## 🚀 Como Contribuir

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/SEU_USUARIO/liveboard.git
cd liveboard
```

### 2. Configurar o Ambiente

```bash
# Instalar dependências
npm run install:all

# Executar em desenvolvimento
npm run dev
```

### 3. Criar uma Branch

```bash
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/nome-do-bug
```

### 4. Fazer Mudanças

- Faça suas alterações
- Teste localmente
- Siga os padrões de código

### 5. Commit e Push

```bash
git add .
git commit -m "feat: adiciona nova funcionalidade X"
git push origin feature/nome-da-feature
```

### 6. Pull Request

- Abra um Pull Request no GitHub
- Descreva suas mudanças
- Aguarde revisão

## 🛠️ Configuração do Ambiente

### Pré-requisitos

- Node.js 16+
- npm ou yarn
- Git

### Instalação

```bash
# Clone o repositório
git clone https://github.com/smx/liveboard.git
cd liveboard

# Instale dependências
npm run install:all

# Execute em desenvolvimento
npm run dev
```

### Estrutura do Projeto

```
SMX-LiveBoard/
├── frontend/          # React App
├── backend/           # Node.js Server
├── electron/          # Electron Main Process
├── assets/            # Recursos do build
└── docs/              # Documentação
```

## 📝 Padrões de Código

### JavaScript/TypeScript

- Use ESLint e Prettier
- Siga as convenções do projeto
- Comente código complexo
- Use nomes descritivos

### React

- Use functional components
- Hooks preferidos sobre classes
- Props tipadas quando possível
- Componentes pequenos e focados

### CSS

- Use classes descritivas
- Evite IDs quando possível
- Mobile-first approach
- Use variáveis CSS

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
style: formatação de código
refactor: refatoração
test: adiciona testes
chore: tarefas de manutenção
```

## 🐛 Reportando Bugs

### Antes de Reportar

1. Verifique se já existe uma issue
2. Teste na versão mais recente
3. Verifique a documentação

### Template de Bug Report

```markdown
**Descrição**
Descrição clara do bug.

**Passos para Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Veja o erro

**Comportamento Esperado**
O que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Informações do Sistema**
- OS: [ex: Windows 10]
- Versão: [ex: 1.0.0]
- Node.js: [ex: 16.14.0]

**Logs**
Adicione logs relevantes.
```

## 💡 Sugerindo Features

### Antes de Sugerir

1. Verifique se já existe uma issue
2. Considere se é realmente necessário
3. Pense em casos de uso

### Template de Feature Request

```markdown
**Feature**
Descrição clara da feature.

**Problema**
Qual problema isso resolve?

**Solução Proposta**
Como você imagina que deveria funcionar?

**Alternativas**
Outras soluções consideradas.

**Contexto Adicional**
Qualquer contexto adicional.
```

## 🔄 Pull Requests

### Checklist

- [ ] Código segue padrões do projeto
- [ ] Testes passam
- [ ] Documentação atualizada
- [ ] Commits seguem convenção
- [ ] PR tem descrição clara

### Processo de Revisão

1. **Revisão Automática**: CI/CD verifica código
2. **Revisão Manual**: Mantenedores revisam
3. **Feedback**: Discussão e melhorias
4. **Merge**: Aprovação e merge

### Tamanho do PR

- **Pequeno**: < 200 linhas
- **Médio**: 200-500 linhas
- **Grande**: > 500 linhas (discutir antes)

## 🏷️ Labels

- `bug`: Algo não está funcionando
- `enhancement`: Nova feature ou melhoria
- `documentation`: Melhorias na documentação
- `good first issue`: Bom para iniciantes
- `help wanted`: Precisa de ajuda
- `question`: Mais informações necessárias

## 📞 Suporte

- **GitHub Issues**: Para bugs e features
- **Discussions**: Para perguntas gerais
- **Email**: smx@example.com

## 🙏 Agradecimentos

Obrigado por contribuir! Cada contribuição, por menor que seja, faz a diferença.

---

**Lembre-se**: Este é um projeto open source mantido por voluntários. Seja paciente e respeitoso com todos os contribuidores.
