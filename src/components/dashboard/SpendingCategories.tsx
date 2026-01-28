import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { useConvertedFinancialData } from '@/hooks/useConvertedFinancialData';
import { useFormatters } from '@/hooks/useFormatters';
import { Button } from "@/components/ui/button";
import { PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { useTheme } from "next-themes";

const SpendingCategories = () => {
  const { t } = useTranslation();
  const { summary, loading } = useConvertedFinancialData();
  const { formatCurrency } = useFormatters();
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';
  const textColor = isDark ? 'hsl(215, 20%, 55%)' : 'hsl(215, 16%, 47%)';

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#0284c7', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'];

  const chartData = summary.spendingByCategory.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: COLORS[index % COLORS.length]
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card px-4 py-3 !rounded-xl shadow-lg">
          <p className="font-medium text-foreground">{payload[0].name || payload[0].payload?.name}</p>
          <p className="text-sm font-bold text-primary">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Categorias de Gastos</h3>
        <div className="flex gap-1">
          <Button
            variant={chartType === 'pie' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setChartType('pie')}
            className="h-8 w-8 p-0 rounded-xl"
          >
            <PieChartIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={chartType === 'bar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setChartType('bar')}
            className="h-8 w-8 p-0 rounded-xl"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="h-[260px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Skeleton className="h-[180px] w-[180px] rounded-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhum dado de categoria disponível
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <defs>
                  {chartData.map((entry, index) => (
                    <linearGradient key={`pieGradient-${index}`} id={`pieGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={0.9}/>
                      <stop offset="100%" stopColor={entry.color} stopOpacity={1}/>
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={70}
                  innerRadius={35}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={3}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#pieGradient-${index})`}
                      stroke={isDark ? 'hsl(220, 40%, 13%)' : '#fff'}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ color: textColor, fontSize: '11px' }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  {chartData.map((entry, index) => (
                    <linearGradient key={`barGradient-${index}`} id={`barGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={1}/>
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.7}/>
                    </linearGradient>
                  ))}
                </defs>
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={10}
                  stroke={textColor}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })}
                  stroke={textColor}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#barGradient-${index})`} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SpendingCategories;