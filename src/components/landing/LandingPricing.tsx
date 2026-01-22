import * as React from "react";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CircleCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

type PlanTier = "basic" | "standard" | "pro";

interface PricingCardProps {
  title: string;
  planId: PlanTier;
  price: string;
  description?: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

const pricingData: PricingCardProps[] = [
  {
    title: "Basic",
    planId: "basic",
    price: "Grátis",
    description: "Perfeito para começar a organizar suas finanças.",
    features: ["Transações ilimitadas", "3 Metas financeiras", "Relatórios básicos", "Suporte por email"],
    cta: "Começar Grátis",
  },
  {
    title: "Standard",
    planId: "standard",
    price: "R$19/mês",
    description: "Ideal para quem quer controle total das finanças.",
    features: [
      "Tudo do Basic",
      "Assistente IA ilimitado",
      "Investimentos em tempo real",
      "Importação PDF com IA",
    ],
    cta: "Assinar Standard",
    featured: true,
  },
  {
    title: "Pro",
    planId: "pro",
    price: "R$39/mês",
    description: "Para famílias e quem busca o máximo de recursos.",
    features: [
      "Tudo do Standard",
      "Múltiplas contas",
      "Análise preditiva avançada",
      "Suporte prioritário 24/7",
    ],
    cta: "Assinar Pro",
  },
];

function PricingCard({
  plan,
  index,
}: {
  plan: PricingCardProps;
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { user, subscription } = useAuth();
  const { loading, handleCheckout, handleManageSubscription } = useStripeCheckout();

  const isCurrentPlan = subscription.plan === plan.planId;
  const isLoading = loading === plan.planId;

  const handleClick = () => {
    if (plan.planId === "basic") return;
    if (isCurrentPlan) handleManageSubscription();
    else handleCheckout(plan.planId as "standard" | "pro");
  };

  const getButtonText = () => {
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (plan.planId === "basic") return plan.cta;
    if (isCurrentPlan) return "Gerenciar Assinatura";
    return plan.cta;
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "relative flex flex-col rounded-2xl p-8",
        "bg-gradient-to-b from-white/10 to-white/5",
        "border border-white/10 backdrop-blur-sm",
        "transition-all duration-500 hover:border-white/20",
        plan.featured && ["border-blue-500/50 scale-105", "shadow-[0_0_60px_rgba(59,130,246,0.3)]"],
        isCurrentPlan && ["border-green-500/50", "shadow-[0_0_60px_rgba(34,197,94,0.3)]"]
      )}
    >
      {plan.featured && !isCurrentPlan && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
      )}
      {isCurrentPlan && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-green-500/10 to-transparent pointer-events-none" />
      )}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">{plan.title}</h3>
          <div className="flex gap-2">
            {isCurrentPlan && (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">Seu Plano</Badge>
            )}
            {plan.featured && !isCurrentPlan && (
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">Mais popular</Badge>
            )}
          </div>
        </div>
        <p className="text-4xl font-bold text-white mb-2">{plan.price}</p>
        {plan.description && <p className="text-white/60 mb-6">{plan.description}</p>}
        <div className="h-px bg-white/10 mb-6" />
        <ul className="space-y-4 mb-8">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <CircleCheck className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-white/80">{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          onClick={handleClick}
          disabled={isLoading || (plan.planId === "basic" && !user)}
          className={cn(
            "w-full py-6 text-base font-medium transition-all duration-300",
            isCurrentPlan
              ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              : plan.featured
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
          )}
        >
          {getButtonText()}
        </Button>
      </div>
    </motion.div>
  );
}

export default function LandingPricing() {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });
  const { subscription, checkSubscription } = useAuth();

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      checkSubscription();
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('canceled') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [checkSubscription]);

  return (
    <section id="pricing" className="relative py-32 bg-black overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[80%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 25 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Planos e Preços</h2>
          <p className="max-w-2xl mx-auto text-lg text-white/60">
            Escolha o plano ideal para suas necessidades financeiras.
          </p>
          {subscription.subscribed && subscription.subscription_end && (
            <p className="mt-4 text-sm text-green-400">
              Sua assinatura {subscription.plan.toUpperCase()} renova em{' '}
              {new Date(subscription.subscription_end).toLocaleDateString('pt-BR')}
            </p>
          )}
        </motion.div>
        <div className="relative">
          <div className={cn(
            "absolute -inset-8 rounded-3xl",
            "bg-gradient-to-b from-blue-950/50 via-blue-900/20 to-transparent",
            "border border-blue-500/20",
            "shadow-[0_0_80px_rgba(59,130,246,0.15),inset_0_-20px_60px_rgba(59,130,246,0.1)]"
          )} />
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
            {pricingData.map((plan, index) => (
              <PricingCard key={plan.title} plan={plan} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
