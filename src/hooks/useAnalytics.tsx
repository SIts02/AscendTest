import { useState, useEffect, useCallback } from 'react';
import { useFinancialData } from './useFinancialData';
import { useBudget } from './useBudget';

export interface FinancialScore {
  overall: number;
  incomeStability: number;
  expenseControl: number;
  savingsRate: number;
  budgetCompliance: number;
  diversification: number;
}

export interface FinancialInsight {
  type: 'positive' | 'warning' | 'negative';
  title: string;
  description: string;
  actionable?: string;
}

export interface TrendAnalysis {
  income: {
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  };
  expenses: {
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  };
  savings: {
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

export interface PredictiveAnalysis {
  nextMonthExpenses: number;
  nextMonthIncome: number;
  projectedSavings: number;
  confidence: number;
}

export const useAnalytics = () => {
  const { summary, transactions } = useFinancialData();
  const { budgetCategories } = useBudget();

  const [financialScore, setFinancialScore] = useState<FinancialScore>({
    overall: 0,
    incomeStability: 0,
    expenseControl: 0,
    savingsRate: 0,
    budgetCompliance: 0,
    diversification: 0,
  });

  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis>({
    income: { trend: 'stable', percentage: 0 },
    expenses: { trend: 'stable', percentage: 0 },
    savings: { trend: 'stable', percentage: 0 },
  });
  const [predictiveAnalysis, setPredictiveAnalysis] = useState<PredictiveAnalysis>({
    nextMonthExpenses: 0,
    nextMonthIncome: 0,
    projectedSavings: 0,
    confidence: 0,
  });

  const calculateFinancialScore = useCallback(() => {
    const { totalIncome, totalExpense, monthlyData } = summary;

    if (totalIncome === 0) {
      setFinancialScore({
        overall: 0,
        incomeStability: 0,
        expenseControl: 0,
        savingsRate: 0,
        budgetCompliance: 0,
        diversification: 0,
      });
      return;
    }

    const incomeVariability = calculateVariability(monthlyData.map(m => m.income));
    const incomeStability = Math.max(0, 100 - (incomeVariability * 100));

    const expenseRatio = totalExpense / totalIncome;
    const expenseControl = Math.max(0, 100 - (expenseRatio * 100));

    const savingsRate = Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100);

    const budgetCompliance = calculateBudgetCompliance();

    const diversification = calculateExpenseDiversification();

    const overall = Math.round(
      (incomeStability * 0.2) +
      (expenseControl * 0.3) +
      (savingsRate * 0.25) +
      (budgetCompliance * 0.15) +
      (diversification * 0.1)
    );

    setFinancialScore({
      overall: Math.min(100, overall),
      incomeStability: Math.round(incomeStability),
      expenseControl: Math.round(expenseControl),
      savingsRate: Math.round(savingsRate),
      budgetCompliance: Math.round(budgetCompliance),
      diversification: Math.round(diversification),
    });
  }, [summary, budgetCategories]);

  const calculateVariability = (values: number[]) => {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return mean === 0 ? 0 : stdDev / mean;
  };

  const calculateBudgetCompliance = () => {
    if (!budgetCategories.length) return 50;

    const compliance = budgetCategories.map(category => {
      if (!category.max_amount) return 100;

      const spent = summary.expenseByCategory[category.id] || 0;
      const compliance = Math.max(0, 100 - ((spent / category.max_amount) * 100));
      return Math.min(100, compliance);
    });

    return compliance.reduce((sum, val) => sum + val, 0) / compliance.length;
  };

  const calculateExpenseDiversification = () => {
    const categoryCount = Object.keys(summary.expenseByCategory).length;

    if (categoryCount === 0) return 0;
    if (categoryCount === 1) return 20;
    if (categoryCount <= 3) return 40;
    if (categoryCount <= 5) return 70;
    if (categoryCount <= 7) return 85;
    return 100;
  };

  const generateInsights = useCallback(() => {
    const newInsights: FinancialInsight[] = [];
    const { totalIncome, totalExpense } = summary;

    if (totalExpense > totalIncome * 0.9) {
      newInsights.push({
        type: 'warning',
        title: 'Gastos Elevados',
        description: 'Seus gastos estão muito próximos da sua receita.',
        actionable: 'Considere revisar e reduzir gastos desnecessários.',
      });
    }

    if (totalIncome > 0 && (totalIncome - totalExpense) / totalIncome > 0.2) {
      newInsights.push({
        type: 'positive',
        title: 'Excelente Taxa de Poupança',
        description: 'Você está poupando mais de 20% da sua receita!',
        actionable: 'Continue assim e considere investir o excedente.',
      });
    }

    const overBudgetCategories = budgetCategories.filter(cat => {
      const spent = summary.expenseByCategory[cat.id] || 0;
      return cat.max_amount && spent > cat.max_amount;
    });

    if (overBudgetCategories.length > 0) {
      newInsights.push({
        type: 'negative',
        title: 'Orçamento Ultrapassado',
        description: `${overBudgetCategories.length} categoria(s) ultrapassaram o orçamento.`,
        actionable: 'Revise os gastos nessas categorias para o próximo mês.',
      });
    }

    const categoryCount = Object.keys(summary.expenseByCategory).length;
    if (categoryCount <= 2 && totalExpense > 0) {
      newInsights.push({
        type: 'warning',
        title: 'Baixa Diversificação',
        description: 'Seus gastos estão concentrados em poucas categorias.',
        actionable: 'Considere categorizar melhor seus gastos para maior controle.',
      });
    }

    setInsights(newInsights);
  }, [summary, budgetCategories]);

  const calculateTrendAnalysis = useCallback(() => {
    const { monthlyData } = summary;

    if (monthlyData.length < 2) return;

    const lastMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];

    const incomeChange = lastMonth.income - previousMonth.income;
    const incomePercentage = previousMonth.income === 0 ? 0 :
      Math.abs((incomeChange / previousMonth.income) * 100);

    const expenseChange = lastMonth.expense - previousMonth.expense;
    const expensePercentage = previousMonth.expense === 0 ? 0 :
      Math.abs((expenseChange / previousMonth.expense) * 100);

    const savingsChange = lastMonth.balance - previousMonth.balance;
    const savingsPercentage = Math.abs(previousMonth.balance) === 0 ? 0 :
      Math.abs((savingsChange / Math.abs(previousMonth.balance)) * 100);

    setTrendAnalysis({
      income: {
        trend: incomeChange > 50 ? 'up' : incomeChange < -50 ? 'down' : 'stable',
        percentage: Math.round(incomePercentage),
      },
      expenses: {
        trend: expenseChange > 50 ? 'up' : expenseChange < -50 ? 'down' : 'stable',
        percentage: Math.round(expensePercentage),
      },
      savings: {
        trend: savingsChange > 50 ? 'up' : savingsChange < -50 ? 'down' : 'stable',
        percentage: Math.round(savingsPercentage),
      },
    });
  }, [summary]);

