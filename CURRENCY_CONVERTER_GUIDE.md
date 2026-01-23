# Guia de Uso - Conversor de Moedas e Configurações

## 🌍 Conversor de Moedas

O conversor de moedas está integrado na aba **Localização** das configurações do aplicativo.

### Moedas Suportadas:
- 🇧🇷 **BRL** - Real Brasileiro
- 🇺🇸 **USD** - Dólar Americano
- 🇪🇺 **EUR** - Euro
- 🇬🇧 **GBP** - Libra Esterlina
- 🇯🇵 **JPY** - Iene Japonês
- 🇦🇺 **AUD** - Dólar Australiano
- 🇨🇦 **CAD** - Dólar Canadense
- 🇨🇭 **CHF** - Franco Suíço
- 🇨🇳 **CNY** - Yuan Chinês
- 🇮🇳 **INR** - Rúpia Indiana

### Como Usar:

1. Abra a aba **Configurações** no dashboard
2. Vá para a aba **Localização**
3. Role para baixo até a seção "Conversor de Moedas"
4. Selecione:
   - **De**: A moeda que você quer converter (ex: BRL)
   - **Valor**: O montante a converter (ex: 100)
   - **Para**: A moeda destino (ex: USD)
5. Clique em **Converter** para fazer a conversão
6. O resultado aparecerá com a taxa de câmbio utilizada

### Funcionalidades Especiais:

- **Botão ⇄**: Inverte automaticamente as moedas de origem e destino
- **Taxa de Câmbio**: Exibida para sua referência
- **Validações**: Rejeita valores inválidos (negativos, muito grandes, etc.)
- **Rate Limiting**: Máximo de 100 conversões por minuto por usuário (proteção de segurança)

## 💾 Salvando Configurações

### Problema: Configurações não estão sendo salvas

Se as configurações não estão sendo persistidas, verifique:

1. **Autenticação**:
   - Você está logado na aplicação? (Obrigatório para salvar no banco de dados)
   - Sem autenticação, as preferências são salvas apenas no localStorage

2. **Conexão com Supabase**:
   - Abra o Console do Navegador (F12)
   - Vá para a aba **Console**
   - Procure por mensagens de erro
   - Você deve ver logs como: `"Saving preferences for user: [user-id]"`

3. **Verificar o Console**:
   ```
   // Você deve ver algo assim:
   Saving preferences for user: 12345-abcde-67890
   Updating existing preferences
   Update response: { data: [...], error: null }
   ```

### Dicas de Diagnóstico:

```javascript
// No Console do Navegador, execute:
// 1. Verificar localStorage
JSON.parse(localStorage.getItem('user_preferences'))

// 2. Verificar usuário autenticado
console.log('User:', user) // Dentro do contexto da aplicação
```

### Solução de Problemas:

| Problema | Solução |
|----------|---------|
| "Erro ao salvar suas preferências" | Verifique sua conexão com a internet e recarregue |
| Configurações desaparecem ao recarregar | Não está autenticado - faça login primeiro |
| Console mostra erro RLS | Contate o administrador - problema com permissões no banco |
| Configurações não atualizam em tempo real | Recarregue a página (F5) |

## 🔒 Segurança

### Rate Limiting do Conversor:
- **Limite**: 100 conversões por minuto
- **Escopo**: Por usuário
- **Objetivo**: Proteger contra abuso da API

### Validações de Entrada:
- Valores devem estar entre 0 e 1.000.000
- Códigos de moeda devem ser válidos (das 10 suportadas)
- Entradas inválidas são automaticamente rejeitadas

## 📊 Taxa de Câmbio

Atualmente, o conversor usa **taxas de câmbio mock** (simuladas) com USD como moeda base.

### Para usar taxas reais em produção:

Atualize `src/hooks/useCurrencyConverter.tsx`, função `getExchangeRate()`:

```typescript
// Exemplo com API real
const response = await fetch(
  `https://api.exchangerate-api.com/v4/latest/${from}`
);
const data = await response.json();
return data.rates[to];
```

APIs recomendadas:
- [exchangerate-api.com](https://exchangerate-api.com) - Gratuito com limite
- [fixer.io](https://fixer.io) - Pago, muito confiável
- [openexchangerates.org](https://openexchangerates.org) - Pago, completo

## 🛠️ Estrutura Técnica

### Arquivos Relevantes:
- `/src/hooks/useCurrencyConverter.tsx` - Lógica de conversão
- `/src/hooks/useUserPreferences.tsx` - Gerenciamento de preferências
- `/src/pages/dashboard/Configuracoes.tsx` - Interface de configurações
- `/supabase/migrations/20260119013530*` - Schema do banco de dados

### Tabelas do Banco:
```sql
user_preferences (
  id UUID,
  user_id UUID,
  theme TEXT,
  language TEXT,
  currency TEXT,
  show_balance BOOLEAN,
  date_format TEXT,
  notifications_enabled BOOLEAN,
  email_notifications BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## 📝 Notas de Desenvolvimento

- O conversor suporta até 10 moedas diferentes
- As taxas são atualizadas conforme necessário
- As preferências são sincronizadas com localStorage para offline
- Logs detalhados estão disponíveis no Console do navegador
