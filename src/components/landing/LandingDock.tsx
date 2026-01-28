import * as React from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon, User, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface DockProps {
  className?: string;
  items: {
    icon: LucideIcon;
    label: string;
    onClick?: () => void;
    href?: string;
  }[];
}

interface DockIconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  href?: string;
  className?: string;
}

const DockIconButton = React.forwardRef<HTMLButtonElement, DockIconButtonProps>(
  ({ icon: Icon, label, onClick, href, className }, ref) => {
    const handleClick = () => {
      if (href) {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
      onClick?.();
    };

    return (
      <motion.button
        ref={ref}
        onClick={handleClick}
        className={cn(
          "group relative flex h-10 w-10 items-center justify-center rounded-lg",
          "bg-transparent transition-all duration-300",
          "hover:bg-white/10",
          "focus:outline-none",
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Icon className="h-5 w-5 text-white/70 transition-colors duration-300 group-hover:text-white" />
        <span
          className={cn(
            "absolute -bottom-8 left-1/2 -translate-x-1/2",
            "px-2 py-1 text-xs font-medium text-white",
            "bg-black/80 backdrop-blur-sm rounded-md",
            "opacity-0 group-hover:opacity-100 transition-all duration-300",
            "whitespace-nowrap pointer-events-none",
            "translate-y-1 group-hover:translate-y-0"
          )}
        >
          {label}
        </span>
      </motion.button>
    );
  }
);
DockIconButton.displayName = "DockIconButton";

const UserButton = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Você saiu da sua conta');
  };

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            className={cn(
              "group relative flex h-10 w-10 items-center justify-center rounded-lg",
              "bg-transparent transition-all duration-300",
              "hover:bg-white/10",
              "focus:outline-none"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <User className="h-5 w-5 text-white/70 transition-colors duration-300 group-hover:text-white" />
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-sm border-white/10 text-white">
          <DropdownMenuItem className="text-gray-400 focus:text-gray-400 focus:bg-transparent cursor-default">
            {user.email}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigate('/dashboard')}
            className="text-cyan-400 focus:text-cyan-400 focus:bg-white/10 cursor-pointer"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Acessar Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-red-400 focus:text-red-400 focus:bg-white/10 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <motion.button
      onClick={() => navigate('/login')}
      className={cn(
        "group relative flex h-10 w-10 items-center justify-center rounded-lg",
        "bg-transparent transition-all duration-300",
        "hover:bg-white/10",
        "focus:outline-none"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <User className="h-5 w-5 text-white/70 transition-colors duration-300 group-hover:text-white" />
      <span
        className={cn(
          "absolute -bottom-8 left-1/2 -translate-x-1/2",
          "px-2 py-1 text-xs font-medium text-white",
          "bg-black/80 backdrop-blur-sm rounded-md",
          "opacity-0 group-hover:opacity-100 transition-all duration-300",
          "whitespace-nowrap pointer-events-none",
          "translate-y-1 group-hover:translate-y-0"
        )}
      >
        Entrar
      </span>
    </motion.button>
  );
};

const LandingDock = React.forwardRef<HTMLDivElement, DockProps>(
  ({ items, className }, ref) => {
    const [hidden, setHidden] = React.useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
      const previous = scrollY.getPrevious() ?? 0;
      if (latest > previous && latest > 150) {
        setHidden(true);
      } else {
        setHidden(false);
      }
    });

    return (
      <motion.nav
        ref={ref}
        className={cn(
          "fixed top-6 left-0 right-0 z-50 flex justify-center",
          className
        )}
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: hidden ? -100 : 0,
          opacity: hidden ? 0 : 1
        }}
        transition={{
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
      >
        <motion.div
          animate={{ y: [-1, 1, -1] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={cn(
            "flex items-center gap-1 px-3 py-2",
            "bg-white/5 backdrop-blur-xl",
            "border border-white/10 rounded-2xl",
            "shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          )}
        >
          {}
          <div className="flex items-center">
            {items.map((item, index) => (
              <DockIconButton
                key={index}
                icon={item.icon}
                label={item.label}
                onClick={item.onClick}
                href={item.href}
              />
            ))}
          </div>

          {}
          <div className="w-px h-6 bg-white/20 mx-2" />

          {}
          <UserButton />

          {}
          <div className="flex items-center pl-2">
            <span className="text-white/90 font-medium tracking-wide text-sm">
              ascend.<sup className="text-[8px] ml-0.5 text-white/60">®</sup>
            </span>
          </div>
        </motion.div>
      </motion.nav>
    );
  }
);
LandingDock.displayName = "LandingDock";

export { LandingDock };