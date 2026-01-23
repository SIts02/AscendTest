import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend 
} from 'recharts';
import { PieChartIcon } from "lucide-react";
import { useConvertedFinancialData } from '@/hooks/useConvertedFinancialData';
import { useFormatters } from '@/hooks/useFormatters';

const COLORS = [
  'hsl(221, 83%, 53%)', // Blue
  'hsl(217, 98%, 53%)', // Blue
  'hsl(142, 76%, 36%)', // Green
  'hsl(38, 92%, 50%)',  // Orange
  'hsl(0, 84%, 60%)',   // Red
  'hsl(199, 89%, 48%)', // Cyan
  'hsl(340, 82%, 52%)', // Pink
  'hsl(25, 95%, 53%)',  // Amber
];

const CategoryDistributionChart = () => {
  const { summary } = useConvertedFinancialData();
  const { formatCurrency, formatPercentage } = useFormatters();

  const chartData = summary.spendingByCategory.slice(0, 8).map((item, index) => ({
    name: item.name,
    value: item.value,
    color: item.color || COLORS[index % COLORS.length],
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = total > 0 ? (data.value / total) * 100 : 0;
      
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <span className="font-medium">{data.name}</span>
          </div>
          <p className="text-sm">
            <span className="font-medium">{formatCurrency(data.value)}</span>
            <span className="text-muted-foreground ml-2">({formatPercentage(percentage)})</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show label for slices < 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Distribuição por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Nenhuma despesa encontrada
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 w-full lg:w-auto">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Total */}
        {chartData.length > 0 && (
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">Total de despesas</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(total)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryDistributionChart;
