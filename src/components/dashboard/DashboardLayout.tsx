import React, { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { AvatarDropdown } from "@/components/ui/avatar-dropdown";
import { motion } from "framer-motion";
import { 
  Home,
  PiggyBank,
  ArrowLeftRight,
  Target,
  MessageSquarePlus,
  Settings,
  FileText,
  Zap,
  Wallet,
  LogOut
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  SidebarAceternity,
  SidebarBody,
  SidebarLink,
  Logo,
  LogoIcon,
  useSidebarAceternity,
} from "@/components/ui/sidebar-aceternity";

interface DashboardLayoutProps {
  children: ReactNode;
  activePage?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activePage = "",
}) => {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Navigation links
  const links = [
    {
      label: t("sidebar.dashboard"),
      href: "/dashboard",
      icon: <Home className="w-5 h-5" />,
    },
    {
      label: t("sidebar.transactions"),
      href: "/dashboard/transacoes",
      icon: <ArrowLeftRight className="w-5 h-5" />,
    },
    {
      label: t("sidebar.budget"),
      href: "/dashboard/orcamento",
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      label: t("sidebar.investments"),
      href: "/dashboard/investimentos",
      icon: <PiggyBank className="w-5 h-5" />,
    },
    {
      label: t("sidebar.goals"),
      href: "/dashboard/metas",
      icon: <Target className="w-5 h-5" />,
    },
    {
      label: t("sidebar.automation"),
      href: "/dashboard/automacao",
      icon: <Zap className="w-5 h-5" />,
    },
    {
      label: t("sidebar.reports"),
      href: "/dashboard/relatorios",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      label: t("sidebar.assistant"),
      href: "/dashboard/assistente",
      icon: <MessageSquarePlus className="w-5 h-5" />,
    },
    {
      label: t("sidebar.settings"),
      href: "/dashboard/configuracoes",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <div className="flex flex-col md:flex-row bg-background w-full flex-1 mx-auto overflow-hidden h-screen">
      <SidebarAceternity open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-6">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <nav className="mt-8 flex flex-col gap-1">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </nav>
          </div>
          
          {/* Bottom section */}
          <div className="flex flex-col gap-3 pt-4 border-t border-sidebar-border/30">
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="sidebar-link group text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-pre"
              >
                {t("sidebar.logout")}
              </motion.span>
            </button>
            
            {/* Theme switcher and avatar */}
            <div className="flex items-center justify-between px-1 pointer-events-auto">
              <AvatarDropdown />
              {open && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="pointer-events-auto"
                >
                  <ThemeSwitcher />
                </motion.div>
              )}
            </div>
          </div>
        </SidebarBody>
      </SidebarAceternity>

      {/* Main content area with glassmorphism */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
