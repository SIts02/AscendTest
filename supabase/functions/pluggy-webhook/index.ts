import { serve } from 'https:
import { createClient } from 'https:

serve(async (req) => {
    try {

        const webhookSecret = Deno.env.get('PLUGGY_WEBHOOK_SECRET');

        if (webhookSecret) {
            const signature = req.headers.get('X-Pluggy-Signature');

        }

        const event = await req.json();
        console.log('Pluggy webhook received:', event);

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const eventType = event.event;

        switch (eventType) {
            case 'item/created':
            case 'item/updated':
                await handleItemUpdate(supabaseClient, event.data);
                break;

            case 'item/deleted':
                await handleItemDeleted(supabaseClient, event.data);
                break;

            case 'item/error':
                await handleItemError(supabaseClient, event.data);
                break;

            case 'accounts/updated':
                await handleAccountsUpdate(supabaseClient, event.data);
                break;

            case 'transactions/created':
            case 'transactions/updated':
                await handleTransactionsUpdate(supabaseClient, event.data);
                break;

            default:
                console.log('Unhandled event type:', eventType);
        }

        return new Response(
            JSON.stringify({ success: true }),
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Webhook processing error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
});

async function handleItemUpdate(supabase: any, itemData: any) {
    const { id, connector, status, clientUserId } = itemData;

    const { error } = await supabase
        .from('connected_accounts')
        .upsert({
            item_id: id,
            user_id: clientUserId,
            connector_id: connector.id,
            connector_name: connector.name,
            status: status === 'UPDATED' ? 'ACTIVE' : status,
            last_sync_at: new Date().toISOString(),
            metadata: itemData,
        }, { onConflict: 'item_id' });

    if (error) {
        console.error('Error upserting connected account:', error);
        throw error;
    }
}

async function handleItemDeleted(supabase: any, itemData: any) {
    const { id } = itemData;

    const { error } = await supabase
        .from('connected_accounts')
        .delete()
        .eq('item_id', id);

    if (error) {
        console.error('Error deleting connected account:', error);
        throw error;
    }
}

async function handleItemError(supabase: any, itemData: any) {
    const { id, error: itemError } = itemData;

    const { error } = await supabase
        .from('connected_accounts')
        .update({
            status: 'LOGIN_ERROR',
            metadata: { ...itemData, last_error: itemError },
        })
        .eq('item_id', id);

    if (error) {
        console.error('Error updating item error status:', error);
    }
}

async function handleAccountsUpdate(supabase: any, accountsData: any) {
    const { itemId, accounts } = accountsData;

    const { data: connectedAccount } = await supabase
        .from('connected_accounts')
        .select('id, user_id')
        .eq('item_id', itemId)
        .single();

    if (!connectedAccount) {
        console.error('Connected account not found for item:', itemId);
        return;
    }

    for (const account of accounts) {
        const { error } = await supabase
            .from('accounts')
            .upsert({
                pluggy_account_id: account.id,
                connected_account_id: connectedAccount.id,
                user_id: connectedAccount.user_id,
                type: account.type,
                subtype: account.subtype,
                name: account.name,
                number: account.number,
                balance: account.balance,
                currency_code: account.currencyCode || 'BRL',
                metadata: account,
            }, { onConflict: 'pluggy_account_id' });

        if (error) {
            console.error('Error upserting account:', error);
        }

        await supabase
            .from('account_balance_history')
            .insert({
                account_id: (await supabase
                    .from('accounts')
                    .select('id')
                    .eq('pluggy_account_id', account.id)
                    .single()).data?.id,
                user_id: connectedAccount.user_id,
                balance: account.balance,
                date: new Date().toISOString().split('T')[0],
            });
    }
}

async function handleTransactionsUpdate(supabase: any, transactionsData: any) {
    const { accountId, transactions } = transactionsData;

    const { data: account } = await supabase
        .from('accounts')
        .select('id, user_id')
        .eq('pluggy_account_id', accountId)
        .single();

    if (!account) {
        console.error('Account not found for transactions update:', accountId);
        return;
    }

    for (const txn of transactions) {
        const { error } = await supabase
            .from('transactions')
            .upsert({
                pluggy_transaction_id: txn.id,
                user_id: account.user_id,
                account_id: account.id,
                description: txn.description,
                amount: Math.abs(txn.amount),
                type: txn.amount < 0 ? 'expense' : 'income',
                date: txn.date,
                external_id: txn.id,
                is_reconciled: false,
                category_id: null,
            }, { onConflict: 'pluggy_transaction_id' });

        if (error && !error.message.includes('duplicate')) {
            console.error('Error upserting transaction:', error);
        }
    }
}