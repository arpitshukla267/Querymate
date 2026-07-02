"use client";

import { cn } from "@/lib/utils";

export function Input({
  label,
  error,
  className = "",
  containerClassName = "",
  ...props
}) {
  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-text-primary))]">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={cn(
          "w-full px-4 py-2 rounded-lg border border-[rgb(var(--color-border))]",
          "bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-primary))]",
          "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent",
          "transition-all duration-200 placeholder:text-[rgb(var(--color-text-secondary))]",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className = "",
  containerClassName = "",
  rows = 4,
  ...props
}) {
  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-text-primary))]">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={cn(
          "w-full px-4 py-2 rounded-lg border border-[rgb(var(--color-border))]",
          "bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-primary))]",
          "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent",
          "transition-all duration-200 placeholder:text-[rgb(var(--color-text-secondary))] resize-none",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export function Select({
  label,
  error,
  options = [],
  className = "",
  containerClassName = "",
  ...props
}) {
  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-text-primary))]">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={cn(
          "w-full px-4 py-2 rounded-lg border border-[rgb(var(--color-border))]",
          "bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-primary))]",
          "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent",
          "transition-all duration-200",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

