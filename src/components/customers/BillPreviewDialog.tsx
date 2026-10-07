import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const money = (n: number) =>
  "₦" +
  new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(n) || 0,
  );

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customerId?: string | null;
};

/**
 * Read-only preview of the bill "Generate Bill" would produce right now, from the
 * live ledger. Breaks the total into Arrears brought forward (cut-over / legacy)
 * vs Account balance (the rest owed) — matching the customer page's own figures.
 */
export function BillPreviewDialog({ open, onOpenChange, customerId }: Props) {
  const { accessToken } = useAuth();
  const [preview, setPreview] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !accessToken || !customerId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setPreview(null);
      try {
        const res = await apiService.getBillPreview(accessToken, customerId);
        if (!cancelled) setPreview(res?.data ?? res);
      } catch (e: any) {
        if (!cancelled) {
          toast.error(e?.message || "Failed to load bill preview");
          onOpenChange(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, accessToken, customerId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bill preview</DialogTitle>
          <DialogDescription>
            What “Generate Bill” would produce right now. On generate, everything owed is
            recomputed into <strong>arrears brought forward</strong>, then this period’s charge is
            added.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="space-y-2 py-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : preview ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Arrears brought forward</span>
              <span className="font-medium tabular-nums">{money(Number(preview.arrearsBroughtForward) || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Current charge
                {Number(preview.months) > 1 ? (
                  <span className="text-[11px] text-muted-foreground/70">
                    {" "}({money(Number(preview.monthlyRate) || 0)} × {preview.months})
                  </span>
                ) : null}
              </span>
              <span className="font-medium tabular-nums">{money(Number(preview.currentCharge) || 0)}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
              <span className="text-sm font-semibold">Total due on bill</span>
              <span className="text-lg font-semibold tabular-nums">{money(Number(preview.totalDue) || 0)}</span>
            </div>
            <div
              className={`rounded-md px-3 py-2 text-xs ${
                preview.hasActiveBill
                  ? "border border-amber-200 bg-amber-50 text-amber-900"
                  : "bg-muted/40 text-muted-foreground"
              }`}
            >
              {preview.note}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
