import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ExecutiveDashboard from "@/components/analytics/ExecutiveDashboard";
import MonthlyBreakdownChart from "@/components/analytics/MonthlyBreakdownChart";
import CategoryDistributionChart from "@/components/analytics/CategoryDistributionChart";
import NetWorthChart from "@/components/analytics/NetWorthChart";

const Analytics = () => {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "MoMoney | Analytics";
  }, []);

  return (
    <DashboardLayout activePage="Analytics">
      <div className="container mx-auto px-4 space-y-6">
        <ExecutiveDashboard />

        {}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyBreakdownChart />
          <CategoryDistributionChart />
        </div>

        <NetWorthChart />
      </div>
    </DashboardLayout>
  );
};

export default Analytics;