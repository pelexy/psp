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
import { Loader2, KeyRound } from "@/lib/icons";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getFolioToken, clearFolioToken, folioMinutesLeft } from "@/lib/folioSession";

export type BillActionKind = "adjust" | "void" | "regenerate" | "arrears";

const naira = (n: number) => `₦${(Number(n) || 0).toLocaleString()}`;

const TITLES: Record<BillActionKind, string> = {
  adjust: "Edit bill",
  void: "Void (recall) bill",
  regenerate: "Generate bill",
  arrears: "Edit legacy arrears",
};

type Props = {
  open: boolean;
  action: BillActionKind;
  bill?: any | null; // required for adjust / void
  customerId: string;
  customerName?: string | null;
  currentArrears?: number; // for the 'arrears' action (brought-forward figure)
  onClose: () => void;
  onDone: () => void; // refresh parent
};

export function BillActionDialog({ open, action, bill, customerId, customerName, currentArrears = 0, onClose, onDone }: Props) {
  const { accessToken } = useAuth();
  const [step, setStep] = useState<"form" | "otp">("form");

  const oldOpening = Number(bill?.openingBalance ?? 0);
  const oldCharge = Number(bill?.newCharges ?? 0);

  const [opening, setOpening] = useState<string>(bill?.openingBalance != null ? String(bill.openingBalance) : "");
  const [charge, setCharge] = useState<string>(bill?.newCharges != null ? String(bill.newCharges) : "");
  const [newArrears, setNewArrears] = useState<string>(currentArrears != null ? String(currentArrears) : "");
  const [reason, setReason] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Void only: notify the customer their bill was recalled (default ON).
  const [notifyRecall, setNotifyRecall] = useState(true);

  const isMoneyEdit = action === "adjust";
  const nextOpening = opening === "" ? oldOpening : Number(opening);
  const nextCharge = charge === "" ? oldCharge : Number(charge);
  const delta = isMoneyEdit ? Math.round((nextOpening - oldOpening + (nextCharge - oldCharge)) * 100) / 100 : 0;
  const newTotal = Math.round((nextOpening + nextCharge) * 100) / 100;

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
    if (!reason.trim()) return "Please enter a reason — it is recorded in the audit trail.";
    if (isMoneyEdit) {
      if (opening !== "" && (isNaN(nextOpening) || nextOpening < 0)) return "Arrears must be a valid amount.";
      if (charge !== "" && (isNaN(nextCharge) || nextCharge < 0)) return "Charge must be a valid amount.";
      if (delta === 0) return "Nothing changed — edit the arrears or charge first.";
    }
    if (action === "arrears") {
      const v = Number(newArrears);
      if (newArrears === "" || isNaN(v) || v < 0) return "Enter a valid arrears amount (0 or more).";
    }
    return null;
  }

  async function sendCode() {
    const v = validate();
    if (v) { toast.error(v); return; }
    if (!accessToken) { toast.error("Session expired — please log in again."); return; }
    // This customer's folio is already open (a code was confirmed a moment ago):
    // apply the change straight away, no new code.
    const folio = getFolioToken(customerId);
    if (folio) { await confirm(folio); return; }
    setBusy(true);
    try {
      const res = await apiService.requestBillActionOtp(accessToken, {
        action,
        billId: bill?.id,
        customerId,
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

  async function confirm(folio?: string) {
    if (!folio && otpCode.length < 6) { toast.error("Enter the 6-digit code sent to your email."); return; }
    const auth = folio ?? otpCode.trim();
    if (!accessToken) { toast.error("Session expired — please log in again."); return; }
    setBusy(true);
    try {
      if (action === "adjust" && bill) {
        const res = await apiService.adjustBill(accessToken, bill.id, {
          openingBalance: opening === "" ? undefined : nextOpening,
          newCharges: charge === "" ? undefined : nextCharge,
          reason: reason.trim(),
          otpCode: auth,
        });
        const d = res?.data;
        toast.success(`Bill updated — new total ${naira(d?.totalDue)}.`);
      } else if (action === "void" && bill) {
        const res = await apiService.voidBill(accessToken, bill.id, {
          reason: reason.trim(),
          otpCode: auth,
          notifyCustomer: notifyRecall,
        });
        const d = res?.data;
        const sent = (d?.notified || []).length ? ` Customer notified (${d.notified.join(", ")}).` : "";
        toast.success(`Bill recalled — no longer active. ${naira(d?.stillOwed)} stays owed as arrears.${sent}`);
      } else if (action === "arrears") {
        const res = await apiService.setCustomerArrears(accessToken, customerId, {
          newArrears: Number(newArrears),
          reason: reason.trim(),
          otpCode: auth,
        });
        const d = res?.data;
        toast.success(`Legacy arrears set to ${naira(d?.newArrears)}. Now regenerate to build the bill.`);
      } else {
        const res = await apiService.regenerateCustomerBill(accessToken, customerId, {
          reason: reason.trim(),
          otpCode: auth,
        });
        const d = res?.data;
        toast.success(d?.newBillId ? `Bill regenerated — ${d?.newBillNumber}.` : "Old bill voided — nothing left to bill.");
      }
      reset();
      onDone();
    } catch (e: any) {
      if (folio && /editing session/i.test(e?.message ?? "")) {
        // The folio session ran out — fall back to a fresh code, keeping what was typed.
        clearFolioToken(customerId);
        setBusy(false);
        toast.info("Your editing session for this customer ended. We are sending a new code.");
        await sendCode();
        return;
      }
      toast.error(e?.message ?? "Action failed");
    } finally {
      setBusy(false);
    }
  }

  // Re-read on every render so the dialog reflects a session opened by an earlier correction.
  const folioOpen = open && !!getFolioToken(customerId);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{TITLES[action]}</DialogTitle>
          <DialogDescription>
            {bill ? <>Bill <span className="font-mono">{bill.billNumber}</span>. </> : <>Customer <span className="font-medium">{customerName}</span>. </>}
            This is a sensitive change.{" "}
            {folioOpen ? "This customer's folio is already open, so no new code is needed." : "It requires a one-time code sent to your email."}
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4">
            {action === "adjust" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="opening">Arrears (opening balance)</Label>
                    <Input id="opening" type="number" value={opening} onChange={(e) => setOpening(e.target.value)} disabled={busy} />
                    <p className="text-[10px] text-muted-foreground">was {naira(oldOpening)}</p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="charge">Current charge</Label>
                    <Input id="charge" type="number" value={charge} onChange={(e) => setCharge(e.target.value)} disabled={busy} />
                    <p className="text-[10px] text-muted-foreground">was {naira(oldCharge)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">New total due</span>
                  <span className="font-semibold">{naira(newTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Ledger adjustment</span>
                  <span className={delta > 0 ? "font-medium text-destructive" : delta < 0 ? "font-medium text-success" : "text-muted-foreground"}>
                    {delta > 0 ? "+" : ""}{naira(delta)} {delta > 0 ? "(owes more)" : delta < 0 ? "(owes less)" : ""}
                  </span>
                </div>
              </div>
            )}

            {action === "void" && (
              <div className="space-y-3">
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  This <strong>recalls the bill</strong> — it is marked no longer active. The money is <strong>not</strong> reversed:
                  the <strong>{naira((oldOpening + oldCharge))}</strong> stays owed and rolls into the next bill as arrears.
                  (To cancel the money, fix the arrears or regenerate instead.)
                </div>
                <label className="flex items-start gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4"
                    checked={notifyRecall}
                    onChange={(e) => setNotifyRecall(e.target.checked)}
                    disabled={busy}
                  />
                  <span>
                    <span className="font-medium">Notify customer of bill recall</span>
                    <span className="block text-[11px] text-muted-foreground">
                      Sends an email + SMS telling them this bill is cancelled. Uncheck to recall quietly.
                    </span>
                  </span>
                </label>
              </div>
            )}

            {action === "regenerate" && (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                This <strong>generates a fresh active bill</strong> for what the customer currently owes (from the ledger).
                You can only generate when there is <strong>no active bill</strong> — void (recall) the active one first.
                It does <strong>not</strong> send WhatsApp/SMS.
              </div>
            )}

            {action === "arrears" && (
              <div className="space-y-3">
                <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  Correct the <strong>legacy / brought-forward arrears</strong> for this customer. The old figure is replaced and
                  the difference is posted to the ledger. Then use <strong>Regenerate / Generate</strong> to build the bill (no WhatsApp).
                </div>
                <div className="space-y-1">
                  <Label htmlFor="arrears">Legacy arrears (brought forward)</Label>
                  <Input id="arrears" type="number" value={newArrears} onChange={(e) => setNewArrears(e.target.value)} disabled={busy} />
                  <p className="text-[10px] text-muted-foreground">was {naira(currentArrears)}</p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea id="reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy}
                placeholder="e.g. Corrected double-charged August arrears" />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={close} disabled={busy}>Cancel</Button>
              <Button className="flex-1" onClick={sendCode} disabled={busy}>
                {busy
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{folioOpen ? "Working…" : "Sending…"}</>
                  : folioOpen ? "Apply change" : "Send verification code"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {folioOpen
                ? `No code needed — this customer's folio is open for editing for about ${folioMinutesLeft(customerId)} more minute(s).`
                : "One code opens this customer's folio: further corrections on this customer need no new code for 30 minutes."}
            </p>
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
                variant={action === "void" ? "destructive" : "default"}
                onClick={() => confirm()}
                disabled={busy || otpCode.length < 6}
              >
                {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Working…</> : action === "void" ? "Recall bill" : action === "regenerate" ? "Generate" : "Apply change"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