  const calculatePredictiveAnalysis = useCallback(() => {
    const { monthlyData } = summary;

    if (monthlyData.length < 3) {
      setPredictiveAnalysis({
        nextMonthExpenses: 0,
        nextMonthIncome: 0,
        projectedSavings: 0,
        confidence: 0,
      });
      return;
    }

    const recentMonths = monthlyData.slice(-3);

    const avgIncome = recentMonths.reduce((sum, m) => sum + m.income, 0) / recentMonths.length;
    const avgExpenses = recentMonths.reduce((sum, m) => sum + m.expense, 0) / recentMonths.length;

    const incomeGrowth = (recentMonths[2].income - recentMonths[0].income) / 2;
    const expenseGrowth = (recentMonths[2].expense - recentMonths[0].expense) / 2;

    const nextMonthIncome = Math.max(0, avgIncome + incomeGrowth);
    const nextMonthExpenses = Math.max(0, avgExpenses + expenseGrowth);
    const projectedSavings = nextMonthIncome - nextMonthExpenses;

    const incomeVariability = calculateVariability(recentMonths.map(m => m.income));
    const expenseVariability = calculateVariability(recentMonths.map(m => m.expense));
    const confidence = Math.max(30, 100 - ((incomeVariability + expenseVariability) * 50));

    setPredictiveAnalysis({
      nextMonthExpenses: Math.round(nextMonthExpenses),
      nextMonthIncome: Math.round(nextMonthIncome),
      projectedSavings: Math.round(projectedSavings),
      confidence: Math.round(confidence),
    });
  }, [summary]);

  useEffect(() => {
    calculateFinancialScore();
    generateInsights();
    calculateTrendAnalysis();
    calculatePredictiveAnalysis();
  }, [
    calculateFinancialScore,
    generateInsights,
    calculateTrendAnalysis,
    calculatePredictiveAnalysis,
  ]);

  return {
    financialScore,
    insights,
    trendAnalysis,
    predictiveAnalysis,
  };
};