
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

// Simulated budget data
const budgetCategories = [
  { 
    name: "Alimentação", 
    current: 950, 
    max: 1200, 
    percentUsed: 79,
    trend: "up", // up means spending more than last month
    trendPercentage: 12
  },
  { 
    name: "Transporte", 
    current: 320, 
    max: 600, 
    percentUsed: 53,
    trend: "down",
    trendPercentage: 8
  },
  { 
    name: "Lazer", 
    current: 480, 
    max: 500, 
    percentUsed: 96,
    trend: "up",
    trendPercentage: 23
  },
  { 
    name: "Moradia", 
    current: 1800, 
    max: 2000, 
    percentUsed: 90,
    trend: "down",
    trendPercentage: 3
  },
  { 
    name: "Saúde", 
    current: 280, 
    max: 600, 
    percentUsed: 47,
    trend: "up",
    trendPercentage: 5
  }
];

const BudgetProgress = () => {
  const getProgressColorClass = (percent: number) => {
    if (percent < 50) return "bg-green-500";
    if (percent < 75) return "bg-amber-500";
    if (percent < 90) return "bg-orange-500";
    return "bg-red-500";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate total budget status
  const totalBudget = budgetCategories.reduce((acc, cat) => acc + cat.max, 0);
  const totalSpent = budgetCategories.reduce((acc, cat) => acc + cat.current, 0);
  const totalPercentUsed = Math.round((totalSpent / totalBudget) * 100);

  return (
    <Card className="h-full animate-fade-in reveal-delay-1">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Progresso do Orçamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Orçamento Total</span>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
            </span>
          </div>
          <Progress 
            value={totalPercentUsed} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Utilizado: {totalPercentUsed}%</span>
            <span>Restante: {formatCurrency(totalBudget - totalSpent)}</span>
          </div>
        </div>

        <div className="space-y-4">
          {budgetCategories.map((category, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-foreground">{category.name}</span>
                  {category.trend === "up" ? (
                    <ArrowUpRight className="ml-1 h-4 w-4 text-red-500" />
                  ) : (
                    <ArrowDownRight className="ml-1 h-4 w-4 text-green-500" />
                  )}
                  <span className={`text-xs ml-1 ${category.trend === "up" ? "text-red-500" : "text-green-500"}`}>
                    {category.trend === "up" ? "+" : "-"}{category.trendPercentage}%
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(category.current)} / {formatCurrency(category.max)}
                </span>
              </div>
              <Progress 
                value={category.percentUsed} 
                className={`h-2 ${getProgressColorClass(category.percentUsed)}`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetProgress;
