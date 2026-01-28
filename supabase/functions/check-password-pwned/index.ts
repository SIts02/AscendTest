import { serve } from "https:

function getCorsHeaders(request: Request) {
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',').map(o => o.trim()) || [];
  const requestOrigin = request.headers.get('Origin');

  let corsOrigin: string;

  if (allowedOrigins.length === 0) {
    corsOrigin = '*';
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    corsOrigin = requestOrigin;
  } else {
    corsOrigin = allowedOrigins[0] || '*';
  }

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

async function sha1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { password } = await req.json();

    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Senha não fornecida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hash = await sha1(password);

    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const response = await fetch(
      `https:
      {
        headers: {
          'User-Agent': 'Ascend-Password-Checker',
          'Add-Padding': 'true',
        },
      }
    );

    if (!response.ok) {
      console.error('HaveIBeenPwned API error:', response.status);

      return new Response(
        JSON.stringify({
          isPwned: false,
          count: 0,
          warning: 'Não foi possível verificar a senha. Prosseguindo por segurança.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.text();

    const lines = data.split('\n');
    let count = 0;

    for (const line of lines) {
      const [hashSuffix, occurrences] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        count = parseInt(occurrences.trim(), 10);
        break;
      }
    }

    const isPwned = count > 0;

    return new Response(
      JSON.stringify({
        isPwned,
        count,
        message: isPwned
          ? `Esta senha apareceu em ${count.toLocaleString()} vazamentos de dados. Escolha outra senha.`
          : 'Senha segura - não encontrada em vazamentos conhecidos.'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error checking password:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro ao verificar senha',
        isPwned: false,
        count: 0
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});