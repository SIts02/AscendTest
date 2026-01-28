import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const PLUGGY_WEBHOOK_SECRET = Deno.env.get('PLUGGY_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ALLOWED_EVENT_TYPES = [
    'item/created',
    'item/updated',
    'item/deleted',
    'item/login_error',
    'item/waiting_user_input',
    'account/created',
    'account/updated',
    'account/deleted',
    'transaction/created',
    'transaction/updated',
    'transaction/deleted',
];

interface WebhookPayload {
    event: string;
    data: {
        itemId?: string;
        accountId?: string;
        transactionId?: string;
        status?: string;
        error?: {
            code: string;
            message: string;
        };
    };
}

const verifyWebhookSignature = (
    payload: string,
    signature: string,
    secret: string
): boolean => {
    try {
        const hmac = createHmac('sha256', secret);
        hmac.update(payload);
        const expectedSignature = hmac.digest('hex');

        return signature === expectedSignature;
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
};

const logWebhookEvent = async (
    supabase: any,
    event: string,
    success: boolean,
    itemId?: string,
    error?: string
) => {
    try {
        await supabase.from('pluggy_security_audit').insert({
            event_type: `webhook_${event}`,
            success,
            error_message: error || null,
            metadata: { item_id: itemId },
        });
    } catch (err) {
        console.error('Failed to log webhook event:', err);
    }
};

serve(async (req: Request) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type, x-pluggy-signature',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        if (!PLUGGY_WEBHOOK_SECRET) {
            console.error('PLUGGY_WEBHOOK_SECRET not configured');
            return new Response(
                JSON.stringify({ error: 'Webhook secret not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const signature = req.headers.get('x-pluggy-signature');
        if (!signature) {
            console.error('Missing webhook signature');
            return new Response(
                JSON.stringify({ error: 'Missing signature' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const rawBody = await req.text();

        const isValid = verifyWebhookSignature(rawBody, signature, PLUGGY_WEBHOOK_SECRET);

        if (!isValid) {
            console.error('Invalid webhook signature');
            return new Response(
                JSON.stringify({ error: 'Invalid signature' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const payload: WebhookPayload = JSON.parse(rawBody);

        if (!ALLOWED_EVENT_TYPES.includes(payload.event)) {
            console.warn('Unknown event type:', payload.event);
            return new Response(
                JSON.stringify({ error: 'Unknown event type' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        console.log(`Processing webhook event: ${payload.event}`);

        switch (payload.event) {
            case 'item/created':
            case 'item/updated': {
                const { itemId, status } = payload.data;

                if (!itemId) {
                    throw new Error('Missing itemId in webhook payload');
                }

                await supabase
                    .from('connected_accounts')
                    .update({
                        sync_status: status || 'updated',
                        last_sync_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .match({ item_id: itemId });

                await logWebhookEvent(supabase, payload.event, true, itemId);
                break;
            }

            case 'item/login_error': {
                const { itemId, error } = payload.data;

                if (!itemId) {
                    throw new Error('Missing itemId in webhook payload');
                }

                await supabase
                    .from('connected_accounts')
                    .update({
                        status: 'error',
                        sync_status: 'login_error',
                        security_flags: {
                            last_error: error?.message || 'Login error',
                            last_error_code: error?.code || 'unknown',
                            error_timestamp: new Date().toISOString(),
                        },
                        updated_at: new Date().toISOString(),
                    })
                    .match({ item_id: itemId });

                await logWebhookEvent(
                    supabase,
                    payload.event,
                    true,
                    itemId,
                    error?.message
                );
                break;
            }

            case 'item/deleted': {
                const { itemId } = payload.data;

                if (!itemId) {
                    throw new Error('Missing itemId in webhook payload');
                }

                await supabase
                    .from('connected_accounts')
                    .update({
                        status: 'disconnected',
                        updated_at: new Date().toISOString(),
                    })
                    .match({ item_id: itemId });

                await logWebhookEvent(supabase, payload.event, true, itemId);
                break;
            }

            case 'account/created':
            case 'account/updated': {
                const { accountId } = payload.data;

                if (!accountId) {
                    throw new Error('Missing accountId in webhook payload');
                }

                await logWebhookEvent(supabase, payload.event, true, accountId);
                break;
            }

            case 'transaction/created':
            case 'transaction/updated': {
                const { transactionId } = payload.data;

                if (!transactionId) {
                    throw new Error('Missing transactionId in webhook payload');
                }

                await logWebhookEvent(supabase, payload.event, true, transactionId);
                break;
            }

            default:
                console.log(`Unhandled event type: ${payload.event}`);
        }

        return new Response(
            JSON.stringify({ success: true, event: payload.event }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Webhook processing error:', error);

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        await logWebhookEvent(
            supabase,
            'webhook_error',
            false,
            undefined,
            error.message
        );

        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
