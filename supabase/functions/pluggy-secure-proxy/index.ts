import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PLUGGY_CLIENT_ID = Deno.env.get('PLUGGY_CLIENT_ID');
const PLUGGY_CLIENT_SECRET = Deno.env.get('PLUGGY_CLIENT_SECRET');
const PLUGGY_API_URL = 'https://api.pluggy.ai';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SecurityContext {
    userId: string;
    ipAddress: string;
    userAgent: string;
    requestPath: string;
}

const logSecurityEvent = async (
    supabase: any,
    context: SecurityContext,
    eventType: string,
    success: boolean,
    errorMessage?: string,
    metadata?: Record<string, any>
) => {
    await supabase.rpc('log_pluggy_security_event', {
        p_user_id: context.userId,
        p_event_type: eventType,
        p_ip_address: context.ipAddress,
        p_user_agent: context.userAgent,
        p_request_path: context.requestPath,
        p_success: success,
        p_error_message: errorMessage || null,
        p_metadata: metadata || {}
    });
};

const checkRateLimit = async (
    supabase: any,
    userId: string,
    endpoint: string
): Promise<boolean> => {
    const { data, error } = await supabase.rpc('check_pluggy_rate_limit', {
        p_user_id: userId,
        p_endpoint: endpoint,
        p_max_requests: 10,
        p_window_minutes: 5
    });

    if (error) {
        console.error('Rate limit check error:', error);
        return false;
    }

    return data === true;
};

const getPluggyApiKey = async (): Promise<string> => {
    if (!PLUGGY_CLIENT_ID || !PLUGGY_CLIENT_SECRET) {
        throw new Error('Pluggy credentials not configured');
    }

    const response = await fetch(`${PLUGGY_API_URL}/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            clientId: PLUGGY_CLIENT_ID,
            clientSecret: PLUGGY_CLIENT_SECRET,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to authenticate with Pluggy');
    }

    const data = await response.json();
    return data.apiKey;
};

const encryptData = (data: string, userKey: string): string => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const keyBuffer = encoder.encode(userKey);

    const encrypted = new Uint8Array(dataBuffer.length);
    for (let i = 0; i < dataBuffer.length; i++) {
        encrypted[i] = dataBuffer[i] ^ keyBuffer[i % keyBuffer.length];
    }

    return btoa(String.fromCharCode(...encrypted));
};

serve(async (req: Request) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        const supabaseClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const url = new URL(req.url);
        const action = url.searchParams.get('action') || 'unknown';

        const context: SecurityContext = {
            userId: user.id,
            ipAddress,
            userAgent,
            requestPath: url.pathname + url.search,
        };

        const rateLimitOk = await checkRateLimit(supabaseAdmin, user.id, action);
        if (!rateLimitOk) {
            await logSecurityEvent(
                supabaseAdmin,
                context,
                'rate_limit_exceeded',
                false,
                'Too many requests'
            );

            return new Response(
                JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const body = await req.json();

        switch (action) {
            case 'create_connect_token': {
                const apiKey = await getPluggyApiKey();

                const response = await fetch(`${PLUGGY_API_URL}/connect_token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-KEY': apiKey,
                    },
                    body: JSON.stringify({
                        clientUserId: user.id,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to create Pluggy connect token');
                }

                const data = await response.json();

                const { data: keyData } = await supabaseAdmin
                    .from('user_encryption_keys')
                    .select('encrypted_key')
                    .eq('user_id', user.id)
                    .single();

                if (!keyData) {
                    const newKey = crypto.randomUUID();
                    await supabaseAdmin.from('user_encryption_keys').insert({
                        user_id: user.id,
                        encrypted_key: encryptData(newKey, SUPABASE_SERVICE_KEY),
                        key_salt: crypto.randomUUID(),
                    });
                }

                await supabaseAdmin.from('pluggy_session_tokens').insert({
                    user_id: user.id,
                    encrypted_token: encryptData(data.accessToken, SUPABASE_SERVICE_KEY),
                    expires_at: new Date(Date.now() + 3600000).toISOString(),
                    ip_address: ipAddress,
                    user_agent: userAgent,
                });

                await logSecurityEvent(
                    supabaseAdmin,
                    context,
                    'connect_token_created',
                    true,
                    undefined,
                    { token_id: data.id }
                );

                return new Response(
                    JSON.stringify({ accessToken: data.accessToken }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            case 'sync_accounts': {
                const { itemId } = body;

                if (!itemId) {
                    throw new Error('Missing itemId');
                }

                const apiKey = await getPluggyApiKey();

                const accountsResponse = await fetch(`${PLUGGY_API_URL}/accounts?itemId=${itemId}`, {
                    headers: { 'X-API-KEY': apiKey },
                });

                if (!accountsResponse.ok) {
                    throw new Error('Failed to fetch accounts from Pluggy');
                }

                const accounts = await accountsResponse.json();

                await logSecurityEvent(
                    supabaseAdmin,
                    context,
                    'accounts_synced',
                    true,
                    undefined,
                    { account_count: accounts.results?.length || 0 }
                );

                return new Response(
                    JSON.stringify({ success: true, count: accounts.results?.length || 0 }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            case 'disconnect': {
                const { itemId } = body;

                if (!itemId) {
                    throw new Error('Missing itemId');
                }

                const apiKey = await getPluggyApiKey();

                await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
                    method: 'DELETE',
                    headers: { 'X-API-KEY': apiKey },
                });

                await supabaseAdmin
                    .from('connected_accounts')
                    .update({ status: 'disconnected', updated_at: new Date().toISOString() })
                    .eq('user_id', user.id)
                    .eq('encrypted_item_id', encryptData(itemId, SUPABASE_SERVICE_KEY));

                await logSecurityEvent(
                    supabaseAdmin,
                    context,
                    'account_disconnected',
                    true,
                    undefined,
                    { item_id: itemId }
                );

                return new Response(
                    JSON.stringify({ success: true }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            default:
                return new Response(
                    JSON.stringify({ error: 'Invalid action' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
        }
    } catch (error: any) {
        console.error('Pluggy secure proxy error:', error);

        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
