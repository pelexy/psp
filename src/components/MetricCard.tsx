import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "@/lib/icons";
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

const iconTints: Record<NonNullable<MetricCardProps["iconColor"]>, string> = {
  primary: "bg-accent text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export function MetricCard({
  title,
  value,
  subtitle,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "primary",
}: MetricCardProps) {
  const DeltaIcon = changeType === "positive" ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="group flex min-h-[140px] w-full flex-col justify-between rounded-xl bg-card p-5 shadow-card transition-shadow duration-200 hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-[13px] font-medium text-muted-foreground">{title}</p>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground/70">{subtitle}</p>
          )}
        </div>
        <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg", iconTints[iconColor])}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="break-words text-2xl font-semibold tracking-tight tabular-nums text-foreground sm:text-[28px] sm:leading-9">
          {value}
        </p>
        {change && (
          <div className="flex items-center gap-1.5">
            {changeType !== "neutral" && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold",
                  changeType === "positive" && "bg-success/10 text-success",
                  changeType === "negative" && "bg-destructive/10 text-destructive",
                )}
              >
                <DeltaIcon className="h-3 w-3" />
              </span>
            )}
            <span className="truncate text-xs font-medium text-muted-foreground">{change}</span>
          </div>
        )}
      </div>
    </div>
  );
}
