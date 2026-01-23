import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown } from "lucide-react";
import { useConvertedFinancialData } from '@/hooks/useConvertedFinancialData';
import { useFormatters } from '@/hooks/useFormatters';

const NetWorthChart = () => {
  const { summary } = useConvertedFinancialData();
  const { formatCurrency } = useFormatters();

  // Calculate cumulative net worth over time
  const chartData = useMemo(() => {
    let cumulativeBalance = 0;
    
    return summary.monthlyData.map((item) => {
      cumulativeBalance += item.balance;
      return {
        name: item.month,
        netWorth: cumulativeBalance,
        monthlyBalance: item.balance,
      };
    });
  }, [summary.monthlyData]);

  const latestNetWorth = chartData[chartData.length - 1]?.netWorth || 0;
  const previousNetWorth = chartData[chartData.length - 2]?.netWorth || 0;
  const change = latestNetWorth - previousNetWorth;
  const changePercent = previousNetWorth !== 0 
    ? ((change / Math.abs(previousNetWorth)) * 100) 
    : 0;
  const isPositive = latestNetWorth >= 0;
  const isGrowing = change >= 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Patrimônio:</span>
              <span className={`font-medium ${payload[0].value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(payload[0].value)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Saldo do mês:</span>
              <span className={`font-medium ${payload[0].payload.monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(payload[0].payload.monthlyBalance)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isGrowing ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
            Evolução do Patrimônio
          </CardTitle>
          
          {/* Current Net Worth */}
          <div className="text-right">
            <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(latestNetWorth)}
            </p>
            <p className={`text-sm ${isGrowing ? 'text-green-600' : 'text-red-600'}`}>
              {isGrowing ? '+' : ''}{changePercent.toFixed(1)}% vs mês anterior
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Nenhuma transação encontrada
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="5%" 
                    stopColor={isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"} 
                    stopOpacity={0.3}
                  />
                  <stop 
                    offset="95%" 
                    stopColor={isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"} 
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => {
                  if (Math.abs(value) >= 1000) {
                    return `${(value / 1000).toFixed(0)}k`;
                  }
                  return value.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke={isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                strokeWidth={2}
                fill="url(#colorNetWorth)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default NetWorthChart;
