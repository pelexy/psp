import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/shared";
import type { Column } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "@/lib/icons";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const money = (n: number) => "₦" + (Number(n) || 0).toLocaleString();

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  running: "secondary",
  partial: "secondary",
  failed: "destructive",
};

const BillRuns = () => {
  const { accessToken } = useAuth();

  const [runs, setRuns] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadRuns = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await apiService.getBillRuns(accessToken, page, 20);
      setRuns(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      setTotal(res.data?.pagination?.total || 0);
    } catch (e: any) {
      toast.error(e.message || "Failed to load bill runs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, page]);

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

  return (
    <DashboardLayout>
      <div className="max-w-full space-y-4 overflow-hidden bg-background p-4 md:p-6 lg:p-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">Bill Runs</h1>
          <p className="text-sm text-muted-foreground">
            The register of every bill run — scheduled or manual · {total.toLocaleString()} total
          </p>
        </div>

        <div className="overflow-hidden rounded-xl bg-card shadow-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-6">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-[13px] font-semibold text-foreground">All Bill Runs</h3>
          </div>
          <DataTable
            columns={columns}
            data={runs}
            pagination={{ currentPage: page, totalPages, totalItems: total, itemsPerPage: 20 }}
            onPageChange={setPage}
            loading={loading}
            emptyMessage="No bill runs yet — create a bill cycle and run it (or wait for its scheduled date)"
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BillRuns;
