import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Plus, Download, ArrowRight, Check, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewGoalModal from "@/components/goals/NewGoalModal";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFormatters } from "@/hooks/useFormatters";
import { useGoals, Goal, CreateGoalInput } from "@/hooks/useGoals";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useConvertedGoals } from "@/hooks/useConvertedGoals";

const Metas = () => {
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const { formatCurrency } = useFormatters();
  const {
    goals: rawGoals,
    isLoading,
    error,
    createGoal,
    deleteGoal,
    isCreating,
    stats
  } = useGoals();

  const { convertedGoals: goals } = useConvertedGoals(rawGoals);

  useEffect(() => {
    document.title = "MoMoney | Metas";
  }, []);

  const handleAddGoal = (goalData: {
    name: string;
    category: string;
    targetAmount: number;
    currentAmount: number;
    deadline: Date;
  }) => {
    const input: CreateGoalInput = {
      name: goalData.name,
      category: goalData.category,
      target: goalData.targetAmount,
      current: goalData.currentAmount || 0,
      deadline: goalData.deadline ? format(goalData.deadline, 'yyyy-MM-dd') : null,
    };

    createGoal(input);
    setShowNewGoalModal(false);
  };

  const exportGoals = (exportFormat: 'csv' | 'json' = 'csv') => {
    try {
      if (exportFormat === 'csv') {
        const headers = ['Nome', 'Categoria', 'Valor alvo', 'Valor atual', 'Progresso', 'Data limite', 'Status'];
        const csvRows = [headers.join(',')];

        goals.forEach(goal => {
          const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
          const row = [
            `"${goal.name.replace(/"/g, '""')}"`,
            `"${goal.category.replace(/"/g, '""')}"`,
            goal.target,
            goal.current,
            `${progress.toFixed(1)}%`,
            goal.deadline ? format(new Date(goal.deadline), 'yyyy-MM-dd') : 'N/A',
            `"${goal.status.replace(/"/g, '""')}"`
          ];
          csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `metas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Metas exportadas com sucesso!');
      } else {
        const dataStr = JSON.stringify(goals, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `metas_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Metas exportadas com sucesso!');
      }
    } catch (err: any) {
      console.error('Erro ao exportar metas:', err);
      toast.error('Erro ao exportar metas');
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'savings': '💰',
      'travel': '✈️',
      'education': '🎓',
      'property': '🏠',
      'vehicle': '🚗',
      'other': '📦'
    };
    return icons[category] || '📌';
  };

  const calculateProgress = (goal: Goal) => {
    if (goal.target <= 0) return 0;
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  const renderGoalCard = (goal: Goal, index: number) => {
    const progress = calculateProgress(goal);
    const isCompleted = goal.status === 'concluída' || progress >= 100;

    return (
      <div
        key={goal.id}
        className="animate-fade-in"
        style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
      >
        <Card className="card-hover-effect overflow-hidden h-full flex flex-col">
          <div className={`h-1.5 ${isCompleted ? 'bg-green-500' : 'gradient-bg'}`}></div>
          <CardContent className="pt-6 flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="text-3xl mr-3 animate-pulse-soft">{getCategoryIcon(goal.category)}</span>
                <div>
                  <h3 className="font-medium">{goal.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {goal.deadline
                      ? `Data limite: ${format(new Date(goal.deadline), 'dd MMM yyyy', { locale: ptBR })}`
                      : 'Sem data limite'
                    }
                  </p>
                </div>
              </div>
              <Badge variant={isCompleted ? "secondary" : "default"} className="animate-pulse-soft">
                {goal.status}
              </Badge>
            </div>

            <div className="mt-4 flex-grow">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{formatCurrency(goal.current)}</span>
                <span className="text-muted-foreground">{formatCurrency(goal.target)}</span>
              </div>
              <Progress value={progress} className="h-2 bg-muted" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Progresso: {progress.toFixed(0)}%</span>
                <span>{isCompleted ?
                  <span className="flex items-center text-green-500">
                    <Check className="h-3 w-3 mr-1" /> Concluída
                  </span> : 'Em andamento'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="ghost" className="flex-1 text-primary group">
                <span>Detalhes</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteGoal(goal.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando metas..." />;
  }

  if (error) {
    toast.error("Erro ao carregar metas");
  }

  const activeGoals = goals.filter(g => g.status !== 'concluída' && calculateProgress(g) < 100);
  const completedGoals = goals.filter(g => g.status === 'concluída' || calculateProgress(g) >= 100);

  return (
    <DashboardLayout activePage="Metas">
      <NewGoalModal
        open={showNewGoalModal}
        onOpenChange={setShowNewGoalModal}
        onAddGoal={handleAddGoal}
      />

      <div className="grid gap-6">
        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-2 gradient-text">Metas Financeiras</h1>
            <p className="text-muted-foreground">
              {stats.totalGoals > 0
                ? `${stats.activeCount} em andamento • ${stats.completedCount} concluídas`
                : 'Defina e acompanhe suas metas financeiras'
              }
            </p>
          </div>
          <div className="flex gap-3 animate-fade-in reveal-delay-1">
            <Button
              variant="outline"
              onClick={() => exportGoals('csv')}
              className="minimalist-button group"
              disabled={goals.length === 0}
            >
              <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Exportar
            </Button>
            <Button
              onClick={() => setShowNewGoalModal(true)}
              className="minimalist-button minimalist-button-primary"
              disabled={isCreating}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </div>
        </div>

        <Card className="minimalist-card overflow-hidden animate-fade-in reveal-delay-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border-b border-blue-100/50 dark:border-blue-800/50">
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              Minhas Metas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 w-full max-w-md mx-auto">
                <TabsTrigger value="all" className="data-[state=active]:gradient-bg data-[state=active]:text-white">
                  Todas ({goals.length})
                </TabsTrigger>
                <TabsTrigger value="active" className="data-[state=active]:gradient-bg data-[state=active]:text-white">
                  Em andamento ({activeGoals.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:gradient-bg data-[state=active]:text-white">
                  Concluídas ({completedGoals.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4 space-y-4">
                {goals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma meta cadastrada.</p>
                    <p className="text-sm">Clique em "Nova Meta" para começar!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map((goal, index) => renderGoalCard(goal, index))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active">
                {activeGoals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Nenhuma meta em andamento.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeGoals.map((goal, index) => renderGoalCard(goal, index))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed">
                {completedGoals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Nenhuma meta concluída ainda.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedGoals.map((goal, index) => renderGoalCard(goal, index))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Metas;