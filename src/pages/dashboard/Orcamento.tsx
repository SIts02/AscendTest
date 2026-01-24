
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BarChart } from "lucide-react";
import { CategoryForm } from "@/components/transactions/CategoryForm"; 
import { useCategories, CategoryFormData } from "@/hooks/useCategories";
import { useBudget } from "@/hooks/useBudget";
import { toast } from "sonner";
import BudgetCategoryCard from "@/components/budget/BudgetCategoryCard";
import BudgetChart from "@/components/budget/BudgetChart";
import BudgetPerformanceChart from "@/components/budget/BudgetPerformanceChart";
import BudgetSummary from "@/components/budget/BudgetSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { useConvertedBudget } from "@/hooks/useConvertedBudget";

const Orcamento = () => {
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const { addCategory } = useCategories();
  const { budgetCategories: rawBudgetCategories, loading, error, updateBudgetLimit } = useBudget();
  
  // Usar o hook de conversão de moeda
  const { convertedBudget: budgetCategories } = useConvertedBudget(rawBudgetCategories);
  
  useEffect(() => {
    document.title = "MoMoney | Orçamento";
  }, []);

  const handleAddCategory = async (data: CategoryFormData) => {
    try {
      await addCategory(data);
      toast.success("Categoria adicionada com sucesso!");
      setCategoryFormOpen(false);
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error);
      toast.error("Erro ao adicionar categoria");
    }
  };

  return (
    <DashboardLayout activePage="Orçamento">
      {/* Formulário para adicionar categoria */}
      <CategoryForm 
        open={categoryFormOpen} 
        onOpenChange={setCategoryFormOpen}
        onSubmit={handleAddCategory}
        isEditing={false}
      />
      
      <div className="grid gap-6">
        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">Orçamento</h1>
            <p className="text-muted-foreground">Acompanhe e gerencie seus gastos mensais</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setCategoryFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Budget summary card */}
          <div className="md:col-span-1">
            {loading ? (
              <Card>
                <CardContent className="pt-6">
                  <Skeleton className="h-[200px] w-full" />
                </CardContent>
              </Card>
            ) : (
              <BudgetSummary budgetCategories={budgetCategories} />
            )}
          </div>
          
          {/* Budget chart card */}
          <div className="md:col-span-2">
            {loading ? (
              <Card>
                <CardContent className="pt-6">
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            ) : (
              <BudgetChart budgetCategories={budgetCategories} />
            )}
          </div>
        </div>

        {/* New budget performance chart */}
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-[350px] w-full" />
              </CardContent>
            </Card>
          ) : (
            <BudgetPerformanceChart budgetCategories={budgetCategories} />
          )}
        </div>

        {/* Budget categories grid */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Categorias de Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-[100px] w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-6 text-red-500">
                Erro ao carregar categorias: {error}
              </div>
            ) : budgetCategories.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="mb-4">Você ainda não tem categorias de orçamento configuradas.</p>
                <Button variant="outline" onClick={() => setCategoryFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar categoria
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {budgetCategories.map((category) => (
                  <BudgetCategoryCard 
                    key={category.id} 
                    category={category} 
                    onUpdateLimit={updateBudgetLimit}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Orcamento;
