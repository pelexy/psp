// Shared types + helpers for the Bill Analytics dashboard and its detail pages.
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter } from "date-fns";

export interface AnalyticsKpis {
  billed: number;
  collected: number;
  outstanding: number;
  collectionRate: number;
  customers: number;
  paid: number;
  partial: number;
  unpaid: number;
  paymentCompliance: number;
}

export interface TrendPoint {
  month: string; // YYYY-MM
  billed: number;
  collected: number;
}

export interface DimensionRow {
  // one of these name/id pairs is populated depending on the dimension
  streetName?: string;
  streetId?: string | null;
  wardName?: string;
  wardId?: string | null;
  cycleName?: string;
  cycleId?: string | null;
  billed: number;
  collected: number;
  outstanding: number;
  customers: number;
  compliance: number;
}

export interface Defaulter {
  name: string;
  streetName: string;
  acct: string | null;
  outstanding: number;
}

export interface AnalyticsResult {
  kpis: AnalyticsKpis;
  trend: TrendPoint[];
  byStreet: DimensionRow[];
  byWard: DimensionRow[];
  byCycle: DimensionRow[];
  topDefaulters: Defaulter[];
}

export type Dimension = "street" | "ward" | "cycle";

export const DIMENSION_META: Record<
  Dimension,
  { title: string; nameKey: keyof DimensionRow; resultKey: keyof AnalyticsResult }
> = {
  street: { title: "Street performance", nameKey: "streetName", resultKey: "byStreet" },
  ward: { title: "Ward performance", nameKey: "wardName", resultKey: "byWard" },
  cycle: { title: "Cycle performance", nameKey: "cycleName", resultKey: "byCycle" },
};

export const money = (n: number) => "₦" + (Number(n) || 0).toLocaleString();

// ── Date presets ──────────────────────────────────────────────────────────
export type PresetKey = "this_month" | "last_month" | "this_quarter" | "all" | "custom";

export interface DateRange {
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;
}

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "this_quarter", label: "This quarter" },
  { key: "all", label: "All time" },
];

export function rangeForPreset(key: PresetKey, now: Date = new Date()): DateRange {
  switch (key) {
    case "this_month":
      return { dateFrom: fmt(startOfMonth(now)), dateTo: fmt(endOfMonth(now)) };
    case "last_month": {
      const lm = subMonths(now, 1);
      return { dateFrom: fmt(startOfMonth(lm)), dateTo: fmt(endOfMonth(lm)) };
    }
    case "this_quarter":
      return { dateFrom: fmt(startOfQuarter(now)), dateTo: fmt(endOfQuarter(now)) };
    case "all":
    default:
      return {};
  }
}

// Headline collection-rate colour: green ≥70, amber ≥40, red else.
export function complianceTone(pct: number): { text: string; bar: string; badge: "default" | "secondary" | "destructive" } {
  if (pct >= 70) return { text: "text-emerald-600", bar: "bg-emerald-500", badge: "default" };
  if (pct >= 40) return { text: "text-amber-600", bar: "bg-amber-500", badge: "secondary" };
  return { text: "text-red-600", bar: "bg-red-500", badge: "destructive" };
}

export const rowName = (r: DimensionRow, dim: Dimension): string =>
  (r[DIMENSION_META[dim].nameKey] as string) || "—";
