import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, ChevronUp } from "@/lib/icons";
import type { AnalyticsResult, Dimension, DimensionRow, PresetKey } from "./analytics";
import {
  DIMENSION_META,
  complianceTone,
  money,
  rowName,
  rangeForPreset,
} from "./analytics";

type SortKey = "compliance" | "outstanding" | "billed" | "collected" | "customers";

const isDimension = (d?: string): d is Dimension => d === "street" || d === "ward" || d === "cycle";

const ComplianceBar = ({ pct }: { pct: number }) => {
  const tone = complianceTone(pct);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }} />
      </div>
      <span className={`text-[12px] font-medium tabular-nums ${tone.text}`}>{Math.round(pct)}%</span>
    </div>
  );
};

const AnalyticsDetailPage = () => {
  const { dimension } = useParams<{ dimension: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const dim: Dimension = isDimension(dimension) ? dimension : "street";

  // Carry the date filter from the dashboard via the querystring.
  const preset = (searchParams.get("preset") as PresetKey) || "this_month";
  const range = useMemo(() => {
    if (preset === "custom") {
      return {
        dateFrom: searchParams.get("dateFrom") || undefined,
        dateTo: searchParams.get("dateTo") || undefined,
      };
    }
    return rangeForPreset(preset);
  }, [preset, searchParams]);

  const [data, setData] = useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("compliance");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

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

  const rows: DimensionRow[] = (data?.[DIMENSION_META[dim].resultKey] as DimensionRow[]) || [];

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const av = Number(a[sortKey]) || 0;
      const bv = Number(b[sortKey]) || 0;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // compliance defaults to ascending (worst first); amounts to descending.
      setSortDir(key === "compliance" ? "asc" : "desc");
    }
  };

  const SortHeader = ({ label, k, align = "right" }: { label: string; k: SortKey; align?: "left" | "right" }) => (
    <th className={`px-4 py-2.5 ${align === "right" ? "text-right" : "text-left"} font-medium`}>
      <button
        className={`inline-flex items-center gap-1 hover:text-foreground ${sortKey === k ? "text-foreground" : ""}`}
        onClick={() => toggleSort(k)}
      >
        {label}
        {sortKey === k && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  const presetLabel =
    preset === "custom"
      ? `${range.dateFrom || "…"} → ${range.dateTo || "…"}`
      : preset.replace("_", " ");

  return (
    <DashboardLayout>
      <div className="max-w-full space-y-4 overflow-hidden bg-background p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button variant="ghost" size="sm" className="-ml-2 mb-1 gap-1 text-muted-foreground" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" /> Back to analytics
            </Button>
            <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              {DIMENSION_META[dim].title}
            </h1>
            <p className="text-sm capitalize text-muted-foreground">
              {rows.length.toLocaleString()} rows · {presetLabel}
            </p>
          </div>
        </div>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <SortHeader label="Customers" k="customers" />
                    <SortHeader label="Billed" k="billed" />
                    <SortHeader label="Collected" k="collected" />
                    <SortHeader label="Compliance" k="compliance" align="left" />
                    <SortHeader label="Outstanding" k="outstanding" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No data for this period
                      </td>
                    </tr>
                  ) : (
                    sorted.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/40">
                        <td className="max-w-[220px] truncate px-4 py-2.5 font-medium text-foreground">{rowName(r, dim)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{(r.customers ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{money(r.billed)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600">{money(r.collected)}</td>
                        <td className="px-4 py-2.5"><ComplianceBar pct={r.compliance} /></td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-foreground">{money(r.outstanding)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsDetailPage;
