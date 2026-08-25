import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatChartAxis } from "@/utils/formatCurrency";

interface RevenueChartProps {
  revenueData?: any;
}

export function RevenueChart({ revenueData }: RevenueChartProps) {
  const data = revenueData?.monthlyData || [];
  const totalInvoiced = revenueData?.summary.totalInvoiced || 0;
  const totalCollected = revenueData?.summary.totalCollected || 0;
  const overallEfficiency = revenueData?.summary.overallEfficiency.toFixed(1) || "0.0";
  return (
    <Card className="min-h-[380px] w-full overflow-hidden p-5 md:p-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Revenue Performance</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{revenueData?.period || "Loading..."}</p>
          </div>
          <div className="flex gap-5">
            <div>
              <p className="text-xs text-muted-foreground">Invoiced</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(totalInvoiced)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Collected</p>
              <p className="text-sm font-semibold tabular-nums text-success">{formatCurrency(totalCollected)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Efficiency</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">{overallEfficiency}%</p>
            </div>
          </div>
        </div>

        <div className="h-[240px] sm:h-[280px] md:h-[320px] w-full">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1f9d57" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1f9d57" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatChartAxis(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => {
                    const label = name === "invoicedAmount" ? "Invoiced" : name === "collectedAmount" ? "Collected" : "Efficiency";
                    return name === "efficiency"
                      ? [`${value}%`, label]
                      : [`₦${value.toLocaleString()}`, label];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="invoicedAmount"
                  stroke="#64748b"
                  strokeWidth={2}
                  fill="url(#colorInvoiced)"
                  name="invoicedAmount"
                />
                <Area
                  type="monotone"
                  dataKey="collectedAmount"
                  stroke="#1f9d57"
                  strokeWidth={2.5}
                  fill="url(#colorCollected)"
                  name="collectedAmount"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <p className="text-xs sm:text-sm">No revenue data yet</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 border-t border-border pt-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#64748b]" />
            <span className="text-muted-foreground">Invoiced Amount</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1f9d57]" />
            <span className="text-muted-foreground">Collected Amount</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
