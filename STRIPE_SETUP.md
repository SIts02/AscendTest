# 📝 Documentação de Configuração - Stripe & Subscriptions

## Variáveis de Ambiente Necessárias

### Frontend (.env.development.local e .env.production.local)

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Feature Flags
VITE_ENABLE_FORECASTING=true
VITE_ENABLE_OPEN_FINANCE=true
VITE_ENABLE_SUBSCRIPTIONS=true
VITE_ENABLE_AI_INSIGHTS=false
VITE_ENABLE_ADVANCED_ANALYTICS=true
```

### Backend - Supabase Dashboard (Project Settings → Edge Functions)

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # ou sk_live_... para produção
STRIPE_WEBHOOK_SECRET=whsec_... # Obtido após configurar webhook

# Pluggy Configuration (Open Finance)
PLUGGY_CLIENT_ID=your_pluggy_client_id
PLUGGY_CLIENT_SECRET=your_pluggy_client_secret
```

---

## Configuração do Stripe

### 1. Criar Conta no Stripe
1. Acesse [stripe.com](https://stripe.com)
2. Crie uma conta (use modo teste primeiro)
3. Acesse o Dashboard

### 2. Criar Produtos e Preços

No Dashboard Stripe → Products:

#### Produto: Ascend Pro
- **Nome**: Ascend Pro
- **Descrição**: Para quem quer controle total
- **Preços**:
  - **Mensal**: R$ 19,90
    - Copie o `priceId` (começará com `price_...`)
  - **Anual**: R$ 199,00
    - Copie o `priceId`

#### Produto: Ascend Premium
- **Nome**: Ascend Premium
- **Descrição**: Para profissionais e empresários
- **Preços**:
  - **Mensal**: R$ 49,90
    - Copie o `priceId`
  - **Anual**: R$ 499,00
    - Copie o `priceId`

### 3. Atualizar Migration com Price IDs

Edite o arquivo `supabase/migrations/20260128160000_subscriptions_billing.sql`:

```sql
-- Atualizar planos com os Price IDs do Stripe
UPDATE subscription_plans 
SET 
    stripe_price_id_monthly = 'price_XXXXXXXX', -- Price ID mensal Pro
    stripe_price_id_yearly = 'price_YYYYYYYY',  -- Price ID anual Pro
    stripe_product_id = 'prod_ZZZZZZZZ'         -- Product ID Pro
WHERE name = 'pro';

UPDATE subscription_plans 
SET 
    stripe_price_id_monthly = 'price_AAAAAAAA', -- Price ID mensal Premium
    stripe_price_id_yearly = 'price_BBBBBBBB',  -- Price ID anual Premium
    stripe_product_id = 'prod_CCCCCCCC'         -- Product ID Premium
WHERE name = 'premium';
```

### 4. Configurar Webhook

1. No Dashboard Stripe → Developers → Webhooks
2. Clique em "Add endpoint"
3. **URL do Endpoint**: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
4. **Eventos a ouvir**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copie o **Signing secret** (começará com `whsec_...`)
6. Cole em `STRIPE_WEBHOOK_SECRET` nas variáveis do Supabase

### 5. Obter API Keys

1. Dashboard Stripe → Developers → API keys
2. **Secret key**: Copie para `STRIPE_SECRET_KEY`
3. Para produção: Ative modo Live e obtenha chaves de produção

---

## Deploy das Edge Functions

```bash
# Login no Supabase
npx supabase login

# Link ao projeto
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy das funções
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook
npx supabase functions deploy create-customer-portal
```

---

## Aplicar Migrations

### Localmente
```bash
npx supabase migration up --local
```

### Produção
```bash
npx supabase db push
```

---

## Testes

### Testar Checkout
1. Acesse `/dashboard/billing` ou onde exibe PricingPlans
2. Clique em "Fazer Upgrade"
3. Use cartão de teste Stripe: `4242 4242 4242 4242`
4. Data válida futura, qualquer CVC

### Testar Webhook
1. Stripe Dashboard → Developers → Webhooks
2. Clique no webhook criado
3. Aba "Testing"
4. Envie evento de teste `checkout.session.completed`

### Testar Customer Portal
1. Acesse `/dashboard/billing`
2. Clique em "Gerenciar Assinatura"
3. Portal deve abrir com opções de:
   - Ver faturas
   - Atualizar método de pagamento
   - Cancelar assinatura

---

## Fluxo Completo

1. **Usuário se cadastra** → Recebe plano Free automaticamente (trigger SQL)
2. **Usuário clica em Upgrade** → Edge function cria checkout session
3. **Usuário completa pagamento** → Stripe envia webhook `checkout.session.completed`
4. **Webhook processa** → Atualiza subscription no banco
5. **Usuário volta ao app** → Vê plano atualizado e features desbloqueadas

---

## Troubleshooting

### Webhook não funciona
- Verifique se `STRIPE_WEBHOOK_SECRET` está configurado
- Teste com [Stripe CLI](https://stripe.com/docs/stripe-cli):
  ```bash
  stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
  ```

### Checkout não abre
- Verifique se `price_id` está correto no banco
- Verifique logs da edge function: `npx supabase functions logs create-checkout-session`

### Customer Portal não abre
- Certifique-se que o Customer foi criado no Stripe
- Verifique se `stripe_customer_id` existe na tabela `user_subscriptions`
