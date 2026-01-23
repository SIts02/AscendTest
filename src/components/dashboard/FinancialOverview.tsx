import { useTranslation } from "react-i18next";
import { useConvertedFinancialData } from "@/hooks/useConvertedFinancialData";
import { useFormatters } from "@/hooks/useFormatters";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";

const FinancialOverview = () => {
  const { t } = useTranslation();
  const { summary, loading } = useConvertedFinancialData();
  const { formatCurrency } = useFormatters();
  const { resolvedTheme } = useTheme();
  
  const isDark = resolvedTheme === 'dark';
  const textColor = isDark ? 'hsl(215, 20%, 55%)' : 'hsl(215, 16%, 47%)';
  
  // Prepare data for the chart
  const chartData = summary.monthlyData.map(item => ({
    name: item.month,
    income: item.income,
    expense: item.expense,
    balance: item.balance
  }));

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-foreground mb-4">Visão Geral Financeira</h3>
      {loading ? (
        <div className="h-[320px] w-full flex items-center justify-center">
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </div>
      ) : (
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                stroke={textColor} 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })}
                stroke={textColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDark ? 'hsl(220, 40%, 13%)' : 'white',
                  borderColor: isDark ? 'hsl(220, 30%, 22%)' : 'hsl(214, 32%, 91%)',
                  color: isDark ? 'white' : 'hsl(215, 25%, 27%)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  border: '1px solid',
                  padding: '12px',
                  backdropFilter: 'blur(12px)'
                }}
                formatter={(value) => {
                  if (typeof value === 'number' || typeof value === 'string') {
                    return formatCurrency(value);
                  }
                  return value;
                }}
                labelFormatter={(label) => `${label}`}
              />
              <Legend 
                wrapperStyle={{ color: textColor, fontSize: '12px', paddingTop: '16px' }} 
                iconType="circle"
                iconSize={8}
              />
              <Area 
                type="monotone" 
                dataKey="income" 
                stroke="#22c55e" 
                strokeWidth={2}
                fill="url(#incomeGradient)"
                name="Receitas"
                activeDot={{ r: 6, strokeWidth: 2, stroke: isDark ? '#151C2C' : '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="expense" 
                stroke="#ef4444" 
                strokeWidth={2}
                fill="url(#expenseGradient)"
                name="Despesas"
                activeDot={{ r: 6, strokeWidth: 2, stroke: isDark ? '#151C2C' : '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fill="url(#balanceGradient)"
                name="Saldo"
                activeDot={{ r: 6, strokeWidth: 2, stroke: isDark ? '#151C2C' : '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default FinancialOverview;
