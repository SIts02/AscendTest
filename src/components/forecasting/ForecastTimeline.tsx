import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { ForecastDataPoint } from '@/hooks/useForecasting';

interface ForecastTimelineProps {
    data: ForecastDataPoint[];
    onRecalculate?: () => void;
    isRecalculating?: boolean;
}

export function ForecastTimeline({ data, onRecalculate, isRecalculating }: ForecastTimelineProps) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        Nenhuma projeção disponível. Clique em recalcular para gerar.
                    </p>
                    <Button onClick={onRecalculate} className="mt-4">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Calcular Projeção
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const chartData = data.map(point => ({
        date: format(point.date, 'dd/MMM', { locale: ptBR }),
        fullDate: point.date,
        balance: point.projectedBalance,
        confidence: point.confidence,
    }));

    const minBalance = Math.min(...data.map(d => d.projectedBalance));
    const maxBalance = Math.max(...data.map(d => d.projectedBalance));
    const currentBalance = data[0]?.projectedBalance || 0;

    const isRisky = minBalance < 0;
    const isWarning = minBalance < currentBalance * 0.2;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Linha do Tempo de Saldo
                        </CardTitle>
                        <CardDescription>
                            Projeção para os próximos {data.length} dias
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRecalculate}
                        disabled={isRecalculating}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
                        Recalcular
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {}
                {isRisky && (
                    <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                            <div>
                                <h4 className="font-semibold text-red-900">Alerta: Risco de Saldo Negativo</h4>
                                <p className="text-sm text-red-700">
                                    Sua projeção indica que o saldo pode ficar negativo em{' '}
                                    {format(data.find(d => d.projectedBalance < 0)?.date || new Date(), 'dd/MM/yyyy')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {!isRisky && isWarning && (
                    <div className="mb-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                            <div>
                                <h4 className="font-semibold text-orange-900">Atenção: Saldo em Queda</h4>
                                <p className="text-sm text-orange-700">
                                    Seu saldo pode cair para {formatCurrency(minBalance)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Saldo Atual</div>
                        <div className="text-xl font-bold text-blue-600">
                            {formatCurrency(currentBalance)}
                        </div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Saldo Máximo</div>
                        <div className="text-xl font-bold text-green-600">
                            {formatCurrency(maxBalance)}
                        </div>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${minBalance < 0 ? 'bg-red-50' : 'bg-yellow-50'
                        }`}>
                        <div className="text-sm text-muted-foreground">Saldo Mínimo</div>
                        <div className={`text-xl font-bold ${minBalance < 0 ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                            {formatCurrency(minBalance)}
                        </div>
                    </div>
                </div>

                {}
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                interval={Math.floor(chartData.length / 10)}
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => formatCurrency(value, true)}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                                                <p className="font-semibold">
                                                    {format(data.fullDate, 'dd/MM/yyyy', { locale: ptBR })}
                                                </p>
                                                <p className="text-sm">
                                                    Saldo: <span className="font-bold">{formatCurrency(data.balance)}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Confiança: {(data.confidence * 100).toFixed(0)}%
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <ReferenceLine
                                y={0}
                                stroke="red"
                                strokeDasharray="3 3"
                                label={{ value: 'Zero', position: 'right' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="balance"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fill="url(#balanceGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        <strong>Nível de Confiança:</strong> As projeções são baseadas em transações recorrentes
                        e médias históricas. A confiança diminui quanto mais distante a data projetada.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}