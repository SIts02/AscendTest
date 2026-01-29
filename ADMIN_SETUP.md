# Configuração do Sistema Admin

## 📋 Pré-requisitos

### 1. Configurar Resend (Envio de Emails)

O sistema admin usa **Resend** para enviar senhas dinâmicas por email. Siga estes passos:

#### Passo 1: Criar Conta no Resend
1. Acesse https://resend.com
2. Crie uma conta usando o email: **kakaverzeque@gmail.com**
   - ⚠️ **IMPORTANTE**: O email da conta Resend DEVE ser o mesmo que receberá os códigos
   - Isso é necessário porque `onboarding@resend.dev` só pode enviar para o email da conta

#### Passo 2: Obter API Key
1. Após criar a conta, vá em **API Keys** (no menu lateral)
2. Clique em **Create API Key**
3. Dê um nome (ex: "Ascend Admin OTP")
4. Copie a chave gerada (ela só aparece uma vez!)

#### Passo 3: Adicionar ao Supabase
1. Acesse seu projeto no Supabase Dashboard
2. Vá em **Edge Functions** > **Secrets**
3. Adicione uma nova secret:
   - **Nome**: `RESEND_API_KEY`
   - **Valor**: Cole a API key copiada do Resend

#### Passo 4: Verificar Configuração
- O email `kakaverzeque@gmail.com` receberá os códigos de acesso
- Os emails serão enviados de `onboarding@resend.dev`
- Isso funciona porque o email de destino é o mesmo da conta Resend

---

## 🚀 Como Usar o Sistema Admin

### Acesso ao Painel Admin

1. **Acesse**: `https://seu-dominio.com/admin/login`
2. **Email**: O campo já vem preenchido com `kakaverzeque@gmail.com`
3. **Solicite código**: Clique em "Solicitar Código"
4. **Verifique email**: Você receberá um código de 6 dígitos
5. **Digite o código**: Insira o código recebido
6. **Acesse o painel**: Você será redirecionado para `/admin/feedbacks`

### Funcionalidades do Painel Admin

- ✅ Visualizar todos os feedbacks dos usuários
- ✅ Filtrar por tipo (Bug, Funcionalidade, Melhoria, Outro)
- ✅ Filtrar por status (Pendente, Revisado, Em Andamento, Resolvido, Rejeitado)
- ✅ Buscar feedbacks por título ou descrição
- ✅ Ver estatísticas (Total, Pendentes, Resolvidos, Avaliação Média)
- ✅ Atualizar status dos feedbacks
- ✅ Adicionar notas do admin
- ✅ Visualizar detalhes completos de cada feedback

---

## 🔒 Segurança

### Proteções Implementadas

1. **Autenticação por OTP**:
   - Código de 6 dígitos gerado aleatoriamente
   - Expira em 5 minutos
   - Hash SHA-256 armazenado no banco (não o código em texto plano)

2. **Rate Limiting**:
   - Máximo 3 tentativas de solicitar código por minuto
   - Previne spam e ataques de força bruta

3. **Sessão Temporária**:
   - Sessão admin expira em 8 horas
   - Token armazenado apenas no `sessionStorage` (não persiste após fechar navegador)

4. **Validação de Email**:
   - Apenas `kakaverzeque@gmail.com` é autorizado
   - Validação hardcoded no backend (não pode ser burlada)

5. **Restrição por IP**:
   - Apenas IP `200.52.28.228` pode acessar as funções admin
   - Validação em todas as edge functions
   - Tentativas de IPs não autorizados são bloqueadas e logadas

6. **RLS no Banco**:
   - Tabela `admin_otps` só acessível via service_role
   - Tabela `user_feedback` com políticas de acesso restritas

7. **Sem Dados Sensíveis no Frontend**:
   - Email do admin não está exposto no código frontend
   - IP permitido não está no código frontend
   - Todas as validações críticas são feitas no backend

---

## 📁 Estrutura de Arquivos Criados

```
supabase/
├── functions/
│   ├── send-admin-otp/
│   │   └── index.ts          # Envia código OTP por email
│   ├── verify-admin-otp/
│   │   └── index.ts          # Verifica código OTP
│   ├── get-admin-feedbacks/
│   │   └── index.ts          # Lista feedbacks (protegido)
│   └── update-admin-feedback/
│       └── index.ts          # Atualiza feedback (protegido)
└── migrations/
    └── 20250120000001_create_admin_otps.sql

src/
├── pages/
│   ├── AdminLogin.tsx        # Página de login admin
│   └── admin/
│       └── AdminFeedbacks.tsx # Painel admin de feedbacks
└── hooks/
    └── useAdminAuth.tsx      # Hook de autenticação admin
```

---

## 🛠️ Troubleshooting

### Email não está chegando?

1. **Verifique a API Key**:
   - Confirme que `RESEND_API_KEY` está configurada no Supabase
   - Verifique se a chave está correta (sem espaços extras)

2. **Verifique o email da conta Resend**:
   - Deve ser exatamente `kakaverzeque@gmail.com`
   - O email de destino deve ser o mesmo da conta

3. **Verifique a caixa de spam**:
   - Emails podem ir para spam na primeira vez
   - Adicione `onboarding@resend.dev` aos contatos

### Erro "Sessão expirada"?

- A sessão admin expira em 8 horas
- Faça login novamente para obter nova sessão

### Erro ao carregar feedbacks?

- Verifique se a sessão está válida
- Tente fazer logout e login novamente
- Verifique os logs do Supabase Edge Functions

---

## 📝 Notas Importantes

1. **Email do Admin**: O email `kakaverzeque@gmail.com` está hardcoded no código por segurança
2. **Domínio Resend**: Usamos `onboarding@resend.dev` que só funciona para o email da conta
3. **Produção**: Para produção, considere usar um domínio próprio no Resend para maior confiabilidade
4. **Backup**: Mantenha backup da API key do Resend em local seguro

---

## 🔗 Links Úteis

- [Resend Dashboard](https://resend.com)
- [Resend API Docs](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
