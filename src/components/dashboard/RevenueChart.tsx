interface RevenueChartProps {
  data: Array<{
    month: string;
    monthName: string;
    revenue: number;
    collectionRate: number;
  }>;
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data available
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const width = 100;
  const height = 100;
  const padding = 5;

  // Create points for the area chart
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1 || 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((item.revenue / maxRevenue) * (height - padding * 2));
    return { x, y, ...item };
  });

  // Create SVG path for area
  const areaPath = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x},${height - padding} L ${point.x},${point.y}`;
    }
    return `${path} L ${point.x},${point.y}`;
  }, "") + ` L ${points[points.length - 1].x},${height - padding} Z`;

  // Create SVG path for line
  const linePath = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x},${point.y}`;
    }
    return `${path} L ${point.x},${point.y}`;
  }, "");

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(0)}K`;
    }
    return `₦${amount}`;
  };

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="relative h-64 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-6 border border-border/40">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.05"
              strokeWidth="0.5"
            />
          ))}

          {/* Area gradient */}
          <defs>
            <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area */}
          <path d={areaPath} fill="url(#revenueGradient)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="rgb(16, 185, 129)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="2"
              fill="rgb(16, 185, 129)"
              className="hover:r-3 transition-all cursor-pointer"
            />
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-6 bottom-6 flex flex-col justify-between text-xs text-muted-foreground">
          <span>{formatCurrency(maxRevenue)}</span>
          <span>{formatCurrency(maxRevenue * 0.5)}</span>
          <span>₦0</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between px-6 text-xs text-muted-foreground">
        {data.map((item, index) => {
          const monthLabel = item.monthName ? item.monthName.split(" ")[0] : item.month || "";
          return (
            <div key={index} className="flex flex-col items-center">
              <span className="hidden sm:inline">
                {monthLabel}
              </span>
              <span className="sm:hidden">
                {monthLabel.substring(0, 3)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full" />
          <span className="text-muted-foreground">Revenue Trend</span>
        </div>
      </div>
    </div>
  );
};
