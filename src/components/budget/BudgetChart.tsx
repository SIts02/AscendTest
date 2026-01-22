import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetCategory } from '@/hooks/useBudget';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useFormatters } from '@/hooks/useFormatters';

interface BudgetChartProps {
  budgetCategories: BudgetCategory[];
}

const BudgetChart: React.FC<BudgetChartProps> = ({ budgetCategories }) => {
  const { formatCurrency } = useFormatters();
  
  // Prepare data for chart
  const chartData = budgetCategories.map(category => ({
    name: category.name,
    value: category.current_amount,
    color: category.color,
    maxAmount: category.max_amount,
    percentage: category.percentage
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-card p-4 rounded-xl shadow-lg border border-border">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm mt-1">
            <span className="font-bold text-primary">{formatCurrency(data.value)}</span>
            {' '}/{' '}
            <span className="text-muted-foreground">{formatCurrency(data.maxAmount)}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.percentage}% do limite utilizado
          </p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">Distribuição de Gastos</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
      </CardContent>
    </Card>
  );
};

export default BudgetChart;
