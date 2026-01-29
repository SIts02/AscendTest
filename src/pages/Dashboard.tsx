import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import RecentActivity from "@/components/dashboard/RecentActivity";
import SpendingCategories from "@/components/dashboard/SpendingCategories";
import UpcomingTransactions from "@/components/dashboard/UpcomingTransactions";
import SpendingAnalysis from "@/components/dashboard/SpendingAnalysis";
import { MotionButton } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import DeveloperLetterDialog from "@/components/onboarding/DeveloperLetterDialog";

const Dashboard = () => {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const userName = profile?.name || t('dashboard.welcome');

  useEffect(() => {
    document.title = "Ascend | Dashboard";
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const
      }
    }
  };

  return (
    <DashboardLayout activePage="Dashboard">
      <DeveloperLetterDialog />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-5 md:gap-6"
      >
        {}
        <motion.div variants={itemVariants} className="mb-1">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            {t('dashboard.welcome')}, {userName}
          </h2>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.welcome_back')}
          </p>
        </motion.div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          <motion.div variants={itemVariants}>
            <div className="glass-card p-5 h-full min-h-[140px]">
              <SpendingCategories />
            </div>
          </motion.div>
          <motion.div variants={itemVariants}>
            <div className="glass-card p-5 h-full min-h-[140px]">
              <SpendingAnalysis />
            </div>
          </motion.div>
        </div>

        {}
        <motion.div variants={itemVariants}>
          <div className="glass-card p-6">
            <FinancialOverview />
          </div>
        </motion.div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          <motion.div variants={itemVariants}>
            <div className="glass-card p-5 h-full">
              <RecentActivity />
            </div>
          </motion.div>
          <motion.div variants={itemVariants}>
            <div className="glass-card p-5 h-full">
              <UpcomingTransactions />
            </div>
          </motion.div>
        </div>

        {}
        <motion.div variants={itemVariants}>
          <div className="glass-card p-6 border-l-4 border-l-primary overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold flex items-center text-foreground">
                  <Sparkles className="h-5 w-5 mr-2 text-primary" />
                  {t('dashboard.ai_assistant.title')}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {t('dashboard.ai_assistant.description')}
                </p>
              </div>
              <MotionButton
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 py-2.5 whitespace-nowrap shadow-lg shadow-primary/20"
                onClick={() => navigate('/dashboard/assistente')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {t('dashboard.ai_assistant.learn_more')}
              </MotionButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Dashboard;