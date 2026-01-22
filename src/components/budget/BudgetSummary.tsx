
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BudgetCategory } from '@/hooks/useBudget';
import { useFormatters } from '@/hooks/useFormatters';

interface BudgetSummaryProps {
  budgetCategories: BudgetCategory[];
}

const BudgetSummary: React.FC<BudgetSummaryProps> = ({ budgetCategories }) => {
  const { formatCurrency } = useFormatters();

  // Calculate total budget data
  const totalBudgetMax = budgetCategories.reduce((acc, cat) => acc + cat.max_amount, 0);
  const totalBudgetUsed = budgetCategories.reduce((acc, cat) => acc + cat.current_amount, 0);
  const totalPercentUsed = totalBudgetMax > 0 
    ? Math.round((totalBudgetUsed / totalBudgetMax) * 100) 
    : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Resumo do Orçamento</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-6">
          {/* Total Budget */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Orçamento Total</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(totalBudgetUsed)} / {formatCurrency(totalBudgetMax)}
              </span>
            </div>
            <Progress 
              value={totalPercentUsed} 
              className="h-3 bg-muted"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Utilizado: {totalPercentUsed}%</span>
              <span>Restante: {formatCurrency(totalBudgetMax - totalBudgetUsed)}</span>
            </div>
          </div>

          {/* Status */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <h4 className="text-sm font-medium mb-2 text-foreground">Status do Orçamento</h4>
            {totalPercentUsed < 50 ? (
              <p className="text-xs text-green-600 dark:text-green-400">
                Excelente! Você está controlando bem seus gastos.
              </p>
            ) : totalPercentUsed < 75 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Bom trabalho! Continue acompanhando seus gastos.
              </p>
            ) : totalPercentUsed < 90 ? (
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Atenção! Você está se aproximando do limite do seu orçamento.
              </p>
            ) : (
              <p className="text-xs text-red-600 dark:text-red-400">
                Alerta! Você atingiu ou ultrapassou o limite do seu orçamento.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetSummary;
