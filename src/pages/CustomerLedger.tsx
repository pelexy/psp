import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Printer } from "@/lib/icons";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LedgerRow {
  date: Date;
  description: string;
  reference?: string;
  kind: "charge" | "payment";
  charge: number; // debit — money the customer owes (invoice / bill)
  payment: number; // credit — money received
  balance: number; // running balance owed after this row
}

const money = (n: number) =>
  "₦" +
  new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);

const shortDate = (d: Date) =>
  d.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });

const drCr = (bal: number) => (bal > 0 ? "Dr" : bal < 0 ? "Cr" : "");

const CustomerLedger = () => {
  const { accountNumber } = useParams<{ accountNumber: string }>();
  const { accessToken, psp } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<any>(null);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [totals, setTotals] = useState({ charges: 0, payments: 0, balance: 0 });
  const [yearFilter, setYearFilter] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      if (!accountNumber || !accessToken) return;
      setLoading(true);
      try {
        const detailRes = await apiService.getCustomerDetails(accessToken, accountNumber);
        const d = detailRes?.data?.customerDetails || detailRes?.customerDetails || {};
        setDetails(d);

        // The ledger statement is the source of truth — it already holds every
        // DEBIT (charge / backlog), CREDIT (payment) and FEE (platform fee) line,
        // each with a human-readable description (e.g. "Platform fee (10%)").
        const custId = d.customerId;
        const stmtRes = custId
          ? await apiService.getCustomerLedgerStatement(accessToken, custId, 1, 2000)
          : null;
        const entries: any[] = stmtRes?.data?.entries || [];

        const events: Omit<LedgerRow, "balance">[] = entries.map((e) => {
          const amt = Number(e.amount) || 0;
          const isCredit = String(e.type || "").toLowerCase() === "credit";
          return {
            date: new Date(e.createdAt),
            description: e.description || (isCredit ? "Payment received" : "Charge"),
            reference: e.reference,
            kind: isCredit ? "payment" : "charge",
            charge: isCredit ? 0 : amt,
            payment: isCredit ? amt : 0,
          };
        });

        events.sort((a, b) => a.date.getTime() - b.date.getTime());

        let balance = 0;
        let charges = 0;
        let payments = 0;
        const built: LedgerRow[] = events.map((e) => {
          balance += e.charge - e.payment;
          charges += e.charge;
          payments += e.payment;
          return { ...e, balance };
        });

        setRows(built);
        setTotals({ charges, payments, balance });
      } catch (error: any) {
        console.error("Error loading ledger:", error);
        toast.error(error.message || "Failed to load ledger");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accountNumber, accessToken]);

  // Years present, newest first.
  const years = useMemo(
    () => Array.from(new Set(rows.map((r) => r.date.getFullYear()))).sort((a, b) => b - a),
    [rows]
  );

  // Year-filtered view — running balance stays the TRUE cumulative balance;
  // an opening-balance row anchors the selected year.
  const view = useMemo(() => {
    if (yearFilter === "all") {
      return {
        rows,
        opening: 0,
        periodCharges: totals.charges,
        periodPayments: totals.payments,
      };
    }
    const y = Number(yearFilter);
    const firstIdx = rows.findIndex((r) => r.date.getFullYear() === y);
    const filtered = rows.filter((r) => r.date.getFullYear() === y);
    const opening = firstIdx > 0 ? rows[firstIdx - 1].balance : 0;
    return {
      rows: filtered,
      opening,
      periodCharges: filtered.reduce((s, r) => s + r.charge, 0),
      periodPayments: filtered.reduce((s, r) => s + r.payment, 0),
    };
  }, [rows, yearFilter, totals]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 p-4 md:p-6 lg:p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[520px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const owing = totals.balance;
  const closing = view.rows.length ? view.rows[view.rows.length - 1].balance : view.opening;

  return (
    <DashboardLayout>
      {/* Print styles: only the statement prints, cleanly and unclipped. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #ledger-print, #ledger-print * { visibility: visible !important; }
          #ledger-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
          #ledger-scroll { max-height: none !important; overflow: visible !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-full space-y-4 bg-background p-4 md:p-6 lg:p-8">
        {/* Action bar (not printed) */}
        <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-muted-foreground shadow-card transition-colors hover:text-foreground"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">Account Ledger</h1>
              <p className="text-xs text-muted-foreground">
                {details?.fullName} · <span className="font-mono">{details?.accountNumber}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => window.print()} variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        </div>

        {/* Summary band */}
        <div className="no-print grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-card p-3.5 shadow-card">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Current Balance</p>
            <p className={`mt-1 text-xl font-semibold tabular-nums ${owing > 0 ? "text-destructive" : "text-success"}`}>
              {money(Math.abs(owing))} <span className="text-sm font-medium text-muted-foreground">{drCr(owing) || "settled"}</span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{owing > 0 ? "Customer owes" : owing < 0 ? "In credit" : "No balance"}</p>
          </div>
          <div className="rounded-xl bg-card p-3.5 shadow-card">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Charged{yearFilter !== "all" ? ` · ${yearFilter}` : ""}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{money(view.periodCharges)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Debits (bills)</p>
          </div>
          <div className="rounded-xl bg-card p-3.5 shadow-card">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Paid{yearFilter !== "all" ? ` · ${yearFilter}` : ""}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-success">{money(view.periodPayments)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Credits</p>
          </div>
          <div className="rounded-xl bg-card p-3.5 shadow-card">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Entries</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{view.rows.length}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{yearFilter === "all" ? "All time" : `In ${yearFilter}`}</p>
          </div>
        </div>

        {/* Ledger statement */}
        <div id="ledger-print" className="overflow-hidden rounded-xl bg-card shadow-card">
          {/* Statement header (mainly for print) */}
          <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-[15px] font-semibold uppercase tracking-wide text-foreground">
                {psp?.companyName || "Waste Management"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Account Statement (Ledger){yearFilter !== "all" ? ` · ${yearFilter}` : ""}
              </p>
              <p className="mt-1 text-[13px] font-medium text-foreground">{details?.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {[details?.wardName, details?.streetName].filter(Boolean).join(" / ")}
                {details?.address ? ` · ${details.address}` : ""}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Generated {shortDate(new Date())}</p>
              <p className="mt-1 text-muted-foreground">Account No</p>
              <p className="font-mono text-sm font-semibold text-foreground">{details?.accountNumber}</p>
            </div>
          </div>

          {/* Scrollable, sticky-header ledger table — scales to hundreds of rows */}
          <div id="ledger-scroll" className="max-h-[62vh] overflow-auto">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-muted text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Description</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">Charge</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">Payment</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {/* Opening balance anchor when a year is selected */}
                {yearFilter !== "all" && view.rows.length > 0 && (
                  <tr className="border-b border-border bg-muted/30">
                    <td className="px-4 py-2 text-muted-foreground" colSpan={2}>
                      Opening balance · {yearFilter}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">—</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">—</td>
                    <td className="px-4 py-2 text-right font-medium tabular-nums text-muted-foreground">
                      {money(Math.abs(view.opening))} {drCr(view.opening)}
                    </td>
                  </tr>
                )}

                {view.rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      No account activity{yearFilter !== "all" ? ` in ${yearFilter}` : " yet"}
                    </td>
                  </tr>
                ) : (
                  view.rows.map((r, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{shortDate(r.date)}</td>
                      <td className="px-4 py-2.5 text-foreground">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                              r.kind === "charge" ? "bg-muted-foreground/50" : "bg-success"
                            }`}
                          />
                          {r.description}
                          {r.reference && <span className="font-mono text-xs text-muted-foreground">#{r.reference}</span>}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right text-foreground tabular-nums">
                        {r.charge > 0 ? money(r.charge) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right text-success tabular-nums">
                        {r.payment > 0 ? money(r.payment) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular-nums text-foreground">
                        {money(Math.abs(r.balance))} <span className="text-xs text-muted-foreground">{drCr(r.balance)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer totals + closing balance */}
          <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex gap-6 text-[13px]">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Charged</p>
                <p className="font-semibold tabular-nums text-foreground">{money(view.periodCharges)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Paid</p>
                <p className="font-semibold tabular-nums text-success">{money(view.periodPayments)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-4 py-2.5">
              <span className="text-[13px] font-semibold text-muted-foreground">
                {closing >= 0 ? "Balance Due" : "In Credit"}
              </span>
              <span className={`text-lg font-semibold tabular-nums ${closing > 0 ? "text-destructive" : "text-success"}`}>
                {money(Math.abs(closing))}
              </span>
            </div>
          </div>
        </div>

        <p className="no-print text-center text-xs text-muted-foreground">This is a computer-generated account statement.</p>
      </div>
    </DashboardLayout>
  );
};

export default CustomerLedger;
