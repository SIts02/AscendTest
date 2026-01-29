import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ReportFilters from "@/components/reports/ReportFilters";
import ReportGenerator from "@/components/reports/ReportGenerator";
import { useReports, ReportFilters as ReportFiltersType } from "@/hooks/useReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, History, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFormatters } from "@/hooks/useFormatters";

const Relatorios = () => {
  const { t } = useTranslation();
  const { formatDate } = useFormatters();
  const {
    generateReportData,
    exportToCSV,
    savedReports,
    deleteSavedReport,
    saveReport,
    loading
  } = useReports();

  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: { start: '', end: '' },
    categories: [],
    transactionTypes: [],
    amountRange: { min: null, max: null },
    paymentMethods: [],
    description: ''
  });

  const [reportData, setReportData] = useState<any[] | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    document.title = "MoMoney | Relatórios";
  }, []);

  const handleApplyFilters = async () => {
    setGeneratingReport(true);
    try {
      const data = await generateReportData(filters);
      setReportData(data || []);
    } catch (error) {
      console.error('Error generating report:', error);
      setReportData([]);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      dateRange: { start: '', end: '' },
      categories: [],
      transactionTypes: [],
      amountRange: { min: null, max: null },
      paymentMethods: [],
      description: ''
    });
    setReportData(null);
  };

  const handleExportCSV = () => {
    if (reportData) {
      const filename = `relatorio-${Date.now()}`;
      exportToCSV(reportData, filename);
    }
  };

  const handleExportPDF = async () => {
    if (reportData) {
      try {

        await saveReport({
          name: `Relatório ${formatDate(new Date().toISOString())}`,
          description: 'Relatório gerado automaticamente',
          filters,
          data_snapshot: reportData,
          format: 'pdf',
          status: 'completed',
          template_id: null,
          file_url: null
        });
      } catch (error) {
        console.error('Error saving report:', error);
      }
    }
  };

  return (
    <DashboardLayout activePage="Relatorios">
      <div className="container mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">
              Gere relatórios detalhados das suas transações financeiras
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {}
          <div className="lg:col-span-1">
            <ReportFilters
              filters={filters}
              onFiltersChange={setFilters}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
            />

            {}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Relatórios Salvos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : savedReports.length > 0 ? (
                  <div className="space-y-3">
                    {savedReports.slice(0, 5).map((report) => (
                      <div key={report.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{report.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(report.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {report.format.toUpperCase()}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteSavedReport(report.id)}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {savedReports.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        E mais {savedReports.length - 5} relatórios...
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Nenhum relatório salvo
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {}
          <div className="lg:col-span-2">
            {generatingReport ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Gerando relatório...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ReportGenerator
                filters={filters}
                data={reportData}
                onExportCSV={handleExportCSV}
                onExportPDF={handleExportPDF}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Relatorios;