import { serve } from 'https:
import { createClient } from 'https:
import Stripe from 'https:

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
});

serve(async (req: Request) => {
    try {

        const signature = req.headers.get('stripe-signature');
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

        if (!signature || !webhookSecret) {
            return new Response('Webhook signature missing', { status: 400 });
        }

        const body = await req.text();
        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message);
            return new Response(`Webhook Error: ${err.message}`, { status: 400 });
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        console.log('Stripe webhook event:', event.type);

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(supabaseClient, session);
                break;
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdate(supabaseClient, subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(supabaseClient, subscription);
                break;
            }

            case 'invoice.paid': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaid(supabaseClient, invoice);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoiceFailed(supabaseClient, invoice);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});

async function handleCheckoutCompleted(
    supabase: any,
    session: Stripe.Checkout.Session
) {
    const userId = session.metadata?.user_id;
    const billingCycle = session.metadata?.billing_cycle || 'monthly';

    if (!userId) {
        console.error('No user_id in session metadata');
        return;
    }

    if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        const priceId = subscription.items.data[0].price.id;
        const { data: plan } = await supabase
            .from('subscription_plans')
            .select('id')
            .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
            .single();

        if (plan) {

            await supabase
                .from('user_subscriptions')
                .update({
                    plan_id: plan.id,
                    stripe_subscription_id: subscription.id,
                    stripe_customer_id: session.customer,
                    stripe_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                    stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    status: subscription.status,
                    billing_cycle: billingCycle,
                })
                .eq('user_id', userId);
        }
    }
}

async function handleSubscriptionUpdate(
    supabase: any,
    subscription: Stripe.Subscription
) {
    const customerId = subscription.customer as string;

    const { data: userSub } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan_id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (!userSub) {
        console.error('User subscription not found for customer:', customerId);
        return;
    }

    const priceId = subscription.items.data[0].price.id;
    const { data: plan } = await supabase
        .from('subscription_plans')
        .select('id')
        .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
        .single();

    await supabase
        .from('user_subscriptions')
        .update({
            plan_id: plan?.id || userSub.plan_id,
            stripe_subscription_id: subscription.id,
            stripe_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            stripe_cancel_at_period_end: subscription.cancel_at_period_end,
            status: subscription.status,
        })
        .eq('stripe_customer_id', customerId);
}

async function handleSubscriptionDeleted(
    supabase: any,
    subscription: Stripe.Subscription
) {
    const customerId = subscription.customer as string;

    const { data: freePlan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('name', 'free')
        .single();

    await supabase
        .from('user_subscriptions')
        .update({
            plan_id: freePlan.id,
            stripe_subscription_id: null,
            status: 'canceled',
            canceled_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);
}

async function handleInvoicePaid(supabase: any, invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const { data: userSub } = await supabase
        .from('user_subscriptions')
        .select('user_id, id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (!userSub) return;

    await supabase.from('billing_history').insert({
        user_id: userSub.user_id,
        subscription_id: userSub.id,
        stripe_invoice_id: invoice.id,
        stripe_payment_intent_id: invoice.payment_intent,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'paid',
        description: invoice.description || 'Subscription payment',
        invoice_url: invoice.hosted_invoice_url,
        invoice_pdf_url: invoice.invoice_pdf,
        paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
    });
}

async function handleInvoiceFailed(supabase: any, invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const { data: userSub } = await supabase
        .from('user_subscriptions')
        .select('user_id, id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (!userSub) return;

    await supabase.from('billing_history').insert({
        user_id: userSub.user_id,
        subscription_id: userSub.id,
        stripe_invoice_id: invoice.id,
        stripe_payment_intent_id: invoice.payment_intent,
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'failed',
        description: invoice.description || 'Subscription payment',
    });

    await supabase
        .from('user_subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_customer_id', customerId);
}