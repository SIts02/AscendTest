import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
import { Sparkles, MessageCircle, X, Rocket } from 'lucide-react';
import { FlipWords } from '@/components/ui/flip-words';

const STORAGE_KEY = 'ascend_developer_letter_seen';

const DeveloperLetterDialog: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the letter
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (!hasSeen) {
      // Small delay to let the dashboard load first
      const timer = setTimeout(() => {
        setOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  };

  const handleGoToAssistant = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
    navigate('/dashboard/assistente');
  };

  const flipWords = [
    t('developer_letter.flip_words.finances', 'finanças'),
    t('developer_letter.flip_words.goals', 'metas'),
    t('developer_letter.flip_words.investments', 'investimentos'),
    t('developer_letter.flip_words.future', 'futuro'),
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg md:max-w-xl p-0 overflow-hidden bg-card border-border rounded-3xl shadow-2xl">
        {/* Decorative header */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent pt-8 pb-6 px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="flex justify-center mb-4"
          >
            <div className="p-4 rounded-2xl bg-primary/20 border border-primary/30">
              <Rocket className="w-10 h-10 text-primary" />
            </div>
          </motion.div>
          
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-foreground">
              {t('developer_letter.title', 'Bem-vindo ao Ascend!')}
            </DialogTitle>
            <DialogDescription className="text-base mt-2 text-muted-foreground">
              {t('developer_letter.subtitle', 'Uma mensagem do desenvolvedor')}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Letter content */}
        <div className="px-6 py-6 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="space-y-4 text-foreground"
          >
            <p className="text-base leading-relaxed">
              {t('developer_letter.greeting', 'Olá! Sou o desenvolvedor por trás do Ascend e estou muito feliz que você está aqui.')}
            </p>
            
            <p className="text-base leading-relaxed">
              {t('developer_letter.beta_notice', 'Este projeto ainda está em fase')} <span className="font-semibold text-primary">BETA</span>{t('developer_letter.beta_notice_2', ', então pode haver alguns bugs. Estou trabalhando para melhorar sua experiência.')}
            </p>

            <div className="flex items-center py-3 text-base">
              <span>{t('developer_letter.manage', 'Gerencie suas')}</span>
              <FlipWords words={flipWords} duration={2500} className="font-semibold" />
              <span>{t('developer_letter.with_us', 'conosco!')}</span>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border">
              <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                {t('developer_letter.ai_help', 'Precisa de ajuda? Nosso Assistente de IA está sempre disponível para tirar suas dúvidas sobre a plataforma ou sobre finanças!')}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Footer with actions */}
        <DialogFooter className="px-6 pb-6 pt-2 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="sm:flex-1 rounded-xl"
          >
            {t('developer_letter.close', 'Fechar')}
          </Button>
          <Button
            onClick={handleGoToAssistant}
            className="sm:flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {t('developer_letter.go_to_assistant', 'Conhecer o Assistente')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeveloperLetterDialog;
