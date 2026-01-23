import { useState } from "react";
import { ChartContainer } from "@/components/ui/chart";
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, Filter, FileBarChart, Calendar } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useConvertedFinancialData } from "@/hooks/useConvertedFinancialData";
import { useFormatters } from "@/hooks/useFormatters";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";

const CustomTooltip = ({ active, payload }: any) => {
  const { formatCurrency } = useFormatters();
  
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-4 py-3 !rounded-xl shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.color }}></div>
          <span className="font-semibold text-foreground">{payload[0].payload.name}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-primary text-lg">{formatCurrency(payload[0].value)}</span>
          <span className="text-xs text-muted-foreground">{payload[0].payload.percentage}% do total</span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return percent > 0.05 ? (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={11}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

const SpendingAnalysis = () => {
  const [tabView, setTabView] = useState<'categories' | 'merchants'>('categories');
  const { summary, loading } = useConvertedFinancialData();
  const { formatCurrency } = useFormatters();
  const { resolvedTheme } = useTheme();
  
  const isDark = resolvedTheme === 'dark';
  
  const data = tabView === 'categories' ? summary.spendingByCategory : [];
  
  const hasData = data.length > 0;
  const total = hasData ? data.reduce((sum, item) => sum + item.value, 0) : 0;
  
  const dataWithPercentage = hasData ? data.map(item => ({
    ...item,
    percentage: parseFloat(((item.value / total) * 100).toFixed(1))
  })) : [];

  const chartConfig = dataWithPercentage.reduce((config, item) => {
    config[item.name] = {
      label: item.name,
      color: item.color
    };
    return config;
  }, {} as Record<string, { label: string; color: string; }>);

  return (
    <div className="h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <FileBarChart className="h-5 w-5 text-primary flex-shrink-0" />
          Análise de Gastos
        </h3>
        <div className="flex items-center gap-2">
          <Tabs defaultValue="categories" className="w-[200px]" onValueChange={(value) => setTabView(value as 'categories' | 'merchants')}>
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-secondary/50 p-1">
              <TabsTrigger 
                value="categories" 
                className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Categorias
              </TabsTrigger>
              <TabsTrigger 
                value="merchants" 
                className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Locais
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                <Calendar className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl glass-card">
              <DropdownMenuItem>Mês atual</DropdownMenuItem>
              <DropdownMenuItem>Mês anterior</DropdownMenuItem>
              <DropdownMenuItem>Últimos 3 meses</DropdownMenuItem>
              <DropdownMenuItem>Este ano</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-[260px]">
          <Skeleton className="h-[180px] w-[180px] rounded-full" />
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center h-[260px] text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <FileBarChart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h4 className="text-base font-medium text-foreground mb-1">Nenhum dado</h4>
          <p className="text-sm text-muted-foreground max-w-xs">
            Adicione transações para ver a análise
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
          <div className="w-full lg:w-1/2 h-[260px] flex items-center justify-center">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {dataWithPercentage.map((entry, index) => (
                      <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie 
                    data={dataWithPercentage} 
                    cx="50%" 
                    cy="50%" 
                    labelLine={false} 
                    outerRadius={70} 
                    innerRadius={35} 
                    fill="#8884d8" 
                    dataKey="value" 
                    nameKey="name" 
                    paddingAngle={3}
                    label={CustomLabel}
                  >
                    {dataWithPercentage.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#gradient-${index})`}
                        stroke={isDark ? 'hsl(220, 40%, 13%)' : '#fff'}
                        strokeWidth={2}
                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          
          <div className="w-full lg:w-1/2 max-h-[260px] overflow-y-auto">
            <div className="space-y-2">
              {dataWithPercentage.slice(0, 4).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-secondary/30 rounded-xl transition-colors">
                  <div className="flex items-center min-w-0">
                    <div 
                      className="w-3 h-3 rounded-full mr-3 flex-shrink-0" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="truncate text-sm font-medium text-foreground">{item.name}</span>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="font-semibold text-sm text-foreground">{formatCurrency(item.value)}</span>
                    <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                  </div>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-border/50">
                <div className="flex items-center justify-between font-semibold text-sm p-3 bg-primary/5 rounded-xl">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingAnalysis;
