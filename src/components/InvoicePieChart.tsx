import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Paid", value: 425000, count: 245, color: "hsl(var(--success))" },
  { name: "Pending", value: 98000, count: 89, color: "hsl(var(--warning))" },
  { name: "Overdue", value: 67000, count: 34, color: "hsl(var(--destructive))" },
  { name: "Partial", value: 31500, count: 28, color: "hsl(var(--primary))" },
];

const totalAmount = data.reduce((sum, item) => sum + item.value, 0);

export function InvoicePieChart() {
  return (
    <Card className="p-6 bg-primary/5 border border-primary/10 shadow-sm animate-fade-in">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Invoice Summary</h3>
          <p className="text-sm text-muted-foreground">Current period breakdown</p>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "var(--shadow-card)",
                }}
                formatter={(value: number, name: string, props: any) => [
                  `₦${value.toLocaleString()} (${props.payload.count} invoices)`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100"
            >
              <div
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 font-medium">{item.name}</p>
                <p className="text-sm font-bold text-foreground truncate">
                  ₦{item.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{item.count} invoices</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-5 border-t border-gray-200">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">Total Amount</span>
            <span className="text-2xl font-bold text-foreground">
              ₦{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
