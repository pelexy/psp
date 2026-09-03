import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/shared";
import type { Column } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, X, FileText } from "@/lib/icons";
import { BillFilterPanel } from "@/components/bills/BillFilterPanel";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

const money = (n: number) => "₦" + (Number(n) || 0).toLocaleString();

// Status badge variants for individual generated bills.
const billStatusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  paid: "default",
  partial: "secondary",
  pending: "secondary",
  unpaid: "outline",
  overdue: "destructive",
};

type GeneratedBill = {
  id: string;
  billNumber: string;
  batchNumber?: string | null;
  billType?: string | null;
  billCycleName?: string | null;
  generatedAt: string;
  dueDate: string;
  totalDue: number;
  amountPaid: number;
  remaining: number;
  status: string;
  deliveredAt?: string | null;
  deliveredChannels?: string[];
  customerId: string;
  accountNumber: string;
  customerName: string;
  phone?: string;
  wardName?: string;
  streetName?: string;
  address?: string;
};

// Ward/street list responses come back in a few shapes across the API — normalise.
const extractArray = (res: any, ...keys: string[]): any[] => {
  if (Array.isArray(res)) return res;
  for (const key of keys) {
    if (res?.[key] && Array.isArray(res[key])) return res[key];
  }
  return [];
};

const GeneratedBills = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [genBills, setGenBills] = useState<GeneratedBill[]>([]);
  const [genLoading, setGenLoading] = useState(true);
  const [genPage, setGenPage] = useState(1);
  const [genTotalPages, setGenTotalPages] = useState(1);
  const [genTotal, setGenTotal] = useState(0);
  const [delivery, setDelivery] = useState<{
    generated: number;
    delivered: number;
    notDelivered: number;
    channels: { whatsapp: number; email: number; sms: number };
  } | null>(null);
  const [wards, setWards] = useState<any[]>([]);
  const [streets, setStreets] = useState<any[]>([]);
  const [genSearch, setGenSearch] = useState("");
  const [genDebouncedSearch, setGenDebouncedSearch] = useState("");
  const [cycles, setCycles] = useState<any[]>([]);
  const [genFilters, setGenFilters] = useState({
    wardId: "",
    streetId: "",
    status: "",
    billCycleId: "",
    delivery: "",
    dateFrom: "",
    dateTo: "",
  });

  // Debounce the search box (~300ms) and reset to the first page.
  useEffect(() => {
    const t = setTimeout(() => {
      setGenDebouncedSearch(genSearch);
      setGenPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [genSearch]);

  // Any filter change resets to page 1.
  useEffect(() => {
    setGenPage(1);
  }, [genFilters]);

  const loadWardStreetOptions = async () => {
    if (!accessToken) return;
    try {
      const [wardsRes, streetsRes] = await Promise.all([
        apiService.getActiveWards(accessToken),
        apiService.getStreets(accessToken),
      ]);
      setWards(extractArray(wardsRes, "wards", "data"));
      setStreets(extractArray(streetsRes, "streets", "data"));
      try {
        const cyclesRes = await apiService.getBillCycles(accessToken);
        setCycles(cyclesRes?.data || []);
      } catch {
        /* cycles are non-fatal for the table */
      }
    } catch (e) {
      // Non-fatal — the table still works without the ward/street dropdowns.
      console.error("Failed to load ward/street options", e);
    }
  };

  // Today's delivery summary (bills sent + per-channel counts). Non-fatal.
  const loadDeliverySummary = async () => {
    if (!accessToken) return;
    try {
      const res = await apiService.getBillDeliverySummary(accessToken);
      setDelivery(res?.data || null);
    } catch {
      /* non-fatal — the summary strip just hides */
    }
  };

  const loadGeneratedBills = async () => {
    if (!accessToken) return;
    setGenLoading(true);
    void loadDeliverySummary();
    try {
      const res = await apiService.getBills(accessToken, genPage, 20, {
        search: genDebouncedSearch.trim() || undefined,
        wardId: genFilters.wardId || undefined,
        streetId: genFilters.streetId || undefined,
        status: genFilters.status || undefined,
        billCycleId: genFilters.billCycleId || undefined,
        delivery: genFilters.delivery || undefined,
        dateFrom: genFilters.dateFrom || undefined,
        dateTo: genFilters.dateTo || undefined,
      });
      setGenBills(res.data?.data || res.data || []);
      setGenTotalPages(res.data?.pagination?.totalPages || 1);
      setGenTotal(res.data?.pagination?.total || 0);
    } catch (e: any) {
      toast.error(e.message || "Failed to load generated bills");
    } finally {
      setGenLoading(false);
    }
  };

  const clearGenFilters = () => {
    setGenSearch("");
    setGenFilters({ wardId: "", streetId: "", status: "", billCycleId: "", delivery: "", dateFrom: "", dateTo: "" });
  };

  const hasGenFilters =
    !!genDebouncedSearch ||
    !!genFilters.wardId ||
    !!genFilters.streetId ||
    !!genFilters.status ||
    !!genFilters.billCycleId ||
    !!genFilters.dateFrom ||
    !!genFilters.dateTo;

  useEffect(() => {
    loadWardStreetOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    loadGeneratedBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, genPage, genDebouncedSearch, genFilters]);

  const genColumns: Column<GeneratedBill>[] = useMemo(
    () => [
      {
        key: "billNumber",
        header: "Bill No / Batch",
        accessor: (b) => (
          <div>
            <span className="font-mono text-sm font-medium text-primary">{b.billNumber || "—"}</span>
            {b.batchNumber && (
              <p className="font-mono text-[11px] text-muted-foreground">{b.batchNumber}</p>
            )}
          </div>
        ),
      },
      {
        key: "billCycle",
        header: "Cycle",
        accessor: (b) =>
          b.billCycleName ? (
            <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
              {b.billCycleName}
            </span>
          ) : b.billType ? (
            <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-foreground">
              {b.billType === "biweekly" ? "2-weekly" : b.billType}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "customer",
        header: "Customer",
        accessor: (b) => (
          <div>
            <p className="font-medium text-foreground">{b.customerName || "—"}</p>
            <p className="text-xs font-mono text-muted-foreground">{b.accountNumber || ""}</p>
          </div>
        ),
      },
      {
        key: "location",
        header: "Ward / Street",
        accessor: (b) => (
          <div className="text-sm">
            <p className="text-foreground">{b.wardName || "—"}</p>
            <p className="text-xs text-muted-foreground">{b.streetName || ""}</p>
          </div>
        ),
      },
      {
        key: "generatedAt",
        header: "Generated",
        accessor: (b) => (
          <span className="text-sm text-muted-foreground">
            {b.generatedAt ? format(new Date(b.generatedAt), "MMM dd, yyyy") : "—"}
          </span>
        ),
      },
      {
        key: "dueDate",
        header: "Due",
        accessor: (b) => (
          <span className="text-sm text-muted-foreground">
            {b.dueDate ? format(new Date(b.dueDate), "MMM dd, yyyy") : "—"}
          </span>
        ),
      },
      {
        key: "totalDue",
        header: "Total Due",
        className: "text-right",
        accessor: (b) => <span className="font-semibold tabular-nums text-foreground">{money(b.totalDue)}</span>,
      },
      {
        key: "remaining",
        header: "Remaining",
        className: "text-right",
        accessor: (b) => (
          <span
            className={`font-semibold tabular-nums ${(b.remaining || 0) > 0 ? "text-destructive" : "text-success"}`}
          >
            {money(b.remaining)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        accessor: (b) => (
          <Badge variant={billStatusVariant[(b.status || "").toLowerCase()] || "secondary"} className="capitalize">
            {b.status || "—"}
          </Badge>
        ),
      },
      {
        key: "delivery",
        header: "Sent via",
        accessor: (b) => {
          const ch = b.deliveredChannels || [];
          if (ch.length === 0) {
            return <span className="text-xs text-muted-foreground">Not sent</span>;
          }
          const chip = (label: string, on: boolean) => (
            <span
              className={
                "rounded px-1.5 py-0.5 text-[10px] font-semibold " +
                (on ? "bg-success/10 text-success" : "bg-muted text-muted-foreground line-through")
              }
              title={on ? `${label} sent${b.deliveredAt ? ` ${new Date(b.deliveredAt).toLocaleString()}` : ""}` : `${label} not sent`}
            >
              {label}
            </span>
          );
          return (
            <div className="flex flex-wrap gap-1">
              {chip("WhatsApp", ch.includes("whatsapp"))}
              {chip("Email", ch.includes("email"))}
              {chip("SMS", ch.includes("sms"))}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <DashboardLayout>
      <div className="max-w-full space-y-4 overflow-hidden bg-background p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">Generated Bills</h1>
          <p className="text-sm text-muted-foreground">
            Every bill statement produced by the runs · {genTotal.toLocaleString()} total
          </p>
        </div>

        {/* Today's delivery summary — bills sent + per-channel counts. */}
        {delivery && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Bills today", value: delivery.generated, tone: "text-foreground" },
              { label: "Sent", value: delivery.delivered, tone: "text-success" },
              { label: "WhatsApp", value: delivery.channels.whatsapp, tone: "text-success" },
              { label: "Email", value: delivery.channels.email, tone: "text-success" },
              { label: "SMS", value: delivery.channels.sms, tone: "text-success" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-card p-3 shadow-card">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                <div className={`text-xl font-semibold tabular-nums ${s.tone}`}>{s.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
        {delivery && delivery.notDelivered > 0 && (
          <p className="-mt-1 text-xs text-muted-foreground">
            {delivery.notDelivered.toLocaleString()} of today's bills not sent yet (scheduled runs send ~1h after generating).
            "Sent" = accepted by the provider; handset/inbox delivery receipts are not tracked yet.
          </p>
        )}

        {/* Generated Bills — every bill produced, with a full filter bar */}
        <div className="overflow-hidden rounded-xl bg-card shadow-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-6">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <h3 className="text-[13px] font-semibold text-foreground">All Bills</h3>
              <p className="text-[11px] text-muted-foreground">
                Search and filter every bill statement · {genTotal.toLocaleString()} total
              </p>
            </div>
          </div>

          {/* Search + slide-in Filters panel (same pattern as the Customers table) */}
          <div className="border-b border-border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by batch no, bill no, account no, customer name, or phone..."
                  value={genSearch}
                  onChange={(e) => setGenSearch(e.target.value)}
                  className="h-10 pl-10"
                />
              </div>
              <BillFilterPanel
                filters={genFilters}
                onFiltersChange={setGenFilters}
                onClear={clearGenFilters}
                wards={wards}
                streets={streets}
                cycles={cycles}
              />
              {hasGenFilters && (
                <Button variant="ghost" size="sm" onClick={clearGenFilters} className="gap-2 text-muted-foreground">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          <DataTable
            columns={genColumns}
            data={genBills}
            pagination={{ currentPage: genPage, totalPages: genTotalPages, totalItems: genTotal, itemsPerPage: 20 }}
            onPageChange={setGenPage}
            onRowClick={(b) => {
              if (b.accountNumber) navigate(`/customers/${b.accountNumber}`);
            }}
            loading={genLoading}
            emptyMessage="No bills found. Adjust the filters or run a bill cycle to generate bills."
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GeneratedBills;
