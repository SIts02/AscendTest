import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useForecasting } from '@/hooks/useForecasting';
import { useAnomalyDetection } from '@/hooks/useAnomalyDetection';
import { ForecastTimeline } from '@/components/forecasting/ForecastTimeline';
import { ScenarioSimulator } from '@/components/forecasting/ScenarioSimulator';
import { AnomalyDetector } from '@/components/forecasting/AnomalyDetector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, AlertTriangle, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type ForecastDays = 30 | 60 | 90;

export default function Forecasting() {
    const [forecastDays, setForecastDays] = useState<ForecastDays>(30);
    const { forecastData, isLoading, recalculate, isRecalculating } = useForecasting({
        days: forecastDays,
        includeRecurring: true,
    });
    const { anomalies, isLoading: anomaliesLoading, detectAnomalies, unacknowledgedCount } = useAnomalyDetection();

    return (
        <DashboardLayout activePage="Previsões">
            <div className="space-y-6">
                {}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <TrendingUp className="h-8 w-8" />
                            Inteligência Preditiva
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Projeções de saldo, cenários e detecção de anomalias
                        </p>
                    </div>

                    {}
                    <div className="flex gap-3">
                        <Select
                            value={forecastDays.toString()}
                            onValueChange={(value) => setForecastDays(Number(value) as ForecastDays)}
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30">30 dias</SelectItem>
                                <SelectItem value="60">60 dias</SelectItem>
                                <SelectItem value="90">90 dias</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button onClick={() => detectAnomalies()} variant="outline">
                            <Play className="mr-2 h-4 w-4" />
                            Detectar Anomalias
                        </Button>
                    </div>
                </div>

                {}
                {unacknowledgedCount > 0 && (
                    <Card className="border-orange-500 border-l-4 bg-orange-50">
                        <CardContent className="py-4">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-6 w-6 text-orange-600" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-orange-900">
                                        {unacknowledgedCount} {unacknowledgedCount === 1 ? 'anomalia detectada' : 'anomalias detectadas'}
                                    </h4>
                                    <p className="text-sm text-orange-700">
                                        Gastos fora do padrão foram identificados pela IA
                                    </p>
                                </div>
                                <Badge variant="destructive" className="text-lg px-4 py-2">
                                    {unacknowledgedCount}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {}
                <Tabs defaultValue="timeline" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
                        <TabsTrigger value="scenarios">Cenários "E Se?"</TabsTrigger>
                        <TabsTrigger value="anomalies">
                            Anomalias
                            {unacknowledgedCount > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                    {unacknowledgedCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {}
                    <TabsContent value="timeline" className="space-y-6">
                        <ForecastTimeline
                            data={forecastData}
                            onRecalculate={recalculate}
                            isRecalculating={isRecalculating}
                        />

                        {}
                        <Card>
                            <CardHeader>
                                <CardTitle>Como funciona a Projeção?</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>
                                    <strong>📊 Algoritmo Preditivo:</strong> Analisamos suas transações recorrentes,
                                    média histórica de gastos e receitas confirmadas para projetar seu saldo futuro.
                                </p>
                                <p>
                                    <strong>🎯 Nível de Confiança:</strong> A confiança da projeção diminui ao longo
                                    do tempo, pois eventos imprevistos podem ocorrer.
                                </p>
                                <p>
                                    <strong>🔄 Atualização Automática:</strong> Sempre que você adiciona novas
                                    transações, o forecast é recalculado automaticamente.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {}
                    <TabsContent value="scenarios" className="space-y-6">
                        <ScenarioSimulator currentForecast={forecastData} />

                        {}
                        <Card>
                            <CardHeader>
                                <CardTitle>💡 Dica: Use antes de grandes compras</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <p>
                                    Antes de fazer uma compra grande (carro, viagem, eletrônico), simule o impacto
                                    no seu saldo futuro. Isso ajuda a evitar surpresas e planejar melhor o parcelamento.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {}
                    <TabsContent value="anomalies" className="space-y-6">
                        <AnomalyDetector anomalies={anomalies} onRefresh={detectAnomalies} />

                        {}
                        <Card>
                            <CardHeader>
                                <CardTitle>Como funciona a Detecção de Anomalias?</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>
                                    <strong>📈 Análise Estatística:</strong> Calculamos a média e o desvio padrão
                                    de gastos por categoria nos últimos 3 meses.
                                </p>
                                <p>
                                    <strong>🚨 Detecção de Outliers:</strong> Transações que ultrapassam 2 desvios
                                    padrão da média são consideradas anomalias.
                                </p>
                                <p>
                                    <strong>🎯 Tipos de Anomalias:</strong>
                                </p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li><strong>Spike:</strong> Gasto muito acima da média</li>
                                    <li><strong>Categoria Incomum:</strong> Gasto em categoria não habitual</li>
                                    <li><strong>Falta de Gasto Esperado:</strong> Transação recorrente não ocorreu</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}