# Ascend 2.0 - Financial Management Platform

## 📊 Sobre o Projeto

Ascend é uma plataforma moderna e completa de gestão financeira pessoal, desenvolvida com as melhores práticas e tecnologias atuais do mercado.

### ✨ Principais Funcionalidades

- **Gestão Financeira**: Controle completo de receitas, despesas, investimentos e orçamentos
- **Previsões Inteligentes**: Projeções financeiras de 30/60/90 dias com algoritmos preditivos
- **Open Finance**: Integração bancária via Pluggy para sincronização automática
- **Análise Comportamental**: Sistema de gamificação com conquistas e desafios financeiros
- **Planos de Assinatura**: Integração Stripe para monetização (Free/Pro/Premium)
- **Dashboards Customizáveis**: Crie e personalize seus próprios dashboards
- **Segurança Avançada**: RLS policies, MFA, auditoria completa

---

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ e npm
- Python 3.8+ (para Supabase local)
- Docker (opcional, para Supabase local)

### Instalação

```bash
# 1. Clone o repositório
git clone <YOUR_GIT_URL>
cd AscendTest

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

### Configuração do Supabase

```bash
# Instalar Supabase CLI
npm install -g supabase

# Iniciar Supabase local (requer Docker)
npx supabase start

# Aplicar migrations
npx supabase db reset
```

Consulte os guias de configuração:
- **Supabase**: Veja instruções no dashboard do Supabase
- **Stripe**: [STRIPE_SETUP.md](./STRIPE_SETUP.md)
- **Pluggy**: [ENV_SETUP.md](./ENV_SETUP.md)

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Vite** - Build tool  rápido
- **React 18** - Framework UI
- **TypeScript** - Type safety
- **TanStack Query** - Data fetching e cache
- **Shadcn/ui** - Componentes UI
- **Tailwind CSS** - Styling utility-first

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Row Level Security
  - Edge Functions (Deno)
  - Realtime subscriptions

### Integrações
- **Stripe** - Pagamentos e assinaturas
- **Pluggy** - Open Finance / Banking
- **Alpha Vantage** - Cotações de ações

---

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia dev server

# Build
npm run build            # Build produção
npm run build:dev        # Build desenvolvimento
npm run preview          # Preview do build

# Qualidade
npm run lint             # ESLint
npm run security:audit   # Audit de segurança
npm run security:check   # Audit + lint

# TypeScript
npx tsc --noEmit         # Verificar tipos
```

---

## 📂 Estrutura do Projeto

```
AscendTest/
├── src/
│   ├── components/      # Componentes React
│   ├── contexts/        # Context providers
│   ├── hooks/           # Custom hooks
│   ├── integrations/    # Integrações externas
│   ├── lib/             # Utilitários
│   ├── pages/           # Páginas/rotas
│   └── App.tsx          # App principal
├── supabase/
│   ├── functions/       # Edge Functions
│   └── migrations/      # SQL migrations
├── public/              # Assets estáticos
└── docs/                # Documentação
```

---

## 🔐 Segurança

O projeto implementa múltiplas camadas de segurança:

- **Authentication**: Supabase Auth com suporte a OAuth
- **MFA**: Two-Factor Authentication opcional
- **RLS**: Row Level Security em todas as tabelas
- **CSRF Protection**: Tokens CSRF configurados
- **Rate Limiting**: Proteção contra abuse
- **Audit Log**: Registro de ações sensíveis
- **Webhook Signatures**: Validação Stripe e Pluggy

---

## 📚 Documentação

- **[ENV_SETUP.md](./ENV_SETUP.md)** - Configuração Pluggy
- **[STRIPE_SETUP.md](./STRIPE_SETUP.md)** - Configuração Stripe
- **[OPTIMIZATIONS.md](./OPTIMIZATIONS.md)** - Boas práticas
- **[CHECKLIST.md](./CHECKLIST.md)** - Checklist deploy

---

## 🚀 Deploy

### Opção 1: Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Opção 2: Netlify

```bash
# Build
npm run build

# Upload dist/ para Netlify
```

### Configuração do Backend

1. Crie um projeto no [Supabase](https://supabase.com)
2. Aplique as migrations: `npx supabase db push`
3. Deploy edge functions: `npx supabase functions deploy [function-name]`
4. Configure variáveis de ambiente no dashboard

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'feat: Adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

---

## 📄 Licença

Proprietary - Todos os direitos reservados

---

## 📧 Suporte

Para suporte e dúvidas, consulte a documentação ou abra uma issue no repositório.

---

**Desenvolvido com ❤️ para gestão financeira inteligente**
