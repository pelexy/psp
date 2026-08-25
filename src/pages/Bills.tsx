import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/shared";
import type { Column } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RefreshCw, Calendar, Receipt, WhatsappLogo, ChatText } from "@/lib/icons";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

const money = (n: number) => "₦" + (Number(n) || 0).toLocaleString();

type Frequency = "daily" | "weekly" | "biweekly" | "monthly" | "bimonthly" | "trimonthly" | "custom";

type BillCycle = {
  id: string;
  name: string;
  frequency: Frequency;
  anchorDayOfWeek: number | null;
  anchorDayOfMonth: number | null;
  customIntervalDays: number | null;
  startDate: string;
  dueDays: number;
  prorateFirstBill: boolean;
  nextBillDate: string | null;
  active: boolean;
  customerCount: number;
};

const WEEKDAYS_PLURAL = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

const cadenceLabel = (c: BillCycle): string => {
  const base: Record<Frequency, string> = {
    weekly: "Weekly",
    biweekly: "Every 2 weeks",
    monthly: "Monthly",
    daily: "Daily",
    bimonthly: "Every 2 months",
    trimonthly: "Every 3 months",
    custom: c.customIntervalDays ? `Every ${c.customIntervalDays} days` : "Custom",
  };
  let label = base[c.frequency];
  if ((c.frequency === "weekly" || c.frequency === "biweekly") && c.anchorDayOfWeek != null) {
    label += ` · ${WEEKDAYS_PLURAL[c.anchorDayOfWeek]}`;
  } else if (
    (c.frequency === "monthly" || c.frequency === "bimonthly" || c.frequency === "trimonthly") &&
    c.anchorDayOfMonth != null
  ) {
    label += ` · day ${c.anchorDayOfMonth}`;
  }
  return label;
};

// Sensible payment windows per frequency. The due window can't exceed one billing
// period — otherwise the next bill lands before the previous one is even overdue.
const DUE_DAYS: Record<Frequency, { default: number; max: number }> = {
  daily: { default: 1, max: 1 },
  weekly: { default: 7, max: 7 },
  biweekly: { default: 14, max: 14 },
  monthly: { default: 21, max: 30 },
  bimonthly: { default: 30, max: 60 },
  trimonthly: { default: 45, max: 90 },
  custom: { default: 14, max: 365 },
};

// Plain-English preview of a cycle's schedule, driven purely by frequency + start date.
const scheduleHint = (
  freq: Frequency,
  startDate: string,
  dueDays: string,
  customIntervalDays?: string,
): string => {
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return "";
  const on = WEEKDAYS_PLURAL[d.getDay()];
  const nice = format(d, "MMM dd, yyyy");
  let base: string;
  switch (freq) {
    case "daily":
      base = `Bills every day, starting ${nice}.`;
      break;
    case "weekly":
      base = `Bills every week on ${on}, starting ${nice}.`;
      break;
    case "biweekly":
      base = `Bills every 2 weeks on ${on}, starting ${nice}.`;
      break;
    case "bimonthly":
      base = `Bills every 2 months on day ${Math.min(d.getDate(), 28)}, starting ${nice}.`;
      break;
    case "trimonthly":
      base = `Bills every 3 months on day ${Math.min(d.getDate(), 28)}, starting ${nice}.`;
      break;
    case "custom": {
      const n = Number(customIntervalDays) || 0;
      base = n > 0 ? `Bills every ${n} day${n === 1 ? "" : "s"}, starting ${nice}.` : `Bills on a custom schedule, starting ${nice}.`;
      break;
    }
    case "monthly":
    default:
      base = `Bills every month on day ${Math.min(d.getDate(), 28)}, starting ${nice}.`;
      break;
  }
  const due = Number(dueDays) || 0;
  return due > 0
    ? `${base} Each bill is due ${due} day${due === 1 ? "" : "s"} later.`
    : `${base} Each bill is due immediately.`;
};

type CycleForm = {
  name: string;
  frequency: Frequency;
  anchorDayOfWeek: number;
  anchorDayOfMonth: string;
  customIntervalDays: string;
  startDate: string;
  dueDays: string;
  prorateFirstBill: boolean;
  active: boolean;
};

const emptyForm = (): CycleForm => ({
  name: "",
  frequency: "monthly",
  anchorDayOfWeek: 6,
  anchorDayOfMonth: "1",
  customIntervalDays: "30",
  startDate: format(new Date(), "yyyy-MM-dd"),
  dueDays: "21",
  prorateFirstBill: true,
  active: true,
});

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  running: "secondary",
  partial: "secondary",
  failed: "destructive",
};

