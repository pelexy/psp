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
import { ArrowLeft, Printer, Plus, XCircle } from "@/lib/icons";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  LedgerEntryDialog,
  type LedgerEntryAction,
  type LedgerEntryTarget,
} from "@/components/customers/LedgerEntryDialog";

interface LedgerRow {
  id: string; // ledger entry id — needed to void a line
  date: Date; // transaction date (when it happened) — orders the statement
  entryDate?: Date; // posting date (when it was recorded), if different
  description: string;
  reference?: string;
  kind: "charge" | "payment";
  source?: string; // 'reversal' lines can't themselves be voided
  category?: string; // e.g. 'cutover_arrears' — recognised as arrears
  voided?: boolean; // this original line has been reversed (struck through)
  voidReason?: string; // why it was voided (shown under the struck-through line)
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
  const [refreshKey, setRefreshKey] = useState(0);

  // OTP-gated ledger-line corrections (PSP owner). Backend enforces @Roles('psp').
  const [ledgerAction, setLedgerAction] = useState<{
    action: LedgerEntryAction;
    entry?: LedgerEntryTarget;
  } | null>(null);

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

        const allEvents: (Omit<LedgerRow, "balance"> & { reversesEntryId?: string })[] = entries.map((e) => {
          const amt = Number(e.amount) || 0;
          const isCredit = String(e.type || "").toLowerCase() === "credit";
          return {
            id: e.id,
            // A manual/void correction can carry an explicit transaction date (the
            // date shown on the bill); it wins over posting time. Existing rows have
            // none, so are unaffected.
            date: new Date(e.metadata?.effectiveDate || e.createdAt),
            // System-stamped posting date (createdAt). Shown as subtext only when it
            // differs from the transaction date (i.e. a back-dated correction).
            entryDate: new Date(e.createdAt),
            description: e.description || (isCredit ? "Payment received" : "Charge"),
            reference: e.reference,
            kind: isCredit ? "payment" : "charge",
            source: e.source,
            category: e.metadata?.category,
            voided: !!e.metadata?.voided,
            voidReason: e.metadata?.voidReason,
            reversesEntryId:
              e.metadata?.reversesEntryId ||
              (String(e.reference || "").startsWith("REVLED-") ? String(e.reference).slice(7) : undefined),
            charge: isCredit ? 0 : amt,
            payment: isCredit ? amt : 0,
          };
        });

