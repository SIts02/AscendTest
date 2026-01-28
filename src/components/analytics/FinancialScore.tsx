import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Target,
  PiggyBank,
  BarChart3,
  Wallet,
  Info
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const FinancialScore = () => {
  const { financialScore } = useAnalytics();

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excelente";
    if (score >= 60) return "Bom";
    if (score >= 40) return "Regular";
    return "Precisa Atenção";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const scoreMetrics = [
    {
      label: "Estabilidade da Receita",
      value: financialScore.incomeStability,
      icon: TrendingUp,
      tooltip: "Avalia a consistência da sua receita ao longo do tempo"
    },
    {
      label: "Controle de Gastos",
      value: financialScore.expenseControl,
      icon: Wallet,
      tooltip: "Mede a relação entre gastos e receita"
    },
    {
      label: "Taxa de Poupança",
      value: financialScore.savingsRate,
      icon: PiggyBank,
      tooltip: "Percentual da receita que você consegue poupar"
    },
    {
      label: "Cumprimento do Orçamento",
      value: financialScore.budgetCompliance,
      icon: Target,
      tooltip: "Como você está seguindo seus limites de orçamento"
    },
    {
      label: "Diversificação",
      value: financialScore.diversification,
      icon: BarChart3,
      tooltip: "Diversidade nas suas categorias de gastos"
    }
  ];

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span>Score de Saúde Financeira</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Avaliação geral da sua situação financeira baseada em múltiplos fatores</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative w-32 h-32 mx-auto"
            >
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                {}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                {}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  className={getScoreColor(financialScore.overall)}
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - financialScore.overall / 100)}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - financialScore.overall / 100) }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className={`text-3xl font-bold ${getScoreColor(financialScore.overall)}`}
                  >
                    {financialScore.overall}
                  </motion.div>
                  <div className="text-sm text-muted-foreground">pontos</div>
                </div>
              </div>
            </motion.div>

            <div className="space-y-2">
              <Badge
                variant="outline"
                className={`${getScoreColor(financialScore.overall)} border-current`}
              >
                {getScoreLabel(financialScore.overall)}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Sua saúde financeira está {getScoreLabel(financialScore.overall).toLowerCase()}
              </p>
            </div>
          </div>

          {}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Detalhamento do Score</h4>
            <div className="space-y-3">
              {scoreMetrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <metric.icon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{metric.label}</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{metric.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className={`text-sm font-bold ${getScoreColor(metric.value)}`}>
                      {metric.value}%
                    </span>
                  </div>
                  <div className="relative">
                    <Progress
                      value={metric.value}
                      className="h-2"
                    />
                    <div
                      className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-1000 ${getProgressColor(metric.value)}`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              💡 Dicas para Melhorar
            </h5>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              {financialScore.overall < 60 && (
                <>
                  <li>• Estabeleça um orçamento mensal para cada categoria</li>
                  <li>• Tente poupar pelo menos 20% da sua receita</li>
                  <li>• Diversifique seus gastos em diferentes categorias</li>
                </>
              )}
              {financialScore.overall >= 60 && financialScore.overall < 80 && (
                <>
                  <li>• Continue seguindo seu orçamento rigorosamente</li>
                  <li>• Considere aumentar sua taxa de poupança</li>
                  <li>• Monitore regularmente seus gastos</li>
                </>
              )}
              {financialScore.overall >= 80 && (
                <>
                  <li>• Excelente controle financeiro!</li>
                  <li>• Considere investir o excedente</li>
                  <li>• Mantenha seus bons hábitos</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default FinancialScore;