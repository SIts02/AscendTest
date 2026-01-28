import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Anomaly } from '@/hooks/useAnomalyDetection';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnomalyDetectorProps {
    anomalies: Anomaly[];
    onRefresh?: () => void;
}

export function AnomalyDetector({ anomalies, onRefresh }: AnomalyDetectorProps) {
    const handleAcknowledge = async (anomalyId: string) => {
        const { error } = await supabase
            .from('financial_anomalies')
            .update({
                is_acknowledged: true,
                acknowledged_at: new Date().toISOString()
            })
            .eq('id', anomalyId);

        if (error) {
            toast.error('Erro ao marcar anomalia');
            return;
        }

        toast.success('Anomalia reconhecida');
        onRefresh?.();
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'high':
                return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case 'medium':
                return <AlertCircle className="h-5 w-5 text-orange-500" />;
            default:
                return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high':
                return 'border-red-500 bg-red-50';
            case 'medium':
                return 'border-orange-500 bg-orange-50';
            default:
                return 'border-blue-500 bg-blue-50';
        }
    };

    const unacknowledged = anomalies.filter(a => !a.is_acknowledged);
    const acknowledged = anomalies.filter(a => a.is_acknowledged);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Detecção de Anomalias
                        </CardTitle>
                        <CardDescription>
                            IA identifica gastos fora do padrão
                        </CardDescription>
                    </div>
                    {unacknowledged.length > 0 && (
                        <Badge variant="destructive" className="text-lg px-3 py-1">
                            {unacknowledged.length} novas
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {unacknowledged.length === 0 && acknowledged.length === 0 && (
                    <div className="text-center p-8">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
                        <p className="text-lg font-semibold text-green-700">
                            Sem anomalias detectadas
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Seus gastos estão dentro do esperado
                        </p>
                    </div>
                )}

                {}
                {unacknowledged.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            Alertas Pendentes
                        </h4>
                        {unacknowledged.map(anomaly => (
                            <AnomalyCard
                                key={anomaly.id}
                                anomaly={anomaly}
                                onAcknowledge={handleAcknowledge}
                            />
                        ))}
                    </div>
                )}

                {}
                {acknowledged.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                            <CheckCircle className="h-4 w-4" />
                            Reconhecidas Recentemente
                        </h4>
                        {acknowledged.slice(0, 5).map(anomaly => (
                            <AnomalyCard
                                key={anomaly.id}
                                anomaly={anomaly}
                                isAcknowledged
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface AnomalyCardProps {
    anomaly: Anomaly;
    onAcknowledge?: (id: string) => void;
    isAcknowledged?: boolean;
}

function AnomalyCard({ anomaly, onAcknowledge, isAcknowledged }: AnomalyCardProps) {
    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'high':
                return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case 'medium':
                return <AlertCircle className="h-5 w-5 text-orange-500" />;
            default:
                return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getSeverityBorder = (severity: string) => {
        switch (severity) {
            case 'high':
                return 'border-l-red-500';
            case 'medium':
                return 'border-l-orange-500';
            default:
                return 'border-l-blue-500';
        }
    };

    return (
        <div
            className={`p-4 border-l-4 rounded-lg ${getSeverityBorder(anomaly.severity)} ${isAcknowledged ? 'bg-muted/50 opacity-70' : 'bg-white shadow-sm'
                }`}
        >
            <div className="flex items-start gap-3">
                {getSeverityIcon(anomaly.severity)}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold">{anomaly.description}</h5>
                        <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}>
                            {anomaly.severity === 'high' ? 'Alta' : anomaly.severity === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                    </div>

                    {anomaly.historical_avg && anomaly.current_value && (
                        <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                            <div>
                                <span className="text-muted-foreground">Média histórica:</span>
                                <span className="ml-2 font-semibold">
                                    {formatCurrency(anomaly.historical_avg)}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Valor atual:</span>
                                <span className="ml-2 font-semibold text-orange-600">
                                    {formatCurrency(anomaly.current_value)}
                                </span>
                            </div>
                        </div>
                    )}

                    {anomaly.deviation_percentage && (
                        <div className="text-sm mb-2">
                            <span className="text-muted-foreground">Desvio:</span>
                            <span className="ml-2 font-semibold text-red-600">
                                +{anomaly.deviation_percentage.toFixed(1)}%
                            </span>
                        </div>
                    )}

                    {anomaly.suggested_action && (
                        <p className="text-sm text-muted-foreground italic mb-3">
                            💡 {anomaly.suggested_action}
                        </p>
                    )}

                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            Detectado em {format(new Date(anomaly.detected_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {!isAcknowledged && onAcknowledge && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAcknowledge(anomaly.id)}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Reconhecer
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}