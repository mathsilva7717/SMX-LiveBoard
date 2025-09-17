# 🔒 Telegram Tokens Hardcoded - SMX LiveBoard

Este documento explica as modificações feitas para deixar os tokens do Telegram **hardcoded** (fixos) no backend, removendo a possibilidade de configuração via interface web.

## 📋 Modificações Realizadas

### 1. **Backend (`backend/index.js`)**

#### ✅ **Removido:**
- Rota `POST /api/telegram/configure` - Não permite mais configuração via API
- Funcionalidade de configuração dinâmica de tokens

#### ✅ **Modificado:**
- Rota `GET /api/telegram/status` - Agora indica que tokens são hardcoded
- Mensagem de status: `"Bot configurado (tokens hardcoded)"`

#### ✅ **Mantido:**
- Rota `POST /api/telegram/send` - Envio de mensagens
- Rota `POST /api/telegram/alert` - Envio de alertas
- Rota `GET /api/telegram/test` - Teste de conexão
- Inicialização automática com tokens fixos

### 2. **Frontend (`js/app.js`)**

#### ✅ **Removido:**
- Função `showTelegramConfigModal()` - Modal de configuração
- Função `saveTelegramConfig()` - Salvamento de configuração
- Interface de configuração de tokens

#### ✅ **Modificado:**
- `handleTelegramAlert()` - Agora mostra erro se não configurado
- Mensagem: `"❌ Telegram não configurado (tokens hardcoded)"`

## 🔧 Configuração Atual

### Tokens Hardcoded
Os tokens estão fixos no arquivo `backend/index.js` na função `initializeTelegramService()`:

```javascript
// 🔒 TOKENS HARDCODED - CONFIGURE AQUI
const botToken = 'SEU_TOKEN_AQUI';
const chatId = 'SEU_CHAT_ID_AQUI';
```

### Como Alterar os Tokens

Para alterar os tokens, edite diretamente o arquivo `backend/index.js`:

1. **Abra o arquivo:** `backend/index.js`
2. **Localize a função:** `initializeTelegramService()`
3. **Altere as variáveis:**
   ```javascript
   const botToken = 'SEU_NOVO_TOKEN_AQUI';
   const chatId = 'SEU_NOVO_CHAT_ID_AQUI';
   ```
4. **Reinicie o servidor:** `npm start`

## 🚀 Funcionalidades Mantidas

### ✅ **APIs Funcionais:**
- `GET /api/telegram/status` - Verificar status
- `POST /api/telegram/send` - Enviar mensagem
- `POST /api/telegram/alert` - Enviar alerta
- `GET /api/telegram/test` - Testar conexão

### ✅ **Recursos Mantidos:**
- Envio de mensagens via interface web
- Alertas automáticos do sistema
- Relatórios diários automáticos
- Notificações de status do sistema

## 🔒 Segurança

### ✅ **Benefícios:**
- **Tokens não expostos** no frontend
- **Não há APIs de configuração** - tokens não podem ser alterados via requisições
- **Configuração única** - feita apenas na inicialização do servidor
- **Controle total** sobre os tokens no código

### ⚠️ **Considerações:**
- Tokens ficam visíveis no código fonte
- Para alterar tokens, é necessário reiniciar o servidor
- Recomendado para ambientes controlados

## 📱 Como Usar

### 1. **Verificar Status**
```bash
curl http://localhost:3000/api/telegram/status
```

**Resposta:**
```json
{
  "configured": true,
  "message": "Bot configurado (tokens hardcoded)"
}
```

### 2. **Enviar Mensagem**
```bash
curl -X POST http://localhost:3000/api/telegram/send \
  -H "Content-Type: application/json" \
  -d '{"message": "Teste de mensagem"}'
```

### 3. **Enviar Alerta**
```bash
curl -X POST http://localhost:3000/api/telegram/alert \
  -H "Content-Type: application/json" \
  -d '{
    "alertType": "SYSTEM_STATUS",
    "data": {"cpu": 85, "memory": 78},
    "severity": "WARNING"
  }'
```

### 4. **Testar Conexão**
```bash
curl http://localhost:3000/api/telegram/test
```

## 🔄 Reversão (Se Necessário)

Para voltar ao sistema de configuração dinâmica:

1. **Restaurar rota de configuração** no `backend/index.js`
2. **Restaurar funções** no `js/app.js`
3. **Reiniciar servidor**

## 📞 Suporte

Se precisar de ajuda com a configuração:

- **Email**: [matheus.silva1097@gmail.com](mailto:matheus.silva1097@gmail.com)
- **GitHub**: [@mathsilva7717](https://github.com/mathsilva7717)

---

**Modificação realizada em:** `$(date)`  
**Status:** ✅ Concluído  
**Tokens:** 🔒 Hardcoded no backend
