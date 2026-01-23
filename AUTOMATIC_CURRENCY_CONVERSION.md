# 💱 Conversão Automática de Moedas - Guia Completo

## 🎯 Como Funciona

Agora que você muda a moeda padrão nas configurações, **TODOS os valores financeiros do site são convertidos automaticamente**:

- 📊 Gráficos (receitas, despesas, saldo)
- 💰 Saldos totais
- 📈 Análise de gastos por categoria
- 📋 Lista de transações
- 🎯 Investimentos

## 🏗️ Arquitetura da Conversão

```
┌─────────────────────────────────────────┐
│ Dashboard / Configurações               │
│ Usuário muda moeda: BRL → USD           │
└────────────────┬────────────────────────┘
                 │
         ┌───────▼────────┐
         │  useUserPref   │
         │  erences      │
         │ (currency: USD)│
         └───────┬────────┘
                 │
    ┌────────────▼──────────────┐
    │ useConvertedFinancialData │
    │ useConvertedTransactions  │
    └────────────┬──────────────┘
                 │
    ┌────────────▼──────────────────┐
    │  useCurrencyConversion       │
    │  - convertAmount()           │
    │  - convertArray()            │
    │  - convertFinancialSummary() │
    │  - Cache de taxas            │
    └────────────┬──────────────────┘
                 │
         ┌───────▼────────┐
         │ Dados Convertidos
         │ (valores em USD)
         └────────────────┘
         
         ┌────────────────────┐
         │ Componentes recebem │
         │ dados convertidos   │
         │ e exibem em USD    │
         └────────────────────┘
```

## 📚 Hooks Principais

### 1. **useCurrencyConversion**
Fornece funções baixo nível de conversão:

```typescript
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';

function MyComponent() {
  const { 
    convertAmount,           // Converter um valor
    convertFinancialSummary, // Converter summary completo
    convertTransactions,     // Converter array de transações
    formatInTargetCurrency,  // Formatar na moeda alvo
    currentCurrency          // Moeda atual
  } = useCurrencyConversion();

  // Converter um valor de BRL para a moeda do usuário
  const usdAmount = await convertAmount(100, 'BRL');
  // Resultado: 19.42 (se USD for a moeda do usuário)
}
```

### 2. **useConvertedFinancialData**
Substitui `useFinancialData` com suporte a conversão automática:

```typescript
import { useConvertedFinancialData } from '@/hooks/useConvertedFinancialData';

function Dashboard() {
  const { 
    summary,        // Dados já convertidos
    transactions,   // Transações já convertidas
    loading,        // Estado de carregamento
    isConverting,   // Estado de conversão
    currentCurrency // Moeda atual
  } = useConvertedFinancialData();

  // summary.totalIncome já está em USD (se for a moeda do usuário)
}
```

### 3. **useConvertedTransactions**
Substitui `useTransactions` com conversão automática:

```typescript
import { useConvertedTransactions } from '@/hooks/useConvertedTransactions';

function TransactionList() {
  const { 
    transactions,   // Já convertidas
    loading,
    isConverting,
    currentCurrency
  } = useConvertedTransactions();

  // Cada transação.amount já está convertida
}
```

## 🔄 Fluxo de Conversão

### Passo 1: Usuário muda moeda nas configurações
```typescript
// Em Configuracoes.tsx
const handlePreferenceChange = (key: string, value: any) => {
  setPreferences({ ...preferences, [key]: value });
  handleSavePreferences(); // Salva a nova moeda
};
```

### Passo 2: useUserPreferences detecta mudança
```typescript
// useUserPreferences.tsx
useEffect(() => {
  localStorage.setItem('user_preferences', JSON.stringify(preferences));
  savePreferences(preferences); // Salva em Supabase
}, [preferences]);
```

### Passo 3: useConvertedFinancialData detecta mudança de moeda
```typescript
// useConvertedFinancialData.tsx
useEffect(() => {
  if (currentCurrency !== lastConvertedCurrency) {
    // Moeda mudou! Reconverter dados
    const newSummary = await convertFinancialSummary(summary, 'BRL');
    setConvertedSummary(newSummary);
  }
}, [currentCurrency, lastConvertedCurrency]);
```

### Passo 4: Componentes recebem dados já convertidos
```typescript
// FinancialOverview.tsx
const { summary, loading } = useConvertedFinancialData();
// summary.totalIncome já está em USD!
```

## 💾 Cache de Taxas

Para melhorar performance, as taxas de câmbio são armazenadas em cache:

