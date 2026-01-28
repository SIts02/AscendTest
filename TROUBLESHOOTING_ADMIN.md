# Troubleshooting - Sistema Admin

## Erro: "Failed to send a request to the Edge Function"

### Possíveis Causas e Soluções

#### 1. ✅ Verificar se a Edge Function foi deployada

A função precisa ser deployada no Supabase. Execute:

```bash
# No diretório do projeto
supabase functions deploy send-admin-otp
```

Ou via Supabase Dashboard:
1. Vá em **Edge Functions**
2. Clique em **Deploy** ou **Redeploy** na função `send-admin-otp`

---

#### 2. ✅ Verificar se a Secret RESEND_API_KEY está configurada

**No Supabase Dashboard:**
1. Vá em **Edge Functions** > **Secrets**
2. Verifique se existe `RESEND_API_KEY`
3. Se não existir, adicione:
   - **Nome**: `RESEND_API_KEY`
   - **Valor**: Sua API key do Resend (começa com `re_...`)

**Importante:** 
- A secret deve estar exatamente como `RESEND_API_KEY` (case-sensitive)
- Após adicionar, a função precisa ser redeployada

---

#### 3. ✅ Verificar logs da Edge Function

**No Supabase Dashboard:**
1. Vá em **Edge Functions** > **send-admin-otp**
2. Clique em **Logs**
3. Verifique se há erros específicos

**Erros comuns:**
- `RESEND_API_KEY not configured` → Secret não configurada
- `Missing Supabase credentials` → Variáveis de ambiente do Supabase não disponíveis
- `Database error` → Problema com a tabela `admin_otps`

---

#### 4. ✅ Verificar se a tabela admin_otps existe

Execute a migration:

```sql
-- Verificar se a tabela existe
SELECT * FROM admin_otps LIMIT 1;
```

Se não existir, execute a migration:
```bash
supabase migration up
```

Ou execute manualmente o SQL em `supabase/migrations/20250120000001_create_admin_otps.sql`

---

#### 5. ✅ Verificar CORS

Se estiver testando localmente, verifique:
- A URL do Supabase está correta?
- O `ALLOWED_ORIGINS` está configurado?

**Para desenvolvimento local:**
- A função permite `unknown` IPs temporariamente
- Em produção, apenas o IP `200.52.28.228` é permitido

---

#### 6. ✅ Testar a função diretamente

Use o Supabase Dashboard ou curl:

```bash
curl -X POST https://[seu-projeto].supabase.co/functions/v1/send-admin-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [anon-key]" \
  -d '{"email": "kakaverzeque@gmail.com"}'
```

Substitua:
- `[seu-projeto]` pelo ID do seu projeto Supabase
- `[anon-key]` pela sua chave anon do Supabase

---

#### 7. ✅ Verificar formato da API Key do Resend

A API key do Resend deve:
- Começar com `re_`
- Ter aproximadamente 51 caracteres
- Estar ativa no dashboard do Resend

**Exemplo válido:** `re_1234567890abcdefghijklmnopqrstuvwxyz1234567890`

---

#### 8. ✅ Verificar email no Resend

Lembre-se:
- O email da conta Resend DEVE ser `kakaverzeque@gmail.com`
- O email de destino também deve ser `kakaverzeque@gmail.com`
- Isso é necessário porque `onboarding@resend.dev` só envia para o email da conta

---

## Checklist de Verificação

- [ ] Edge Function `send-admin-otp` está deployada
- [ ] Secret `RESEND_API_KEY` está configurada no Supabase
- [ ] Tabela `admin_otps` existe no banco de dados
- [ ] API key do Resend está correta e ativa
- [ ] Email da conta Resend é `kakaverzeque@gmail.com`
- [ ] Logs da função não mostram erros específicos
- [ ] Testou a função diretamente via curl/Dashboard

---

## Próximos Passos

Se ainda não funcionar:

1. **Verifique os logs detalhados** no Supabase Dashboard
2. **Teste a função diretamente** via curl (veja item 6)
3. **Verifique se o Resend está funcionando** testando manualmente no dashboard do Resend
4. **Confirme que todas as migrations foram executadas**

---

## Contato

Se o problema persistir, verifique:
- Logs da Edge Function no Supabase
- Status da API do Resend
- Configurações de rede/firewall
