import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, KeyRound } from "@/lib/icons";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type LedgerEntryAction = "void-entry" | "add-entry";

const naira = (n: number) => `₦${(Number(n) || 0).toLocaleString()}`;

/** The single ledger line being voided (only needed for "void-entry"). */
export type LedgerEntryTarget = {
  id: string;
  description?: string;
  reference?: string;
  kind: "charge" | "payment"; // charge = debit, payment = credit
  amount: number;
};

type Props = {
  open: boolean;
  action: LedgerEntryAction;
  customerId: string;
  customerName?: string | null;
  entry?: LedgerEntryTarget | null; // required for "void-entry"
  onClose: () => void;
  onDone: () => void; // refresh parent
};

export function LedgerEntryDialog({
  open,
  action,
  customerId,
  customerName,
  entry,
  onClose,
  onDone,
}: Props) {
  const { accessToken } = useAuth();
  const [step, setStep] = useState<"form" | "otp">("form");

  // add-entry fields. "cutover" = arrears brought over from the old system at
  // go-live; the system tags it so it is always understood as arrears.
  const [entryKind, setEntryKind] = useState<"debit" | "credit" | "cutover">("debit");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");

  // The owner sets ONLY the transaction date — the date that shows on the
  // bill / statement (when it actually happened). The posting/entry date is
  // stamped automatically by the system (server createdAt); it is not editable.
  const today = new Date().toISOString().slice(0, 10);
  const [transactionDate, setTransactionDate] = useState<string>(today);

  const [reason, setReason] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isVoid = action === "void-entry";

  function reset() {
    setStep("form");
    setOtpCode("");
    setSentTo(null);
    setBusy(false);
  }

  function close() {
    reset();
    onClose();
  }

  function validate(): string | null {
    if (!transactionDate) return "Please choose the transaction date.";
    if (transactionDate > today) return "The transaction date cannot be in the future.";
    if (!reason.trim()) return "Please enter a reason — it is recorded in the audit trail.";
    if (action === "add-entry") {
      const v = Number(amount);
      if (amount === "" || isNaN(v) || v <= 0) return "Enter an amount greater than zero.";
      if (!description.trim()) return "Enter a description for this entry.";
    }
    return null;
  }

  async function sendCode() {
    const v = validate();
    if (v) { toast.error(v); return; }
    if (!accessToken) { toast.error("Session expired — please log in again."); return; }
    setBusy(true);
    try {
      const res = await apiService.requestBillActionOtp(accessToken, {
        action,
        customerId,
        entryId: isVoid ? entry?.id : undefined,
      });
      setSentTo(res?.data?.sentTo ?? "your email");
      setStep("otp");
      toast.success("Verification code sent to your email.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send verification code");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (otpCode.length < 6) { toast.error("Enter the 6-digit code sent to your email."); return; }
    if (!accessToken) { toast.error("Session expired — please log in again."); return; }
    setBusy(true);
    try {
      if (isVoid && entry) {
        const res: any = await apiService.voidLedgerEntry(accessToken, entry.id, {
          reason: reason.trim(),
          otpCode: otpCode.trim(),
          transactionDate,
        });
        const ab = res?.data?.activeBill ?? res?.activeBill;
        toast.success(
          ab
            ? `Entry voided. Active bill ${ab.billNumber} updated — now ₦${Number(ab.totalDue).toLocaleString()}.`
            : "Entry voided — it no longer counts towards the balance.",
        );
      } else {
        const res = await apiService.addLedgerEntry(accessToken, customerId, {
          type: entryKind === "credit" ? "credit" : "debit",
          category: entryKind === "cutover" ? "cutover_arrears" : undefined,
          amount: Number(amount),
          description: description.trim(),
          reason: reason.trim(),
          otpCode: otpCode.trim(),
          transactionDate,
        });
        const d = res?.data;
        toast.success(
          `Entry posted — ${d?.type === "credit" ? "credit" : "charge"} of ${naira(d?.amount)}.`,
        );
      }
      reset();
      onDone();
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isVoid ? "Void ledger entry" : "Add ledger entry"}</DialogTitle>
          <DialogDescription>
            Customer <span className="font-medium">{customerName}</span>. This is a sensitive
            change and requires a one-time code sent to your email.
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4">
            {isVoid && entry && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Voiding <strong>{entry.description || (entry.kind === "payment" ? "Payment" : "Charge")}</strong>
                {entry.reference && <> (<span className="font-mono text-xs">#{entry.reference}</span>)</>} of{" "}
                <strong>{naira(entry.amount)}</strong>. Nothing is deleted — a reversing{" "}
                <strong>{entry.kind === "payment" ? "debit" : "credit"}</strong> line is posted to cancel it,
                so the balance brought forward is corrected. This keeps the full audit trail.
                {entry.kind === "payment" && (
                  <span className="mt-1 block text-xs">
                    Note: this is a <strong>payment</strong>. Voiding only removes it from the ledger — it does{" "}
                    <strong>not</strong> refund the customer if the money was received electronically.
                  </span>
                )}
              </div>
            )}

            {/* Owner sets ONLY the transaction date — the date shown on the bill /
                statement. The posting date is stamped automatically by the system. */}
            <div className="space-y-1">
              <Label htmlFor="txnDate">Transaction date *</Label>
              <Input
                id="txnDate"
                type="date"
                value={transactionDate}
                max={today}
                onChange={(e) => setTransactionDate(e.target.value)}
                disabled={busy}
              />
              <p className="text-[10px] text-muted-foreground">
                The date shown on the bill / statement. The recorded date is stamped automatically.
              </p>
            </div>

            {action === "add-entry" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Entry type</Label>
                    <Select
                      value={entryKind}
                      onValueChange={(v) => {
                        const k = v as "debit" | "credit" | "cutover";
                        setEntryKind(k);
                        // Prefill a sensible label for cut-over arrears.
                        if (k === "cutover" && !description.trim()) setDescription("Cut-over arrears");
                      }}
                    >
                      <SelectTrigger disabled={busy}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debit">Charge (customer owes)</SelectItem>
                        <SelectItem value="credit">Credit (in customer's favour)</SelectItem>
                        <SelectItem value="cutover">Cut-over arrears (brought over)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="amount">Amount (₦)</Label>
                    <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={busy} placeholder="0" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="desc">Description *</Label>
                  <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} disabled={busy}
                    placeholder="e.g. Arrears brought forward (corrected)" />
                  <p className="text-[10px] text-muted-foreground">
                    {entryKind === "cutover"
                      ? "Tagged as cut-over arrears — the system always treats it as arrears brought over."
                      : "Shows on the statement as the line label."}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea id="reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy}
                placeholder={isVoid ? "e.g. Legacy arrears entered twice" : "e.g. Re-posting corrected arrears figure"} />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={close} disabled={busy}>Cancel</Button>
              <Button className="flex-1" onClick={sendCode} disabled={busy}>
                {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</> : "Send verification code"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A 6-digit code was sent to <span className="font-medium">{sentTo}</span>. Enter it to confirm.
            </p>
            <div className="space-y-2">
              <Label htmlFor="otp">Verification code</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="otp"
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="pl-10 text-center text-lg tracking-[0.4em]"
                  disabled={busy}
                />
              </div>
              <button onClick={sendCode} className="text-xs text-primary hover:underline" disabled={busy}>Resend code</button>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setStep("form"); setOtpCode(""); }} disabled={busy}>Back</Button>
              <Button
                className="flex-1"
                variant={isVoid ? "destructive" : "default"}
                onClick={confirm}
                disabled={busy || otpCode.length < 6}
              >
                {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Working…</> : isVoid ? "Void entry" : "Post entry"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
