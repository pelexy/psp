import { cn } from "@/lib/utils";
import React from "react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
  iconColor?: "primary" | "success" | "warning" | "destructive";
  gradient?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  change,
  changeType = "neutral",
  icon: Icon,
  gradient = false,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-glow animate-fade-in min-h-[140px] sm:min-h-[160px] w-full",
        gradient
          ? "bg-gradient-primary border-primary/20"
          : "bg-card/40 border-border/50"
      )}
    >
      {/* Animated background blur */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Floating icon background */}
      <div className="absolute -right-4 -top-4 h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-primary-glow/20 to-transparent blur-2xl" />

      <div className="relative p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className={cn(
              "text-sm font-medium",
              gradient ? "text-primary-foreground/80" : "text-muted-foreground"
            )}>
              {title}
            </p>
            {subtitle && (
              <p className={cn(
                "text-xs",
                gradient ? "text-primary-foreground/60" : "text-muted-foreground/70"
              )}>
                {subtitle}
              </p>
            )}
          </div>
          <div
            className={cn(
              "rounded-xl sm:rounded-2xl p-2 sm:p-2.5 md:p-3 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
              gradient ? "bg-primary-foreground/10" : "bg-gradient-primary"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 sm:h-6 sm:w-6",
                gradient ? "text-primary-foreground" : "text-primary-foreground"
              )}
            />
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <p className={cn(
            "text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight break-words",
            gradient ? "text-primary-foreground" : "text-foreground"
          )}>
            {value}
          </p>
          {change && (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm",
                  changeType === "positive" && "bg-success/20 text-success",
                  changeType === "negative" && "bg-destructive/20 text-destructive",
                  changeType === "neutral" && (gradient ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")
                )}
              >
                {change}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
