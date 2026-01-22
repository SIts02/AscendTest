import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

const FinancialInsights = () => {
  const { insights, trendAnalysis } = useAnalytics();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'negative':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Lightbulb className="h-5 w-5 text-blue-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'negative':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span>Análise de Tendências</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                {getTrendIcon(trendAnalysis.income.trend)}
                <span className="font-medium text-foreground">Receitas</span>
              </div>
              <div className={`text-2xl font-bold ${getTrendColor(trendAnalysis.income.trend)}`}>
                {trendAnalysis.income.percentage}%
              </div>
              <div className="text-sm text-muted-foreground">
                {trendAnalysis.income.trend === 'up' ? 'Crescimento' : 
                 trendAnalysis.income.trend === 'down' ? 'Redução' : 'Estável'}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                {getTrendIcon(trendAnalysis.expenses.trend)}
                <span className="font-medium text-foreground">Gastos</span>
              </div>
              <div className={`text-2xl font-bold ${getTrendColor(trendAnalysis.expenses.trend)}`}>
                {trendAnalysis.expenses.percentage}%
              </div>
              <div className="text-sm text-muted-foreground">
                {trendAnalysis.expenses.trend === 'up' ? 'Aumento' : 
                 trendAnalysis.expenses.trend === 'down' ? 'Redução' : 'Estável'}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                {getTrendIcon(trendAnalysis.savings.trend)}
                <span className="font-medium text-foreground">Poupança</span>
              </div>
              <div className={`text-2xl font-bold ${getTrendColor(trendAnalysis.savings.trend)}`}>
                {trendAnalysis.savings.percentage}%
              </div>
              <div className="text-sm text-muted-foreground">
                {trendAnalysis.savings.trend === 'up' ? 'Crescimento' : 
                 trendAnalysis.savings.trend === 'down' ? 'Redução' : 'Estável'}
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <span>Insights Financeiros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-muted mx-auto mb-4" />
              <p className="text-muted-foreground">
                Adicione mais transações para receber insights personalizados
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Alert className={getInsightColor(insight.type)}>
                    <div className="flex items-start space-x-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge 
                            variant="outline"
                            className={
                              insight.type === 'positive' ? 'border-green-500 text-green-700' :
                              insight.type === 'warning' ? 'border-yellow-500 text-yellow-700' :
                              'border-red-500 text-red-700'
                            }
                          >
                            {insight.type === 'positive' ? 'Positivo' :
                             insight.type === 'warning' ? 'Atenção' : 'Ação Necessária'}
                          </Badge>
                        </div>
                        <AlertDescription className="text-sm">
                          {insight.description}
                        </AlertDescription>
                        {insight.actionable && (
                          <div className="bg-white/50 dark:bg-gray-800/50 rounded-md p-3 mt-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              💡 Ação recomendada:
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {insight.actionable}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Alert>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialInsights;