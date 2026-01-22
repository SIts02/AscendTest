import { Button } from "@/components/ui/button";
import { CalendarDays, CreditCard, Check, Clock, AlertCircle, Loader2, Receipt } from "lucide-react";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { useCategories, Category } from "@/hooks/useCategories";
import { useMemo } from "react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const UpcomingTransactions = () => {
  const navigate = useNavigate();
  const { transactions, loading: transactionsLoading, updateTransaction } = useTransactions();
  const { categories, loading: categoriesLoading } = useCategories();

  const loading = transactionsLoading || categoriesLoading;

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(cat => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const upcomingTransactions = useMemo(() => {
    const today = startOfDay(new Date());
    
    return transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        if (t.status !== 'pending' && t.status !== 'scheduled') return false;
        return true;
      })
      .map(t => {
        const transactionDate = startOfDay(parseISO(t.date));
        let displayStatus = t.status;
        
        if (isBefore(transactionDate, today) && t.status === 'pending') {
          displayStatus = 'overdue';
        }
        
        return { ...t, displayStatus };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd/MM", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 text-green-500 text-xs font-medium">
            <Check className="h-3 w-3" /> Pago
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-medium">
            <Clock className="h-3 w-3" /> Pendente
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-medium">
            <Clock className="h-3 w-3" /> Agendado
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium">
            <AlertCircle className="h-3 w-3" /> Atrasado
          </span>
        );
      default:
        return null;
    }
  };

  const handleMarkAsPaid = async (transaction: Transaction) => {
    const success = await updateTransaction(transaction.id, { status: 'completed' });
    if (success) {
      toast.success(`"${transaction.description}" marcado como pago!`);
    }
  };

  const handleViewAll = () => {
    navigate('/dashboard/transacoes');
  };

  const total = upcomingTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  if (loading) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <CalendarDays className="h-5 w-5 text-primary" />
            Próximos Pagamentos
          </h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (upcomingTransactions.length === 0) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <CalendarDays className="h-5 w-5 text-primary" />
            Próximos Pagamentos
          </h3>
          <Button variant="ghost" size="sm" onClick={handleViewAll} className="rounded-xl text-xs">
            Ver Todos
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
            <Receipt className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Nenhum pagamento pendente.</p>
          <p className="text-muted-foreground text-xs mt-1">Adicione transações pendentes para vê-las aqui.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <CalendarDays className="h-5 w-5 text-primary" />
          Próximos Pagamentos
        </h3>
        <Button variant="ghost" size="sm" onClick={handleViewAll} className="rounded-xl text-xs">
          Ver Todos
        </Button>
      </div>
      
      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
        {upcomingTransactions.map((transaction) => {
          const category = transaction.category_id ? categoryMap.get(transaction.category_id) : null;
          const categoryName = category?.name || null;

          return (
            <div 
              key={transaction.id} 
              className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center min-w-0 flex-1">
                <div className="p-2.5 rounded-xl bg-red-500/10 mr-3 flex-shrink-0">
                  <CreditCard className="h-4 w-4 text-red-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-foreground truncate">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(transaction.date)}
                    {categoryName && ` • ${categoryName}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                {getStatusBadge(transaction.displayStatus)}
                <span className="font-semibold text-sm text-red-500">
                  {formatCurrency(transaction.amount)}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleMarkAsPaid(transaction)}
                  className="h-7 px-2 rounded-lg text-xs"
                >
                  Pagar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="pt-3 mt-3 border-t border-border/50">
        <div className="flex items-center justify-between font-semibold text-sm p-3 bg-red-500/5 rounded-xl">
          <span className="text-foreground">Total Pendente</span>
          <span className="text-red-500">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
};

export default UpcomingTransactions;
