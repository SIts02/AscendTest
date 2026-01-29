# Variáveis de Ambiente - Ascend 2.0

## ⚙️ Frontend (.env.development.local)

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Feature Flags
VITE_ENABLE_FORECASTING=true
VITE_ENABLE_OPEN_FINANCE=true
VITE_ENABLE_SUBSCRIPTIONS=false

# Pluggy (Open Finance) - Opcional para desenvolvimento
VITE_PLUGGY_CLIENT_ID=your_pluggy_client_id
```

## 🔐 Backend (Supabase  Edge Functions)

Configure no Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```env
# Pluggy API
PLUGGY_CLIENT_ID=your_pluggy_client_id
PLUGGY_CLIENT_SECRET=your_pluggy_client_secret
PLUGGY_WEBHOOK_SECRET=optional_webhook_secret

# Supabase (auto-configurado)
SUPABASE_URL=auto
SUPABASE_ANON_KEY=auto
SUPABASE_SERVICE_ROLE_KEY=auto
```

## 📝 Notas

1. **Pluggy Sandbox**: Use credenciais de sandbox para testes
2. **Webhooks**: Configure URL do webhook no dashboard Pluggy
3. **Service Role**: Nunca exponha no frontend
4. **Feature Flags**: Controle features em produção

## 🔗 Links Úteis

- [Pluggy Dashboard](https://dashboard.pluggy.ai/)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Documentação Pluggy](https://docs.pluggy.ai/)
