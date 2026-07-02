"use client";

import { cn } from "@/lib/utils";

export function Card({ children, className = "", hover = false, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[rgb(var(--color-border))]",
        "bg-[rgb(var(--color-surface-elevated))]",
        "p-6 shadow-sm transition-all duration-200",
        hover && "hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }) {
  return (
    <h3 className={cn("text-xl font-semibold text-[rgb(var(--color-text-primary))]", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }) {
  return (
    <p className={cn("text-sm text-[rgb(var(--color-text-secondary))] mt-1", className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "" }) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  );
}

