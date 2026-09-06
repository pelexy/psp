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
import { Search, Percent, HandCoins, Banknote, Wallet } from "@/lib/icons";
import { apiService } from "@/services/api";
import type { PspCommissionEntry } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatCurrencyFull } from "@/utils/formatCurrency";
import { toast } from "sonner";
import { format } from "date-fns";

const PAGE_SIZE = 20;

const Commission = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState<PspCommissionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totals, setTotals] = useState<{
    commission: number;
    gross: number;
    net: number;
    count: number;
  }>({ commission: 0, gross: 0, net: 0, count: 0 });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({ payer: "all", dateFrom: "", dateTo: "" });

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

  const loadCommission = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await apiService.getPspCommission(accessToken, {
        search: debouncedSearch.trim() || undefined,
        payer: filters.payer !== "all" ? filters.payer : undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      // App envelope: unwrap `.data`, then the paginated `data` inside it.
      const payload = res?.data ?? ({} as any);
      setRows(payload.data || []);
      setTotalPages(payload.pagination?.totalPages || 1);
      setTotal(payload.pagination?.total || 0);
      setTotals(payload.totals || { commission: 0, gross: 0, net: 0, count: 0 });
    } catch (e: any) {
      toast.error(e.message || "Failed to load commission");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, page, debouncedSearch, filters]);

  const columns: Column<PspCommissionEntry>[] = useMemo(
    () => [
      {
        key: "date",
        header: "Date",
        accessor: (c) => (
          <div className="text-sm">
            <p className="text-foreground">{format(new Date(c.createdAt), "MMM dd, yyyy")}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(c.createdAt), "hh:mm a")}</p>
          </div>
        ),
      },
      {
        key: "customer",
        header: "Customer",
        accessor: (c) => (
          <div
            className={c.customerId ? "cursor-pointer transition-colors hover:text-primary" : undefined}
            onClick={(e) => {
              e.stopPropagation();
              if (c.customerId) navigate(`/customers/${c.customerId}`);
            }}
          >
            <p className="font-medium text-foreground">{c.customerName || "—"}</p>
            {c.source && <p className="text-xs capitalize text-muted-foreground">{c.source}</p>}
          </div>
        ),
      },
      {
        key: "reference",
        header: "Reference",
        accessor: (c) => (
          <span className="font-mono text-sm font-medium text-primary">{c.reference || "—"}</span>
        ),
      },
      {
        key: "gross",
        header: "Gross",
        className: "text-right",
        accessor: (c) => (
          <span className="tabular-nums text-foreground">{formatCurrencyFull(c.grossAmount)}</span>
        ),
      },
      {
        key: "commission",
        header: "Commission",
        className: "text-right",
        accessor: (c) => (
          <span className="font-semibold tabular-nums text-foreground">
            {formatCurrencyFull(c.commissionAmount)}
          </span>
        ),
      },
      {
        key: "net",
        header: "Net to you",
        className: "text-right",
        accessor: (c) => (
          <span className="tabular-nums text-success">{formatCurrencyFull(c.netToPsp)}</span>
        ),
      },
      {
        key: "payer",
        header: "Paid by",
        accessor: (c) => (
          <Badge variant={c.commissionPayer === "customer" ? "secondary" : "outline"}>
            {c.commissionPayer === "customer" ? "Customer" : "You (PSP)"}
          </Badge>
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
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">Commission</h1>
          <p className="text-sm text-muted-foreground">
            Commission paid to BuyPower on your collections · {total.toLocaleString()} payments
          </p>
        </div>

        {/* Summary — totals for the current filter */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Percent className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Total commission paid
              </p>
              <p className="text-xl font-semibold tabular-nums text-foreground">
                {formatCurrency(totals.commission)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Banknote className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Gross processed
              </p>
              <p className="text-xl font-semibold tabular-nums text-foreground">
                {formatCurrency(totals.gross)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
              <Wallet className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Net received
              </p>
              <p className="text-xl font-semibold tabular-nums text-foreground">
                {formatCurrency(totals.net)}
              </p>
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

        {/* Commission table */}
        <div className="overflow-hidden rounded-xl bg-card shadow-card">
          {/* Search + filters */}
          <div className="border-b border-border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by reference..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 pl-10"
                />
              </div>

              <Select
                value={filters.payer}
                onValueChange={(v) => setFilters((f) => ({ ...f, payer: v }))}
              >
                <SelectTrigger className="h-10 w-full sm:w-[180px]">
                  <SelectValue placeholder="All payers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payers</SelectItem>
                  <SelectItem value="customer">Customer bears</SelectItem>
                  <SelectItem value="psp">PSP bears</SelectItem>
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
            emptyMessage="No commission records found. These appear once customers pay."
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Commission;
