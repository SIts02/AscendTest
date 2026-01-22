import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewInvestmentModal from "@/components/investments/NewInvestmentModal";
import { toast } from "sonner";
import { useFormatters } from "@/hooks/useFormatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useMultipleStockQuotes, calculatePortfolioWithQuotes } from "@/hooks/useStockQuotes";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Investment = {
  id: string;
  user_id: string;
  name: string;
  type: string;
  ticker: string | null;
  quantity: number | null;
  average_price: number;
  purchase_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const Investimentos = () => {
  const [isNewInvestmentModalOpen, setIsNewInvestmentModalOpen] = useState(false);
  const { formatCurrency, formatPercentage } = useFormatters();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    document.title = "MoMoney | Investimentos";
  }, []);

  // Fetch investments
  const { data: investments, isLoading, error } = useQuery({
    queryKey: ['investments'],
    queryFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Investment[];
    },
    enabled: !!user?.id,
  });

  // Get stock tickers for quote fetching
  const stockTickers = useMemo(() => {
    if (!investments) return [];
    return investments
      .filter(inv => inv.type === 'stocks' && inv.ticker)
      .map(inv => inv.ticker);
  }, [investments]);

  // Fetch stock quotes
  const { 
    data: quotes = {}, 
    isLoading: quotesLoading, 
    refetch: refetchQuotes 
  } = useMultipleStockQuotes(stockTickers);

  // Calculate portfolio with real-time quotes
  const portfolio = useMemo(() => {
    if (!investments) return null;
    return calculatePortfolioWithQuotes(investments, quotes);
  }, [investments, quotes]);

  // Add investment mutation
  const addInvestmentMutation = useMutation({
    mutationFn: async (newInvestment: {
      name: string;
      type: string;
      ticker?: string | null;
      quantity?: number | null;
      average_price: number;
      purchase_date: string;
      notes?: string | null;
    }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from('investments')
        .insert([{
          name: newInvestment.name,
          type: newInvestment.type,
          ticker: newInvestment.ticker || null,
          quantity: newInvestment.quantity || null,
          average_price: newInvestment.average_price,
          purchase_date: newInvestment.purchase_date,
          notes: newInvestment.notes || null,
          user_id: user.id,
        } as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Investimento adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      setIsNewInvestmentModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar investimento: ${error.message}`);
    },
  });

  const handleAddInvestment = (investment: any) => {
    addInvestmentMutation.mutate(investment);
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando investimentos..." />;
  }

  if (error) {
    toast.error("Erro ao carregar investimentos");
  }

  const hasQuotesForStocks = stockTickers.length > 0;

  return (
    <DashboardLayout activePage="Investimentos">
      <NewInvestmentModal 
        open={isNewInvestmentModalOpen}
        onOpenChange={setIsNewInvestmentModalOpen}
        onAddInvestment={handleAddInvestment}
      />
      
      <div className="grid gap-6">
        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">Investimentos</h1>
            <p className="text-muted-foreground">Acompanhe o desempenho da sua carteira</p>
          </div>
          <div className="flex gap-3">
            {hasQuotesForStocks && (
              <Button 
                variant="outline" 
                onClick={() => refetchQuotes()}
                disabled={quotesLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${quotesLoading ? 'animate-spin' : ''}`} />
                Atualizar Cotações
              </Button>
            )}
            <Button onClick={() => setIsNewInvestmentModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Investimento
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-100 dark:border-blue-900/30">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Total Investido
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-2">
                {formatCurrency(portfolio?.totalInvested || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-100 dark:border-green-900/30">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                Valor Atual
                {quotesLoading && hasQuotesForStocks && (
                  <Badge variant="outline" className="text-xs">Atualizando...</Badge>
                )}
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400 mt-2">
                {quotesLoading && hasQuotesForStocks ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  formatCurrency(portfolio?.currentValue || 0)
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className={`bg-gradient-to-br ${(portfolio?.totalGainLossPercent || 0) >= 0 
            ? "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-100 dark:border-green-900/30" 
            : "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-100 dark:border-red-900/30"}`}>
            <CardContent className="pt-6">
              <div className={`text-sm font-medium ${(portfolio?.totalGainLossPercent || 0) >= 0 
                ? "text-green-700 dark:text-green-400"
                : "text-red-700 dark:text-red-400"}`}>
                Retorno Total
              </div>
              <div className={`text-2xl font-bold flex items-center mt-2 ${(portfolio?.totalGainLossPercent || 0) >= 0 
                ? "text-green-700 dark:text-green-400"
                : "text-red-700 dark:text-red-400"}`}>
                {quotesLoading && hasQuotesForStocks ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    {(portfolio?.totalGainLossPercent || 0) >= 0 ? (
                      <ArrowUpRight className="h-5 w-5 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 mr-1" />
                    )}
                    {formatPercentage(Math.abs(portfolio?.totalGainLossPercent || 0))}
                  </>
                )}
              </div>
              {portfolio && portfolio.totalGainLoss !== 0 && !quotesLoading && (
                <div className={`text-sm mt-1 ${portfolio.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolio.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(portfolio.totalGainLoss)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Investment list */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Investimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="stocks">Ações</TabsTrigger>
                <TabsTrigger value="fixed_income">Renda Fixa</TabsTrigger>
                <TabsTrigger value="crypto">Criptomoedas</TabsTrigger>
              </TabsList>
              
              {['all', 'stocks', 'fixed_income', 'crypto'].map((tabValue) => (
                <TabsContent key={tabValue} value={tabValue}>
                  <div className="overflow-x-auto">
                    {(() => {
                      const filteredInvestments = tabValue === 'all' 
                        ? portfolio?.investments 
                        : portfolio?.investments.filter(inv => inv.type === tabValue);
                      
                      if (!filteredInvestments || filteredInvestments.length === 0) {
                        return (
                          <div className="text-center text-muted-foreground py-10">
                            {tabValue === 'all' 
                              ? 'Nenhum investimento cadastrado. Clique em "Novo Investimento" para começar!'
                              : `Nenhum investimento de ${tabValue === 'stocks' ? 'ações' : tabValue === 'fixed_income' ? 'renda fixa' : 'criptomoedas'} cadastrado`
                            }
                          </div>
                        );
                      }

                      return (
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4">Nome</th>
                              <th className="text-left py-3 px-4">Ticker</th>
                              <th className="text-right py-3 px-4">Qtd</th>
                              <th className="text-right py-3 px-4">Preço Médio</th>
                              <th className="text-right py-3 px-4">Preço Atual</th>
                              <th className="text-right py-3 px-4">Investido</th>
                              <th className="text-right py-3 px-4">Valor Atual</th>
                              <th className="text-right py-3 px-4">Retorno</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredInvestments.map((inv) => (
                              <tr key={inv.id} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4 font-medium">{inv.name}</td>
                                <td className="py-3 px-4">{inv.ticker || '-'}</td>
                                <td className="py-3 px-4 text-right">{inv.quantity || '-'}</td>
                                <td className="py-3 px-4 text-right">{formatCurrency(inv.average_price)}</td>
                                <td className="py-3 px-4 text-right">
                                  {inv.ticker && quotes[inv.ticker] ? (
                                    <span className="flex items-center justify-end gap-1">
                                      {formatCurrency(inv.currentPrice)}
                                      <span className={`text-xs ${inv.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ({inv.changePercent})
                                      </span>
                                    </span>
                                  ) : (
                                    formatCurrency(inv.currentPrice)
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right">{formatCurrency(inv.invested)}</td>
                                <td className="py-3 px-4 text-right font-medium">
                                  {formatCurrency(inv.currentValue)}
                                </td>
                                <td className={`py-3 px-4 text-right font-medium ${
                                  inv.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {inv.gainLossPercent >= 0 ? '+' : ''}{inv.gainLossPercent.toFixed(2)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Investimentos;
