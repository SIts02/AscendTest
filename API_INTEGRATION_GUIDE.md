# 🔧 Integração com API Real de Taxas de Câmbio

O conversor de moedas está configurado com **taxas mock** por padrão. Siga este guia para integrar com uma API real.

## 🌐 APIs Recomendadas

### 1. **ExchangeRate-API** (Recomendado - Gratuito)
- **URL**: https://exchangerate-api.com
- **Plan Gratuito**: 1.500 requisições/mês
- **Sem Taxa de Câmbio Reversa**: Suporta automático

### 2. **Fixer.io**
- **URL**: https://fixer.io
- **Plan Pago**: €10+/mês
- **Mais Confiável**: Usado por grandes empresas

### 3. **Open Exchange Rates**
- **URL**: https://openexchangerates.org
- **Plan Gratuito**: 1.000 requisições/mês
- **Muito Completo**: 200+ moedas

## 📝 Passo a Passo - ExchangeRate-API

### 1. Criar Conta
1. Acesse https://exchangerate-api.com
2. Clique em "Sign Up" e complete o cadastro
3. Você receberá uma **API Key**

### 2. Variável de Ambiente
Adicione ao `.env.local`:

```
VITE_EXCHANGERATE_API_KEY=your_api_key_here
```

### 3. Atualizar `useCurrencyConverter.tsx`

Substitua a função `getExchangeRate()` por:

```typescript
const getExchangeRate = useCallback(
  async (from: string, to: string): Promise<number | null> => {
    try {
      // Validate inputs
      if (!validateCurrency(from) || !validateCurrency(to)) {
        throw new Error('Moeda inválida');
      }

      if (from === to) {
        return 1;
      }

      // Use real API
      const apiKey = import.meta.env.VITE_EXCHANGERATE_API_KEY;
      
      if (!apiKey) {
        console.warn('API key not found, using mock rates');
        // Fallback para mock rates
        const fromRate = MOCK_RATES[from] || 1;
        const toRate = MOCK_RATES[to] || 1;
        return Number((toRate / fromRate).toFixed(4));
      }

      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${from}?apikey=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.rates || !data.rates[to]) {
        throw new Error('Taxa de câmbio não encontrada');
      }

      return Number(data.rates[to].toFixed(4));
    } catch (error: any) {
      console.error('Error fetching exchange rate:', error);
      // Fallback para mock rates
      const fromRate = MOCK_RATES[from] || 1;
      const toRate = MOCK_RATES[to] || 1;
      const rate = toRate / fromRate;
      console.warn('Using mock rate as fallback:', rate);
      return Number(rate.toFixed(4));
    }
  },
  [validateCurrency]
);
```

### 4. Testar

1. Defina `VITE_EXCHANGERATE_API_KEY` no `.env.local`
2. Recarregue a aplicação
3. Faça uma conversão
4. Abra DevTools e veja se a API foi chamada (Network tab)

## 🔍 Resposta da API

### ExchangeRate-API Format:

```json
{
  "result": "success",
  "documentation": "https://www.exchangerate-api.com/docs",
  "terms_of_use": "https://www.exchangerate-api.com/terms",
  "time_last_updated_utc": "2024-01-01T00:00:00+00:00",
  "base_code": "BRL",
  "rates": {
    "USD": 0.1942,
    "EUR": 0.1798,
    "GBP": 0.1528,
    "JPY": 29.84,
    ...
  }
}
```

## 💾 Caching de Taxas (Opcional)

Para economizar requisições, adicione cache:

```typescript
// Adicione ao início do hook
const cacheStore: { [key: string]: { rate: number; timestamp: number } } = {};
const CACHE_DURATION = 3600000; // 1 hora

const getExchangeRate = useCallback(
  async (from: string, to: string): Promise<number | null> => {
    try {
      const cacheKey = `${from}-${to}`;
      const now = Date.now();
      
      // Verificar cache
      if (cacheStore[cacheKey] && 
          (now - cacheStore[cacheKey].timestamp) < CACHE_DURATION) {
        console.log('Using cached rate:', cacheStore[cacheKey].rate);
        return cacheStore[cacheKey].rate;
      }

      // ... resto do código ...
      
      // Salvar no cache
      cacheStore[cacheKey] = {
        rate: Number(data.rates[to].toFixed(4)),
        timestamp: now
      };
      
      return cacheStore[cacheKey].rate;
    } catch (error: any) {
      // ...
    }
  },
  [validateCurrency]
);
```

## 🛡️ Boas Práticas

### 1. Nunca exponha sua API Key
- ✅ Use variáveis de ambiente
- ❌ Nunca commite `.env` no Git
- ❌ Nunca hardcode a chave no código

### 2. Tratamento de Erros
```typescript
if (!response.ok) {
  // Log do erro
  console.error('API Error:', response.status);
  // Use mock rates como fallback
  return mockRate;
}
```

### 3. Rate Limiting
- Respeite limites da API
- Use cache para evitar requisições desnecessárias
- Implemente backoff exponencial para retries

### 4. Monitoramento
```typescript
// Log cada requisição
console.log(`Converting ${amount} ${from} to ${to}`);
console.log(`Rate: 1 ${from} = ${rate} ${to}`);
```

## 🧪 Teste da Integração

### Local:
```bash
# 1. Defina a variável de ambiente
export VITE_EXCHANGERATE_API_KEY="your_key"

# 2. Rode o desenvolvimento
npm run dev

# 3. Teste a conversão
# Abra DevTools > Network, faça conversão
# Você deve ver uma requisição para exchangerate-api.com
```

### Production:
1. Defina `VITE_EXCHANGERATE_API_KEY` nas variáveis de produção
2. Verifique que a requisição está funcionando
3. Monitore o uso da API no dashboard

## 📊 Alternativa: Backend API

Se preferir mais controle, crie um endpoint backend:

```typescript
// Backend (Node.js/Express)
app.get('/api/exchange-rate', async (req, res) => {
  const { from, to } = req.query;
  
  // Chamada para API com sua chave (segura no backend)
  const rate = await fetchRate(from, to);
  
  res.json({ rate });
});

// Frontend
const getExchangeRate = useCallback(async (from: string, to: string) => {
  const response = await fetch(
    `/api/exchange-rate?from=${from}&to=${to}`
  );
  const data = await response.json();
  return data.rate;
}, []);
```

## 🚨 Troubleshooting

| Problema | Solução |
|----------|---------|
| 401 Unauthorized | Chave de API inválida ou expirada |
| 429 Too Many Requests | Limite de requisições atingido |
| 404 Not Found | Moeda não é suportada pela API |
| Timeout | API indisponível, use mock rates |
| CORS Error | Use proxy ou backend API |

## 📚 Documentação das APIs

- [ExchangeRate-API Docs](https://www.exchangerate-api.com/docs)
- [Fixer.io Docs](https://fixer.io/documentation)
- [Open Exchange Rates Docs](https://openexchangerates.org/documentation)

---

**Nota**: A aplicação continuará funcionando com mock rates se a API não estiver configurada. O fallback automático garante que o usuário sempre consegue fazer conversões.
