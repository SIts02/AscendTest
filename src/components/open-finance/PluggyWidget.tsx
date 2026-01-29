import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import { useOpenFinance } from '@/hooks/useOpenFinance';
import { toast } from 'sonner';

declare global {
    interface Window {
        PluggyConnect: any;
    }
}

interface PluggyWidgetProps {
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

export function PluggyWidget({ onSuccess, onError }: PluggyWidgetProps) {
    const [isLoadingSDK, setIsLoadingSDK] = useState(false);
    const pluggyContainerRef = useRef<HTMLDivElement>(null);
    const { createPluggyToken, isCreatingToken } = useOpenFinance();

    useEffect(() => {
        const loadPluggySDK = () => {
            if (window.PluggyConnect) return Promise.resolve();

            setIsLoadingSDK(true);
            return new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.pluggy.ai/pluggy-connect/v4.2.0/pluggy-connect.js';
                script.async = true;

                script.onload = () => {
                    setIsLoadingSDK(false);
                    resolve();
                };

                script.onerror = () => {
                    setIsLoadingSDK(false);
                    toast.error('Erro ao carregar widget Pluggy');
                    reject(new Error('Failed to load Pluggy SDK'));
                };

                document.head.appendChild(script);
            });
        };

        loadPluggySDK();
    }, []);

    const handleOpenWidget = async () => {
        try {

            createPluggyToken(undefined, {
                onSuccess: (data: any) => {
                    const connectToken = data.connectToken;

                    if (!window.PluggyConnect) {
                        toast.error('SDK Pluggy não carregado');
                        return;
                    }

                    const pluggyConnect = new window.PluggyConnect({
                        connectToken,
                        includeSandbox: true,
                        onSuccess: (itemData: any) => {
                            console.log('Pluggy connection success:', itemData);
                            toast.success(`Conta ${itemData.connector.name} conectada!`);
                            onSuccess?.();
                        },
                        onError: (error: any) => {
                            console.error('Pluggy connection error:', error);
                            toast.error('Erro ao conectar conta bancária');
                            onError?.(error);
                        },
                        onClose: () => {
                            console.log('Pluggy widget closed');
                        },
                    });

                    pluggyConnect.init();
                },
                onError: (error: any) => {
                    toast.error(`Erro ao inicializar: ${error.message}`);
                    onError?.(error);
                },
            });
        } catch (error: any) {
            console.error('Error opening Pluggy widget:', error);
            toast.error(error.message || 'Erro ao abrir widget');
            onError?.(error);
        }
    };

    return (
        <Card className="border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5" />
                    Conectar Conta Bancária
                </CardTitle>
                <CardDescription>
                    Conecte suas contas bancárias e de investimento de forma segura via Open Finance
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div ref={pluggyContainerRef} className="space-y-4">
                    <Button
                        onClick={handleOpenWidget}
                        disabled={isCreatingToken || isLoadingSDK}
                        className="w-full"
                    >
                        {isCreatingToken || isLoadingSDK ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isLoadingSDK ? 'Carregando...' : 'Conectando...'}
                            </>
                        ) : (
                            <>
                                <LinkIcon className="mr-2 h-4 w-4" />
                                Adicionar Nova Conta
                            </>
                        )}
                    </Button>

                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>✅ Conexão segura via Open Finance</p>
                        <p>🔒 Seus dados bancários nunca são armazenados</p>
                        <p>🏦 Suporte para +400 instituições financeiras</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}