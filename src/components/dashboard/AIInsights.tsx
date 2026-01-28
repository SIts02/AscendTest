import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from "lucide-react";

const insights = [
  {
    id: 1,
    title: "Padrão de gasto excessivo detectado",
    description: "Identificamos um aumento de 28% em gastos com delivery nos últimos 30 dias comparado à sua média histórica. Considere reduzir a frequência de pedidos para atingir sua meta de economia.",
    type: "alert",
    icon: AlertTriangle,
    color: "red"
  },
  {
    id: 2,
    title: "Oportunidade de investimento",
    description: "Com base no seu perfil conservador e no seu saldo disponível, recomendamos alocar R$ 1.500 em um CDB com liquidez diária e rentabilidade de 102% do CDI.",
    type: "opportunity",
    icon: TrendingUp,
    color: "green"
  },
  {
    id: 3,
    title: "Economia potencial identificada",
    description: "Você está pagando R$ 59,90 por mês em uma assinatura de streaming que não utiliza há 3 meses. Cancelando este serviço, você economizaria R$ 718,80 por ano.",
    type: "saving",
    icon: Lightbulb,
    color: "amber"
  },
  {
    id: 4,
    title: "Alerta de orçamento",
    description: "Você já utilizou 85% do seu orçamento mensal para Alimentação, e ainda faltam 12 dias para o fechamento do mês. Considere ajustar seus gastos para evitar estourar o limite.",
    type: "alert",
    icon: TrendingDown,
    color: "orange"
  },
];

const additionalInsights = [
  {
    id: 5,
    title: "Dica fiscal",
    description: "Baseado nos seus gastos com saúde, você pode deduzir aproximadamente R$ 3.200 no seu próximo Imposto de Renda, resultando em uma restituição estimada de R$ 960.",
    type: "opportunity",
    icon: TrendingUp,
    color: "blue"
  },
  {
    id: 6,
    title: "Inadimplência evitada",
    description: "Detectamos que sua fatura do cartão de crédito vence em 3 dias e você ainda não possui saldo suficiente na conta principal. Recomendamos uma transferência de R$ 1.750 da sua reserva de emergência.",
    type: "alert",
    icon: AlertTriangle,
    color: "red"
  },
];

type InsightType = {
  id: number;
  title: string;
  description: string;
  type: string;
  icon: React.ElementType;
  color: string;
};

const AIInsights = () => {
  const [currentInsights, setCurrentInsights] = useState<InsightType[]>(insights);
  const [loading, setLoading] = useState(false);

  const handleAskMore = () => {
    setLoading(true);

    setTimeout(() => {
      setCurrentInsights([...currentInsights, ...additionalInsights]);
      setLoading(false);
    }, 1500);
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'green': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'blue': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'amber': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'orange': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="animate-fade-in reveal-delay-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center">
          <Bot className="mr-2 h-6 w-6 text-primary" />
          <CardTitle className="text-lg font-medium">Insights Inteligentes</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentInsights.map((insight) => (
            <div
              key={insight.id}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-card"
            >
              <div className="flex items-start">
                <div className={`p-2 rounded-full ${getColorClass(insight.color)} mr-3`}>
                  <insight.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    <h3 className="font-medium text-foreground">{insight.title}</h3>
                    <Badge
                      variant="outline"
                      className={`ml-2 ${
                        insight.type === 'alert'
                          ? 'border-red-300 text-red-700 dark:border-red-800 dark:text-red-400'
                          : insight.type === 'opportunity'
                            ? 'border-green-300 text-green-700 dark:border-green-800 dark:text-green-400'
                            : 'border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400'
                      }`}
                    >
                      {insight.type === 'alert'
                        ? 'Alerta'
                        : insight.type === 'opportunity'
                          ? 'Oportunidade'
                          : 'Economia'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={handleAskMore}
            disabled={loading || currentInsights.length > insights.length}
            className="group"
          >
            {loading ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-momoney-500 border-t-transparent rounded-full"></span>
                Analisando...
              </span>
            ) : currentInsights.length > insights.length ? (
              "Todos os insights exibidos"
            ) : (
              <span className="flex items-center">
                <Sparkles className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                Gerar mais insights
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIInsights;