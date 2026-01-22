import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Wallet, Brain, Target, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Gestão Completa",
    description:
      "Controle transações, orçamentos e categorias com importação automática de PDF e CSV.",
  },
  {
    icon: Brain,
    title: "Assistente IA",
    description:
      "Chat inteligente com contexto financeiro para insights personalizados e análises preditivas.",
  },
  {
    icon: Target,
    title: "Metas Financeiras",
    description:
      "Defina e acompanhe objetivos de poupança, viagem, educação, imóvel e veículo.",
  },
  {
    icon: TrendingUp,
    title: "Investimentos",
    description:
      "Acompanhe ações, renda fixa e criptomoedas com cotações em tempo real.",
  },
];

const FeatureCard = ({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.12,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-500"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="w-14 h-14 mb-6 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)]">
          <feature.icon className="w-7 h-7 text-white" />
        </div>

        <h3 className="text-xl font-semibold text-white mb-3">
          {feature.title}
        </h3>
        <p className="text-white/60 leading-relaxed">{feature.description}</p>
      </div>
    </motion.div>
  );
};

const LandingFeatures = () => {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

  return (
    <section id="features" className="relative py-32 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 25 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Por Que Escolher o{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              MoMoney
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-white/60">
            Tecnologia de ponta com inteligência artificial para você ter controle
            total das suas finanças pessoais.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;