```typescript
// Cada taxa é cacheada por 1 hora
const CACHE_DURATION = 3600000; // 1 hora

// Primeira conversão: BRL→USD
const rate1 = await getExchangeRate('BRL', 'USD'); // API call

// Dentro de 1 hora: BRL→USD novamente
const rate2 = await getExchangeRate('BRL', 'USD'); // Usa cache!

// Após 1 hora: cache expirou, faz nova chamada
```

## ⚠️ O que Muda e O que Não Muda

### Muda Automaticamente:
- ✅ Gráficos de receitas/despesas
- ✅ Saldos totais
- ✅ Gastos por categoria
- ✅ Lista de transações
- ✅ Análise de investimentos
- ✅ Relatórios financeiros

### Não Muda (Por Design):
- ❌ Dados no banco de dados (sempre em BRL)
- ❌ Histórico de conversões passadas
- ❌ Valores já salvos em outras moedas (se houver)

**Nota**: Os dados sempre são salvos em BRL no banco de dados por consistência. A conversão ocorre APENAS na exibição.

## 🚀 Exemplo Prático

### Cenário:
1. Usuário tem 1000 BRL em renda
2. Gasta 300 BRL em despesas
3. Saldo: 700 BRL

### Usuário muda para USD:
1. Taxa: 1 BRL = 0.1942 USD
2. Renda: 1000 × 0.1942 = 194.20 USD
3. Despesas: 300 × 0.1942 = 58.26 USD
4. Saldo: 700 × 0.1942 = 135.94 USD

Tudo acontece automaticamente quando o usuário muda a moeda!

## 📊 Dados que São Convertidos

```typescript
// Resumo Financeiro
{
  totalIncome: 1000 → 194.20,
  totalExpense: 300 → 58.26,
  balance: 700 → 135.94,
  
  monthlyData: [
    {
      month: "Jan",
      income: 2000 → 388.40,
      expense: 800 → 155.36,
      balance: 1200 → 233.04
    }
  ],
  
  spendingByCategory: [
    {
      name: "Alimentação",
      value: 200 → 38.84
    }
  ]
}
```

## 🔧 Configurando API Real

Os hooks estão prontos para usar uma API real de taxas de câmbio:

```typescript
// Em useCurrencyConverter.tsx, função getExchangeRate()
const response = await fetch(
  `https://api.exchangerate-api.com/v4/latest/${from}?apikey=${apiKey}`
);
const data = await response.json();
return data.rates[to];
```

Veja `API_INTEGRATION_GUIDE.md` para detalhes.

## ⚡ Performance

- **Cache de Taxas**: 1 hora de validade
- **Limite de Requisições**: 100/min por usuário
- **Conversão Assíncrona**: Não bloqueia UI
- **Fallback**: Se API falhar, usa valores originais

## 🐛 Debugging

### Verificar se conversão está funcionando:

```javascript
// Console do navegador
// 1. Verificar preferências
console.log(localStorage.getItem('user_preferences'))

// 2. Verificar moeda atual
// Deve mostrar: { "currency": "USD", ... }

// 3. Verificar dados convertidos
// Abra o React DevTools e inspecione os hooks
```

### Logs disponíveis:

```javascript
// Ativar logs em console.log
// Você verá:
// - "Saving preferences for user: [ID]"
// - "Converting financial data..."
// - "Conversion completed"
```

## 🎨 UX Melhorado

- ⚡ Conversão instantânea (cache)
- 🔄 Sincronização automática entre abas
- 🌍 Suporta 10 moedas principais
- 💪 Funciona offline (localStorage)
- 🛡️ Rate limiting protege API

## 📝 Próximas Melhorias (Opcionais)

1. **Histórico de Conversões**: Manter registro de conversões
2. **Alertas de Taxa**: Notificar mudanças significativas
3. **Conversão em Tempo Real**: WebSocket para taxas em tempo real
4. **Múltiplas Moedas**: Exibir valores em várias moedas simultaneamente
5. **Previsões**: Estimar valores futuros baseado em histórico

## 📞 Suporte

Se a conversão não estiver funcionando:
1. Verifique se você está autenticado
2. Abra o console do navegador (F12)
3. Procure por erros de API
4. Verifique conexão com internet
5. Tente recarregar a página (F5)

---

**Resumo**: A conversão de moedas é **totalmente automática e transparente**. Basta mudar a moeda nas configurações e todos os gráficos, saldos e transações serão exibidos na nova moeda! 🎉
