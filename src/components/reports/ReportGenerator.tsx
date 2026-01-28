import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Calendar,
  Target
} from 'lucide-react';
import { useFormatters } from '@/hooks/useFormatters';
import { ReportFilters, useReports } from '@/hooks/useReports';

interface ReportGeneratorProps {
  filters: ReportFilters;
  data: any[] | null;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

const ReportGenerator = ({ filters, data, onExportCSV, onExportPDF }: ReportGeneratorProps) => {
  const { formatCurrency, formatDate } = useFormatters();
  const { calculateReportStats } = useReports();
  const [loading, setLoading] = useState(false);

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Configure os filtros e clique em "Aplicar Filtros" para gerar o relatório</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = calculateReportStats(data);

  const handleExport = async (type: 'csv' | 'pdf') => {
    setLoading(true);
    try {
      if (type === 'csv') {
        onExportCSV();
      } else {
        onExportPDF();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resumo do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="font-semibold text-green-600">{formatCurrency(stats.totalIncome)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="font-semibold text-red-600">{formatCurrency(stats.totalExpenses)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`font-semibold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.balance)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transações</p>
                <p className="font-semibold">{stats.transactionCount}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {}
      <Card>
        <CardHeader>
          <CardTitle>Principais Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topCategories.map(([categoryName, categoryData]: [string, { total: number; count: number; type: string }]) => {
              const percentage = stats.totalExpenses > 0
                ? (categoryData.total / stats.totalExpenses) * 100
                : 0;

              return (
                <div key={categoryName} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{categoryName}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {categoryData.count} transações
                      </Badge>
                      <span className="font-semibold">
                        {formatCurrency(categoryData.total)}
                      </span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {percentage.toFixed(1)}% do total
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {}
      <Card>
        <CardHeader>
          <CardTitle>Transações Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Descrição</th>
                  <th className="text-left p-2">Categoria</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-right p-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 20).map((transaction) => (
                  <tr key={transaction.id} className="border-b">
                    <td className="p-2">{formatDate(transaction.date)}</td>
                    <td className="p-2">{transaction.description}</td>
                    <td className="p-2">
                      <Badge variant="outline">
                        {transaction.categories?.name || 'Sem categoria'}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                        {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </td>
                    <td className={`p-2 text-right font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 20 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Mostrando 20 de {data.length} transações. Use a exportação para ver todos os dados.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={() => handleExport('csv')}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={loading}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>

          {filters.dateRange.start && filters.dateRange.end && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 inline mr-1" />
                Período: {formatDate(filters.dateRange.start)} até {formatDate(filters.dateRange.end)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportGenerator;