import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { 
  Sparkles,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useFormatters } from "@/hooks/useFormatters";

const PredictiveAnalysis = () => {
  const { predictiveAnalysis } = useAnalytics();
  const { formatCurrency } = useFormatters();

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return "text-green-600";
    if (confidence >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 70) return "Alta";
    if (confidence >= 50) return "Média";
    return "Baixa";
  };

  const predictions = [
    {
      label: "Receita Prevista",
      value: predictiveAnalysis.nextMonthIncome,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      label: "Gastos Previstos",
      value: predictiveAnalysis.nextMonthExpenses,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20"
    },
    {
      label: "Poupança Projetada",
      value: predictiveAnalysis.projectedSavings,
      icon: Target,
      color: predictiveAnalysis.projectedSavings >= 0 ? "text-green-600" : "text-red-600",
      bgColor: predictiveAnalysis.projectedSavings >= 0 ? 
        "bg-green-50 dark:bg-green-900/20" : 
        "bg-red-50 dark:bg-red-900/20"
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span>Análise Preditiva</span>
          </div>
          <Badge 
            variant="outline" 
            className={`${getConfidenceColor(predictiveAnalysis.confidence)} border-current`}
          >
            Confiança: {getConfidenceLabel(predictiveAnalysis.confidence)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Confidence Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Nível de Confiança</span>
            <span className={`font-bold ${getConfidenceColor(predictiveAnalysis.confidence)}`}>
              {predictiveAnalysis.confidence}%
            </span>
          </div>
          <Progress value={predictiveAnalysis.confidence} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Baseado nos últimos 3 meses de dados financeiros
          </p>
        </div>

        {/* Next Month Predictions */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="h-4 w-4 text-blue-600" />
            <h4 className="font-semibold">Previsões para o Próximo Mês</h4>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {predictions.map((prediction, index) => (
              <motion.div
                key={prediction.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className={`p-4 rounded-lg border ${prediction.bgColor}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full bg-card ${prediction.color}`}>
                      <prediction.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {prediction.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {prediction.label === "Poupança Projetada" ? 
                          (prediction.value >= 0 ? "Economia esperada" : "Déficit previsto") :
                          "Baseado no histórico recente"
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${prediction.color}`}>
                      {formatCurrency(prediction.value)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Insights and Recommendations */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-3 flex items-center">
            <Sparkles className="h-4 w-4 mr-2" />
            Insights Preditivos
          </h5>
          <div className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
            {predictiveAnalysis.projectedSavings > 0 ? (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                <p>
                  Tendência positiva! Você pode economizar{" "}
                  <span className="font-semibold">
                    {formatCurrency(predictiveAnalysis.projectedSavings)}
                  </span>{" "}
                  no próximo mês.
                </p>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                <p>
                  Atenção! Há risco de déficit de{" "}
                  <span className="font-semibold">
                    {formatCurrency(Math.abs(predictiveAnalysis.projectedSavings))}
                  </span>{" "}
                  no próximo mês.
                </p>
              </div>
            )}
            
            {predictiveAnalysis.confidence < 50 && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0" />
                <p>
                  Adicione mais transações para melhorar a precisão das previsões.
                </p>
              </div>
            )}
            
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
              <p>
                As previsões são baseadas em padrões históricos e podem variar com mudanças no comportamento.
              </p>
            </div>
          </div>
        </div>

        {/* Action Items */}
        {predictiveAnalysis.projectedSavings <= 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <h5 className="font-medium text-red-900 dark:text-red-100 mb-2">
              🚨 Ações Recomendadas
            </h5>
            <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
              <li>• Revise e reduza gastos não essenciais</li>
              <li>• Considere fontes adicionais de receita</li>
              <li>• Monitore diariamente seus gastos</li>
              <li>• Ajuste seu orçamento para o próximo mês</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictiveAnalysis;