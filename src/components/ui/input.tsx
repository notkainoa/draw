import * as React from "react";

import { cn } from "@/lib/utils";

import { Eye, EyeOff } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-input border-2 border-border-input bg-background-input px-3 py-2 text-base text-text-primary placeholder:text-text-muted file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:border-accent-blue disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-in-out shadow-sm font-virgil",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

const HiddenInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          className={cn(
            "flex h-10 w-full rounded-input border-2 border-border-input bg-background-input px-3 py-2 text-base text-text-primary placeholder:text-text-muted file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:border-accent-blue disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-in-out shadow-sm font-virgil",
            "pr-10",
            className,
          )}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary focus:outline-none transition-colors duration-150 ease-in-out"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  },
);

Input.displayName = "Input";
HiddenInput.displayName = "HiddenInput";

export { Input, HiddenInput };
