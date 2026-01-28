import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { CategoryForm } from "@/components/transactions/CategoryForm";
import { ImportCSV } from "@/components/transactions/ImportCSV";
import { ImportPDF } from "@/components/transactions/ImportPDF";
import {
  ArrowDownUp,
  Calendar,
  Download,
  Upload,
  FileText,
  Filter,
  Plus,
  Search,
  ShoppingCart,
  Coffee,
  Home,
  Car,
  DollarSign,
  CreditCard,
  Briefcase,
  Trash2,
  Pencil,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useTransactions,
  Transaction as TransactionType,
  TransactionFormData
} from "@/hooks/useTransactions";
import { useCategories, CategoryFormData } from "@/hooks/useCategories";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useFormatters } from "@/hooks/useFormatters";
import { useConvertedTransactions } from "@/hooks/useConvertedTransactions";

const Transacoes = () => {
  const { formatCurrency } = useFormatters();

  useEffect(() => {
    document.title = "MoMoney | Transações";
  }, []);

  const {
    transactions,
    loading: loadingTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    exportTransactions
  } = useConvertedTransactions();

  const { categories, addCategory } = useCategories();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentTab, setCurrentTab] = useState("all");
  const [period, setPeriod] = useState("current");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [importCsvOpen, setImportCsvOpen] = useState(false);
  const [importPdfOpen, setImportPdfOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionType | null>(null);

  const filteredTransactions = transactions.filter(transaction => {

    const matchesSearch = searchQuery === "" ||
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" ||
      (typeFilter === "income" && transaction.type === "income") ||
      (typeFilter === "expense" && transaction.type === "expense");

    const matchesTab = currentTab === "all" ||
      (currentTab === "income" && transaction.type === "income") ||
      (currentTab === "expense" && transaction.type === "expense") ||
      (currentTab === "scheduled" && transaction.status === "scheduled");

    return matchesSearch && matchesType && matchesTab;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortDirection === "asc") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const handleAddTransaction = async (data: TransactionFormData) => {
    await addTransaction(data);
    setTransactionFormOpen(false);
  };

  const handleUpdateTransaction = async (data: TransactionFormData) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data);
      setEditingTransaction(null);
    }
  };

  const handleEditTransaction = (transaction: TransactionType) => {
    setEditingTransaction(transaction);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      await deleteTransaction(id);
    }
  };

  const handleAddCategory = async (data: CategoryFormData) => {
    await addCategory(data);
    setCategoryFormOpen(false);
  };

  const handleExport = () => {
    exportTransactions('csv');
  };

  const handleImportTransactions = async (transactions: TransactionFormData[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;

      toast("Importando transações...", {
        duration: transactions.length * 200,
      });

      const batchSize = 10;
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);

        const results = await Promise.all(
          batch.map(async (transaction) => {
            try {
              await addTransaction(transaction);
              return true;
            } catch (error) {
              console.error("Error adding transaction:", error);
              return false;
            }
          })
        );

        successCount += results.filter(Boolean).length;
        errorCount += results.filter(result => !result).length;
      }

      if (errorCount === 0) {
        toast.success(`${successCount} transações importadas com sucesso!`);
      } else {
        toast.info(`${successCount} transações importadas com sucesso, ${errorCount} com erros.`);
      }
    } catch (error) {
      console.error("Error in batch import:", error);
      toast.error("Erro ao importar transações");
    }
  };

  const getCategoryIcon = (type: string, category: string | null = null) => {

    if (type === "income") return DollarSign;
    if (category === "Alimentação") return ShoppingCart;
    if (category === "Café") return Coffee;
    if (category === "Moradia") return Home;
    if (category === "Transporte") return Car;
    if (category === "Salário") return Briefcase;
    if (category === "Freelance") return DollarSign;
    return CreditCard;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Concluída</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Agendada</Badge>;
      default:
        return null;
    }
  };

  const getPaymentMethodName = (method: string | null) => {
    if (!method) return "";

    const methods: Record<string, string> = {
      "credit": "Cartão de Crédito",
      "debit": "Cartão de Débito",
      "cash": "Dinheiro",
      "transfer": "Transferência",
      "pix": "Pix"
    };

    return methods[method] || method;
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "";
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "";
  };

  return (
    <DashboardLayout activePage="Transações">
      <div className="grid gap-6">
        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">Transações</h1>
            <p className="text-muted-foreground">Visualize e gerencie todas as suas transações financeiras</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" onClick={() => setImportCsvOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
            <Button variant="default" className="bg-gradient-to-r from-primary to-primary/80" onClick={() => setImportPdfOpen(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Importar Extrato com IA
            </Button>
            <Button variant="outline" onClick={() => setCategoryFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
            <Button onClick={() => setTransactionFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        </div>

        <Card className="w-full animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle>Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Pesquisar transações..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <div className="w-40">
                  <Select onValueChange={setTypeFilter} defaultValue="all">
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="income">Entradas</SelectItem>
                      <SelectItem value="expense">Saídas</SelectItem>
                      <SelectItem value="scheduled">Agendadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-40">
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger>
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Mês Atual</SelectItem>
                      <SelectItem value="previous">Mês Anterior</SelectItem>
                      <SelectItem value="last3">Últimos 3 Meses</SelectItem>
                      <SelectItem value="last6">Últimos 6 Meses</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
                >
                  <ArrowDownUp className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Tabs defaultValue="all" onValueChange={setCurrentTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="income">Entradas</TabsTrigger>
                <TabsTrigger value="expense">Saídas</TabsTrigger>
                <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {loadingTransactions ? (
                  <div className="flex justify-center py-10">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="mt-2 text-muted-foreground">Carregando transações...</span>
                    </div>
                  </div>
                ) : sortedTransactions.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhuma transação encontrada. Clique em "Nova Transação" para adicionar.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Pagamento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedTransactions.map((transaction) => {
                          const IconComponent = getCategoryIcon(transaction.type, getCategoryName(transaction.category_id));
                          return (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium">
                                {format(parseISO(transaction.date), "dd MMM yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-full ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                                    <IconComponent className={`h-3.5 w-3.5 ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`} />
                                  </div>
                                  {transaction.description}
                                </div>
                              </TableCell>
                              <TableCell>{getCategoryName(transaction.category_id)}</TableCell>
                              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                              <TableCell>{getPaymentMethodName(transaction.payment_method)}</TableCell>
                              <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditTransaction(transaction)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="income">
                {loadingTransactions ? (
                  <div className="flex justify-center py-10">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                      <span className="mt-2 text-gray-500">Carregando transações...</span>
                    </div>
                  </div>
                ) : sortedTransactions.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhuma transação encontrada. Clique em "Nova Transação" para adicionar.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Pagamento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedTransactions.filter(transaction => transaction.type === "income").map((transaction) => {
                          const IconComponent = getCategoryIcon(transaction.type, getCategoryName(transaction.category_id));
                          return (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium">
                                {format(parseISO(transaction.date), "dd MMM yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-full ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                                    <IconComponent className={`h-3.5 w-3.5 ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`} />
                                  </div>
                                  {transaction.description}
                                </div>
                              </TableCell>
                              <TableCell>{getCategoryName(transaction.category_id)}</TableCell>
                              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                              <TableCell>{getPaymentMethodName(transaction.payment_method)}</TableCell>
                              <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditTransaction(transaction)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="expense">
                {loadingTransactions ? (
                  <div className="flex justify-center py-10">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                      <span className="mt-2 text-gray-500">Carregando transações...</span>
                    </div>
                  </div>
                ) : sortedTransactions.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhuma transação encontrada. Clique em "Nova Transação" para adicionar.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Pagamento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedTransactions.filter(transaction => transaction.type === "expense").map((transaction) => {
                          const IconComponent = getCategoryIcon(transaction.type, getCategoryName(transaction.category_id));
                          return (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium">
                                {format(parseISO(transaction.date), "dd MMM yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-full ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                                    <IconComponent className={`h-3.5 w-3.5 ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`} />
                                  </div>
                                  {transaction.description}
                                </div>
                              </TableCell>
                              <TableCell>{getCategoryName(transaction.category_id)}</TableCell>
                              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                              <TableCell>{getPaymentMethodName(transaction.payment_method)}</TableCell>
                              <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditTransaction(transaction)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="scheduled">
                {loadingTransactions ? (
                  <div className="flex justify-center py-10">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                      <span className="mt-2 text-gray-500">Carregando transações...</span>
                    </div>
                  </div>
                ) : sortedTransactions.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhuma transação encontrada. Clique em "Nova Transação" para adicionar.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Pagamento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedTransactions.filter(transaction => transaction.status === "scheduled").map((transaction) => {
                          const IconComponent = getCategoryIcon(transaction.type, getCategoryName(transaction.category_id));
                          return (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium">
                                {format(parseISO(transaction.date), "dd MMM yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-full ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                                    <IconComponent className={`h-3.5 w-3.5 ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`} />
                                  </div>
                                  {transaction.description}
                                </div>
                              </TableCell>
                              <TableCell>{getCategoryName(transaction.category_id)}</TableCell>
                              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                              <TableCell>{getPaymentMethodName(transaction.payment_method)}</TableCell>
                              <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditTransaction(transaction)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <TransactionForm
        open={transactionFormOpen}
        onOpenChange={setTransactionFormOpen}
        onSubmit={handleAddTransaction}
      />

      {editingTransaction && (
        <TransactionForm
          open={!!editingTransaction}
          onOpenChange={(open) => {
            if (!open) setEditingTransaction(null);
          }}
          onSubmit={handleUpdateTransaction}
          initialData={{
            description: editingTransaction.description,
            amount: editingTransaction.amount,
            category_id: editingTransaction.category_id,
            type: editingTransaction.type,
            date: editingTransaction.date,
            payment_method: editingTransaction.payment_method,
            status: editingTransaction.status
          }}
          isEditing={true}
        />
      )}

      <CategoryForm
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        onSubmit={handleAddCategory}
      />

      <ImportCSV
        open={importCsvOpen}
        onOpenChange={setImportCsvOpen}
        onImport={handleImportTransactions}
      />

      <ImportPDF
        open={importPdfOpen}
        onOpenChange={setImportPdfOpen}
        onImport={handleImportTransactions}
      />
    </DashboardLayout>
  );
};

export default Transacoes;