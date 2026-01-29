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

const ADMIN_EMAIL = 'kakaverzeque@gmail.com';
const ALLOWED_IP = '200.52.28.228';

function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  return 'unknown';
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {

    const clientIP = getClientIP(req);
    if (clientIP !== ALLOWED_IP && clientIP !== 'unknown') {
      console.warn(`Unauthorized IP attempt: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação não fornecido' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const sessionToken = authHeader.replace('Bearer ', '');
    let sessionData;
    try {
      sessionData = JSON.parse(atob(sessionToken));
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (sessionData.email !== ADMIN_EMAIL ||
        !sessionData.verified ||
        sessionData.expiresAt < Date.now()) {
      return new Response(
        JSON.stringify({ error: 'Sessão expirada ou inválida' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { feedbackId, status, adminNotes } = await req.json();

    if (!feedbackId) {
      return new Response(
        JSON.stringify({ error: 'ID do feedback é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
    }

    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes;
    }

    const { error } = await supabaseAdmin
      .from('user_feedback')
      .update(updateData)
      .eq('id', feedbackId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in update-admin-feedback:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});