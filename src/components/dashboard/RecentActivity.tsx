import { ShoppingCart, Coffee, Home, Car, CreditCard, DollarSign, TrendingUp, Loader2, Receipt, LucideIcon } from "lucide-react";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { useCategories, Category } from "@/hooks/useCategories";
import { useMemo } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const getCategoryIcon = (categoryName: string | null, transactionType: string): LucideIcon => {
  if (!categoryName) {
    return transactionType === 'income' ? DollarSign : Receipt;
  }
  
  const lowerName = categoryName.toLowerCase();
  
  if (lowerName.includes('alimentação') || lowerName.includes('mercado') || lowerName.includes('supermercado')) {
    return ShoppingCart;
  }
  if (lowerName.includes('café') || lowerName.includes('restaurante') || lowerName.includes('lanche')) {
    return Coffee;
  }
  if (lowerName.includes('moradia') || lowerName.includes('aluguel') || lowerName.includes('casa')) {
    return Home;
  }
  if (lowerName.includes('transporte') || lowerName.includes('combustível') || lowerName.includes('uber') || lowerName.includes('carro')) {
    return Car;
  }
  if (lowerName.includes('investimento') || lowerName.includes('ações') || lowerName.includes('renda')) {
    return TrendingUp;
  }
  if (lowerName.includes('receita') || lowerName.includes('salário')) {
    return DollarSign;
  }
  
  return transactionType === 'income' ? DollarSign : CreditCard;
};

const formatTransactionDate = (dateString: string): string => {
  const date = parseISO(dateString);
  
  if (isToday(date)) {
    return `Hoje, ${format(date, 'HH:mm')}`;
  }
  
  if (isYesterday(date)) {
    return `Ontem, ${format(date, 'HH:mm')}`;
  }
  
  return format(date, "dd/MM/yyyy", { locale: ptBR });
};

const RecentActivity = () => {
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { categories, loading: categoriesLoading } = useCategories();

  const loading = transactionsLoading || categoriesLoading;

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(cat => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 6);
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getIconColorClass = (type: string) => {
    return type === 'income'
      ? "bg-green-500/10 text-green-500" 
      : "bg-red-500/10 text-red-500";
  };

  const getDisplayAmount = (transaction: Transaction) => {
    return transaction.type === 'expense' ? -Math.abs(transaction.amount) : Math.abs(transaction.amount);
  };

  if (loading) {
    return (
      <div className="h-full">
        <h3 className="text-lg font-semibold text-foreground mb-4">Atividade Recente</h3>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (recentTransactions.length === 0) {
    return (
      <div className="h-full">
        <h3 className="text-lg font-semibold text-foreground mb-4">Atividade Recente</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
            <Receipt className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Nenhuma transação registrada.</p>
          <p className="text-muted-foreground text-xs mt-1">Adicione uma transação para começar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <h3 className="text-lg font-semibold text-foreground mb-4">Atividade Recente</h3>
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
        {recentTransactions.map((transaction) => {
          const category = transaction.category_id ? categoryMap.get(transaction.category_id) : null;
          const categoryName = category?.name || null;
          const Icon = getCategoryIcon(categoryName, transaction.type);
          const displayAmount = getDisplayAmount(transaction);

          return (
            <div 
              key={transaction.id} 
              className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center min-w-0">
                <div className={`p-2.5 rounded-xl ${getIconColorClass(transaction.type)} mr-3 flex-shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTransactionDate(transaction.date)} 
                    {categoryName && ` • ${categoryName}`}
                  </p>
                </div>
              </div>
              <p className={`font-semibold text-sm flex-shrink-0 ml-3 ${transaction.type === 'income' ? "text-green-500" : "text-red-500"}`}>
                {formatCurrency(displayAmount)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;
