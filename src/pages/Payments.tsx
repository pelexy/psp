import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/shared";
import type { Column } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Banknote, HandCoins } from "@/lib/icons";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const money = (n: number) => "₦" + (Number(n) || 0).toLocaleString();

const PAGE_SIZE = 20;

// Payment status → badge variant. success=green (default), pending=amber,
// failed=destructive (red).
const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  success: "default",
  pending: "secondary",
  failed: "destructive",
};

type PaymentRow = {
  id: string;
  reference: string;
  amount: number;
  status: "pending" | "success" | "failed";
  method: string;
  channel: string;
  paidAt: string | null;
  createdAt: string;
  bankName: string | null;
  accountNumber: string | null;
  gatewayReference: string | null;
  customerName: string | null;
  customerAccountNumber: string | null;
  phone: string | null;
};

const Payments = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totals, setTotals] = useState<{ collected: number; count: number }>({ collected: 0, count: 0 });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({ status: "all", dateFrom: "", dateTo: "" });

  // Debounce the search box (~400ms) and reset to the first page.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Any filter change resets to page 1.
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const loadPayments = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await apiService.getPspPayments(accessToken, {
        search: debouncedSearch.trim() || undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      // App envelope: unwrap `.data`, then the paginated `data` inside it.
      const payload = res?.data ?? {};
      setRows(payload.data || []);
      setTotalPages(payload.totalPages || 1);
      setTotal(payload.total || 0);
      setTotals(payload.totals || { collected: 0, count: 0 });
    } catch (e: any) {
      toast.error(e.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, page, debouncedSearch, filters]);

  const columns: Column<PaymentRow>[] = useMemo(
    () => [
      {
        key: "date",
        header: "Date",
        accessor: (p) => (
          <div className="text-sm">
            <p className="text-foreground">{format(new Date(p.createdAt), "MMM dd, yyyy")}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(p.createdAt), "hh:mm a")}</p>
          </div>
        ),
      },
      {
        key: "customer",
        header: "Customer",
        accessor: (p) => (
          <div
            className={p.customerAccountNumber ? "cursor-pointer transition-colors hover:text-primary" : undefined}
            onClick={(e) => {
              e.stopPropagation();
              if (p.customerAccountNumber) navigate(`/customers/${p.customerAccountNumber}`);
            }}
          >
            <p className="font-medium text-foreground">{p.customerName || "—"}</p>
            <p className="text-xs font-mono text-muted-foreground">{p.customerAccountNumber || ""}</p>
          </div>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        className: "text-right",
        accessor: (p) => (
          <span className="font-semibold tabular-nums text-foreground">{money(p.amount)}</span>
        ),
      },
      {
        key: "channel",
        header: "Channel",
        accessor: (p) => (
          <span className="text-sm capitalize text-foreground">{p.channel || p.method || "—"}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        accessor: (p) => (
          <Badge variant={statusVariant[(p.status || "").toLowerCase()] || "outline"} className="capitalize">
            {p.status || "—"}
          </Badge>
        ),
      },
      {
        key: "reference",
        header: "Reference",
        accessor: (p) => (
          <div>
            <span className="font-mono text-sm font-medium text-primary">{p.reference || "—"}</span>
            {(p.bankName || p.accountNumber) && (
              <p className="text-[11px] text-muted-foreground">
                {[p.bankName, p.accountNumber].filter(Boolean).join(" · ")}
              </p>
            )}
            {p.gatewayReference && (
              <p className="font-mono text-[11px] text-muted-foreground">{p.gatewayReference}</p>
            )}
          </div>
        ),
      },
    ],
    [navigate]
  );

  return (
    <DashboardLayout>
      <div className="max-w-full space-y-4 overflow-hidden bg-background p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Every payment received by your account · {total.toLocaleString()} total
          </p>
        </div>

        {/* Summary — totals for the current filter */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
              <Banknote className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total collected</p>
              <p className="text-xl font-semibold tabular-nums text-foreground">{money(totals.collected)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <HandCoins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Payments</p>
              <p className="text-xl font-semibold tabular-nums text-foreground">
                {totals.count.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Payments table */}
        <div className="overflow-hidden rounded-xl bg-card shadow-card">
          {/* Search + filters */}
          <div className="border-b border-border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by customer or reference..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 pl-10"
                />
              </div>

              <Select
                value={filters.status}
                onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="h-10 w-full sm:w-[150px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                aria-label="From date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                className="h-10 w-full sm:w-[150px]"
              />
              <Input
                type="date"
                aria-label="To date"
                value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                className="h-10 w-full sm:w-[150px]"
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={rows}
            pagination={{ currentPage: page, totalPages, totalItems: total, itemsPerPage: PAGE_SIZE }}
            onPageChange={setPage}
            loading={loading}
            emptyMessage="No payments found. Payments will appear here once customers pay."
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
