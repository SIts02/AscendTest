import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { RecurringTransactions } from "@/components/automation/RecurringTransactions";
import { AutoCategorization } from "@/components/automation/AutoCategorization";
import { SmartAlerts } from "@/components/automation/SmartAlerts";

const Automacao = () => {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "MoMoney | Automação";
  }, []);

  return (
    <DashboardLayout activePage="Automacao">
      <div className="container mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Automação</h1>
            <p className="text-muted-foreground">
              Configure automações para economizar tempo e melhorar sua gestão financeira
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <div className="space-y-6">
            <RecurringTransactions />
            <AutoCategorization />
          </div>
          <div>
            <SmartAlerts />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Automacao;