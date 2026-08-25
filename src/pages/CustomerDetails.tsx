import { useState, useEffect, useMemo, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  FileText,
  AlertCircle,
  Trash2,
  Pencil,
  Home,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
} from "@/lib/icons";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { TrashSealPreview } from "@/components/customers/TrashSealPreview";
import { EditCustomerDialog } from "@/components/customers/EditCustomerDialog";
import { QRCodeSVG } from "qrcode.react";

/* ── Small presentational helpers — dense billing-console style ───────────── */

function Panel({
  title,
  subtitle,
  right,
  children,
  bodyClassName = "p-4",
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-card">
      {(title || right) && (
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {title && <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>}
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

function FinTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "bad" | "good" | "neutral";
}) {
  const valueClass = tone === "bad" ? "text-destructive" : tone === "good" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-xl bg-card p-3.5 shadow-card">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold tracking-tight tabular-nums ${valueClass}`}>{value}</p>
      {sub && <p className="mt-1 truncate text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Detail({ label, value, className = "" }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-[13px] font-medium text-foreground">{value}</div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

const CustomerDetails = () => {
  const { accountNumber } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [customer, setCustomer] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Wider slices used purely for the statistics charts (not the paged tables).
  const [statsInvoices, setStatsInvoices] = useState<any[]>([]);
  const [statsTxns, setStatsTxns] = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [billing, setBilling] = useState<any>(null);
  const [savingBilling, setSavingBilling] = useState(false);
  const [cycles, setCycles] = useState<any[]>([]);

  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [transactionTotalPages, setTransactionTotalPages] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingService, setTogglingService] = useState<string | null>(null);

  // Fetch customer details
  const fetchCustomerDetails = async () => {
    if (!accountNumber || !accessToken) return;

    setLoading(true);
    try {
      const response = await apiService.getCustomerDetails(accessToken, accountNumber);
      setCustomer(response);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast.error("Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [accountNumber, accessToken]);

  // Transactions (payments & activity) — load on mount
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!accountNumber || !accessToken) return;

      setTransactionsLoading(true);
      try {
        const response = await apiService.getCustomerTransactions(accessToken, accountNumber, transactionPage, 20);
        setTransactions(response.data || []);
        setTransactionTotal(response.pagination?.total || 0);
        setTransactionTotalPages(response.pagination?.totalPages || 1);
      } catch (error: any) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to load transactions");
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchTransactions();
  }, [accountNumber, accessToken, transactionPage]);

  // One-off wider pull for the statistics charts (best-effort, non-blocking).
  useEffect(() => {
    const fetchStats = async () => {
      if (!accountNumber || !accessToken) return;
      try {
        const [inv, txn] = await Promise.all([
          apiService.getCustomerInvoices(accessToken, accountNumber, 1, 200),
          apiService.getCustomerTransactions(accessToken, accountNumber, 1, 200),
        ]);
        setStatsInvoices(inv.data || []);
        setStatsTxns(txn.data || []);
      } catch {
        // Stats are non-critical — silently fall back to whatever loaded.
      }
    };
    fetchStats();
  }, [accountNumber, accessToken]);

  // Bills for this customer (to show the active bill + rolled-over history).
  useEffect(() => {
    const custId = customer?.customerDetails?.customerId;
    if (!accessToken || !custId) return;
    apiService
      .getBills(accessToken, 1, 12, { customerId: custId })
      .then((res) => setBills(res.data?.data || []))
      .catch(() => {});
    apiService
      .getCustomerBilling(accessToken, custId)
      .then((res) => setBilling(res.data))
      .catch(() => {});
    // Ledger statement — source of truth for charges, payments and platform fees.
    apiService
      .getCustomerLedgerStatement(accessToken, custId, 1, 500)
      .then((res) => setLedgerEntries(res?.data?.entries || []))
      .catch(() => {});
  }, [accessToken, customer]);

  // PSP bill cycles (assignable schedules).
  useEffect(() => {
    if (!accessToken) return;
    apiService
      .getBillCycles(accessToken)
      .then((res) => setCycles(res.data || []))
      .catch(() => {});
  }, [accessToken]);

  const updateBilling = async (patch: any) => {
    const custId = customer?.customerDetails?.customerId;
    if (!accessToken || !custId) return;
    setSavingBilling(true);
    try {
      const res = await apiService.updateCustomerBilling(accessToken, custId, patch);
      setBilling(res.data);
      toast.success("Billing cycle updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update billing cycle");
    } finally {
      setSavingBilling(false);
    }
  };

  // Delete customer
  const handleDeleteCustomer = async () => {
    if (!accessToken || !customer?.customerDetails?.customerId) return;

    setDeleting(true);
    try {
      await apiService.deleteCustomer(accessToken, customer.customerDetails.customerId);
      toast.success("Customer deleted successfully");
      navigate("/customers");
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      toast.error(error.message || "Failed to delete customer");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Toggle auto-generate for service
  const handleToggleAutoGenerate = async (collectionId: string, enrollmentId: string, currentStatus: boolean) => {
    if (!accessToken || !accountNumber) return;

    setTogglingService(enrollmentId);
    try {
      await apiService.toggleAutoGenerate(accessToken, collectionId, accountNumber);

      setCustomer((prevCustomer: any) => {
        if (!prevCustomer?.servicesEnrolled) return prevCustomer;

        return {
          ...prevCustomer,
          servicesEnrolled: prevCustomer.servicesEnrolled.map((service: any) =>
            service.enrollmentId === enrollmentId
              ? { ...service, autoGenerateInvoices: !currentStatus }
              : service
          ),
        };
      });

      toast.success(`Auto-generate ${!currentStatus ? "enabled" : "disabled"} successfully`);
    } catch (error: any) {
      console.error("Error toggling auto-generate:", error);
      toast.error(error.message || "Failed to toggle auto-generate");
    } finally {
      setTogglingService(null);
    }
  };

  // Statistics derived from the wider stats slices (charges = debits, payments = credits).
  const stats = useMemo(() => {
    const now = new Date();
    const buckets = new Map<string, { label: string; billed: number; collected: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.set(`${d.getFullYear()}-${d.getMonth()}`, {
        label: d.toLocaleString("en-US", { month: "short" }),
        billed: 0,
        collected: 0,
      });
    }

    let totalBilled = 0;
    let totalCollected = 0;
    let totalFees = 0;
    const creditEntries: { amount: number; date: Date }[] = [];

    if (ledgerEntries.length > 0) {
      // Preferred: the ledger is the source of truth.
      // DEBIT (source ≠ fee) = charges billed · CREDIT = payments · DEBIT fee = platform fees.
      ledgerEntries.forEach((e) => {
        const amt = Number(e.amount || 0);
        const d = new Date(e.createdAt);
        const k = `${d.getFullYear()}-${d.getMonth()}`;
        const type = String(e.type || "").toLowerCase();
        const source = String(e.source || "").toLowerCase();
        if (type === "credit") {
          totalCollected += amt;
          creditEntries.push({ amount: amt, date: d });
          if (buckets.has(k)) buckets.get(k)!.collected += amt;
        } else if (type === "debit") {
          if (source === "fee") {
            totalFees += amt;
          } else {
            totalBilled += amt;
            if (buckets.has(k)) buckets.get(k)!.billed += amt;
          }
        }
      });
    } else {
      // Fallback to the legacy slices if the ledger hasn't loaded.
      statsInvoices.forEach((inv) => {
        const amt = Number(inv.totalAmount || 0);
        totalBilled += amt;
        const d = new Date(inv.issueDate || inv.createdAt);
        const k = `${d.getFullYear()}-${d.getMonth()}`;
        if (buckets.has(k)) buckets.get(k)!.billed += amt;
      });
      statsTxns
        .filter((t) => {
          const ok = ["success", "successful", "completed"].includes(String(t.status).toLowerCase());
          const credit = ["credit", "payment"].includes(String(t.type).toLowerCase());
          return ok && credit;
        })
        .forEach((t) => {
          const amt = Number(t.amount || 0);
          totalCollected += amt;
          const d = new Date(t.paidAt || t.createdAt);
          creditEntries.push({ amount: amt, date: d });
          const k = `${d.getFullYear()}-${d.getMonth()}`;
          if (buckets.has(k)) buckets.get(k)!.collected += amt;
        });
    }

    const payments = creditEntries.sort((a, b) => b.date.getTime() - a.date.getTime());
    const paymentsCount = payments.length;
    return {
      monthly: [...buckets.values()],
      collectionRate: totalBilled > 0 ? Math.min(100, Math.round((totalCollected / totalBilled) * 100)) : 0,
      totalFees,
      paymentsCount,
      avgPayment: paymentsCount ? Math.round(totalCollected / paymentsCount) : 0,
      lastPayment: payments[0] ? { amount: payments[0].amount, date: payments[0].date } : null,
    };
  }, [ledgerEntries, statsInvoices, statsTxns]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 p-4 md:p-6 lg:p-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-24" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 lg:p-8">
          <div className="py-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Customer not found</p>
            <Button onClick={() => navigate("/customers")} className="mt-4">
              Back to Customers
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const details = customer.customerDetails || {};
  const financial = customer.financialSummary || {};
  const services = customer.servicesEnrolled || [];
  // NB: the API returns money as strings (numeric/decimal columns) — coerce to
  // numbers before ANY arithmetic, or `+` concatenates ("2152.38" + "4147.62").
  const balance = Number(financial.currentBalance) || 0;
  const activeBill = bills.find((b: any) => b.status === "active");
  const rolledBills = bills.filter((b: any) => b.status !== "active");

  // Money truth: everything ever charged = what's been paid + what's still owed.
  const paidToDate = Number(financial.totalPaid) || 0;
  const billedToDate = paidToDate + balance;
  // Collection rate = collected ÷ total obligation (paid + owed), not the ledger-debit total
  // (which is 0 until bills generate). This is what the PSP actually recovered.
  const collectionRate =
    billedToDate > 0 ? Math.min(100, Math.round((paidToDate / billedToDate) * 100)) : 0;

  // Estimated bill is quoted per the customer's cycle period (falls back to monthly).
  const cycleFreq: string | null = billing?.billCycleFrequency || null;
  const estBillLabel =
    cycleFreq === "weekly" ? "Est. Bill / Week"
    : cycleFreq === "biweekly" ? "Est. Bill / 2 Weeks"
    : cycleFreq === "daily" ? "Est. Bill / Day"
    : "Est. Bill / Month";
  const estBillSub =
    cycleFreq === "weekly" ? "Charged every week"
    : cycleFreq === "biweekly" ? "Charged every 2 weeks"
    : cycleFreq === "daily" ? "Charged daily"
    : cycleFreq === "monthly" ? "Charged monthly"
    : "Monthly estimate (no cycle yet)";

  return (
    <DashboardLayout>
      <div className="max-w-full space-y-4 overflow-hidden bg-background p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate("/customers")}
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-muted-foreground shadow-card transition-colors hover:text-foreground"
              title="Back to customers"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                  {details.address || details.fullName}
                </h1>
                <Badge variant={details.isActive ? "default" : "secondary"} className="shrink-0">
                  {details.accountStatus?.toUpperCase() || (details.isActive ? "ACTIVE" : "INACTIVE")}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span className="font-mono text-foreground">{details.accountNumber}</span>
                {details.contactName && (
                  <>
                    <span className="hidden sm:inline">·</span>
                    <span>{details.contactName}</span>
                  </>
                )}
                {details.lastLogin && (
                  <>
                    <span className="hidden lg:inline">·</span>
                    <span className="hidden lg:inline">
                      Last login {format(new Date(details.lastLogin), "MMM dd, yyyy HH:mm")}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <TrashSealPreview customer={customer} />
            <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)} className="gap-2">
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} className="gap-2">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>

        {/* Dialogs */}
        <EditCustomerDialog
          customer={customer}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onCustomerUpdated={fetchCustomerDetails}
        />
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Customer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{details.fullName}</strong>? This action cannot be undone. All
                customer data, invoices, and transactions will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCustomer}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90 focus:ring-destructive"
              >
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Financial stat band */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <FinTile
            label="Account Balance"
            value={`₦${balance.toLocaleString()}`}
            sub={balance > 0 ? "Outstanding" : "No balance due"}
            tone={balance > 0 ? "bad" : "neutral"}
          />
          <FinTile
            label="Paid to Date"
            value={`₦${paidToDate.toLocaleString()}`}
            sub="Credits on ledger"
            tone="good"
          />
          <FinTile
            label="Total Billed"
            value={`₦${billedToDate.toLocaleString()}`}
            sub="Charged to date (paid + owed)"
          />
          <FinTile
            label="Bills Raised"
            value={`${bills.length}`}
            sub="Statements generated"
          />
          <FinTile
            label={estBillLabel}
            value={`₦${(details.expectedBill || 0).toLocaleString()}`}
            sub={estBillSub}
          />
        </div>

        {/* 9 : 3 split */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* LEFT — main (9) */}
          <div className="space-y-4 lg:col-span-8 xl:col-span-9">
            {/* Billing statistics */}
            <Panel title="Billing Statistics" subtitle="Billed vs collected over the last 6 months" bodyClassName="p-4 sm:p-5">
              <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Collection Rate</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{collectionRate}%</p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${collectionRate}%` }} />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Payments</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{stats.paymentsCount}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">successful credits</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Avg Payment</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">₦{stats.avgPayment.toLocaleString()}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">per payment</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Last Payment</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                    {stats.lastPayment ? `₦${stats.lastPayment.amount.toLocaleString()}` : "—"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {stats.lastPayment ? format(stats.lastPayment.date, "MMM dd, yyyy") : "No payments yet"}
                  </p>
                </div>
              </div>

              {stats.totalFees > 0 && (
                <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px]">
                  <span className="text-amber-800">
                    Platform fees deducted from payments —{" "}
                    <button
                      className="underline underline-offset-2 hover:text-amber-900"
                      onClick={() => navigate(`/customers/${accountNumber}/ledger`)}
                    >
                      see line-by-line in the ledger
                    </button>
                  </span>
                  <span className="font-semibold tabular-nums text-amber-900">₦{stats.totalFees.toLocaleString()}</span>
                </div>
              )}

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthly} margin={{ top: 8, right: 4, left: -16, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid hsl(214 20% 91%)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px -2px rgba(15,23,42,0.08)",
                        fontSize: "12px",
                        padding: "8px 12px",
                      }}
                      formatter={(value: number, name: string) => [
                        `₦${Number(value).toLocaleString()}`,
                        name === "billed" ? "Billed" : "Collected",
                      ]}
                    />
                    <Bar dataKey="billed" name="billed" fill="#64748b" radius={[3, 3, 0, 0]} maxBarSize={26} />
                    <Bar dataKey="collected" name="collected" fill="#1f9d57" radius={[3, 3, 0, 0]} maxBarSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 flex items-center justify-center gap-5 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#64748b]" />
                  <span className="text-muted-foreground">Billed</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#1f9d57]" />
                  <span className="text-muted-foreground">Collected</span>
                </span>
              </div>
            </Panel>

            {/* Customer information */}
            <Panel title="Customer Information" bodyClassName="p-4 sm:p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                <div className="grid flex-1 gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Detail label="Account Number" value={<span className="font-mono">{details.accountNumber || "N/A"}</span>} />
                  <Detail
                    label="Old Account Number"
                    value={
                      details.oldAccountNumber ? (
                        <span className="font-mono">{details.oldAccountNumber}</span>
                      ) : (
                        <span className="italic text-muted-foreground">Not set</span>
                      )
                    }
                  />
                  <Detail label="Customer Type" value={<span className="capitalize">{details.customerType || "standalone"}</span>} />
                  <Detail
                    label="Contact Person"
                    value={
                      details.contactName ? (
                        details.contactName
                      ) : (
                        <span className="italic text-muted-foreground">Not set</span>
                      )
                    }
                  />
                  <Detail label="Phone Number" value={details.phone || "N/A"} />
                  <Detail label="Email Address" value={<span className="block truncate">{details.email || "N/A"}</span>} className="min-w-0" />
                  <Detail
                    label="Ward / Street"
                    value={
                      <>
                        {details.wardName || details.wardId?.name || details.ward?.name || "Not set"}
                        {(details.streetName || details.streetId?.name || details.street?.name) && (
                          <span className="text-muted-foreground"> / {details.streetName || details.streetId?.name || details.street?.name}</span>
                        )}
                      </>
                    }
                  />
                  <Detail
                    label="Address"
                    className="sm:col-span-2"
                    value={
                      <>
                        {details.address || "N/A"}
                        {(details.city || details.state || details.lga) && (
                          <span className="text-muted-foreground">
                            {" — "}
                            {[details.lga, details.city, details.state].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </>
                    }
                  />
                  {details.enumerationNotes && (
                    <Detail
                      label="Enumerator notes"
                      className="sm:col-span-2 xl:col-span-3"
                      value={<span className="whitespace-pre-wrap text-foreground">{details.enumerationNotes}</span>}
                    />
                  )}
                  <Detail
                    label="GPS Coordinates"
                    value={
                      details.latitude != null && details.longitude != null ? (
                        <a
                          href={`https://www.google.com/maps?q=${details.latitude},${details.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-primary hover:underline"
                        >
                          {Number(details.latitude).toFixed(6)}, {Number(details.longitude).toFixed(6)}
                        </a>
                      ) : (
                        <span className="italic text-muted-foreground">Not mapped</span>
                      )
                    }
                  />
                </div>
                <div className="flex shrink-0 flex-col items-center gap-1.5 self-start rounded-lg border border-border bg-muted/30 p-3">
                  <QRCodeSVG value={details.accountNumber} size={100} level="H" includeMargin={false} fgColor="#000000" bgColor="#ffffff" />
                  <p className="text-[11px] font-medium text-muted-foreground">Scan for Account Info</p>
                </div>
              </div>

              {/* Additional (secondary) contacts captured during enumeration */}
              {(() => {
                const secondary = ((details.contacts as any[]) || []).filter((c: any) => !c.isPrimary);
                if (secondary.length === 0) return null;
                return (
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="mb-3 text-sm font-medium text-muted-foreground">Additional contacts</p>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {secondary.map((c: any, i: number) => (
                        <div key={i} className="rounded-lg border border-border bg-muted/20 p-3">
                          <p className="font-medium text-foreground">{c.fullName || "Unnamed contact"}</p>
                          <p className="text-sm text-muted-foreground">{c.phone || "No phone"}</p>
                          {c.email && <p className="truncate text-xs text-muted-foreground">{c.email}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </Panel>

            {/* Property breakdown */}
            <Panel
              title="Property Breakdown"
              right={
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{estBillLabel}</p>
                  <p className="text-sm font-semibold text-success tabular-nums">₦{(details.expectedBill || 0).toLocaleString()}</p>
                </div>
              }
              bodyClassName="p-0"
            >
              {details.properties && details.properties.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Property Type</th>
                      <th className="px-4 py-2.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Qty</th>
                      <th className="px-4 py-2.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Occupancy</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Rate</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {details.properties.map((prop: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span className="text-[13px] font-medium text-foreground">{prop.propertyTypeName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center text-[13px] text-muted-foreground">{prop.quantity}</td>
                        <td className="px-4 py-2.5 text-center text-[12px] text-muted-foreground">
                          {prop.occupiedUnits !== undefined && prop.occupiedUnits !== null ? (
                            <>
                              {prop.occupiedUnits} occ · {prop.vacantUnits ?? (Number(prop.quantity) - Number(prop.occupiedUnits))} vac
                              {(prop.vacantUnits ?? 0) > 0 && (
                                <span className={`ml-1 ${prop.billVacant !== false ? "text-amber-600" : "text-muted-foreground/60"}`}>
                                  {prop.billVacant !== false ? "(vacant billed)" : "(vacant free)"}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[13px] text-muted-foreground tabular-nums">₦{(prop.costPerUnit || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right text-[13px] font-semibold text-foreground tabular-nums">₦{(prop.subtotal || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/40">
                    <tr>
                      <td colSpan={4} className="px-4 py-2.5 text-right text-[13px] font-semibold text-foreground">Total Estimated Bill</td>
                      <td className="px-4 py-2.5 text-right text-[15px] font-semibold text-success tabular-nums">₦{(details.expectedBill || 0).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="p-6 text-center">
                  <Home className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No properties configured</p>
                  <p className="mt-1 text-xs text-muted-foreground">Click "Edit" to add property types</p>
                </div>
              )}
            </Panel>

            {/* Services enrolled */}
            {services.length > 0 && (
              <Panel title={`Services Enrolled (${services.length})`} bodyClassName="p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {services.map((service: any) => (
                    <div key={service.enrollmentId} className="rounded-lg border border-border p-4">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-semibold text-foreground">{service.serviceName}</h4>
                          <p className="text-[11px] text-muted-foreground">
                            {service.amountType} · {service.billingFrequency}
                          </p>
                        </div>
                        <Badge variant={service.isActive ? "default" : "secondary"} className="text-[10px]">
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
                        <span className="text-[12px] font-medium text-muted-foreground">Auto-generate Invoices</span>
                        <Switch
                          checked={service.autoGenerateInvoices}
                          onCheckedChange={() =>
                            handleToggleAutoGenerate(service.collectionId, service.enrollmentId, service.autoGenerateInvoices)
                          }
                          disabled={togglingService === service.enrollmentId}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-semibold text-foreground tabular-nums">₦{(service.amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Invoices</span>
                          <span className="font-medium text-foreground">{service.totalInvoicesPaid}/{service.totalInvoicesGenerated}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Billed</span>
                          <span className="font-medium text-foreground tabular-nums">₦{(service.totalAmountInvoiced || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Paid</span>
                          <span className="font-medium text-success tabular-nums">₦{(service.totalAmountPaid || 0).toLocaleString()}</span>
                        </div>
                        {service.autoGenerateInvoices && service.nextInvoiceDate && (
                          <div className="col-span-2 flex justify-between border-t border-border pt-2">
                            <span className="text-muted-foreground">Next Invoice</span>
                            <span className="font-medium text-foreground">{format(new Date(service.nextInvoiceDate), "MMM dd, yyyy")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* Bills — the statements generated for this customer */}
            <Panel title="Bills" subtitle="Statements generated on the customer's cycle" bodyClassName="p-0">
              {bills.length > 0 ? (
                <table className="w-full text-[13px]">
                  <thead className="bg-muted/40">
                    <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Bill #</th>
                      <th className="px-4 py-2.5 font-medium">Period</th>
                      <th className="px-4 py-2.5 text-right font-medium">Total Due</th>
                      <th className="px-4 py-2.5 text-right font-medium">Paid</th>
                      <th className="px-4 py-2.5 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bills.map((b: any) => (
                      <tr key={b.id} className="hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-mono text-xs text-foreground">{b.billNumber}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {b.periodEnd ? format(new Date(b.periodEnd), "MMM dd, yyyy") : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-foreground">
                          ₦{(Number(b.totalDue) || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-success">
                          ₦{(Number(b.amountPaid) || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Badge variant={b.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">
                            {String(b.status).replace("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center text-[13px] text-muted-foreground">
                  No bills generated yet. Bills are created on the customer's billing cycle from the estimated amount.
                </div>
              )}
            </Panel>
          </div>

          {/* RIGHT — rail (3) */}
          <div className="space-y-4 lg:col-span-4 xl:col-span-3">
            {/* Billing cycle (per-customer override of the PSP default) */}
            <Panel title="Bill Cycle" subtitle="Named schedule this customer is billed on" bodyClassName="p-4">
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Cycle</p>
                  <Select
                    value={billing?.billCycleId ?? "unassigned"}
                    disabled={savingBilling || !billing}
                    onValueChange={(v) => updateBilling({ billCycleId: v === "unassigned" ? null : v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {cycles.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {billing?.billCycleName ? (
                      <>
                        Assigned to <span className="font-medium text-foreground">{billing.billCycleName}</span>
                      </>
                    ) : (
                      "Not assigned to any cycle"
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">Billing active</p>
                    <p className="text-[11px] text-muted-foreground">Include this customer in bill runs</p>
                  </div>
                  <Switch
                    checked={billing?.billingActive ?? true}
                    disabled={savingBilling || !billing}
                    onCheckedChange={(v) => updateBilling({ billingActive: v })}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3 text-[12px]">
                  <span className="text-muted-foreground">Next bill date</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {(() => {
                      const next = billing?.nextBillDate || billing?.billCycleNextBillDate;
                      return next
                        ? format(new Date(next), "MMM dd, yyyy")
                        : billing?.billCycleId
                          ? "—"
                          : "Assign a cycle";
                    })()}
                  </span>
                </div>
              </div>
            </Panel>

            {/* Active bill */}
            <Panel
              title="Active Bill"
              subtitle={activeBill ? activeBill.billNumber : "No bill generated yet"}
              bodyClassName="p-4"
            >
              {activeBill ? (
                (() => {
                  const due = Number(activeBill.totalDue) || 0;
                  const paid = Number(activeBill.amountPaid) || 0;
                  const remaining = Math.max(0, Math.round((due - paid) * 100) / 100);
                  const pct = due > 0 ? Math.min(100, Math.round((paid / due) * 100)) : 0;
                  return (
                    <div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Amount Due</p>
                          <p className={`text-2xl font-semibold tabular-nums ${remaining > 0 ? "text-destructive" : "text-success"}`}>
                            ₦{remaining.toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="default" className="mb-1 capitalize">Active</Badge>
                      </div>
                      <div className="mt-3 space-y-2 text-[12px]">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Brought forward</span>
                          <span className="font-medium tabular-nums text-foreground">₦{(Number(activeBill.openingBalance) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">This period's charge</span>
                          <span className="font-medium tabular-nums text-foreground">₦{(Number(activeBill.newCharges) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2">
                          <span className="text-muted-foreground">Total due</span>
                          <span className="font-semibold tabular-nums text-foreground">₦{due.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Paid</span>
                          <span className="font-medium tabular-nums text-success">₦{paid.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                          <span>Settled</span>
                          <span className="tabular-nums">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <p className="mt-3 text-[11px] text-muted-foreground">
                        Due {activeBill.dueDate ? format(new Date(activeBill.dueDate), "MMM dd, yyyy") : "—"}
                        {rolledBills.length > 0 && ` · ${rolledBills.length} rolled over`}
                      </p>
                    </div>
                  );
                })()
              ) : (
                <p className="text-[12px] text-muted-foreground">
                  This customer has no active bill yet. Bills are generated on the PSP's cycle from the estimated amount.
                </p>
              )}
            </Panel>

            {/* Billing actions */}
            <Panel title="Billing" bodyClassName="p-3">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => navigate(`/customers/${accountNumber}/ledger`)}
                >
                  <FileText className="h-4 w-4" />
                  View Ledger
                </Button>
                <Button
                  className="w-full justify-start gap-2"
                  onClick={() => navigate(`/billing/customer-statement/${details.customerId}`)}
                >
                  <Printer className="h-4 w-4" />
                  Generate Bill
                </Button>
              </div>
            </Panel>

            {/* Transactions feed */}
            <Panel
              title="Transactions"
              subtitle="Payments & wallet activity"
              right={
                transactionTotal > 0 ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{transactionTotal}</span>
                ) : undefined
              }
              bodyClassName="p-0"
            >
              {transactionsLoading ? (
                <div className="space-y-2 p-4">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="max-h-[520px] divide-y divide-border overflow-y-auto">
                  {transactions.map((txn: any) => {
                    const isCredit = ["credit", "payment"].includes(String(txn.type).toLowerCase());
                    return (
                      <div key={txn.id || txn._id || txn.transactionReference} className="flex items-start gap-2.5 px-4 py-3">
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                            isCredit ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isCredit ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[12px] font-medium capitalize text-foreground">
                              {(txn.paymentMethod || txn.type || "Transaction").replace(/_/g, " ")}
                            </p>
                            <p className={`shrink-0 text-[12px] font-semibold tabular-nums ${isCredit ? "text-success" : "text-foreground"}`}>
                              ₦{(txn.amount || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-2">
                            <span className="truncate font-mono text-[10.5px] text-muted-foreground">{txn.transactionReference}</span>
                            <span className="shrink-0 text-[10.5px] text-muted-foreground">
                              {format(new Date(txn.paidAt || txn.createdAt), "MMM dd, HH:mm")}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-12 text-center">
                  <Receipt className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-[12px] text-muted-foreground">No transactions yet</p>
                </div>
              )}
              {transactionTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
                  <button
                    className="text-[12px] font-medium text-muted-foreground disabled:opacity-40"
                    disabled={transactionPage <= 1}
                    onClick={() => setTransactionPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <span className="text-[11px] text-muted-foreground">
                    Page {transactionPage} of {transactionTotalPages}
                  </span>
                  <button
                    className="text-[12px] font-medium text-muted-foreground disabled:opacity-40"
                    disabled={transactionPage >= transactionTotalPages}
                    onClick={() => setTransactionPage((p) => Math.min(transactionTotalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDetails;
