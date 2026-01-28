import { serve } from 'https:
import { createClient } from 'https:

serve(async (req) => {
    try {

        const authHeader = req.headers.get('Authorization')!;
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const {
            data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const pluggyClientId = Deno.env.get('PLUGGY_CLIENT_ID');
        const pluggyClientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET');

        if (!pluggyClientId || !pluggyClientSecret) {
            throw new Error('Pluggy credentials not configured');
        }

        const authResponse = await fetch('https:
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientId: pluggyClientId,
                clientSecret: pluggyClientSecret,
            }),
        });

        if (!authResponse.ok) {
            const error = await authResponse.text();
            throw new Error(`Pluggy auth failed: ${error}`);
        }

        const { accessToken } = await authResponse.json();

        const connectTokenResponse = await fetch('https:
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': accessToken,
            },
            body: JSON.stringify({
                clientUserId: user.id,
            }),
        });

        if (!connectTokenResponse.ok) {
            const error = await connectTokenResponse.text();
            throw new Error(`Connect token creation failed: ${error}`);
        }

        const { accessToken: connectToken } = await connectTokenResponse.json();

        return new Response(
            JSON.stringify({
                success: true,
                connectToken,
                message: 'Token criado com sucesso',
            }),
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error creating Pluggy token:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
});