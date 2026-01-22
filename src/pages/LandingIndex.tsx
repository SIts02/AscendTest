import { Home, Layers, CreditCard, MessageSquare, Mail } from "lucide-react";
import { LandingDock } from "@/components/landing/LandingDock";
import LandingHero from "@/components/landing/LandingHero";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingPricing from "@/components/landing/LandingPricing";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingFooter from "@/components/landing/LandingFooter";

const dockItems = [
  { icon: Home, label: "Home", href: "#home" },
  { icon: Layers, label: "Features", href: "#features" },
  { icon: CreditCard, label: "Pricing", href: "#pricing" },
  { icon: MessageSquare, label: "Testimonials", href: "#testimonials" },
  { icon: Mail, label: "Contact", href: "#contact" },
];

const LandingIndex = () => {
  return (
    <div className="min-h-screen bg-black">
      <LandingDock items={dockItems} />
      <LandingHero />
      <LandingFeatures />
      <LandingPricing />
      <LandingTestimonials />
      <LandingFooter />
    </div>
  );
};

export default LandingIndex;
