import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, LineChart as LineChartIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ForecastDataPoint } from '@/hooks/useForecasting';
import { addDays, format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Scenario {
    id: string;
    name: string;
    amount: number;
    date: Date;
    type: 'one-time' | 'installments';
    installments?: number;
}

interface ScenarioSimulatorProps {
    currentForecast: ForecastDataPoint[];
}

export function ScenarioSimulator({ currentForecast }: ScenarioSimulatorProps) {
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newScenario, setNewScenario] = useState<Partial<Scenario>>({
        name: '',
        amount: 0,
        date: new Date(),
        type: 'one-time',
    });

    const handleAddScenario = () => {
        if (!newScenario.name || !newScenario.amount) return;

        const scenario: Scenario = {
            id: Math.random().toString(36).substr(2, 9),
            name: newScenario.name,
            amount: newScenario.amount,
            date: newScenario.date || new Date(),
            type: newScenario.type || 'one-time',
            installments: newScenario.installments,
        };

        setScenarios([...scenarios, scenario]);
        setIsModalOpen(false);
        setNewScenario({ name: '', amount: 0, date: new Date(), type: 'one-time' });
    };

    const handleRemoveScenario = (id: string) => {
        setScenarios(scenarios.filter(s => s.id !== id));
    };

    const simulateWithScenarios = () => {
        const modifiedForecast = currentForecast.map(point => ({ ...point }));

        scenarios.forEach(scenario => {
            if (scenario.type === 'one-time') {

                const targetIndex = modifiedForecast.findIndex(
                    p => p.date >= scenario.date
                );

                if (targetIndex !== -1) {
                    for (let i = targetIndex; i < modifiedForecast.length; i++) {
                        modifiedForecast[i].projectedBalance -= scenario.amount;
                    }
                }
            } else {

                const installmentAmount = scenario.amount / (scenario.installments || 1);
                let currentDate = scenario.date;

                for (let i = 0; i < (scenario.installments || 1); i++) {
                    const targetIndex = modifiedForecast.findIndex(
                        p => p.date >= currentDate
                    );

                    if (targetIndex !== -1) {
                        for (let j = targetIndex; j < modifiedForecast.length; j++) {
                            modifiedForecast[j].projectedBalance -= installmentAmount;
                        }
                    }

                    currentDate = addDays(currentDate, 30);
                }
            }
        });

        return modifiedForecast;
    };

    const forecastWithScenarios = scenarios.length > 0
        ? simulateWithScenarios()
        : currentForecast;

    const comparisonData = currentForecast.slice(0, 90).map((point, index) => ({
        date: format(point.date, 'dd/MM'),
        original: point.projectedBalance,
        withScenarios: forecastWithScenarios[index]?.projectedBalance || point.projectedBalance,
    }));

    const minBalanceOriginal = Math.min(...currentForecast.map(d => d.projectedBalance));
    const minBalanceWithScenarios = Math.min(...forecastWithScenarios.map(d => d.projectedBalance));
    const impact = minBalanceOriginal - minBalanceWithScenarios;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <LineChartIcon className="h-5 w-5" />
                            Simulador de Cenários "E Se?"
                        </CardTitle>
                        <CardDescription>
                            Experimente diferentes decisões financeiras e veja o impacto
                        </CardDescription>
                    </div>
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Cenário
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Criar Novo Cenário</DialogTitle>
                                <DialogDescription>
                                    Simule o impacto de uma despesa futura no seu saldo
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Descrição</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ex: Comprar MacBook"
                                        value={newScenario.name}
                                        onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="amount">Valor (R$)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="12000"
                                        value={newScenario.amount}
                                        onChange={(e) => setNewScenario({ ...newScenario, amount: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="date">Data da Compra</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={format(newScenario.date || new Date(), 'yyyy-MM-dd')}
                                        onChange={(e) => setNewScenario({ ...newScenario, date: new Date(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="type">Forma de Pagamento</Label>
                                    <Select
                                        value={newScenario.type}
                                        onValueChange={(value: 'one-time' | 'installments') =>
                                            setNewScenario({ ...newScenario, type: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="one-time">À Vista</SelectItem>
                                            <SelectItem value="installments">Parcelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {newScenario.type === 'installments' && (
                                    <div>
                                        <Label htmlFor="installments">Número de Parcelas</Label>
                                        <Input
                                            id="installments"
                                            type="number"
                                            placeholder="12"
                                            value={newScenario.installments}
                                            onChange={(e) =>
                                                setNewScenario({ ...newScenario, installments: Number(e.target.value) })
                                            }
                                        />
                                    </div>
                                )}
                                <Button onClick={handleAddScenario} className="w-full">
                                    Adicionar Cenário
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {}
                {scenarios.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Cenários Ativos:</h4>
                        {scenarios.map(scenario => (
                            <div
                                key={scenario.id}
                                className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                            >
                                <div>
                                    <p className="font-medium">{scenario.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatCurrency(scenario.amount)} •{' '}
                                        {scenario.type === 'one-time' ? 'À vista' : `${scenario.installments}x`} •{' '}
                                        {format(scenario.date, 'dd/MM/yyyy')}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveScenario(scenario.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {}
                {scenarios.length > 0 && (
                    <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                        <h4 className="font-semibold text-orange-900 mb-2">Análise de Impacto</h4>
                        <div className="space-y-1 text-sm">
                            <p>
                                <span className="text-muted-foreground">Saldo mínimo original:</span>{' '}
                                <span className="font-semibold">{formatCurrency(minBalanceOriginal)}</span>
                            </p>
                            <p>
                                <span className="text-muted-foreground">Saldo mínimo com cenários:</span>{' '}
                                <span className="font-semibold text-orange-600">
                                    {formatCurrency(minBalanceWithScenarios)}
                                </span>
                            </p>
                            <p>
                                <span className="text-muted-foreground">Impacto total:</span>{' '}
                                <span className={`font-semibold ${impact > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {impact > 0 ? '-' : '+'}{formatCurrency(Math.abs(impact))}
                                </span>
                            </p>
                            {minBalanceWithScenarios < 0 && (
                                <p className="text-red-600 font-semibold mt-2">
                                    ⚠️ Risco: Saldo pode ficar negativo!
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {}
                {scenarios.length > 0 ? (
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={comparisonData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11 }}
                                    interval={Math.floor(comparisonData.length / 10)}
                                />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="original"
                                    stroke="#3b82f6"
                                    name="Projeção Original"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="withScenarios"
                                    stroke="#f59e0b"
                                    name="Com Cenários"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-center p-8 text-muted-foreground">
                        <p>Adicione cenários para visualizar o impacto no seu saldo futuro</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}