        // A void is an original line + an equal-and-opposite reversal line. They
        // cancel out, so show them as ONE struck-through line (the original) and
        // drop the reversal — it is not a payment and must never read as one.
        const voidedIds = new Set(allEvents.filter((e) => e.voided).map((e) => e.id));
        const events = allEvents.filter(
          (e) => !(String(e.source || "").toLowerCase() === "reversal" && e.reversesEntryId && voidedIds.has(e.reversesEntryId)),
        );
        events.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Charged = net debits (credits that aren't money received — write-offs,
        // corrections — reduce what was charged). Paid = real money received only.
        // So Charged − Paid always equals the balance.
        let balance = 0;
        let charges = 0;
        let payments = 0;
        const built: LedgerRow[] = events.map((e) => {
          if (e.voided) return { ...e, balance }; // cancelled — moves nothing
          balance += e.charge - e.payment;
          if (e.payment > 0 && String(e.source || "").toLowerCase() === "payment") payments += e.payment;
          else charges += e.charge - e.payment;
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
  }, [accountNumber, accessToken, refreshKey]);

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
      periodCharges: filtered.reduce(
        (s, r) => (r.voided || (r.payment > 0 && String(r.source || "").toLowerCase() === "payment") ? s : s + r.charge - r.payment),
        0,
      ),
      periodPayments: filtered.reduce(
        (s, r) => (!r.voided && String(r.source || "").toLowerCase() === "payment" ? s + r.payment : s),
        0,
      ),
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
            <Button
              onClick={() => setLedgerAction({ action: "add-entry" })}
              variant="outline"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" /> Add entry
            </Button>
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
            <p className="mt-1 text-[11px] text-muted-foreground">Bills &amp; charges (voids excluded)</p>
          </div>
          <div className="rounded-xl bg-card p-3.5 shadow-card">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Paid{yearFilter !== "all" ? ` · ${yearFilter}` : ""}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-success">{money(view.periodPayments)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Money received</p>
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
                  <th className="no-print whitespace-nowrap px-4 py-2.5 text-right font-medium"></th>
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
                    <td className="no-print px-4 py-2" />
                  </tr>
                )}

                {view.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      No account activity{yearFilter !== "all" ? ` in ${yearFilter}` : " yet"}
                    </td>
                  </tr>
                ) : (
                  view.rows.map((r, i) => {
                    const src = String(r.source || "").toLowerCase();
                    const isReversal = src === "reversal";
                    // Real money-in (electronic payments) and platform fees are NOT
                    // voidable from the ledger — voiding would misstate collections and
                    // never refunds the payer. Only charges / arrears / backlog /
                    // manual adjustments (and non-voided originals) can be voided.
                    const isElectronicPayment = src === "payment" || src === "fee";
                    const canVoid = !r.voided && !isReversal && !isElectronicPayment;
                    // Cut-over arrears = balances brought over from the old system at
                    // go-live: entries explicitly tagged cutover_arrears or the
                    // LEGACY-ARREARS migration seed. (The generic "opening bills owed"
                    // debit is NOT counted here — it is ordinary account balance.)
                    const ref = String(r.reference || "").toUpperCase();
                    const isCutover =
                      r.category === "cutover_arrears" || ref.startsWith("LEGACY-ARREARS");
                    return (
                    <tr key={r.id || i} className={`border-b border-border last:border-0 hover:bg-muted/40 ${r.voided ? "no-print opacity-60" : ""}`}>
                      <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                        {shortDate(r.date)}
                        {r.entryDate && shortDate(r.entryDate) !== shortDate(r.date) && (
                          <span className="block text-[10px] text-muted-foreground/70">entered {shortDate(r.entryDate)}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-foreground">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                              r.kind === "charge" ? "bg-muted-foreground/50" : "bg-success"
                            }`}
                          />
                          <span className={r.voided ? "line-through" : ""}>{r.description}</span>
                          {isCutover && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 no-underline">
                              Cut-over arrears
                            </span>
                          )}
                          {r.voided && (
                            <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive no-underline">
                              Voided
                            </span>
                          )}
                        </span>
                        {r.voided && (
                          <span className="mt-0.5 block text-[11px] text-muted-foreground" style={{ textDecoration: "none" }}>
                            Cancelled — not owed{r.voidReason ? ` · ${r.voidReason}` : ""}
                          </span>
                        )}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-2.5 text-right text-foreground tabular-nums ${r.voided ? "line-through" : ""}`}>
                        {r.charge > 0 ? money(r.charge) : "—"}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-2.5 text-right text-success tabular-nums ${r.voided ? "line-through" : ""}`}>
                        {r.payment > 0 ? money(r.payment) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular-nums text-foreground">
                        {money(Math.abs(r.balance))} <span className="text-xs text-muted-foreground">{drCr(r.balance)}</span>
                      </td>
                      <td className="no-print whitespace-nowrap px-4 py-2.5 text-right">
                        {canVoid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px] text-destructive hover:text-destructive"
                            title="Void this entry (posts a reversing line)"
                            onClick={() =>
                              setLedgerAction({
                                action: "void-entry",
                                entry: {
                                  id: r.id,
                                  description: r.description,
                                  reference: r.reference,
                                  kind: r.kind,
                                  amount: r.charge > 0 ? r.charge : r.payment,
                                },
                              })
                            }
                          >
                            <XCircle className="mr-1 h-3.5 w-3.5" /> Void
                          </Button>
                        )}
                      </td>
                    </tr>
                    );
                  })
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

      {ledgerAction && details?.customerId && (
        <LedgerEntryDialog
          open={!!ledgerAction}
          action={ledgerAction.action}
          entry={ledgerAction.entry}
          customerId={details.customerId}
          customerName={details?.fullName}
          onClose={() => setLedgerAction(null)}
          onDone={() => {
            setLedgerAction(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default CustomerLedger;
