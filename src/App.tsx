import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useState, useEffect } from "react";
import { useThemeEffect } from "./hooks/useThemeEffect";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUserPreferences } from "./hooks/useUserPreferences";
import i18n from "./i18n";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Toaster } from "@/components/ui/sonner";

// Landing pages
import LandingIndex from "@/pages/LandingIndex";
import LandingLogin from "@/pages/LandingLogin";
import LandingSignup from "@/pages/LandingSignup";
import LandingForgotPassword from "@/pages/LandingForgotPassword";
import LandingResetPassword from "@/pages/LandingResetPassword";

// Dashboard pages
import Dashboard from "@/pages/Dashboard";
import Orcamento from "@/pages/dashboard/Orcamento";
import Investimentos from "@/pages/dashboard/Investimentos";
import Transacoes from "@/pages/dashboard/Transacoes";
import Metas from "@/pages/dashboard/Metas";
import Assistente from "@/pages/dashboard/Assistente";
import Analytics from "@/pages/dashboard/Analytics";
import Automacao from "@/pages/dashboard/Automacao";
import Relatorios from "@/pages/dashboard/Relatorios";
import Configuracoes from "@/pages/dashboard/Configuracoes";
import Perfil from "@/pages/dashboard/Perfil";
import Mensagens from "@/pages/dashboard/Mensagens";
import MFAVerify from "@/pages/MFAVerify";
import NotFound from "@/pages/NotFound";
import AuthCallback from "@/pages/AuthCallback";

import "./sidebar-theme.css";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const ThemeAndLanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const { preferences } = useUserPreferences();
  useThemeEffect();
  
  useEffect(() => {
    if (preferences.language) i18n.changeLanguage(preferences.language);
  }, [preferences.language]);

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Landing pages */}
    <Route path="/" element={<LandingIndex />} />
    <Route path="/login" element={<LandingLogin />} />
    <Route path="/signup" element={<LandingSignup />} />
    <Route path="/forgot-password" element={<LandingForgotPassword />} />
    <Route path="/reset-password" element={<LandingResetPassword />} />
    <Route path="/auth-callback" element={<AuthCallback />} />
    <Route path="/mfa-verify" element={<MFAVerify />} />
    
    {/* Dashboard routes */}
    <Route path="/dashboard" element={<ProtectedRoute><ThemeAndLanguageProvider><Dashboard /></ThemeAndLanguageProvider></ProtectedRoute>} />
    <Route path="/dashboard/analytics" element={<ProtectedRoute><ThemeAndLanguageProvider><Analytics /></ThemeAndLanguageProvider></ProtectedRoute>} />
    <Route path="/dashboard/automacao" element={<ProtectedRoute><ThemeAndLanguageProvider><Automacao /></ThemeAndLanguageProvider></ProtectedRoute>} />
    <Route path="/dashboard/relatorios" element={<ProtectedRoute><ThemeAndLanguageProvider><Relatorios /></ThemeAndLanguageProvider></ProtectedRoute>} />
    <Route path="/dashboard/orcamento" element={<ProtectedRoute><ThemeAndLanguageProvider><Orcamento /></ThemeAndLanguageProvider></ProtectedRoute>} />
    <Route path="/dashboard/investimentos" element={<ProtectedRoute><ThemeAndLanguageProvider><Investimentos /></ThemeAndLanguageProvider></ProtectedRoute>} />
    <Route path="/dashboard/transacoes" element={<ProtectedRoute><ThemeAndLanguageProvider><Transacoes /></ThemeAndLanguageProvider></ProtectedRoute>} />
    <Route path="/dashboard/metas" element={<ProtectedRoute><ThemeAndLanguageProvider><Metas /></ThemeAndLanguageProvider></ProtectedRoute>} />
    <Route path="/dashboard/assistente" element={<ProtectedRoute><ThemeAndLanguageProvider><Assistente /></ThemeAndLanguageProvider></ProtectedRoute>} />
    <Route path="/dashboard/configuracoes" element={<ProtectedRoute><ThemeAndLanguageProvider><Configuracoes /></ThemeAndLanguageProvider></ProtectedRoute>} />
    <Route path="/dashboard/perfil" element={<ProtectedRoute><ThemeAndLanguageProvider><Perfil /></ThemeAndLanguageProvider></ProtectedRoute>} />
    <Route path="/dashboard/mensagens" element={<ProtectedRoute><ThemeAndLanguageProvider><Mensagens /></ThemeAndLanguageProvider></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <AppRoutes />
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
