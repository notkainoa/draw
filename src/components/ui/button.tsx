import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-blue disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-accent-blue text-white hover:opacity-90 border-2 border-transparent rounded-button shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:shadow-[1px_1px_0px_rgba(0,0,0,0.2)] hover:translate-y-[1px] hover:translate-x-[1px] transition-all",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 border-2 border-transparent rounded-button shadow-[2px_2px_0px_rgba(0,0,0,0.2)]",
        outline:
          "border-2 border-text-primary bg-transparent text-text-primary hover:bg-background-hover rounded-button shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:shadow-[1px_1px_0px_rgba(0,0,0,0.2)] hover:translate-y-[1px] hover:translate-x-[1px] transition-all",
        secondary:
          "bg-background-card text-text-primary hover:bg-background-hover border-2 border-border-subtle rounded-button shadow-[2px_2px_0px_rgba(0,0,0,0.2)]",
        ghost:
          "bg-transparent text-text-secondary hover:bg-background-hover hover:text-text-primary border-0 rounded-button",
        link: "text-accent-blue underline-offset-4 hover:underline bg-transparent",
        highlight: "bg-accent-yellow text-black hover:bg-yellow-500 border-2 border-black rounded-button shadow-[2px_2px_0px_rgba(0,0,0,0.2)]",
      },
      size: {
        default: "h-10 px-4 text-lg", /* Increased height and font size for Virgil */
        sm: "h-9 px-3 text-base",
        lg: "h-12 px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText = "Loading...",
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="flex cursor-progress gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText}
          </div>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
