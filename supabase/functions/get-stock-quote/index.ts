import { serve } from "https:
import { createClient } from 'https:

function getCorsHeaders(request: Request) {
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',').map(o => o.trim()) || [];
  const requestOrigin = request.headers.get('Origin');

  let corsOrigin: string;

  if (allowedOrigins.length === 0) {

    corsOrigin = '*';
    console.warn('⚠️ ALLOWED_ORIGINS not configured, using permissive CORS (development mode)');
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {

    corsOrigin = requestOrigin;
  } else {

    corsOrigin = allowedOrigins[0] || '*';
  }

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Authorization header missing');
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { data: rateLimitAllowed, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        p_user_id: user.id,
        p_endpoint: 'get-stock-quote',
        p_max_requests: 5,
        p_window_minutes: 1
      });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);

    } else if (rateLimitAllowed === false) {
      return new Response(
        JSON.stringify({ error: 'Muitas requisições. Aguarde um momento antes de tentar novamente.' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');

    if (!ALPHA_VANTAGE_API_KEY) {
      console.error('ALPHA_VANTAGE_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Serviço temporariamente indisponível' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { symbol } = await req.json();

    if (!symbol) {
      console.error('Símbolo da ação não fornecido');
      return new Response(
        JSON.stringify({ error: 'Símbolo da ação é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const symbolRegex = /^[A-Z0-9\.\-]{1,10}$/;
    if (typeof symbol !== 'string' || !symbolRegex.test(symbol.toUpperCase())) {
      console.error('Símbolo inválido:', symbol);
      return new Response(
        JSON.stringify({ error: 'Símbolo da ação inválido' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const normalizedSymbol = symbol.toUpperCase();

    console.log(`Buscando cotação para: ${normalizedSymbol}`);

    const url = `https:

    const response = await fetch(url);
    const data = await response.json();

    if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
      const quote = data['Global Quote'];

      const formattedData = {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent'],
        volume: parseInt(quote['06. volume']),
        latestTradingDay: quote['07. latest trading day'],
        previousClose: parseFloat(quote['08. previous close']),
        open: parseFloat(quote['02. open']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
      };

      console.log(`Cotação obtida com sucesso para ${normalizedSymbol}:`, formattedData);

      return new Response(
        JSON.stringify(formattedData),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else if (data['Note']) {

      console.error('Limite de requisições da API atingido:', data['Note']);
      return new Response(
        JSON.stringify({
          error: 'Limite de requisições atingido. Tente novamente em alguns minutos.'
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {

      console.error('Erro ao buscar cotação:', data);
      return new Response(
        JSON.stringify({
          error: 'Não foi possível obter a cotação para este símbolo'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Erro na função get-stock-quote:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor. Tente novamente.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});