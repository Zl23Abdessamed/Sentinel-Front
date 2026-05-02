import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Button shapes match design-system §4.1. Mono uppercase wordmark feel,
// amber primary, ghost minor actions, destructive only for genuinely
// destructive ops (revealing identity, force-closing).
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-mono text-[13px] font-semibold uppercase tracking-[0.04em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sentinel focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-40 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:
          "bg-sentinel text-bg hover:opacity-90 hover:-translate-y-px active:translate-y-0",
        outline:
          "bg-transparent border border-border text-text hover:bg-surface-hover hover:border-border-soft",
        ghost:
          "bg-transparent text-text-muted hover:text-text hover:bg-surface-hover",
        destructive:
          "bg-p1 text-white hover:opacity-90",
        vault:
          "bg-vault text-white hover:opacity-90",
      },
      size: {
        default: "h-9 px-5 py-2",
        sm: "h-7 px-3 text-[11px]",
        lg: "h-11 px-6",
        icon: "h-9 w-9 px-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
