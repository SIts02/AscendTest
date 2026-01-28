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
    console.log('=== send-admin-otp function called ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    const clientIP = getClientIP(req);
    console.log(`Request from IP: ${clientIP}`);

    if (clientIP !== ALLOWED_IP && clientIP !== 'unknown') {
      console.warn(`Unauthorized IP attempt: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body:', JSON.stringify(requestBody));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Corpo da requisição inválido' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { email } = requestBody;
    console.log('Email received:', email);

    if (!email || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      console.warn(`Unauthorized email attempt: ${email}`);
      return new Response(
        JSON.stringify({ error: 'Email não autorizado' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('Supabase Service Key:', supabaseServiceKey ? 'Set' : 'Missing');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta. Verifique as variáveis de ambiente.' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    try {
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      const { data: recentOtps, error: rateLimitError } = await supabaseAdmin
        .from('admin_otps')
        .select('id')
        .eq('admin_email', ADMIN_EMAIL)
        .gte('created_at', oneMinuteAgo)
        .limit(3);

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError);

        if (rateLimitError.message?.includes('relation') || rateLimitError.message?.includes('does not exist')) {
          console.warn('Table admin_otps may not exist. Continuing anyway...');
        }

      } else if (recentOtps && recentOtps.length >= 3) {
        return new Response(
          JSON.stringify({ error: 'Muitas tentativas. Aguarde 1 minuto.' }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (rateLimitErr) {
      console.error('Error in rate limit check:', rateLimitErr);

    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const encoder = new TextEncoder();
    const data = encoder.encode(otp);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const otpHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    try {
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      console.log('Attempting to save OTP to database...');
      const { error: dbError } = await supabaseAdmin
        .from('admin_otps')
        .insert({
          admin_email: ADMIN_EMAIL,
          otp_hash: otpHash,
          expires_at: expiresAt,
          used: false
        });

      if (dbError) {
        console.error('Error saving OTP:', dbError);

        if (dbError.message?.includes('relation') || dbError.message?.includes('does not exist')) {
          return new Response(
            JSON.stringify({ error: 'Tabela admin_otps não encontrada. Execute a migration primeiro.' }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        throw dbError;
      }
      console.log('OTP saved successfully to database');
    } catch (dbErr: any) {
      console.error('Database error:', dbErr);
      const errorMsg = dbErr?.message?.includes('relation') || dbErr?.message?.includes('does not exist')
        ? 'Tabela admin_otps não encontrada. Execute a migration primeiro.'
        : 'Erro ao salvar código. Tente novamente.';
      return new Response(
        JSON.stringify({ error: errorMsg }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    console.log('RESEND_API_KEY:', RESEND_API_KEY ? 'Set' : 'Missing');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Serviço de email não configurado. Configure a secret RESEND_API_KEY no Supabase.' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      const emailResponse = await fetch('https:
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: ADMIN_EMAIL,
          subject: 'Ascend Admin - Código de Acesso',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Código de Acesso Admin</h2>
              <p>Seu código de acesso temporário é:</p>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="font-size: 32px; letter-spacing: 8px; color: #1f2937; margin: 0;">${otp}</h1>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Este código expira em <strong>5 minutos</strong>.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                Se você não solicitou este código, ignore este email.
              </p>
            </div>
          `
        })
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('Resend API error:', emailResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: `Erro ao enviar email (${emailResponse.status}): ${errorText}` }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      console.log('Email sent successfully via Resend');
    } catch (emailErr: any) {
      console.error('Error sending email:', emailErr);
      return new Response(
        JSON.stringify({ error: `Erro ao enviar email: ${emailErr?.message || 'Erro desconhecido'}` }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`OTP sent to ${ADMIN_EMAIL}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Código enviado com sucesso. Verifique seu email.'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in send-admin-otp:', error);
    console.error('Error stack:', error?.stack);
    return new Response(
      JSON.stringify({ error: `Erro interno do servidor: ${error?.message || 'Erro desconhecido'}` }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});