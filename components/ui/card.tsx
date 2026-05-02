import * as React from "react";
import { cn } from "@/lib/utils";

// Default Card maps directly to design-system §4.2 — surface bg, single
// border, radius-lg, padding 20. Severity-tagged / Whisper / Crisis variants
// add a 3px left border via prop.

type CardVariant = "default" | "severity" | "whisper" | "crisis" | "vault";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  severity?: "P1" | "P2" | "P3" | "P4";
  hoverable?: boolean;
}

const severityBorder: Record<NonNullable<CardProps["severity"]>, string> = {
  P1: "border-l-[3px] border-l-p1",
  P2: "border-l-[3px] border-l-p2",
  P3: "border-l-[3px] border-l-p3",
  P4: "border-l-[3px] border-l-p4",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", severity, hoverable, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-surface border border-border rounded-lg p-5",
        hoverable && "transition-colors duration-200 hover:border-border-soft cursor-pointer",
        variant === "severity" && severity && severityBorder[severity],
        variant === "whisper" && "border-l-[3px] border-l-whisper bg-[rgba(139,92,246,0.04)]",
        variant === "crisis" && "border-l-[3px] border-l-p1 animate-crisis-glow",
        variant === "vault" && "border-l-[3px] border-l-vault",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 mb-4", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-h3", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-body", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-2 mt-4", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";
