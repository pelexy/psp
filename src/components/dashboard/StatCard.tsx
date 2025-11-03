import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  extra?: ReactNode;
}

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-100/80",
  trend,
  extra,
}: StatCardProps) => {
  return (
    <div className="group relative bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-6 hover:border-border/80 hover:shadow-md transition-all duration-300">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300" />

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground font-medium truncate">
              {title}
            </p>
          </div>
          <div className={`p-2.5 ${iconBgColor} rounded-lg shrink-0`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </div>

        {/* Value */}
        <div className="space-y-1">
          <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Trend or Extra */}
        {trend && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-border/40">
            {trend.isPositive !== undefined && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                  trend.isPositive
                    ? "bg-emerald-100/80 text-emerald-700"
                    : "bg-red-100/80 text-red-700"
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="text-xs font-semibold">
                  {trend.value > 0 ? "+" : ""}
                  {trend.value}%
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{trend.label}</p>
          </div>
        )}

        {extra && <div className="pt-2 border-t border-border/40">{extra}</div>}
      </div>
    </div>
  );
};
