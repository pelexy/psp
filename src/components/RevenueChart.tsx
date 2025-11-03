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
    <Card className="p-4 md:p-6 bg-white border border-gray-200 shadow-sm animate-fade-in min-h-[450px]">
      <div className="space-y-4 md:space-y-5">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Revenue Performance</h3>
            <p className="text-xs text-gray-500 mt-0.5">{revenueData?.period || "Loading..."}</p>
          </div>
          <div className="flex gap-3 md:gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">Invoiced</p>
              <p className="text-xs md:text-sm font-bold text-gray-900">{formatCurrency(totalInvoiced)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Collected</p>
              <p className="text-xs md:text-sm font-bold text-green-600">{formatCurrency(totalCollected)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Efficiency</p>
              <p className="text-xs md:text-sm font-bold text-gray-900">{overallEfficiency}%</p>
            </div>
          </div>
        </div>

        <div className="h-[250px] md:h-[320px] w-full">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#567E3A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#567E3A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                  stroke="#567E3A"
                  strokeWidth={2}
                  fill="url(#colorInvoiced)"
                  name="invoicedAmount"
                />
                <Area
                  type="monotone"
                  dataKey="collectedAmount"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorCollected)"
                  name="collectedAmount"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <p>Loading revenue data...</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 text-xs pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#567E3A]" />
            <span className="text-gray-600">Invoiced Amount</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-gray-600">Collected Amount</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
