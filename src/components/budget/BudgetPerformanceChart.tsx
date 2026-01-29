import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetCategory } from '@/hooks/useBudget';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFormatters } from '@/hooks/useFormatters';
import { useTheme } from 'next-themes';

interface BudgetPerformanceChartProps {
  budgetCategories: BudgetCategory[];
}

const BudgetPerformanceChart: React.FC<BudgetPerformanceChartProps> = ({ budgetCategories }) => {
  const { formatCurrency } = useFormatters();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';
  const textColor = isDark ? 'hsl(215, 20%, 65%)' : 'hsl(215, 16%, 47%)';

  const chartData = budgetCategories.map(category => ({
    name: category.name,
    gasto: category.current_amount,
    limite: category.max_amount,
    disponivel: Math.max(0, category.max_amount - category.current_amount),
    color: category.color
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-4 rounded-xl shadow-lg border border-border">
          <p className="font-semibold mb-2 text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">Performance por Categoria</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 h-[350px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 20,
                left: 0,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id="gastoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.7}/>
                </linearGradient>
                <linearGradient id="disponivelGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.7}/>
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke={textColor}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={11}
                tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })}
                stroke={textColor}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="gasto"
                name="Gasto Atual"
                fill="url(#gastoGradient)"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="disponivel"
                name="Disponível"
                fill="url(#disponivelGradient)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              Adicione categorias e defina limites<br />
              para visualizar a performance do seu orçamento
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetPerformanceChart;