import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "O MoMoney mudou completamente minha relação com dinheiro. Finalmente consigo ver para onde vai cada centavo.",
    author: "Ana Paula Silva",
    role: "Empreendedora",
    avatar: "AP",
  },
  {
    quote:
      "A importação de PDF com IA é incrível! Escanear notas fiscais e ter tudo categorizado automaticamente é mágico.",
    author: "Carlos Eduardo",
    role: "Contador",
    avatar: "CE",
  },
  {
    quote:
      "Consegui economizar R$15.000 em 6 meses usando as metas e o assistente IA. Recomendo muito!",
    author: "Fernanda Costa",
    role: "Designer",
    avatar: "FC",
  },
];

const TestimonialCard = ({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[0];
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
      className="relative p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-500 hover:bg-white/[0.07]"
    >
      <Quote className="w-10 h-10 text-blue-500/40 mb-4" />

      <p className="text-lg text-white/80 leading-relaxed mb-6">
        "{testimonial.quote}"
      </p>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
          {testimonial.avatar}
        </div>
        <div>
          <p className="font-semibold text-white">{testimonial.author}</p>
          <p className="text-sm text-white/60">{testimonial.role}</p>
        </div>
      </div>
    </motion.div>
  );
};

const LandingTestimonials = () => {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

  return (
    <section id="testimonials" className="relative py-32 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 25 }}
          animate={
            isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }
          }
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            O Que Nossos{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Usuários Dizem
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-white/60">
            Veja como o MoMoney está transformando a vida financeira de milhares
            de brasileiros.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.author}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingTestimonials;