"use client";

import { cn } from "@/lib/utils";
import { Link, LinkProps, useLocation } from "react-router-dom";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import montanhaLogo from "@/assets/Montanha logo.png";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebarAceternity = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarAceternity must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProviderAceternity = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const SidebarAceternity = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProviderAceternity open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProviderAceternity>
  );
};

export const SidebarBody = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <>
      <DesktopSidebar className={className}>{children}</DesktopSidebar>
      <MobileSidebar className={className}>{children}</MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebarAceternity();
  return (
    <motion.div
      className={cn(
        "h-full px-3 py-4 hidden md:flex md:flex-col glass-sidebar pointer-events-auto",
        className
      )}
      animate={{
        width: animate ? (open ? "240px" : "72px") : "240px",
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebarAceternity();
  return (
    <>
      <div
        className={cn(
          "h-14 px-4 py-3 flex flex-row md:hidden items-center justify-between glass-sidebar w-full"
        )}
        {...props}
      >
        <div className="flex items-center gap-3">
          <span className="text-sidebar-foreground font-medium tracking-wide text-sm">
            ascend.<sup className="text-[8px] ml-0.5 text-sidebar-foreground/60">®</sup>
          </span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-xl glass-button"
        >
          <Menu className="text-sidebar-foreground w-5 h-5" />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
              }}
              className={cn(
                "fixed h-full w-full inset-0 glass-sidebar p-6 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-6 top-6 z-50 p-2 rounded-xl glass-button cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <X className="text-sidebar-foreground w-5 h-5" />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: Omit<LinkProps, 'to'>;
}) => {
  const { open, animate } = useSidebarAceternity();
  const location = useLocation();
  const isActive = location.pathname === link.href;
  
  return (
    <Link
      to={link.href}
      className={cn(
        "sidebar-link group",
        isActive && "active",
        className
      )}
      {...props}
    >
      <span className={cn(
        "icon transition-colors duration-200",
        isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
      )}>
        {link.icon}
      </span>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "text-sm font-medium whitespace-pre transition-all duration-200",
          isActive ? "text-sidebar-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
        )}
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

// Logo components for the sidebar
export const Logo = () => {
  const { open, animate } = useSidebarAceternity();
  return (
    <div className="relative px-1 py-3 mb-2">
      {/* Barra decorativa superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary/40 rounded-full" />
      
      {/* Container */}
      <Link
        to="/dashboard"
        className="flex items-center gap-3 p-3 transition-colors"
      >
        <motion.div
          animate={{
            justifyContent: animate ? (open ? "flex-start" : "center") : "flex-start",
          }}
          className="flex items-center w-full"
        >
          <span className="text-sidebar-foreground font-medium tracking-wide text-sm">
            ascend.<sup className="text-[8px] ml-0.5 text-sidebar-foreground/60">®</sup>
          </span>
        </motion.div>
      </Link>
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div className="relative px-1 py-3 mb-2">
      {/* Barra decorativa superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary/40 rounded-full" />
      
      <Link
        to="/dashboard"
        className="flex items-center justify-center p-2 transition-colors"
      >
        <img
          src={montanhaLogo}
          alt="Montanha Logo"
          className="h-8 w-auto filter brightness-0 invert"
        />
      </Link>
    </div>
  );
};
