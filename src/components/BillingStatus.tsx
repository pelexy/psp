import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Calendar, RefreshCw, ArrowUpRight } from "@/lib/icons";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const freqLabel: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

export function BillingStatus() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    try {
      const res = await apiService.getBillSummary(accessToken);
      setSummary(res.data);
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const runNow = async () => {
    if (!accessToken) return;
    setRunning(true);
    try {
      const res = await apiService.runBills(accessToken);
      toast.success(`Bill run complete — ${res.data?.totalBills ?? 0} bills generated`);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Failed to run bills");
    } finally {
      setRunning(false);
    }
  };

  const nextDate = summary?.nextBillDate ? format(new Date(summary.nextBillDate), "MMM dd, yyyy") : "Not scheduled";
  const enabled = summary?.billingEnabled;

  return (
    <div className="rounded-xl bg-card p-4 shadow-card md:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-primary">
            <Receipt className="h-[18px] w-[18px]" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-foreground">Bill Generation</h3>
            <p className="text-[11px] text-muted-foreground">
              {enabled
                ? `${summary?.billScheduleLabel || freqLabel[summary?.billFrequency] || "Monthly"} · auto`
                : "Not enabled"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => navigate("/billing/bills")}>
            View bills
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-8 gap-1.5" onClick={runNow} disabled={running || loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
            {running ? "Running…" : "Run bills now"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Next Bill Date</p>
          <p className="mt-1 flex items-center gap-1.5 text-[15px] font-semibold text-foreground">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            {nextDate}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Bills Generated</p>
          <p className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
            {(summary?.totalBills ?? 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Bill Runs</p>
          <p className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
            {(summary?.totalRuns ?? 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Last Run</p>
          <p className="mt-1 text-[15px] font-semibold text-foreground">
            {summary?.lastRun ? (
              <span className="inline-flex items-center gap-1.5">
                {format(new Date(summary.lastRun.runDate), "MMM dd")}
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {summary.lastRun.totalBills} bills
                </Badge>
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
