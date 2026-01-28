import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Award
} from "lucide-react";
import FinancialScore from './FinancialScore';
import FinancialInsights from './FinancialInsights';
import PredictiveAnalysis from './PredictiveAnalysis';
import { useConvertedFinancialData } from '@/hooks/useConvertedFinancialData';
import { useFormatters } from '@/hooks/useFormatters';

const ExecutiveDashboard = () => {
  const { summary } = useConvertedFinancialData();
  const { formatCurrency } = useFormatters();

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const savingsRate = summary.totalIncome > 0 ?
    ((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100 : 0;

  const kpis = [
    {
      title: "Receita Total",
      value: formatCurrency(summary.totalIncome),
      change: summary.monthlyData.length >= 2 ?
        ((summary.monthlyData[summary.monthlyData.length - 1]?.income || 0) -
         (summary.monthlyData[summary.monthlyData.length - 2]?.income || 0)) : 0,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "Gastos Totais",
      value: formatCurrency(summary.totalExpense),
      change: summary.monthlyData.length >= 2 ?
        ((summary.monthlyData[summary.monthlyData.length - 1]?.expense || 0) -
         (summary.monthlyData[summary.monthlyData.length - 2]?.expense || 0)) : 0,
      icon: TrendingUp,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20"
    },
    {
      title: "Saldo Atual",
      value: formatCurrency(summary.balance),
      change: summary.monthlyData.length >= 2 ?
        ((summary.monthlyData[summary.monthlyData.length - 1]?.balance || 0) -
         (summary.monthlyData[summary.monthlyData.length - 2]?.balance || 0)) : 0,
      icon: Target,
      color: summary.balance >= 0 ? "text-green-600" : "text-red-600",
      bgColor: summary.balance >= 0 ?
        "bg-green-50 dark:bg-green-900/20" :
        "bg-red-50 dark:bg-red-900/20"
    },
    {
      title: "Taxa de Poupança",
      value: `${savingsRate.toFixed(1)}%`,
      change: 0,
      icon: Award,
      color: savingsRate >= 20 ? "text-green-600" : savingsRate >= 10 ? "text-yellow-600" : "text-red-600",
      bgColor: savingsRate >= 20 ?
        "bg-green-50 dark:bg-green-900/20" :
        savingsRate >= 10 ?
        "bg-yellow-50 dark:bg-yellow-900/20" :
        "bg-red-50 dark:bg-red-900/20"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Dashboard Executivo</h1>
        </div>
        <p className="text-muted-foreground">
          Análise abrangente da sua situação financeira • {currentMonth}
        </p>
      </motion.div>

      {}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map((kpi, index) => (
            <motion.div
              key={kpi.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className={`border-l-4 ${kpi.bgColor} border-l-current ${kpi.color}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        {kpi.title}
                      </p>
                      <p className={`text-xl font-bold ${kpi.color}`}>
                        {kpi.value}
                      </p>
                      {kpi.change !== 0 && (
                        <div className="flex items-center space-x-1 text-xs">
                          {kpi.change > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                          )}
                          <span className={kpi.change > 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(Math.abs(kpi.change))}
                          </span>
                          <span className="text-muted-foreground">vs mês anterior</span>
                        </div>
                      )}
                    </div>
                    <div className={`p-3 rounded-full bg-card ${kpi.color}`}>
                      <kpi.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {}
        <motion.div variants={itemVariants} className="xl:col-span-1">
          <FinancialScore />
        </motion.div>

        {}
        <motion.div variants={itemVariants} className="xl:col-span-1">
          <PredictiveAnalysis />
        </motion.div>

        {}
        <motion.div variants={itemVariants} className="xl:col-span-1">
          <FinancialInsights />
        </motion.div>
      </div>

      {}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Resumo de Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Melhor Mês (Receita)
                </h4>
                <p className="text-2xl font-bold text-blue-600">
                  {summary.monthlyData.length > 0 ?
                    formatCurrency(Math.max(...summary.monthlyData.map(m => m.income))) :
                    formatCurrency(0)
                  }
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {summary.monthlyData.length > 0 ?
                    summary.monthlyData.find(m => m.income === Math.max(...summary.monthlyData.map(d => d.income)))?.month || 'N/A' :
                    'N/A'
                  }
                </p>
              </div>

              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Maior Economia
                </h4>
                <p className="text-2xl font-bold text-green-600">
                  {summary.monthlyData.length > 0 ?
                    formatCurrency(Math.max(...summary.monthlyData.map(m => m.balance))) :
                    formatCurrency(0)
                  }
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {summary.monthlyData.length > 0 ?
                    summary.monthlyData.find(m => m.balance === Math.max(...summary.monthlyData.map(d => d.balance)))?.month || 'N/A' :
                    'N/A'
                  }
                </p>
              </div>

              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Média Mensal
                </h4>
                <p className="text-2xl font-bold text-blue-600">
                  {summary.monthlyData.length > 0 ?
                    formatCurrency(summary.monthlyData.reduce((sum, m) => sum + m.balance, 0) / summary.monthlyData.length) :
                    formatCurrency(0)
                  }
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Saldo médio mensal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ExecutiveDashboard;