import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatChartAxis } from "@/utils/formatCurrency";
import { ChartLineUp, Banknote, HandCoins, AlertTriangle, Users, ChevronRight } from "@/lib/icons";
import type { AnalyticsResult, Dimension, DimensionRow, PresetKey, DateRange } from "./analytics";
import {
  DIMENSION_META,
  PRESETS,
  rangeForPreset,
  complianceTone,
  money,
  rowName,
} from "./analytics";

// A compact horizontal compliance bar reused in the section tables.
const ComplianceBar = ({ pct }: { pct: number }) => {
  const tone = complianceTone(pct);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }} />
      </div>
      <span className={`text-[12px] font-medium tabular-nums ${tone.text}`}>{Math.round(pct)}%</span>
    </div>
  );
};

// KPI stat card.
const Kpi = ({
  label,
  value,
  icon: Icon,
  valueClass,
  hint,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
  valueClass?: string;
  hint?: string;
}) => (
  <Card className="p-4 md:p-5">
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
    </div>
    <p className={`mt-2 text-2xl font-semibold tabular-nums ${valueClass || "text-foreground"}`}>{value}</p>
    {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
  </Card>
);

// One "top 8" section card with a View all link to the detail page.
const SectionCard = ({
  dim,
  rows,
  range,
}: {
  dim: Dimension;
  rows: DimensionRow[];
  range: { preset: PresetKey; dateFrom?: string; dateTo?: string };
}) => {
  const navigate = useNavigate();
  // Worst compliance first — that's where attention is needed.
  const sorted = [...rows].sort((a, b) => a.compliance - b.compliance).slice(0, 8);
  const goDetail = () => {
    const q = new URLSearchParams();
    q.set("preset", range.preset);
    if (range.dateFrom) q.set("dateFrom", range.dateFrom);
    if (range.dateTo) q.set("dateTo", range.dateTo);
    navigate(`/analytics/${dim}?${q.toString()}`);
  };
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">{DIMENSION_META[dim].title}</h3>
          <p className="text-[11px] text-muted-foreground">Worst compliance first · top 8</p>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={goDetail}>
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 text-right font-medium">Billed</th>
              <th className="px-4 py-2 text-right font-medium">Collected</th>
              <th className="px-4 py-2 font-medium">Compliance</th>
              <th className="px-4 py-2 text-right font-medium">Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No data for this period
                </td>
              </tr>
            ) : (
              sorted.map((r, i) => (
                <tr key={i} className="hover:bg-muted/40">
                  <td className="max-w-[160px] truncate px-4 py-2.5 font-medium text-foreground">{rowName(r, dim)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{money(r.billed)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600">{money(r.collected)}</td>
                  <td className="px-4 py-2.5"><ComplianceBar pct={r.compliance} /></td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{money(r.outstanding)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const AnalyticsPage = () => {
  const { accessToken } = useAuth();

  const [preset, setPreset] = useState<PresetKey>("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);

  // The effective date range that gets sent to the API + carried to detail pages.
  const range = useMemo<DateRange & { preset: PresetKey }>(() => {
    if (preset === "custom") {
      return { preset, dateFrom: customFrom || undefined, dateTo: customTo || undefined };
    }
    return { preset, ...rangeForPreset(preset) };
  }, [preset, customFrom, customTo]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await apiService.getBillAnalytics(accessToken, {
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
      });
      setData(res.data as AnalyticsResult);
    } catch (e: any) {
      toast.error(e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [accessToken, range.dateFrom, range.dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = data?.kpis;
  const rateTone = complianceTone(kpis?.collectionRate ?? 0);

  // Last 6 months of trend for the chart.
  const trend = useMemo(() => (data?.trend || []).slice(-6), [data]);

  return (
    <DashboardLayout>
      <div className="max-w-full space-y-4 overflow-hidden bg-background p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              <ChartLineUp className="h-6 w-6 text-primary" />
              Bill Analytics
            </h1>
            <p className="text-sm text-muted-foreground">
              Billing performance &amp; payment compliance across streets, wards and cycles
            </p>
          </div>
        </div>

        {/* Date filter */}
        <Card className="p-3 md:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.key}
                  size="sm"
                  variant={preset === p.key ? "default" : "outline"}
                  onClick={() => setPreset(p.key)}
                >
                  {p.label}
                </Button>
              ))}
              <Button
                size="sm"
                variant={preset === "custom" ? "default" : "outline"}
                onClick={() => setPreset("custom")}
              >
                Custom
              </Button>
            </div>
            {preset === "custom" && (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  className="h-9 w-40"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="date"
                  className="h-9 w-40"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            )}
          </div>
        </Card>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              <Kpi label="Billed" value={money(kpis?.billed ?? 0)} icon={Banknote} />
              <Kpi label="Collected" value={money(kpis?.collected ?? 0)} icon={HandCoins} valueClass="text-emerald-600" />
              <Kpi
                label="Collection rate"
                value={`${Math.round(kpis?.collectionRate ?? 0)}%`}
                valueClass={rateTone.text}
                hint="Collected ÷ Billed"
              />
              <Kpi label="Outstanding" value={money(kpis?.outstanding ?? 0)} icon={AlertTriangle} valueClass="text-red-600" />
              <Kpi label="Customers billed" value={(kpis?.customers ?? 0).toLocaleString()} icon={Users} />
              <Kpi
                label="Payment compliance"
                value={`${Math.round(kpis?.paymentCompliance ?? 0)}%`}
                valueClass={complianceTone(kpis?.paymentCompliance ?? 0).text}
                hint="Bills paid on time"
              />
            </div>

            {/* Compliance breakdown + Trend */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Breakdown */}
              <Card className="p-4 md:p-5">
                <h3 className="mb-3 text-[13px] font-semibold text-foreground">Payment status</h3>
                <div className="space-y-3">
                  {[
                    { label: "Paid", count: kpis?.paid ?? 0, bar: "bg-emerald-500", badge: "default" as const },
                    { label: "Part-paid", count: kpis?.partial ?? 0, bar: "bg-amber-500", badge: "secondary" as const },
                    { label: "Unpaid", count: kpis?.unpaid ?? 0, bar: "bg-red-500", badge: "destructive" as const },
                  ].map((s) => {
                    const total = (kpis?.paid ?? 0) + (kpis?.partial ?? 0) + (kpis?.unpaid ?? 0);
                    const pct = total > 0 ? (s.count / total) * 100 : 0;
                    return (
                      <div key={s.label}>
                        <div className="mb-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${s.bar}`} />
                            <span className="text-[13px] text-foreground">{s.label}</span>
                          </div>
                          <Badge variant={s.badge} className="tabular-nums">{s.count.toLocaleString()}</Badge>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Trend */}
              <Card className="p-4 md:p-5 lg:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-foreground">Billed vs Collected</h3>
                  <p className="text-[11px] text-muted-foreground">Last 6 months</p>
                </div>
                <div className="h-[240px] w-full">
                  {trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trend} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis
                          stroke="#9ca3af"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => formatChartAxis(v)}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                            fontSize: "12px",
                          }}
                          formatter={(v: number, n: string) => [
                            `₦${Number(v).toLocaleString()}`,
                            n === "billed" ? "Billed" : "Collected",
                          ]}
                        />
                        <Legend
                          formatter={(v) => (v === "billed" ? "Billed" : "Collected")}
                          iconType="circle"
                          wrapperStyle={{ fontSize: "12px" }}
                        />
                        <Bar dataKey="billed" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="collected" fill="#1f9d57" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No trend data for this period
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Section cards */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <SectionCard dim="street" rows={data?.byStreet || []} range={range} />
              <SectionCard dim="ward" rows={data?.byWard || []} range={range} />
              <SectionCard dim="cycle" rows={data?.byCycle || []} range={range} />

              {/* Top defaulters */}
              <Card className="overflow-hidden">
                <div className="border-b border-border px-4 py-3">
                  <h3 className="text-[13px] font-semibold text-foreground">Top defaulters</h3>
                  <p className="text-[11px] text-muted-foreground">Highest outstanding balances</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-2 font-medium">Customer</th>
                        <th className="px-4 py-2 font-medium">Street</th>
                        <th className="px-4 py-2 font-medium">Account</th>
                        <th className="px-4 py-2 text-right font-medium">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(data?.topDefaulters || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                            No defaulters for this period
                          </td>
                        </tr>
                      ) : (
                        (data?.topDefaulters || []).slice(0, 8).map((d, i) => (
                          <tr key={i} className="hover:bg-muted/40">
                            <td className="max-w-[160px] truncate px-4 py-2.5 font-medium text-foreground">{d.name}</td>
                            <td className="max-w-[140px] truncate px-4 py-2.5 text-muted-foreground">{d.streetName || "—"}</td>
                            <td className="px-4 py-2.5 font-mono text-[12px] text-muted-foreground">{d.acct || "—"}</td>
                            <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-red-600">{money(d.outstanding)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
