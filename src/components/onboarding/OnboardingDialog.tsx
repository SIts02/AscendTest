
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useOnboarding } from '@/hooks/useOnboarding';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Sparkles, BarChart3, LineChart, Settings } from 'lucide-react';

const OnboardingDialog: React.FC = () => {
  const { t } = useTranslation();
  const { isFirstLogin, completeOnboarding } = useOnboarding();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(isFirstLogin);

  // Close dialog and mark onboarding as completed
  const handleFinish = () => {
    completeOnboarding();
    setOpen(false);
  };

  // Define the onboarding steps
  const steps = [
    {
      title: "Bem-vindo ao MoMoney",
      description: "O seu assistente financeiro pessoal inteligente. Vamos conhecer as principais funcionalidades.",
      icon: <Sparkles className="w-12 h-12 text-blue-500" />,
    },
    {
      title: "Dashboard Personalizado",
      description: "Visualize seus gastos, investimentos e finanças em um só lugar. Gráficos interativos facilitam o entendimento dos seus dados.",
      icon: <BarChart3 className="w-12 h-12 text-green-500" />,
    },
    {
      title: "Assistente de IA",
      description: "Nossa IA analisa seus dados financeiros e oferece dicas personalizadas para economizar e investir melhor.",
      icon: <Sparkles className="w-12 h-12 text-purple-500" />,
    },
    {
      title: "Planejamento Financeiro",
      description: "Defina metas financeiras, acompanhe seu progresso e receba orientações para alcançá-las mais rapidamente.",
      icon: <LineChart className="w-12 h-12 text-orange-500" />,
    },
    {
      title: "Personalize sua Experiência",
      description: "Ajuste as configurações nas opções do perfil para personalizar o MoMoney conforme suas necessidades.",
      icon: <Settings className="w-12 h-12 text-blue-600" />,
    },
  ];

  // Function to go to the previous step
  const prevStep = () => {
    setStep((current) => Math.max(0, current - 1));
  };

  // Function to go to the next step
  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
    } else {
      handleFinish();
    }
  };

  // If it's not the first login, don't show the dialog
  if (!isFirstLogin && !open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md md:max-w-xl p-0 overflow-hidden bg-white dark:bg-gray-900 rounded-2xl">
        <div className="relative">
          {/* Progress indicator */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ width: `${(step / (steps.length - 1)) * 100}%` }}
              animate={{ width: `${(step / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <DialogHeader className="pt-8 px-6 flex justify-center items-center flex-col text-center">
            <motion.div
              key={`icon-${step}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4"
            >
              {steps[step].icon}
            </motion.div>
            <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {steps[step].title}
            </DialogTitle>
            <DialogDescription className="text-lg mt-2 text-gray-600 dark:text-gray-400 max-w-md">
              {steps[step].description}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6">
            {/* Step indicators */}
            <div className="flex justify-center space-x-2 mt-4 mb-6">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 rounded-full ${
                    index === step ? 'w-8 bg-blue-500' : 'w-2 bg-gray-200 dark:bg-gray-700'
                  }`}
                  initial={false}
                  animate={{
                    width: index === step ? 32 : 8,
                    backgroundColor: index === step ? '#3b82f6' : '#e5e7eb',
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>

            <DialogFooter className="flex justify-between gap-4 sm:justify-between mt-4">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={step === 0}
                className={step === 0 ? 'opacity-0' : ''}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t('common.previous')}
              </Button>
              
              <Button onClick={nextStep}>
                {step < steps.length - 1 ? (
                  <>
                    {t('common.next')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    {t('common.finish')}
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
