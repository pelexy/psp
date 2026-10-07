import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Loader2, Send } from "@/lib/icons";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const money = (n: number) =>
  "₦" +
  new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(n) || 0,
  );

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/** The bill row from the list — enough to render the header instantly. */
export type BillRow = {
  id: string;
  billNumber: string;
  status: string;
  totalDue: number;
  amountPaid: number;
  remaining?: number;
  accountNumber?: string;
  customerName?: string;
  billCycleName?: string | null;
};

type Props = {
  open: boolean;
  bill: BillRow | null;
  onClose: () => void;
};

export function BillDetailDialog({ open, bill, onClose }: Props) {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [full, setFull] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<{ email: boolean; sms: boolean }>({ email: true, sms: false });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !bill?.id || !accessToken) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFull(null);
      try {
        const res = await apiService.getBill(accessToken, bill.id);
        const data = res?.data ?? res;
        if (!cancelled) {
          setFull(data);
          // Default-select the channels this PSP is allowed to send on.
          const allowed: string[] = data?.sendChannels || ["email"];
          setChannels({ email: allowed.includes("email"), sms: allowed.includes("sms") });
        }
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message || "Failed to load bill");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, bill?.id, accessToken]);

  if (!bill) return null;

  const b = full?.bill || {};
  const c = b.customer || {};
  const totalDue = Number(b.totalDue ?? bill.totalDue) || 0;
  const paid = Number(b.amountPaid ?? bill.amountPaid) || 0;
  const outstanding = Math.max(0, Math.round((totalDue - paid) * 100) / 100);
  const status = String(b.status || bill.status || "");
  const company = b.psp?.companyName || "";
  const cycle = bill.billCycleName || b.billType || "";
  const channelsSent: string[] = b.deliveredChannels?.channels || b.deliveredChannels || [];
  const acct = c.customerAccountNumber || bill.accountNumber || "";
  const wardStreet = [c.ward?.name, c.street?.name].filter(Boolean).join(" / ") || "—";

  const download = () => window.open(apiService.billPdfUrl(bill.id), "_blank", "noopener,noreferrer");

  const send = async () => {
    if (!accessToken) { toast.error("Session expired — please log in again."); return; }
    if (!channels.email && !channels.sms) {
      toast.error("Pick at least one channel to send on."); return;
    }
    setSending(true);
    try {
      const res = await apiService.resendBill(accessToken, bill.id, channels);
      const sent = res?.data?.sent || res?.sent || [];
      if (sent.length) toast.success(`Bill sent to customer (${sent.join(", ")}).`);
      else toast.warning(res?.data?.note ? `Not sent — ${res.data.note}.` : "Nothing was sent.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send bill");
    } finally {
      setSending(false);
    }
  };

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between gap-4 border-b border-border/50 py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm text-foreground">{value ?? "—"}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="font-mono">{bill.billNumber}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                {company || "—"}{cycle ? ` · ${cycle}` : ""}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={download}>
              <FileText className="h-3.5 w-3.5" /> PDF
            </Button>
          </div>
        </DialogHeader>

        {loading && !full ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Amount cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Total due</div>
                <div className="text-lg font-semibold">{money(totalDue)}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Paid</div>
                <div className="text-lg font-semibold text-success">{money(paid)}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Outstanding</div>
                <div className={`text-lg font-semibold ${outstanding > 0 ? "text-destructive" : "text-foreground"}`}>{money(outstanding)}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</div>
                <div className="text-lg font-semibold capitalize">{status || "—"}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Breakdown */}
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Breakdown</div>
                <Row label="Brought forward" value={money(b.openingBalance ?? 0)} />
                <Row label="This period's charge" value={money(b.newCharges ?? 0)} />
                {Number(b.penaltyAmount ?? 0) > 0 && <Row label="Penalty" value={money(b.penaltyAmount)} />}
                <Row label="Total due" value={<span className="font-semibold">{money(totalDue)}</span>} />
                <Row label="Period" value={`${fmtDate(b.periodStart)} → ${fmtDate(b.periodEnd)}`} />
                <Row label="Generated" value={fmtDate(b.issueDate || b.createdAt)} />
                <Row label="Due" value={fmtDate(b.dueDate)} />
                {b.batchNumber && <Row label="Batch" value={b.batchNumber} />}
              </div>

              {/* Customer + delivery */}
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</div>
                <Row label="Name" value={c.fullName || bill.customerName} />
                <Row label="Account" value={<span className="font-mono">{acct}</span>} />
                <Row label="Phone" value={c.phone} />
                <Row label="Ward / Street" value={wardStreet} />
                <Row label="Address" value={c.address} />
                {acct && (
                  <button onClick={() => navigate(`/customers/${acct}`)} className="mt-2 text-sm text-primary hover:underline">
                    Open customer →
                  </button>
                )}

                <div className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivery</div>
                <Row label="Sent via" value={channelsSent.length ? channelsSent.join(", ") : "Not sent"} />
                <Row label="Sent at" value={fmtDate(b.deliveredAt)} />
              </div>
            </div>

            {/* Send to customer — email always; SMS only if super-admin enabled it. */}
            {(() => {
              const allowed: string[] = full?.sendChannels || ["email"];
              const smsAllowed = allowed.includes("sms");
              return (
                <div className="flex flex-col gap-2 rounded-md border border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-medium">Send to customer:</span>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={channels.email}
                        onChange={(e) => setChannels((s) => ({ ...s, email: e.target.checked }))}
                        disabled={sending}
                      />
                      Email
                    </label>
                    {smsAllowed ? (
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={channels.sms}
                          onChange={(e) => setChannels((s) => ({ ...s, sms: e.target.checked }))}
                          disabled={sending}
                        />
                        SMS
                      </label>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        SMS not enabled — ask super-admin to activate it.
                      </span>
                    )}
                  </div>
                  <Button size="sm" className="gap-1.5" onClick={send} disabled={sending}>
                    {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Send</>}
                  </Button>
                </div>
              );
            })()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
