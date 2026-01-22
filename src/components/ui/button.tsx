
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type TargetAndTransition, type Variants, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

// Define the MotionButtonProps type correctly
type MotionButtonProps = Omit<HTMLMotionProps<"button">, "animate" | "initial" | "transition" | "whileHover" | "whileTap"> & 
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
    whileHover?: TargetAndTransition | string;
    whileTap?: TargetAndTransition | string;
    initial?: TargetAndTransition | string;
    animate?: TargetAndTransition | string;
    transition?: any;
  };

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 shadow-sm",
        destructive: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm",
        outline: "border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 shadow-sm",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 shadow-sm",
        ghost: "hover:bg-gray-50 active:bg-gray-100 text-gray-700",
        link: "text-blue-500 underline-offset-4 hover:underline",
        clean: "bg-blue-500 text-white hover:bg-blue-400 active:bg-blue-600 shadow-sm",
        cleanOutline: "border border-blue-200 text-blue-600 bg-white hover:bg-blue-50 active:bg-blue-100",
        success: "bg-green-500 text-white hover:bg-green-400 active:bg-green-600 shadow-sm",
        primary: "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 active:from-blue-700 active:to-blue-600 shadow-md",
      },
      size: {
        default: "h-10 px-5 py-2",
        xs: "h-7 text-xs px-2.5 py-1 rounded-lg",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8 text-base",
        xl: "h-12 rounded-xl px-10 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children as React.ReactNode}
      </Comp>
    );
  }
);

// Define specific motion animation variants for enhanced interactions
const buttonAnimationVariants: Variants = {
  initial: { scale: 1, y: 0 },
  hover: { scale: 1.03, y: -1 },
  tap: { scale: 0.97 }
};

// Create a proper typed motion button version that works with both React and Framer Motion
const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    whileHover = "hover", 
    whileTap = "tap", 
    transition = { duration: 0.15 }, 
    animate = "initial", 
    initial = "initial", 
    isLoading, 
    children,
    ...props 
  }, ref) => {
    const buttonClasses = cn(buttonVariants({ variant, size, className }));
    
    return (
      <motion.button
        className={buttonClasses}
        ref={ref}
        variants={buttonAnimationVariants}
        initial={initial}
        whileHover={whileHover}
        whileTap={whileTap}
        transition={transition}
        animate={animate}
        {...props}
      >
        {children as React.ReactNode}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
MotionButton.displayName = "MotionButton";

export { Button, MotionButton, buttonVariants };
