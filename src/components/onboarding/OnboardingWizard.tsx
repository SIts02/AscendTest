import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { useGoals } from '@/hooks/useGoals';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Settings,
  Target,
  Sparkles,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';

const OnboardingWizard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { isFirstLogin, completeOnboarding } = useOnboarding();
  const { createGoal, isCreating } = useGoals();

  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [currency, setCurrency] = useState('BRL');
  const [language, setLanguage] = useState('pt-BR');
  const [theme, setTheme] = useState('system');

  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCategory, setGoalCategory] = useState('savings');

  useEffect(() => {
    if (user?.user_metadata?.name) {
      setName(user.user_metadata.name);
    }
  }, [user]);

  useEffect(() => {
    if (isFirstLogin) {
      setOpen(true);
    }
  }, [isFirstLogin]);

  const steps = [
    {
      id: 'profile',
      title: 'Complete seu perfil',
      description: 'Nos conte um pouco sobre você para personalizar sua experiência.',
      icon: <User className="w-10 h-10 text-primary" />,
    },
    {
      id: 'preferences',
      title: 'Suas preferências',
      description: 'Configure como você quer ver suas finanças.',
      icon: <Settings className="w-10 h-10 text-primary" />,
    },
    {
      id: 'first-goal',
      title: 'Sua primeira meta',
      description: 'Comece sua jornada financeira definindo um objetivo!',
      icon: <Target className="w-10 h-10 text-primary" />,
    },
  ];

  const handlePrevStep = () => {
    setStep((current) => Math.max(0, current - 1));
  };

  const handleNextStep = async () => {
    if (step === 0) {

      await saveProfile();
    } else if (step === 1) {

      await savePreferences();
    }

    if (step < steps.length - 1) {
      setStep((current) => current + 1);
    } else {
      await handleFinish();
    }
  };

  const saveProfile = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          avatar_url: avatarUrl || null,
        })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving profile:', error);
    }
  };

  const savePreferences = async () => {
    if (!user?.id) return;

    try {

      const { data: existingPrefs } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingPrefs) {
        await supabase
          .from('user_preferences')
          .update({ currency, language, theme })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_preferences')
          .insert({ user_id: user.id, currency, language, theme });
      }

      i18n.changeLanguage(language);

      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      }
    } catch (error: any) {
      console.error('Error saving preferences:', error);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);

    try {

      if (goalName && goalTarget) {
        createGoal({
          name: goalName,
          category: goalCategory,
          target: parseFloat(goalTarget),
          current: 0,
        });
      }

      completeOnboarding();
      setOpen(false);
      toast.success('Bem-vindo ao MoMoney! 🎉');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast.error('Erro ao finalizar configuração');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    setOpen(false);
    toast.info('Você pode configurar seu perfil a qualquer momento nas Configurações.');
  };

  if (!isFirstLogin && !open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-background rounded-2xl">
        <div className="relative">
          {}
          <div className="absolute top-0 left-0 w-full h-1 bg-muted">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-muted-foreground"
            onClick={handleSkip}
          >
            Pular
          </Button>

          <div className="pt-10 px-6 pb-6">
            {}
            <div className="flex justify-center space-x-2 mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === step
                      ? 'w-8 bg-primary'
                      : index < step
                        ? 'w-2 bg-primary/60'
                        : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>

            {}
            <div className="text-center mb-6">
              <motion.div
                key={`icon-${step}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex p-4 rounded-full bg-primary/10 mb-4"
              >
                {steps[step].icon}
              </motion.div>
              <h2 className="text-xl font-bold">{steps[step].title}</h2>
              <p className="text-muted-foreground mt-1">{steps[step].description}</p>
            </div>

            {}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {step === 0 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Seu nome</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Como podemos te chamar?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avatar">URL do Avatar (opcional)</Label>
                      <Input
                        id="avatar"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://exemplo.com/avatar.jpg"
                      />
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label>Moeda</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BRL">🇧🇷 Real (R$)</SelectItem>
                          <SelectItem value="USD">🇺🇸 Dólar ($)</SelectItem>
                          <SelectItem value="EUR">🇪🇺 Euro (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Idioma</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">Português (BR)</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tema</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'light', icon: Sun, label: 'Claro' },
                          { id: 'dark', icon: Moon, label: 'Escuro' },
                          { id: 'system', icon: Monitor, label: 'Sistema' },
                        ].map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setTheme(option.id)}
                            className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                              theme === option.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <option.icon className="w-5 h-5 mb-1" />
                            <span className="text-sm">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg mb-4">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Metas ajudam a manter o foco nas suas conquistas!
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="goal-name">Nome da meta (opcional)</Label>
                      <Input
                        id="goal-name"
                        value={goalName}
                        onChange={(e) => setGoalName(e.target.value)}
                        placeholder="Ex: Fundo de emergência"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={goalCategory} onValueChange={setGoalCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="savings">💰 Poupança</SelectItem>
                          <SelectItem value="travel">✈️ Viagem</SelectItem>
                          <SelectItem value="education">🎓 Educação</SelectItem>
                          <SelectItem value="property">🏠 Imóvel</SelectItem>
                          <SelectItem value="vehicle">🚗 Veículo</SelectItem>
                          <SelectItem value="other">📦 Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="goal-target">Valor alvo (R$)</Label>
                      <Input
                        id="goal-target"
                        type="number"
                        value={goalTarget}
                        onChange={(e) => setGoalTarget(e.target.value)}
                        placeholder="10000"
                        min="0"
                      />
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {}
            <div className="flex justify-between gap-4 mt-8">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={step === 0}
                className={step === 0 ? 'invisible' : ''}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>

              <Button
                onClick={handleNextStep}
                disabled={isSubmitting || isCreating}
              >
                {step < steps.length - 1 ? (
                  <>
                    Próximo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    {isSubmitting ? 'Salvando...' : 'Começar'}
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;