import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PluggyWidget } from '@/components/open-finance/PluggyWidget';
import { NetWorthDashboard } from '@/components/open-finance/NetWorthDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOpenFinance } from '@/hooks/useOpenFinance';
import { Building2, RefreshCw, Trash2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function OpenFinance() {
    const {
        connectedAccounts,
        accounts,
        deleteConnectedAccount,
        isDeletingAccount,
        syncAccount,
        isSyncing,
    } = useOpenFinance();

    const [selectedTab, setSelectedTab] = useState('dashboard');

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge variant="default" className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" />Ativo</Badge>;
            case 'UPDATING':
                return <Badge variant="secondary"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Atualizando</Badge>;
            case 'LOGIN_ERROR':
                return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Erro de Login</Badge>;
            case 'OUTDATED':
                return <Badge variant="outline"><AlertCircle className="mr-1 h-3 w-3" />Desatualizado</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleDisconnect = (accountId: string, connectorName: string) => {
        if (window.confirm(`Deseja realmente desconectar ${connectorName}?`)) {
            deleteConnectedAccount(accountId);
        }
    };

    return (
        <DashboardLayout activePage="Open Finance">
            <div className="space-y-6">
                {}
                <div>
                    <h1 className="text-3xl font-bold mb-2">Open Finance</h1>
                    <p className="text-muted-foreground">
                        Conecte suas contas bancárias e acompanhe seu patrimônio em tempo real
                    </p>
                </div>

                {}
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="dashboard">Patrimônio</TabsTrigger>
                        <TabsTrigger value="accounts">Contas Conectadas</TabsTrigger>
                        <TabsTrigger value="connect">Conectar Nova</TabsTrigger>
                    </TabsList>

                    {}
                    <TabsContent value="dashboard" className="space-y-6 mt-6">
                        <NetWorthDashboard />

                        {accounts.length === 0 && (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center py-8">
                                        <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">Nenhuma conta conectada</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Conecte suas contas bancárias para visualizar seu patrimônio
                                        </p>
                                        <Button onClick={() => setSelectedTab('connect')}>
                                            Conectar Primeira Conta
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {}
                    <TabsContent value="accounts" className="space-y-6 mt-6">
                        {connectedAccounts.length === 0 ? (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center py-8">
                                        <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">Nenhuma conta conectada</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Comece conectando sua primeira conta bancária
                                        </p>
                                        <Button onClick={() => setSelectedTab('connect')}>
                                            Conectar Agora
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {connectedAccounts.map((connectedAccount) => {
                                    const accountsForThisConnection = accounts.filter(
                                        (acc) => acc.connected_account_id === connectedAccount.id
                                    );

                                    return (
                                        <Card key={connectedAccount.id}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <Building2 className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-lg">{connectedAccount.connector_name}</CardTitle>
                                                            <CardDescription>
                                                                {accountsForThisConnection.length} {accountsForThisConnection.length === 1 ? 'conta' : 'contas'}
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(connectedAccount.status)}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {}
                                                <div className="space-y-2">
                                                    {accountsForThisConnection.map((account) => (
                                                        <div
                                                            key={account.id}
                                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                                        >
                                                            <div>
                                                                <p className="font-medium">{account.name}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {account.subtype || account.type}
                                                                    {account.number && ` • ${account.number}`}
                                                                </p>
                                                            </div>
                                                            <p className="text-lg font-bold">{formatCurrency(Number(account.balance))}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {}
                                                <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                                                    <span>
                                                        Última sincronização:{' '}
                                                        {connectedAccount.last_sync_at
                                                            ? format(new Date(connectedAccount.last_sync_at), "dd/MM/yyyy 'às' HH:mm", {
                                                                locale: ptBR,
                                                            })
                                                            : 'Nunca'}
                                                    </span>
                                                </div>

                                                {}
                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => syncAccount(connectedAccount.item_id)}
                                                        disabled={isSyncing}
                                                    >
                                                        {isSyncing ? (
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <RefreshCw className="mr-2 h-4 w-4" />
                                                        )}
                                                        Sincronizar
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDisconnect(connectedAccount.id, connectedAccount.connector_name)}
                                                        disabled={isDeletingAccount}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Desconectar
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>

                    {}
                    <TabsContent value="connect" className="space-y-6 mt-6">
                        <PluggyWidget
                            onSuccess={() => {
                                setSelectedTab('accounts');
                                toast.success('Aguarde alguns instantes para sincronização completa');
                            }}
                        />

                        <Card className="border-dashed">
                            <CardHeader>
                                <CardTitle className="text-lg">Como funciona?</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>1. <strong>Selecione seu banco</strong> - Escolha entre +400 instituições suportadas</p>
                                <p>2. <strong>Conecte com segurança</strong> - Autentique-se direto no site do seu banco via Open Finance</p>
                                <p>3. <strong>Sincronização automática</strong> - Seus dados são atualizados automaticamente</p>
                                <p>4. <strong>Conciliação inteligente</strong> - Transações são importadas e categorizadas</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}