# 🔐 Configuração Pluggy - Checklist Rápido

## 📝 Suas Credenciais Pluggy
```
Client ID: f8c9b8f0-b8e2-4f0
Client Secret: UZzp2n7eMThpfZ7
```

---

## ✅ PASSO A PASSO SIMPLIFICADO

### 1️⃣ Gerar Master Key
- [ ] Acesse: https://generate-secret.vercel.app/32
- [ ] Copie a chave gerada
- [ ] Anote em local seguro

### 2️⃣ Gerar Webhook Secret
- [ ] Acesse: https://generate-secret.vercel.app/32
- [ ] Copie a chave gerada
- [ ] Anote em local seguro

### 3️⃣ Configurar Supabase Variables
- [ ] Vá em: https://supabase.com/dashboard
- [ ] Abra seu projeto
- [ ] Settings > Edge Functions
- [ ] Clique "Add new secret"
- [ ] Adicione:
  ```
  PLUGGY_CLIENT_ID = f8c9b8f0-b8e2-4f0
  PLUGGY_CLIENT_SECRET = UZzp2n7eMThpfZ7
  PLUGGY_WEBHOOK_SECRET = [sua chave gerada no passo 2]
  MASTER_ENCRYPTION_KEY = [sua chave gerada no passo 1]
  ```

### 4️⃣ Aplicar Migration
- [ ] Dashboard Supabase > SQL Editor
- [ ] New query
- [ ] Copie conteúdo de: `supabase/migrations/20260128210000_pluggy_ultra_security.sql`
- [ ] Execute (Run)

### 5️⃣ Deploy Edge Functions
**Opção A - Via CLI (Recomendado)**:
```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase functions deploy pluggy-secure-proxy
npx supabase functions deploy pluggy-webhook-secure
```

**Opção B - Via Dashboard**:
- [ ] Dashboard > Edge Functions > Deploy new function
- [ ] Nome: `pluggy-secure-proxy`
- [ ] Copie código de: `supabase/functions/pluggy-secure-proxy/index.ts`
- [ ] Deploy
- [ ] Repita para `pluggy-webhook-secure`

### 6️⃣ Configurar Webhook no Pluggy
- [ ] https://dashboard.pluggy.ai/
- [ ] Menu > Webhooks
- [ ] Add webhook
- [ ] URL: `https://SEU_PROJETO.supabase.co/functions/v1/pluggy-webhook-secure`
- [ ] Secret: [mesma do passo 2]
- [ ] Marque todos os eventos
- [ ] Save

### 7️⃣ Instalar Dependências
```bash
npm install crypto-js
npm install --save-dev @types/crypto-js
```

### 8️⃣ Testar
```bash
npm run dev
```
- [ ] Acesse app
- [ ] Vá em Open Finance
- [ ] Conecte um banco
- [ ] Verifique no Supabase se dados estão criptografados

---

## 🔍 Como Verificar

### Dados Criptografados?
Dashboard > Table Editor > `connected_accounts`
- `encrypted_access_token` deve conter: `{"version":1,"data":"..."}`
- ✅ Criptografado
- ❌ Se estiver em texto plano, algo deu errado

### Edge Functions Funcionando?
Dashboard > Edge Functions
- `pluggy-secure-proxy` - Status: Active ✅
- `pluggy-webhook-secure` - Status: Active ✅

### Webhook Funcionando?
Pluggy Dashboard > Webhooks
- Status: Active ✅
- Test event: Success (200 OK) ✅

---

## 📚 Documentação Completa
[Guia Detalhado](file:///C:/Users/GC%20Info%20Gamer/.gemini/antigravity/brain/165a1cdb-a33b-4e4c-9313-d33eb2270a48/pluggy_manual_setup_guide.md)

**Pronto!** 🎉