const Bills = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Bill Cycles
  const [cycles, setCycles] = useState<BillCycle[]>([]);
  const [cyclesLoading, setCyclesLoading] = useState(true);
  const [runningCycleId, setRunningCycleId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CycleForm>(emptyForm());
  const [savingCycle, setSavingCycle] = useState(false);

  const loadConfig = async () => {
    if (!accessToken) return;
    const sum = await apiService.getBillSummary(accessToken);
    setSummary(sum.data);
  };

  // Bills page shows only the 5 most recent runs — the full register lives on /billing/runs.
  const loadRuns = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await apiService.getBillRuns(accessToken, 1, 5);
      setRuns(res.data?.data || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (e: any) {
      toast.error(e.message || "Failed to load bill runs");
    } finally {
      setLoading(false);
    }
  };

  const loadCycles = async () => {
    if (!accessToken) return;
    setCyclesLoading(true);
    try {
      const res = await apiService.getBillCycles(accessToken);
      setCycles(res.data || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load bill cycles");
    } finally {
      setCyclesLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    loadCycles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (c: BillCycle) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      frequency: c.frequency,
      anchorDayOfWeek: c.anchorDayOfWeek ?? 6,
      anchorDayOfMonth: c.anchorDayOfMonth != null ? String(c.anchorDayOfMonth) : "1",
      customIntervalDays: c.customIntervalDays != null ? String(c.customIntervalDays) : "30",
      startDate: c.startDate ? format(new Date(c.startDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      dueDays: String(c.dueDays ?? 14),
      prorateFirstBill: c.prorateFirstBill,
      active: c.active,
    });
    setDialogOpen(true);
  };

  const saveCycle = async () => {
    if (!accessToken) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const start = new Date(form.startDate);
    const body: any = {
      name: form.name.trim(),
      frequency: form.frequency,
      // The day you start on IS the bill day — derive the anchor from the start date
      // so there's never a contradiction between "bill day" and "start date".
      anchorDayOfWeek:
        form.frequency === "weekly" || form.frequency === "biweekly" ? start.getDay() : null,
      anchorDayOfMonth:
        form.frequency === "monthly" || form.frequency === "bimonthly" || form.frequency === "trimonthly"
          ? Math.min(start.getDate(), 28)
          : null,
      customIntervalDays:
        form.frequency === "custom" ? Math.max(Number(form.customIntervalDays) || 0, 1) : null,
      startDate: start.toISOString(),
      dueDays: Math.min(Math.max(Number(form.dueDays) || 0, 0), DUE_DAYS[form.frequency].max),
      prorateFirstBill: form.prorateFirstBill,
      active: form.active,
    };
    setSavingCycle(true);
    try {
      if (editingId) {
        await apiService.updateBillCycle(accessToken, editingId, body);
        toast.success("Bill cycle updated");
      } else {
        await apiService.createBillCycle(accessToken, body);
        toast.success("Bill cycle created");
      }
      setDialogOpen(false);
      await loadCycles();
    } catch (e: any) {
      toast.error(e.message || "Failed to save bill cycle");
    } finally {
      setSavingCycle(false);
    }
  };

  const runCycle = async (c: BillCycle) => {
    if (!accessToken) return;
    setRunningCycleId(c.id);
    try {
      const res = await apiService.runBillCycle(accessToken, c.id);
      toast.success(`"${c.name}" run — ${res.data?.totalBills ?? 0} bills generated`);
      await Promise.all([loadCycles(), loadRuns()]);
    } catch (e: any) {
      toast.error(e.message || "Failed to run bill cycle");
    } finally {
      setRunningCycleId(null);
    }
  };

  const deleteCycle = async (c: BillCycle) => {
    if (!accessToken) return;
    if (!window.confirm(`Delete bill cycle "${c.name}"? Customers assigned to it will be unassigned.`)) return;
    try {
      await apiService.deleteBillCycle(accessToken, c.id);
      toast.success("Bill cycle deleted");
      await loadCycles();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete bill cycle");
    }
  };

  const columns: Column<any>[] = useMemo(
    () => [
      {
        key: "batchNumber",
        header: "Batch",
        accessor: (r) => (
          <span className="font-mono text-sm font-medium text-primary">{r.batchNumber || "—"}</span>
        ),
      },
      {
        key: "runDate",
        header: "Run Date",
        accessor: (r) => (
          <div>
            <p className="font-medium text-foreground">{format(new Date(r.runDate), "MMM dd, yyyy")}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(r.runDate), "hh:mm a")}</p>
          </div>
        ),
      },
      {
        key: "period",
        header: "Period",
        accessor: (r) => (
          <span className="text-[13px] text-muted-foreground">
            {format(new Date(r.periodStart), "MMM dd")} – {format(new Date(r.periodEnd), "MMM dd, yyyy")}
          </span>
        ),
      },
      {
        key: "frequency",
        header: "Frequency",
        accessor: (r) => <Badge variant="outline" className="capitalize">{r.frequency}</Badge>,
      },
      {
        key: "trigger",
        header: "Started By",
        accessor: (r) => (
          <span className="text-[13px] text-muted-foreground">
            {r.trigger === "cron" ? "Automatic" : r.trigger === "manual" ? "Manual" : r.trigger}
          </span>
        ),
      },
      {
        key: "totalBills",
        header: "Bills",
        className: "text-right",
        accessor: (r) => <span className="font-medium tabular-nums text-foreground">{r.totalBills}</span>,
      },
      {
        key: "totalDue",
        header: "Total Due",
        className: "text-right",
        accessor: (r) => <span className="font-semibold tabular-nums text-foreground">{money(r.totalDue)}</span>,
      },
      {
        key: "status",
        header: "Status",
        accessor: (r) => (
          <Badge variant={statusVariant[r.status] || "secondary"} className="capitalize">
            {r.status}
          </Badge>
        ),
      },
    ],
    []
  );

  const nextCycleRun = useMemo(() => {
    const upcoming = cycles
      .filter((c) => c.active && c.nextBillDate)
      .map((c) => c.nextBillDate as string)
      .sort();
    return upcoming[0] || null;
  }, [cycles]);

  return (
    <DashboardLayout>
      <div className="max-w-full space-y-4 overflow-hidden bg-background p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">Bills</h1>
            <p className="text-sm text-muted-foreground">
              Bills are statements of account — balance brought forward + this period's charges = total due · {total} runs
            </p>
          </div>
          <Button className="gap-2" onClick={openCreate}>
            <Calendar className="h-4 w-4" />
            New bill cycle
          </Button>
        </div>

        {/* Config + next-run stat band */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Settings */}
          <div className="rounded-xl bg-card p-4 shadow-card lg:col-span-2 md:p-5">
            <h3 className="mb-3 text-[13px] font-semibold text-foreground">How billing works</h3>
            <ol className="space-y-2.5 text-[13px] text-muted-foreground">
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">1</span>
                <span>
                  <span className="font-medium text-foreground">Create a bill cycle</span> — a named schedule (e.g.
                  “Weekly residential — every Saturday”, “Monthly — 1st”). You can run several cycles under one account.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">2</span>
                <span>
                  <span className="font-medium text-foreground">Assign customers</span> to a cycle from their profile.
                  Some customers can bill weekly, others monthly — each follows their own cycle.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">3</span>
                <span>
                  <span className="font-medium text-foreground">The cycle runs</span> on its date (or “Run now”): each
                  customer’s balance is carried forward, the period’s charge is added, and the bill is delivered by WhatsApp.
                </span>
              </li>
            </ol>
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
              No bill cycles means no bills are generated. Create at least one cycle below and assign customers to it.
            </p>
          </div>

          {/* Next run + delivery */}
          <div className="rounded-xl bg-card p-4 shadow-card md:p-5">
            <h3 className="mb-4 text-[13px] font-semibold text-foreground">Next Run</h3>
            <div className="flex items-center gap-2 text-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold">
                {nextCycleRun ? format(new Date(nextCycleRun), "MMM dd, yyyy") : "No cycles scheduled"}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Bills Generated</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{(summary?.totalBills ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Bill Runs</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{(summary?.totalRuns ?? 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Delivery channels */}
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Delivery</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={summary?.delivery?.whatsapp?.configured ? "default" : "secondary"}
                  className="gap-1 text-[11px]"
                >
                  <WhatsappLogo className="h-3 w-3" />
                  WhatsApp {summary?.delivery?.whatsapp?.configured ? "on" : "not set up"}
                </Badge>
                <Badge variant="secondary" className="gap-1 text-[11px]">
                  <ChatText className="h-3 w-3" />
                  SMS fallback
                </Badge>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Generated bills are sent automatically via WhatsApp (WATI), with SMS as fallback.
                {!summary?.delivery?.whatsapp?.configured &&
                  " Set WATI_API_URL + WATI_ACCESS_TOKEN (+ template) to enable WhatsApp."}
              </p>
            </div>
          </div>
        </div>

        {/* Bill Cycles */}
        <div className="overflow-hidden rounded-xl bg-card shadow-card">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="text-[13px] font-semibold text-foreground">Bill Cycles</h3>
                <p className="text-[11px] text-muted-foreground">Named schedules — assign customers to a cycle</p>
              </div>
            </div>
            <Button size="sm" className="gap-1" onClick={openCreate}>
              + New cycle
            </Button>
          </div>

          {cyclesLoading ? (
            <div className="px-4 py-8 text-center text-[13px] text-muted-foreground sm:px-6">Loading cycles…</div>
          ) : cycles.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-muted-foreground sm:px-6">
              No bill cycles yet — click "+ New cycle" to create a named schedule.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {cycles.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-foreground">{c.name}</p>
                      <Badge variant={c.active ? "default" : "secondary"} className="text-[10px]">
                        {c.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span>{cadenceLabel(c)}</span>
                      <span className="tabular-nums">{(c.customerCount ?? 0).toLocaleString()} customers</span>
                      <span>
                        Next run:{" "}
                        <span className="tabular-nums text-foreground">
                          {c.nextBillDate ? format(new Date(c.nextBillDate), "MMM dd, yyyy") : "—"}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => runCycle(c)}
                      disabled={runningCycleId === c.id}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${runningCycleId === c.id ? "animate-spin" : ""}`} />
                      {runningCycleId === c.id ? "Running…" : "Run now"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteCycle(c)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent bill runs — last 5 only; the full register lives on its own page */}
        <div className="overflow-hidden rounded-xl bg-card shadow-card">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="text-[13px] font-semibold text-foreground">Recent Bill Runs</h3>
                <p className="text-[11px] text-muted-foreground">Last 5 runs · {total.toLocaleString()} total</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/billing/runs")}>
              View all runs
            </Button>
          </div>
          <DataTable
            columns={columns}
            data={runs}
            loading={loading}
            emptyMessage="No bill runs yet — create a bill cycle and run it (or wait for its scheduled date)"
          />
        </div>

        {/* Create / Edit cycle dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit bill cycle" : "New bill cycle"}</DialogTitle>
              <DialogDescription>Named schedule that customers can be assigned to.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Name</p>
                <Input
                  className="h-9"
                  value={form.name}
                  placeholder="e.g. Weekly residential"
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div>
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Frequency</p>
                <Select
                  value={form.frequency}
                  onValueChange={(v) => {
                    const freq = v as BillCycle["frequency"];
                    // Reset the due window to a sensible default for the new frequency
                    setForm((f) => ({ ...f, frequency: freq, dueDays: String(DUE_DAYS[freq].default) }));
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="bimonthly">Every 2 months (bi-monthly)</SelectItem>
                    <SelectItem value="trimonthly">Every 3 months (tri-monthly)</SelectItem>
                    <SelectItem value="custom">Custom (every N days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.frequency === "custom" && (
                <div>
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Interval (days)
                  </p>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    className="h-9"
                    value={form.customIntervalDays}
                    onChange={(e) => setForm((f) => ({ ...f, customIntervalDays: e.target.value }))}
                    onBlur={(e) => {
                      const v = Math.min(Math.max(Number(e.target.value) || 1, 1), 365);
                      setForm((f) => ({ ...f, customIntervalDays: String(v) }));
                    }}
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">A bill is generated every {Number(form.customIntervalDays) || 0} days</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    First bill date
                  </p>
                  <Input
                    type="date"
                    className="h-9"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Due after (days)
                  </p>
                  <Input
                    type="number"
                    min={0}
                    max={DUE_DAYS[form.frequency].max}
                    className="h-9"
                    value={form.dueDays}
                    onChange={(e) => setForm((f) => ({ ...f, dueDays: e.target.value }))}
                    onBlur={(e) => {
                      const max = DUE_DAYS[form.frequency].max;
                      const v = Math.min(Math.max(Number(e.target.value) || 0, 0), max);
                      setForm((f) => ({ ...f, dueDays: String(v) }));
                    }}
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">Max {DUE_DAYS[form.frequency].max} — must fit within one cycle</p>
                </div>
              </div>

              {form.startDate && (
                <p className="rounded-lg bg-primary/5 px-3 py-2 text-[12px] text-foreground">
                  {scheduleHint(form.frequency, form.startDate, form.dueDays, form.customIntervalDays)}
                </p>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <div>
                  <p className="text-[13px] font-medium text-foreground">Prorate first bill</p>
                  <p className="text-[11px] text-muted-foreground">Charge partial period up to the first cycle date</p>
                </div>
                <Switch
                  checked={form.prorateFirstBill}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, prorateFirstBill: v }))}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <div>
                  <p className="text-[13px] font-medium text-foreground">Active</p>
                  <p className="text-[11px] text-muted-foreground">Include this cycle in scheduled runs</p>
                </div>
                <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={savingCycle}>
                Cancel
              </Button>
              <Button onClick={saveCycle} disabled={savingCycle}>
                {savingCycle ? "Saving…" : editingId ? "Save changes" : "Create cycle"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Bills;
